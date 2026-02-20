import Task from '../models/Task.js';
import User from '../models/User.js';
import { notifyTaskApproved, notifyTaskRejected } from '../services/notificationService.js';

// @desc    Get pending approvals
// @route   GET /api/approvals
// @access  Private (Any authenticated user)
export const getPendingApprovals = async (req, res) => {
    try {
        const userEmail = req.user.email;
        const tasks = await Task.find({
            status: 'Waiting for Approval',
            approvalStatus: 'Pending',
            $or: [
                { currentApprover: req.user._id },
                { currentApprover: { $exists: false }, createdByEmail: userEmail }
            ]
        })
            .populate({
                path: 'createdBy',
                select: 'name email role designation',
                populate: { path: 'role', select: 'displayName' }
            })
            .populate({
                path: 'assignedTo',
                select: 'name email role designation',
                populate: { path: 'role', select: 'displayName' }
            })
            .sort({ updatedAt: -1 });

        res.json({
            success: true,
            tasks,
        });
    } catch (error) {
        console.error('Get pending approvals error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Approve task
// @route   POST /api/approvals/:id/approve
// @access  Private (Task Creator only)
export const approveTask = async (req, res) => {
    try {
        const userEmail = req.user.email;
        const { comments } = req.body;
        const task = await Task.findById(req.params.id).populate('assignedTo', 'role');

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Check if user is the current approver
        const isCurrentApprover = (task.currentApprover && task.currentApprover.toString() === req.user._id.toString());
        const isCreator = task.createdByEmail === userEmail;

        // If currentApprover is set, STRICTLY enforce it. If not set, fallback to creator.
        if (task.currentApprover) {
            if (!isCurrentApprover) {
                return res.status(403).json({ error: 'You are not the assigned approver for this task' });
            }
        } else {
            if (!isCreator) {
                return res.status(403).json({ error: 'Only the task creator can approve this task' });
            }
        }

        if (task.status !== 'Waiting for Approval') {
            return res.status(400).json({ error: 'Only tasks waiting for approval can be approved' });
        }

        if (task.approvalStatus === 'Approved') {
            return res.status(400).json({ error: 'Task already approved' });
        }

        // INTERMEDIATE APPROVAL LOGIC
        // If task is forwarded AND this is the Forwarder approving it (and not yet approved by forwarder)
        if (task.isForwarded && !task.forwarderApproved && task.forwardedBy && req.user._id.toString() === task.forwardedBy.toString()) {
            // This is an intermediate approval
            task.forwarderApproved = true;
            task.currentApprover = task.createdBy; // Handover to original creator

            // Add a system note/comment about this approval
            const approvalNote = comments ? `Forwarder Approval by ${req.user.name}: ${comments}` : `Approved by Forwarder ${req.user.name}`;
            task.comments.push({
                text: `[System]: ${approvalNote}`,
                createdBy: req.user._id,
                createdByName: req.user.name,
                userRole: req.user.role?.name || 'Staff'
            });

            await task.save();

            // Notify the Original Creator (A) that it's now their turn to approve
            const creator = await User.findById(task.createdBy);
            if (creator && creator.whatsapp) {
                try {
                    const { sendWhatsAppTemplate, getWhatsappConfig } = await import('../services/notificationService.js');
                    const config = getWhatsappConfig();

                    if (config.apiUrl && config.accessToken) {
                        const dueDateTime = task.targetTime
                            ? `${new Date(task.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} ${new Date('2000-01-01T' + task.targetTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`
                            : new Date(task.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

                        sendWhatsAppTemplate(
                            creator.whatsapp,
                            'task_status_alert',
                            [
                                creator.name,                       // {{1}} Recipient (A)
                                'Waiting for Final Approval',       // {{2}} New Status
                                task.sno.toString(),                // {{3}} Task ID
                                task.task,                          // {{4}} Task Name
                                req.user.name,                      // {{5}} Updated By (B the forwarder)
                                dueDateTime,                        // {{6}} Due Date & Time
                                task.notes || 'No notes'            // {{7}} Notes
                            ],
                            'en'
                        ).catch(err => console.error('WhatsApp notification error (intermediate approval to A):', err));
                    }
                } catch (notifError) {
                    console.error('Intermediate approval notification error:', notifError);
                }
            }

            return res.json({
                success: true,
                message: 'Intermediate approval granted. Task passed to original creator.',
                task
            });
        }

        // FINAL APPROVAL LOGIC
        task.status = 'Completed';
        task.approvalStatus = 'Approved';
        task.approvedBy = req.user._id;
        task.approvedAt = new Date();
        // Clear current approver as flow is done
        task.currentApprover = undefined;

        // Save approval comments
        if (comments && comments.trim()) {
            task.approvalComments = `Approved by ${req.user.name} on ${new Date().toLocaleDateString()}: ${comments}`;
        } else {
            task.approvalComments = `Approved by ${req.user.name} on ${new Date().toLocaleDateString()}`;
        }

        await task.save();

        // Send approval notification to C (current assignee) and also B (forwarder) if forwarded
        const assignedUser = await User.findById(task.assignedTo);
        if (assignedUser) {
            notifyTaskApproved(task, assignedUser, req.user).catch(err => {
                console.error('Notification error (assignee C):', err);
            });
        }

        if (task.isForwarded && task.forwardedBy) {
            const forwarderUser = await User.findById(task.forwardedBy);
            if (forwarderUser && forwarderUser._id.toString() !== assignedUser?._id.toString()) {
                notifyTaskApproved(task, forwarderUser, req.user).catch(err => {
                    console.error('Notification error (forwarder B):', err);
                });
            }
        }

        res.json({
            success: true,
            message: 'Task approved successfully',
            task,
        });
    } catch (error) {
        console.error('Approve task error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Reject task
// @route   POST /api/approvals/:id/reject
// @access  Private (Task Creator only)
export const rejectTask = async (req, res) => {
    try {
        const userEmail = req.user.email;
        const { reason } = req.body;

        const task = await Task.findById(req.params.id).populate('assignedTo', 'role');

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Allow creator OR forwarder (before they've approved) to reject
        const isCreator = task.createdByEmail === userEmail;
        const isForwarderPendingApproval = task.isForwarded && !task.forwarderApproved &&
            task.forwardedBy && task.forwardedBy.toString() === req.user._id.toString();

        if (!isCreator && !isForwarderPendingApproval) {
            return res.status(403).json({ error: 'Only the task creator or forwarder can reject this task' });
        }

        if (task.status !== 'Waiting for Approval') {
            return res.status(400).json({ error: 'Only tasks waiting for approval can be rejected' });
        }

        task.approvalStatus = 'Rejected';
        task.status = 'In Progress';
        // Clear currentApprover so the flow resets
        task.currentApprover = undefined;

        // Save rejection reason to approvalComments field
        task.approvalComments = `Rejected by ${req.user.name} on ${new Date().toLocaleDateString()}: ${reason || 'No reason provided'}`;

        await task.save();

        // Send rejection notification to C (current assignee)
        const assignedUser = await User.findById(task.assignedTo);
        if (assignedUser) {
            notifyTaskRejected(task, assignedUser, req.user, reason).catch(err => {
                console.error('Notification error (assignee C):', err);
            });
        }

        // If creator (A) is rejecting a forwarded task, also notify forwarder (B)
        // If forwarder (B) is rejecting, don't notify themselves
        if (isCreator && task.isForwarded && task.forwardedBy) {
            const forwarderUser = await User.findById(task.forwardedBy);
            if (forwarderUser && forwarderUser._id.toString() !== assignedUser?._id.toString()) {
                notifyTaskRejected(task, forwarderUser, req.user, reason).catch(err => {
                    console.error('Notification error (forwarder B):', err);
                });
            }
        }

        res.json({
            success: true,
            message: 'Task rejected successfully',
            task,
        });
    } catch (error) {
        console.error('Reject task error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

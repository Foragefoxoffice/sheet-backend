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

            // Notify the Original Creator that it's now their turn
            // (We might need a new notification function or reuse notifyStatusChanged logic but targeting creator)
            const creator = await User.findById(task.createdBy);
            if (creator) {
                // Reuse notifyStatusChanged but customize message logic inside that function or here
                // For now, simpler to just let them know status is Waiting for Approval (which it still is)
                const { notifyStatusChanged } = await import('../services/notificationService.js');
                notifyStatusChanged(task, creator, req.user, 'Waiting for Final Approval').catch(console.error);
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

        // Send notification to assigned user
        const assignedUser = await User.findById(task.assignedTo);
        if (assignedUser) {
            notifyTaskApproved(task, assignedUser, req.user).catch(err => {
                console.error('Notification error:', err);
            });
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

        // Only the creator can reject
        if (task.createdByEmail !== userEmail) {
            return res.status(403).json({ error: 'Only the task creator can reject this task' });
        }

        if (task.status !== 'Waiting for Approval') {
            return res.status(400).json({ error: 'Only tasks waiting for approval can be rejected' });
        }

        task.approvalStatus = 'Rejected';
        task.status = 'In Progress';

        // Save rejection reason to approvalComments field
        task.approvalComments = `Rejected by ${req.user.name} on ${new Date().toLocaleDateString()}: ${reason || 'No reason provided'}`;

        await task.save();

        // Send notification to assigned user
        const assignedUser = await User.findById(task.assignedTo);
        if (assignedUser) {
            notifyTaskRejected(task, assignedUser, req.user, reason).catch(err => {
                console.error('Notification error:', err);
            });
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

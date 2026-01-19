import Task from '../models/Task.js';
import User from '../models/User.js';
import { notifyTaskApproved, notifyTaskRejected } from '../services/notificationService.js';

// @desc    Get pending approvals
// @route   GET /api/approvals
// @access  Private (Any authenticated user)
export const getPendingApprovals = async (req, res) => {
    try {
        const userEmail = req.user.email;

        // Find tasks created by this user that are Waiting for Approval
        const tasks = await Task.find({
            createdByEmail: userEmail,
            status: 'Waiting for Approval',
            approvalStatus: 'Pending',
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

        // Only the creator can approve
        if (task.createdByEmail !== userEmail) {
            return res.status(403).json({ error: 'Only the task creator can approve this task' });
        }

        if (task.status !== 'Waiting for Approval') {
            return res.status(400).json({ error: 'Only tasks waiting for approval can be approved' });
        }

        if (task.approvalStatus === 'Approved') {
            return res.status(400).json({ error: 'Task already approved' });
        }

        task.status = 'Completed';
        task.approvalStatus = 'Approved';
        task.approvedBy = req.user._id;
        task.approvedAt = new Date();

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

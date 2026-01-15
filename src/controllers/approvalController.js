import Task from '../models/Task.js';
import User from '../models/User.js';
import { notifyTaskApproved, notifyTaskRejected } from '../services/notificationService.js';

// @desc    Get pending approvals
// @route   GET /api/approvals
// @access  Private (Any authenticated user)
export const getPendingApprovals = async (req, res) => {
    try {
        const userEmail = req.user.email;

        // Find tasks created by this user that are Completed and Pending Approval
        const tasks = await Task.find({
            createdByEmail: userEmail,
            status: 'Completed',
            approvalStatus: 'Pending',
        })
            .populate('createdBy assignedTo', 'name email role')
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
        const task = await Task.findById(req.params.id).populate('assignedTo', 'role');

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Only the creator can approve
        if (task.createdByEmail !== userEmail) {
            return res.status(403).json({ error: 'Only the task creator can approve this task' });
        }

        if (task.status !== 'Completed') {
            return res.status(400).json({ error: 'Only completed tasks can be approved' });
        }

        if (task.approvalStatus === 'Approved') {
            return res.status(400).json({ error: 'Task already approved' });
        }

        task.approvalStatus = 'Approved';
        task.approvedBy = req.user._id;
        task.approvedAt = new Date();

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

        if (task.status !== 'Completed') {
            return res.status(400).json({ error: 'Only completed tasks can be rejected' });
        }

        task.approvalStatus = 'Rejected';
        // We might want to keep it as 'Completed' but rejected, or move back to 'In Progress'. 
        // usage plan says: Rejected -> Resubmitted -> Pending Approval.
        // Usually if rejected, work needs to be done, so 'In Progress' makes sense, 
        // OR we keep it 'Completed' but Rejected state implies it needs attention.
        // Let's set it to 'In Progress' so assignee sees it in their active list.
        task.status = 'In Progress';

        // Append rejection reason to notes or a new field. Plan mentioned "add rejection reason".
        // Let's append to notes for now as schema change wasn't explicitly requested but plan mentioned "rejectionReason field (optional)".
        // I will append to notes to be safe without schema migration, formatted clearly.
        const rejectionNote = `\n\n[${new Date().toLocaleDateString()}] Rejected by ${req.user.name}: ${reason || 'No reason provided'}`;
        task.notes = (task.notes || '') + rejectionNote;

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

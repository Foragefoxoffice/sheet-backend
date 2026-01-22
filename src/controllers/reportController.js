import Task from '../models/Task.js';
import User from '../models/User.js';

// @desc    Get task statistics
// @route   GET /api/reports/statistics
// @access  Private
export const getTaskStatistics = async (req, res) => {
    try {
        const Role = (await import('../models/Role.js')).default;
        const currentUserRole = await Role.findById(req.user.role._id || req.user.role);
        const userEmail = req.user.email;

        let filter = {};

        // Filter based on permissions
        const roleName = currentUserRole.name?.toLowerCase().replace(/\s+/g, '') || '';
        const allowedRoles = ['staff', 'projectmanager', 'standalone', 'standalonerole', 'projectmanagerandstandalone'];

        // Users without viewReports permission only see their own tasks
        // BUT if they are Staff/PM/Standalone, they can see tasks they created (assigned) as well
        if (!currentUserRole?.permissions?.viewReports) {
            if (allowedRoles.includes(roleName)) {
                filter = {
                    $or: [
                        { assignedToEmail: userEmail },
                        { createdByEmail: userEmail }
                    ]
                };
                
                // Also allow them to see pending approvals count for tasks they created
                // (The default check below uses 'viewApprovals' permission, we'll need to update that too if needed)
            } else {
                filter.assignedToEmail = userEmail;
            }
        }
        // Users with viewReports can see all tasks (no filter)

        // Get counts by status
        const statusCounts = await Task.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ]);

        // Get counts by priority
        const priorityCounts = await Task.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$priority',
                    count: { $sum: 1 },
                },
            },
        ]);

        // Get overdue tasks count
        const overdueTasks = await Task.countDocuments({
            ...filter,
            dueDate: { $lt: new Date() },
            status: { $ne: 'Completed' },
        });

        // Get total tasks
        const totalTasks = await Task.countDocuments(filter);

        // Get pending approvals count (for users with approval permissions OR allowed roles)
        let pendingApprovals = 0;
        if (currentUserRole?.permissions?.viewApprovals || allowedRoles.includes(roleName)) {
            pendingApprovals = await Task.countDocuments({
                createdByEmail: userEmail, // Only count their own created tasks needing approval
                status: 'Completed',
                approvalStatus: 'Pending',
            });
        }

        res.json({
            success: true,
            statistics: {
                total: totalTasks,
                byStatus: statusCounts,
                byPriority: priorityCounts,
                overdue: overdueTasks,
                pendingApprovals,
            },
        });
    } catch (error) {
        console.error('Get task statistics error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Get user reports
// @route   GET /api/reports/users
// @access  Private (requires viewReports permission)
export const getUserReports = async (req, res) => {
    try {
        // Get all users with their task counts
        const users = await User.find().select('name email role');

        const userReports = await Promise.all(
            users.map(async (user) => {
                const totalTasks = await Task.countDocuments({ assignedToEmail: user.email });
                const completedTasks = await Task.countDocuments({
                    assignedToEmail: user.email,
                    status: 'Completed',
                });
                const pendingTasks = await Task.countDocuments({
                    assignedToEmail: user.email,
                    status: 'Pending',
                });
                const inProgressTasks = await Task.countDocuments({
                    assignedToEmail: user.email,
                    status: 'In Progress',
                });
                const overdueTasks = await Task.countDocuments({
                    assignedToEmail: user.email,
                    dueDate: { $lt: new Date() },
                    status: { $ne: 'Completed' },
                });

                return {
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                    },
                    tasks: {
                        total: totalTasks,
                        completed: completedTasks,
                        pending: pendingTasks,
                        inProgress: inProgressTasks,
                        overdue: overdueTasks,
                    },
                };
            })
        );

        res.json({
            success: true,
            reports: userReports,
        });
    } catch (error) {
        console.error('Get user reports error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

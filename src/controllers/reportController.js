import Task from '../models/Task.js';
import User from '../models/User.js';

// @desc    Get task statistics
// @route   GET /api/reports/statistics
// @access  Private
export const getTaskStatistics = async (req, res) => {
    try {
        const userRole = req.user.role;
        const userEmail = req.user.email;

        let filter = {};

        // Filter based on role
        if (userRole === 'Staff') {
            filter.assignedToEmail = userEmail;
        } else if (userRole === 'Manager') {
            // Managers see tasks they created or assigned to them
            filter = {
                $or: [{ createdByEmail: userEmail }, { assignedToEmail: userEmail }],
            };
        }
        // Director and GeneralManager see all tasks (no filter)

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

        // Get pending approvals count (for managers and above)
        let pendingApprovals = 0;
        if (['Manager', 'GeneralManager', 'Director'].includes(userRole)) {
            pendingApprovals = await Task.countDocuments({
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
// @access  Private (Manager, GeneralManager, Director)
export const getUserReports = async (req, res) => {
    try {
        const userRole = req.user.role;

        // Only managers and above can access user reports
        if (!['Manager', 'GeneralManager', 'Director'].includes(userRole)) {
            return res.status(403).json({ error: 'Not authorized to access user reports' });
        }

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

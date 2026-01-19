import Task from '../models/Task.js';
import User from '../models/User.js';
import { notifyTaskAssigned, notifyStatusChanged } from '../services/notificationService.js';

// Role hierarchy for permissions
const ROLE_HIERARCHY = {
    Director: 4,
    GeneralManager: 3,
    Manager: 2,
    Staff: 1,
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
export const createTask = async (req, res) => {
    try {
        const { task, assignedToEmail, priority, durationType, durationValue, notes, isSelfTask, taskGivenBy } = req.body;

        // Validate required fields
        if (!task || !assignedToEmail || !durationValue) {
            return res.status(400).json({ error: 'Please provide all required fields' });
        }

        // Find assigned user
        const assignedUser = await User.findOne({ email: assignedToEmail }).populate('role');

        if (!assignedUser) {
            return res.status(404).json({ error: 'Assigned user not found' });
        }

        // Validate role-based assignment permissions (unless self-task)
        if (!isSelfTask && assignedUser._id.toString() !== req.user._id.toString()) {
            const Role = (await import('../models/Role.js')).default;
            const currentUserRole = await Role.findById(req.user.role._id || req.user.role)
                .populate('managedRoles');
            const assignedUserRole = typeof assignedUser.role === 'object' ? assignedUser.role :
                await Role.findById(assignedUser.role);

            if (!assignedUserRole) {
                return res.status(404).json({ error: 'Assigned user role not found' });
            }

            // Super Admin can assign to anyone except Super Admin
            if (currentUserRole.name === 'superadmin') {
                if (assignedUserRole.name === 'superadmin') {
                    return res.status(403).json({
                        error: 'Cannot assign tasks to Super Admin users'
                    });
                }
            }
            // Others can only assign to roles in their managedRoles
            else {
                const canAssign = currentUserRole.managedRoles.some(
                    role => role._id.toString() === assignedUserRole._id.toString()
                );

                if (!canAssign) {
                    return res.status(403).json({
                        error: `You cannot assign tasks to users with "${assignedUserRole.displayName}" role. Check your role's managed roles permissions.`
                    });
                }
            }
        }

        // Find task giver if provided
        let taskGivenByName = '';
        if (taskGivenBy) {
            const giverUser = await User.findOne({ email: taskGivenBy });
            if (giverUser) {
                taskGivenByName = giverUser.name;
            }
        }

        // Calculate due date
        const now = new Date();
        let dueDate;
        if (durationType === 'hours') {
            dueDate = new Date(now.getTime() + durationValue * 60 * 60 * 1000);
        } else {
            dueDate = new Date(now.getTime() + durationValue * 24 * 60 * 60 * 1000);
        }

        // Create task
        const newTask = await Task.create({
            task,
            createdBy: req.user._id,
            createdByEmail: req.user.email,
            assignedTo: assignedUser._id,
            assignedToName: assignedUser.name,
            assignedToEmail: assignedUser.email,
            priority: priority || 'Medium',
            dueDate,
            notes: notes || '',
            isSelfTask: isSelfTask || false,
            taskGivenBy: taskGivenBy || '',
            taskGivenByName: taskGivenByName,
        });

        // Send notification to assigned user
        notifyTaskAssigned(newTask, assignedUser, req.user).catch(err => {
            console.error('Notification error:', err);
        });

        res.status(201).json({
            success: true,
            task: newTask,
        });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// @desc    Get tasks assigned to current user (by others)
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res) => {
    try {
        const userEmail = req.user.email;

        // All users see only tasks assigned TO them BY others (excludes self-tasks)
        const tasks = await Task.find({
            assignedToEmail: userEmail,
            createdByEmail: { $ne: userEmail }, // Not created by themselves
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
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            tasks,
        });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Get self tasks
// @route   GET /api/tasks/self
// @access  Private
export const getSelfTasks = async (req, res) => {
    try {
        const tasks = await Task.find({
            createdByEmail: req.user.email,
            assignedToEmail: req.user.email,
            isSelfTask: true,
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
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            tasks,
        });
    } catch (error) {
        console.error('Get self tasks error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Get tasks assigned by current user (to others)
// @route   GET /api/tasks/assigned
// @access  Private
export const getAssignedTasks = async (req, res) => {
    try {
        // Tasks created BY me and assigned TO others (excludes self-tasks)
        const tasks = await Task.find({
            createdByEmail: req.user.email,
            assignedToEmail: { $ne: req.user.email }, // Not assigned to themselves
        })
            .populate({
                path: 'createdBy',
                select: 'name email role designation department whatsapp',
                populate: { path: 'role', select: 'displayName' }
            })
            .populate({
                path: 'assignedTo',
                select: 'name email role designation department whatsapp',
                populate: [
                    { path: 'role', select: 'displayName' },
                    { path: 'department', select: 'name' }
                ]
            })
            .populate({
                path: 'approvedBy',
                select: 'name email'
            })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            tasks,
        });
    } catch (error) {
        console.error('Get assigned tasks error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Get all tasks (role-based filtering)
// @route   GET /api/tasks/all
// @access  Private
export const getAllTasks = async (req, res) => {
    try {
        const userDepartment = req.user.department;

        // Fetch full role with permissions
        const Role = (await import('../models/Role.js')).default;
        const currentUserRole = await Role.findById(req.user.role._id || req.user.role);

        const hasViewAll = currentUserRole?.permissions?.viewAllTasks;
        const hasViewDepartment = currentUserRole?.permissions?.viewDepartmentTasks;

        let tasks;

        // View All Tasks permission (e.g. Director, GM)
        if (hasViewAll) {
            tasks = await Task.find()
                .populate({
                    path: 'createdBy',
                    select: 'name email role designation department whatsapp',
                    populate: [
                        { path: 'role', select: 'displayName' },
                        { path: 'department', select: 'name' }
                    ]
                })
                .populate({
                    path: 'assignedTo',
                    select: 'name email role designation department whatsapp',
                    populate: [
                        { path: 'role', select: 'displayName' },
                        { path: 'department', select: 'name' }
                    ]
                })
                .populate({
                    path: 'approvedBy',
                    select: 'name email'
                })
                .sort({ createdAt: -1 });
        }
        // View Department Tasks permission (e.g. Manager)
        else if (hasViewDepartment) {
            if (!userDepartment) {
                // User has permission but no department assigned
                tasks = [];
            } else {
                // Get all users in the same department
                const departmentUsers = await User.find({ department: userDepartment }).select('email');
                const departmentEmails = departmentUsers.map(u => u.email);

                // Find tasks assigned to users in this department
                tasks = await Task.find({
                    assignedToEmail: { $in: departmentEmails }
                })
                    .populate({
                        path: 'createdBy',
                        select: 'name email role designation department',
                        populate: { path: 'role', select: 'displayName' }
                    })
                    .populate({
                        path: 'assignedTo',
                        select: 'name email role designation department',
                        populate: { path: 'role', select: 'displayName' }
                    })
                    .populate('approvedBy', 'name email role')
                    .sort({ createdAt: -1 });
            }
        }
        // No permission to view all or department tasks
        else {
            tasks = [];
        }

        res.json({
            success: true,
            tasks,
        });
    } catch (error) {
        console.error('Get all tasks error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private
export const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
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
            .populate('approvedBy', 'name email role');

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({
            success: true,
            task,
        });
    } catch (error) {
        console.error('Get task by ID error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Update task status
// @route   PATCH /api/tasks/:id/status
// @access  Private
export const updateTaskStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const userEmail = req.user.email;

        // Only the assigned user can change the task status
        if (task.assignedToEmail !== userEmail) {
            return res.status(403).json({ error: 'Only the assigned user can update task status' });
        }

        // Validate allowed status values
        const allowedStatuses = ['Pending', 'In Progress', 'Waiting for Approval', 'Completed'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        // Prevent users from directly setting status to 'Completed'
        // Completed can only be set via approval process
        if (status === 'Completed') {
            return res.status(403).json({
                error: 'Tasks must be approved by the task creator to be marked as Completed. Please set status to "Waiting for Approval" instead.'
            });
        }

        // Update status
        task.status = status;

        // Handle Approval Workflow
        if (status === 'Waiting for Approval') {
            // When marked as waiting for approval, set approval status to Pending
            task.approvalStatus = 'Pending';
            task.approvedBy = undefined;
            task.approvedAt = undefined;
        } else if (status === 'In Progress' || status === 'Pending') {
            // If moved back to In Progress or Pending, set approval status to Pending
            task.approvalStatus = 'Pending';
            task.approvedBy = undefined;
            task.approvedAt = undefined;
        }

        await task.save();

        // Send notification to task creator if status changed to In Progress or Waiting for Approval
        if (status === 'In Progress' || status === 'Waiting for Approval') {
            const createdByUser = await User.findOne({ email: task.createdByEmail });
            const assignedToUser = await User.findOne({ email: task.assignedToEmail });

            if (createdByUser && assignedToUser) {
                notifyStatusChanged(task, assignedToUser, createdByUser, status).catch(err => {
                    console.error('Notification error:', err);
                });
            }
        }

        res.json({
            success: true,
            task,
        });
    } catch (error) {
        console.error('Update task status error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req, res) => {
    try {
        const { task: taskDescription, assignedToEmail, priority, dueDate, notes } = req.body;

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Check if user has permission to update
        const Role = (await import('../models/Role.js')).default;
        const currentUserRole = await Role.findById(req.user.role._id || req.user.role);
        const userEmail = req.user.email;

        let canUpdate = false;
        // Users with editAllTasks permission
        if (currentUserRole?.permissions?.editAllTasks) {
            canUpdate = true;
        }
        // Task Creator (if they have editOwnTasks permission)
        else if (task.createdByEmail === userEmail && currentUserRole?.permissions?.editOwnTasks) {
            canUpdate = true;
        }

        if (!canUpdate) {
            return res.status(403).json({ error: 'Not authorized to update this task' });
        }

        // Update fields
        if (taskDescription) task.task = taskDescription;
        if (priority) task.priority = priority;
        if (dueDate) task.dueDate = new Date(dueDate);
        if (notes !== undefined) task.notes = notes;

        // If changing assignee
        if (assignedToEmail && assignedToEmail !== task.assignedToEmail) {
            const assignedUser = await User.findOne({ email: assignedToEmail });
            if (!assignedUser) {
                return res.status(404).json({ error: 'Assigned user not found' });
            }
            task.assignedTo = assignedUser._id;
            task.assignedToName = assignedUser.name;
            task.assignedToEmail = assignedUser.email;
        }

        await task.save();

        const updatedTask = await Task.findById(task._id).populate('createdBy assignedTo', 'name email role');

        res.json({
            success: true,
            task: updatedTask,
        });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Check if user has permission to delete
        const Role = (await import('../models/Role.js')).default;
        const currentUserRole = await Role.findById(req.user.role._id || req.user.role);
        const userEmail = req.user.email;

        let canDelete = false;
        // Users with deleteAllTasks permission
        if (currentUserRole?.permissions?.deleteAllTasks) {
            canDelete = true;
        }
        // Task Creator (if they have deleteOwnTasks permission)
        else if (task.createdByEmail === userEmail && currentUserRole?.permissions?.deleteOwnTasks) {
            canDelete = true;
        }

        if (!canDelete) {
            return res.status(403).json({ error: 'Not authorized to delete this task' });
        }

        await task.deleteOne();

        res.json({
            success: true,
            message: 'Task deleted successfully',
        });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
export const addTaskComment = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Comment text is required' });
        }

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const userEmail = req.user.email;

        // Check permissions: Creator, Assignee, or Giver can comment
        let canComment = false;
        if (task.createdByEmail === userEmail) {
            canComment = true;
        } else if (task.assignedToEmail === userEmail) {
            canComment = true;
        } else if (task.taskGivenBy === userEmail) {
            canComment = true;
        }

        if (!canComment) {
            return res.status(403).json({ error: 'Not authorized to comment on this task' });
        }

        const newComment = {
            text,
            createdBy: req.user._id,
            createdByName: req.user.name,
            userRole: req.user.role?.displayName || userRoleName,
            createdAt: new Date()
        };

        task.comments.push(newComment);
        await task.save();

        // Return the full task with populated fields
        const updatedTask = await Task.findById(task._id)
            .populate('createdBy assignedTo approvedBy', 'name email role')
            .populate('comments.createdBy', 'name role');

        res.json({
            success: true,
            task: updatedTask
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

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
        const { task, assignedToEmail, priority, durationType, durationValue, notes, isSelfTask } = req.body;

        // Validate required fields
        if (!task || !assignedToEmail || !durationValue) {
            return res.status(400).json({ error: 'Please provide all required fields' });
        }

        // Find assigned user
        const assignedUser = await User.findOne({ email: assignedToEmail });

        if (!assignedUser) {
            return res.status(404).json({ error: 'Assigned user not found' });
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

// @desc    Get tasks assigned to current user
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res) => {
    try {
        const userRoleName = req.user.role?.name || req.user.role;
        const userEmail = req.user.email;

        let tasks;

        // Director and GeneralManager see all tasks
        if (userRoleName === 'director' || userRoleName === 'generalmanager') {
            tasks = await Task.find().populate('createdBy assignedTo', 'name email role').sort({ createdAt: -1 });
        } else {
            // Manager and Staff see only tasks assigned to them by others
            tasks = await Task.find({
                assignedToEmail: userEmail,
                createdByEmail: { $ne: userEmail }, // Not created by themselves
            })
                .populate('createdBy assignedTo', 'name email role')
                .sort({ createdAt: -1 });
        }

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
            .populate('createdBy assignedTo', 'name email role')
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

// @desc    Get tasks assigned by current user
// @route   GET /api/tasks/assigned
// @access  Private
export const getAssignedTasks = async (req, res) => {
    try {
        const tasks = await Task.find({
            createdByEmail: req.user.email,
        })
            .populate('createdBy assignedTo', 'name email role')
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

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private
export const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id).populate('createdBy assignedTo approvedBy', 'name email role');

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

        const userRoleName = req.user.role?.name || req.user.role;
        const userEmail = req.user.email;

        // Check permissions - anyone assigned or any manager/director can update logic, 
        // but let's keep it simple: Assignee can update, Creator can update, Managers+ can update.
        // Actually, adhering to "any role user can assign task to anyone", we should be flexible.

        let canUpdate = false;

        // Admin roles
        if (['director', 'generalmanager', 'manager'].includes(userRoleName)) {
            canUpdate = true;
        }
        // Task Creator
        else if (task.createdByEmail === userEmail) {
            canUpdate = true;
        }
        // Task Assignee
        else if (task.assignedToEmail === userEmail) {
            canUpdate = true;
        }

        if (!canUpdate) {
            return res.status(403).json({ error: 'Not authorized to update this task' });
        }

        // Update status
        task.status = status;

        // Handle Approval Workflow
        if (status === 'Completed') {
            // When marked completed, it goes to Pending Approval
            task.approvalStatus = 'Pending';
            task.approvedBy = undefined;
            task.approvedAt = undefined;
        } else {
            // If moved back to In Progress or Pending (e.g. resubmission or mistake), clear approval status
            task.approvalStatus = undefined;
            task.approvedBy = undefined;
            task.approvedAt = undefined;
        }

        await task.save();

        // Send notification to task creator if status changed to In Progress or Completed
        if (status === 'In Progress' || status === 'Completed') {
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
        const userRoleName = req.user.role?.name || req.user.role;
        const userEmail = req.user.email;

        let canUpdate = false;
        if (userRoleName === 'director' || userRoleName === 'generalmanager') {
            canUpdate = true;
        } else if (task.createdByEmail === userEmail) {
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
        const userRoleName = req.user.role?.name || req.user.role;
        const userEmail = req.user.email;

        let canDelete = false;
        if (userRoleName === 'director' || userRoleName === 'generalmanager') {
            canDelete = true;
        } else if (task.createdByEmail === userEmail) {
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

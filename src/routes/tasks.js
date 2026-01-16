import express from 'express';
import {
    createTask,
    getTasks,
    getSelfTasks,
    getAssignedTasks,
    getAllTasks,
    getTaskById,
    updateTaskStatus,
    updateTask,
    deleteTask,
    addTaskComment,
} from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Task routes - All authenticated users can create and manage tasks
router.post('/', createTask); // No permission required - all users can create tasks
router.get('/', getTasks); // No specific permission needed - controller handles logic
router.get('/self', getSelfTasks); // No specific permission needed - own tasks
router.get('/assigned', getAssignedTasks); // No specific permission needed - assigned tasks
router.get('/all', getAllTasks); // Role-based filtering - all tasks
router.get('/:id', getTaskById); // No specific permission needed - controller handles logic
router.patch('/:id/status', updateTaskStatus); // No specific permission needed - users can update their own task status
router.put('/:id', updateTask); // Controller handles permission logic (editOwnTasks vs editAllTasks)
router.delete('/:id', deleteTask); // Controller handles permission logic (deleteOwnTasks vs deleteAllTasks)
router.post('/:id/comments', addTaskComment); // Add comment to task

export default router;



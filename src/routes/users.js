import express from 'express';
import {
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    getAvailableRoles,
    getUsersForTaskAssignment,
} from '../controllers/userController.js';
import { protect, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// User CRUD with permission-based access
router.get('/', checkPermission('viewUsers'), getUsers);
router.get('/available-roles', checkPermission('createUsers'), getAvailableRoles);
router.get('/for-tasks', getUsersForTaskAssignment); // No permission required - all users can see this
router.get('/:id', getUser);
router.put('/:id', checkPermission('editUsers'), updateUser);
router.delete('/:id', checkPermission('deleteUsers'), deleteUser);

export default router;


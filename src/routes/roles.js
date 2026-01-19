import express from 'express';
import {
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
} from '../controllers/roleController.js';
import { protect, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Role routes with granular permissions
router.get('/', checkPermission('viewRoles'), getRoles);
router.get('/:id', checkPermission('viewRoles'), getRoleById);
router.post('/', checkPermission('createRoles'), createRole);
router.put('/:id', checkPermission('editRoles'), updateRole);
router.delete('/:id', checkPermission('deleteRoles'), deleteRole);

export default router;

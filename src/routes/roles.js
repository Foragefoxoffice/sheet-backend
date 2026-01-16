import express from 'express';
import {
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
} from '../controllers/roleController.js';
import { protect } from '../middleware/auth.js';
import isSuperAdmin from '../middleware/isSuperAdmin.js';

const router = express.Router();

// All routes are protected and require super admin access
router.use(protect);
router.use(isSuperAdmin);

// Role routes - Only accessible by super admins
router.get('/', getRoles);
router.get('/:id', getRoleById);
router.post('/', createRole);
router.put('/:id', updateRole);
router.delete('/:id', deleteRole);

export default router;

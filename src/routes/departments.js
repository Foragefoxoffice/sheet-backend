import express from 'express';
import {
    getDepartments,
    getDepartment,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    addMember,
    removeMember,
} from '../controllers/departmentController.js';
import { protect, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Department CRUD with permission-based access
router.get('/', getDepartments); // Anyone can view departments list
router.get('/:id', getDepartment);
router.post('/', checkPermission('createDepartments'), createDepartment);
router.put('/:id', checkPermission('editDepartments'), updateDepartment);
router.delete('/:id', checkPermission('deleteDepartments'), deleteDepartment);

// Member management
router.post('/:id/members', checkPermission('editDepartments'), addMember);
router.delete('/:id/members/:userId', checkPermission('editDepartments'), removeMember);

export default router;

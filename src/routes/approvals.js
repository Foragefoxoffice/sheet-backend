import express from 'express';
import { getPendingApprovals, approveTask, rejectTask } from '../controllers/approvalController.js';
import { protect, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/', checkPermission('viewApprovals'), getPendingApprovals);
router.post('/:id/approve', checkPermission('approveRejectTasks'), approveTask);
router.post('/:id/reject', checkPermission('approveRejectTasks'), rejectTask);

export default router;

import express from 'express';
import { getPendingApprovals, approveTask, rejectTask } from '../controllers/approvalController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/', getPendingApprovals);
router.post('/:id/approve', approveTask);
router.post('/:id/reject', rejectTask);

export default router;

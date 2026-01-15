import express from 'express';
import { getTaskStatistics, getUserReports } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/statistics', getTaskStatistics);
router.get('/users', getUserReports);

export default router;

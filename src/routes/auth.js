import express from 'express';
import { login, getCurrentUser, register } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register); // For testing - should be protected in production
router.get('/me', protect, getCurrentUser);

export default router;

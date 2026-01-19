import express from 'express';
import { sendOTP, verifyOTP, resetPassword } from '../controllers/passwordResetController.js';

const router = express.Router();

// Send OTP to WhatsApp
router.post('/send-otp', sendOTP);

// Verify OTP
router.post('/verify-otp', verifyOTP);

// Reset password
router.post('/reset-password', resetPassword);

export default router;

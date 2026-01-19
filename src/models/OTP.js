import mongoose from 'mongoose';
import crypto from 'crypto';

const otpSchema = new mongoose.Schema({
    whatsapp: {
        type: String,
        required: true,
        trim: true,
    },
    otp: {
        type: String,
        required: true,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

// Create TTL index to auto-delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Hash OTP before saving
otpSchema.pre('save', async function (next) {
    if (this.isModified('otp')) {
        this.otp = crypto.createHash('sha256').update(this.otp).digest('hex');
    }
    next();
});

// Method to compare OTP
otpSchema.methods.compareOTP = function (candidateOTP) {
    const hashedCandidate = crypto.createHash('sha256').update(candidateOTP).digest('hex');
    return this.otp === hashedCandidate;
};

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;

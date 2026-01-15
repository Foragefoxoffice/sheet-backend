import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
    try {
        const { whatsapp, password } = req.body;

        if (!whatsapp || !password) {
            return res.status(400).json({ error: 'Please provide WhatsApp number and password' });
        }

        // Find user by whatsapp and include password, populate role
        const user = await User.findOne({ whatsapp }).select('+password').populate('role');

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                whatsapp: user.whatsapp,
                role: user.role,
                permissions: user.role?.permissions || {},
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('role');

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                whatsapp: user.whatsapp,
                role: user.role,
                permissions: user.role?.permissions || {},
            },
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Register new user (for testing/admin purposes)
// @route   POST /api/auth/register
// @access  Public (should be protected in production)
export const register = async (req, res) => {
    try {
        const { name, email, whatsapp, password, role, department } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ $or: [{ email }, { whatsapp }] });

        if (userExists) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            whatsapp,
            password,
            role: role || 'Staff',
            department: department || null,
        });

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                whatsapp: user.whatsapp,
                role: user.role,
                department: user.department,
            },
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

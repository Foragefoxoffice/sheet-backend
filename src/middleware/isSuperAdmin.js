import User from '../models/User.js';

/**
 * Middleware to check if user is a Super Admin
 * Super admins have exclusive access to role management
 */
export const isSuperAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).populate('role');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user role is superadmin (lowercase to match DB)
        const roleName = typeof user.role === 'string' ? user.role : user.role?.name;

        if (roleName !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Super Admin privileges required.'
            });
        }

        next();
    } catch (error) {
        console.error('Super Admin check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying super admin status'
        });
    }
};

export default isSuperAdmin;

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Role from '../models/Role.js';

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token and populate role with permissions
            req.user = await User.findById(decoded.id).select('-password').populate('role');

            if (!req.user) {
                return res.status(401).json({ error: 'User not found' });
            }

            // If user has no role or role is a string (old system), handle gracefully
            if (!req.user.role || typeof req.user.role === 'string') {
                // For backward compatibility, assign a default role based on old role string
                const roleName = req.user.role || 'staff';
                const defaultRole = await Role.findOne({ name: roleName.toLowerCase() });

                if (defaultRole) {
                    req.user.role = defaultRole;
                    // Update user document
                    await User.findByIdAndUpdate(req.user._id, { role: defaultRole._id });
                }
            }

            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ error: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'Not authorized, no token' });
    }
};

// Permission-based authorization middleware
export const checkPermission = (permission) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({
                error: 'User role not found',
            });
        }

        const hasPermission = req.user.role.permissions && req.user.role.permissions[permission];

        if (!hasPermission) {
            return res.status(403).json({
                error: `You don't have permission to ${permission}`,
            });
        }

        next();
    };
};

// Role-based authorization middleware (kept for backward compatibility)
export const authorize = (...roles) => {
    return (req, res, next) => {
        const userRole = req.user.role?.name || req.user.role;

        if (!roles.includes(userRole)) {
            return res.status(403).json({
                error: `User role '${userRole}' is not authorized to access this route`,
            });
        }
        next();
    };
};

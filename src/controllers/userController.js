import User from '../models/User.js';
import Role from '../models/Role.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private (requires viewUsers permission)
export const getUsers = async (req, res) => {
    try {
        const currentUserRole = req.user.role;
        const currentUserLevel = currentUserRole?.level || 0;

        // Parse pagination params
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let query = {};

        // Managers can only see users in their department
        if (currentUserLevel === 2) { // Manager level
            if (!req.user.department) {
                return res.json({
                    success: true,
                    count: 0,
                    total: 0,
                    users: [],
                    message: 'You need to be assigned to a department to view users'
                });
            }
            query.department = req.user.department;
        }
        // Director and GM can see all users (level 3 and 4)

        const users = await User.find(query)
            .select('-password')
            .populate('department', 'name')
            .populate('role', 'name displayName level designation')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            count: users.length,
            total,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasMore: page * limit < total
            },
            users,
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
export const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('department', 'name')
            .populate('role', 'name displayName level');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if manager can access this user
        const currentUserRole = req.user.role;
        const currentUserLevel = currentUserRole?.level || 0;

        if (currentUserLevel === 2) { // Manager
            if (user.department?._id?.toString() !== req.user.department?.toString()) {
                return res.status(403).json({
                    error: 'You can only view users in your department'
                });
            }
        }

        res.json({
            success: true,
            user,
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (requires editUsers permission)
export const updateUser = async (req, res) => {
    try {
        const { name, email, whatsapp, role, department } = req.body;

        const user = await User.findById(req.params.id).populate('role');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if manager can edit this user
        const currentUserRole = req.user.role;
        const currentUserLevel = currentUserRole?.level || 0;

        if (currentUserLevel === 2) { // Manager
            // Can only edit users in their department
            if (user.department?.toString() !== req.user.department?.toString()) {
                return res.status(403).json({
                    error: 'You can only edit users in your department'
                });
            }

            // Cannot change department
            if (department && department !== user.department?.toString()) {
                return res.status(403).json({
                    error: 'You cannot move users to a different department'
                });
            }
        }

        // If role is being changed, check hierarchy
        if (role && role !== user.role?._id?.toString() && role !== user.role?.toString()) {
            const targetRole = await Role.findById(role);

            if (!targetRole) {
                return res.status(400).json({ error: 'Invalid role' });
            }

            // Safely get current user's role level
            const currentUserLevel = currentUserRole?.level || 999; // High number if no level

            // Check if current user can assign this role
            if (targetRole.level >= currentUserLevel) {
                return res.status(403).json({
                    error: `You cannot assign the ${targetRole.displayName} role. You can only assign roles below your level.`
                });
            }
        }

        // Check for duplicate email or whatsapp (excluding current user)
        if (email && email !== user.email) {
            const existingEmail = await User.findOne({ email, _id: { $ne: req.params.id } });
            if (existingEmail) {
                return res.status(400).json({ error: 'Email already in use by another user' });
            }
        }

        if (whatsapp && whatsapp !== user.whatsapp) {
            const existingWhatsApp = await User.findOne({ whatsapp, _id: { $ne: req.params.id } });
            if (existingWhatsApp) {
                return res.status(400).json({ error: 'WhatsApp number already in use by another user' });
            }
        }

        // Update fields
        if (name) user.name = name;
        if (email) user.email = email;
        if (whatsapp) user.whatsapp = whatsapp;
        if (req.body.designation !== undefined) user.designation = req.body.designation;

        // Handle department updates
        const currentRoleName = typeof currentUserRole === 'string' ? currentUserRole : currentUserRole?.name;

        // Update role if provided and user has permission
        if (role && role !== user.role?._id?.toString() && role !== user.role?.toString()) {
            const RoleModel = (await import('../models/Role.js')).default;
            const currentUserRoleDoc = await RoleModel.findById(currentUserRole._id || currentUserRole).populate('managedRoles');
            const newRole = await RoleModel.findById(role);

            if (!newRole) {
                return res.status(404).json({ error: 'Role not found' });
            }

            // Validate role hierarchy - check if new role is in managedRoles
            if (currentRoleName === 'superadmin') {
                // Super Admin can assign any role except Super Admin itself
                if (newRole.name === 'superadmin') {
                    return res.status(403).json({
                        error: 'Cannot assign Super Admin role to users'
                    });
                }
            } else {
                // Other users can only assign roles in their managedRoles list
                const canManage = currentUserRoleDoc.managedRoles.some(
                    managedRole => managedRole._id.toString() === newRole._id.toString()
                );

                if (!canManage) {
                    return res.status(403).json({
                        error: `You cannot assign the "${newRole.displayName}" role. Check your role's managed roles permissions.`
                    });
                }
            }

            user.role = role;
        }

        if (department !== undefined && (currentUserLevel >= 3 || currentRoleName === 'superadmin')) {
            // Director/GM/SuperAdmin can change departments
            user.department = department && department !== '' ? department : null;
        }

        await user.save();

        const updatedUser = await User.findById(user._id)
            .select('-password')
            .populate('department', 'name')
            .populate('role', 'name displayName level');

        res.json({
            success: true,
            user: updatedUser,
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (requires deleteUsers permission)
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('role');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if manager can delete this user
        const currentUserRole = req.user.role;
        const currentUserLevel = currentUserRole?.level || 999;

        if (currentUserLevel === 2) { // Manager
            // Can only delete users in their department
            if (user.department?.toString() !== req.user.department?.toString()) {
                return res.status(403).json({
                    error: 'You can only delete users in your department'
                });
            }
        }

        // Check hierarchy - can only delete users with lower level roles
        const targetUserLevel = user.role?.level || 0;

        if (targetUserLevel >= currentUserLevel) {
            return res.status(403).json({
                error: 'You cannot delete users with equal or higher role levels'
            });
        }

        await user.deleteOne();

        res.json({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get available roles for user creation
// @route   GET /api/users/available-roles
// @access  Private (requires createUsers permission)
export const getAvailableRoles = async (req, res) => {
    try {
        const currentUserRole = await Role.findById(req.user.role._id || req.user.role).populate('managedRoles');

        if (!currentUserRole) {
            return res.status(404).json({ error: 'User role not found' });
        }

        const currentRoleName = currentUserRole.name;
        let availableRoles;

        // Super admin can assign any role except Super Admin itself
        if (currentRoleName === 'superadmin') {
            availableRoles = await Role.find({
                name: { $ne: 'superadmin' }
            })
                .select('_id name displayName description permissions')
                .sort({ displayName: 1 });
        }
        // Other users can only assign roles in their managedRoles list
        else {
            const managedRoleIds = currentUserRole.managedRoles.map(role => role._id);
            availableRoles = await Role.find({
                _id: { $in: managedRoleIds }
            })
                .select('_id name displayName description permissions')
                .sort({ displayName: 1 });
        }

        res.json({
            success: true,
            roles: availableRoles,
        });
    } catch (error) {
        console.error('Get available roles error:', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get users for task assignment (role-based filtering)
// @route   GET /api/users/for-tasks
// @access  Private (authenticated users only)
export const getUsersForTaskAssignment = async (req, res) => {
    try {
        const currentUser = req.user;
        const currentUserRole = req.user.role;
        let query = {};
        const Role = (await import('../models/Role.js')).default;

        // Helper to find role IDs by names
        const getRoleIds = async (names) => {
            const roles = await Role.find({
                $or: names.map(n => ({
                    name: { $regex: new RegExp(`^${n}$`, 'i') }
                }))
            });
            return roles.map(r => r._id);
        };

        // Explicitly load role if needed to be sure
        let userRole = currentUserRole;
        if (!userRole || !userRole.name) {
             // If role is ID
             if (currentUser.role) {
                userRole = await Role.findById(currentUser.role);
             }
        }

        const currentRoleName = userRole?.name?.toLowerCase().replace(/\s+/g, '') || '';
        const roleLevel = userRole?.level || 0;

        // 0. Super Admin (By name or Level 6+)
        if (currentRoleName === 'superadmin' || roleLevel >= 6) {
            query = {};
        }

        // 1. Main Director
        // Can assign to anyone
        else if (currentRoleName === 'maindirector') {
            query = {};
        }

        // 2. Director (and Director2)
        // Can assign tasks only to GMs and Department Heads.
        else if (currentRoleName === 'director' || currentRoleName === 'director2' || currentUser.name.includes('Vasanth') || currentUser.name.includes('Guna') || currentUser.name.includes('Sathish')) {
            const allowedRoleIds = await getRoleIds(['generalmanager', 'General Manager', 'manager', 'Manager', 'departmenthead', 'Department Head']);
            query = { role: { $in: allowedRoleIds } };
        }

        // 3. General Manager (GM)
        // Can assign only to Department Heads, Project Managers, and Standalone Roles.
        else if (currentRoleName === 'generalmanager') {
            const allowedRoleIds = await getRoleIds(['manager', 'Manager', 'departmenthead', 'Department Head', 'projectmanager', 'Project Manager', 'standalone', 'standalonerole', 'Standalone Role']);
            query = { role: { $in: allowedRoleIds } };
        }

        // 4. Department Heads
        // Can assign to other Department Heads, Project Managers, Standalone Roles.
        // AND Can assign or forward tasks within their own department.
        else if (currentRoleName === 'manager' || currentRoleName === 'departmenthead') {
            const targetRoleNames = [
                'manager', 'Manager', 
                'departmenthead', 'Department Head', 'DepartmentHead'
            ];
            
            const targetRoleIds = await getRoleIds(targetRoleNames);

            query = {
                $or: [
                    { role: { $in: targetRoleIds } },
                    { department: currentUser.department }
                ]
            };
        }

        // 5. Staff
        // Can assign tasks only to Department Heads, Project Managers, and Standalone Roles.
        else if (currentRoleName === 'staff') {
            const targetRoleNames = [
                'manager', 'Manager', 
                'departmenthead', 'Department Head', 'DepartmentHead',
                'projectmanager', 'Project Manager', 'ProjectManager',
                'standalone', 'standalonerole', 'Standalone Role', 'StandaloneRole'
            ];
            const allowedRoleIds = await getRoleIds(targetRoleNames);
            query = {
                $or: [
                    { role: { $in: allowedRoleIds } },
                    { department: currentUser.department }
                ]
            };
        }

        // 6. Project Managers and Standalone Roles
        // Can assign costs to Department Heads, Project Managers, and Standalone Roles.
        else if (currentRoleName === 'projectmanager' || currentRoleName === 'standalone' || currentRoleName === 'standalonerole' || currentRoleName === 'projectmanagerandstandalone') {
            const targetRoleNames = [
                'manager', 'Manager', 
                'departmenthead', 'Department Head', 'DepartmentHead',
                'projectmanager', 'Project Manager', 'ProjectManager',
                'standalone', 'standalonerole', 'Standalone Role', 'StandaloneRole'
            ];
            const allowedRoleIds = await getRoleIds(targetRoleNames);
            query = {
                $or: [
                    { role: { $in: allowedRoleIds } },
                    { department: currentUser.department }
                ]
            };
        }

        // Default: If role not matched above, fallback
        else {
            const targetRoleNames = [
                'manager', 'Manager', 
                'departmenthead', 'Department Head', 
                'projectmanager', 'Project Manager',
                'standalone', 'standalonerole'
            ];
            const allowedRoleIds = await getRoleIds(targetRoleNames);
            query = { role: { $in: allowedRoleIds } };
        }

        const users = await User.find(query)
            .select('name email role designation department')
            .populate('role', 'name displayName')
            .populate('department', 'name')
            .sort({ name: 1 });

        res.json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        console.error('Get users for task assignment error:', error);
        res.status(500).json({ error: error.message });
    }
};

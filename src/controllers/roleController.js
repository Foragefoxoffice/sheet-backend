import Role from '../models/Role.js';
import User from '../models/User.js';

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private (requires viewRoles permission)
export const getRoles = async (req, res) => {
    try {
        const roles = await Role.find().sort({ createdAt: -1 });

        res.json({
            success: true,
            roles,
        });
    } catch (error) {
        console.error('Get roles error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Get role by ID
// @route   GET /api/roles/:id
// @access  Private (requires viewRoles permission)
export const getRoleById = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);

        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        res.json({
            success: true,
            role,
        });
    } catch (error) {
        console.error('Get role by ID error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Create new role
// @route   POST /api/roles
// @access  Private (requires createRoles permission)
export const createRole = async (req, res) => {
    try {
        const { name, displayName, description, permissions } = req.body;

        // Validate required fields
        if (!name || !displayName) {
            return res.status(400).json({ error: 'Name and display name are required' });
        }

        // Check if role already exists
        const existingRole = await Role.findOne({ name: name.toLowerCase() });
        if (existingRole) {
            return res.status(400).json({ error: 'Role with this name already exists' });
        }

        // Create role
        const role = await Role.create({
            name: name.toLowerCase(),
            displayName,
            description: description || '',
            permissions: permissions || {},
            isSystem: false,
            createdBy: req.user._id,
        });

        res.status(201).json({
            success: true,
            role,
        });
    } catch (error) {
        console.error('Create role error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// @desc    Update role
// @route   PUT /api/roles/:id
// @access  Private (requires editRoles permission)
export const updateRole = async (req, res) => {
    try {
        const { displayName, description, permissions } = req.body;

        const role = await Role.findById(req.params.id);

        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        // Update fields
        if (displayName) role.displayName = displayName;
        if (description !== undefined) role.description = description;
        if (permissions) role.permissions = { ...role.permissions, ...permissions };

        await role.save();

        res.json({
            success: true,
            role,
        });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// @desc    Delete role
// @route   DELETE /api/roles/:id
// @access  Private (requires deleteRoles permission)
export const deleteRole = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);

        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        // Prevent deletion of system roles
        if (role.isSystem) {
            return res.status(403).json({ error: 'Cannot delete system roles' });
        }

        // Check if any users have this role
        const usersWithRole = await User.countDocuments({ role: role._id });
        if (usersWithRole > 0) {
            return res.status(400).json({
                error: `Cannot delete role. ${usersWithRole} user(s) are assigned this role.`
            });
        }

        await role.deleteOne();

        res.json({
            success: true,
            message: 'Role deleted successfully',
        });
    } catch (error) {
        console.error('Delete role error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

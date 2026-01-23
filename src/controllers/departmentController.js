import Department from '../models/Department.js';
import User from '../models/User.js';

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
export const getDepartments = async (req, res) => {
    try {
        const currentUser = req.user;
        const Role = (await import('../models/Role.js')).default;
        const currentUserRole = await Role.findById(currentUser.role._id || currentUser.role);

        let query = {};

        // If user doesn't have viewDepartments permission, restrict to their own department
        if (!currentUserRole?.permissions?.viewDepartments) {
            if (currentUser.department) {
                query = { _id: currentUser.department };
            } else {
                return res.json({ success: true, count: 0, departments: [] });
            }
        }
        // Users with viewDepartments can see all departments

        const departments = await Department.find(query)
            .populate('manager', 'name email role')
            .sort({ createdAt: -1 });

        // Count members for each department by querying users
        const departmentsWithCounts = await Promise.all(
            departments.map(async (dept) => {
                const memberCount = await User.countDocuments({ department: dept._id });
                return {
                    ...dept.toObject(),
                    members: [], // Keep empty array for compatibility
                    memberCount, // Add actual count
                };
            })
        );

        res.json({
            success: true,
            count: departmentsWithCounts.length,
            departments: departmentsWithCounts,
        });
    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Private
export const getDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id)
            .populate('manager', 'name email role whatsapp')
            .populate('members', 'name email role whatsapp');

        if (!department) {
            return res.status(404).json({ error: 'Department not found' });
        }

        res.json({
            success: true,
            department,
        });
    } catch (error) {
        console.error('Get department error:', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Create department
// @route   POST /api/departments
// @access  Private (requires createDepartments permission)
export const createDepartment = async (req, res) => {
    try {
        const { name, description, manager } = req.body;

        // Check if department already exists
        const existingDept = await Department.findOne({ name });
        if (existingDept) {
            return res.status(400).json({ error: 'Department already exists' });
        }

        // Verify manager exists if provided
        if (manager) {
            const managerUser = await User.findById(manager).populate('role');
            if (!managerUser) {
                return res.status(404).json({ error: 'Manager not found' });
            }
            // Note: Removed hardcoded role check - any user can be assigned as manager
        }

        const department = await Department.create({
            name,
            description,
            manager,
            members: manager ? [manager] : [],
        });

        const populatedDept = await Department.findById(department._id)
            .populate('manager', 'name email role')
            .populate('members', 'name email role');

        res.status(201).json({
            success: true,
            department: populatedDept,
        });
    } catch (error) {
        console.error('Create department error:', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (requires editDepartments permission)
export const updateDepartment = async (req, res) => {
    try {
        const { name, description, manager, isActive } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (manager !== undefined) updates.manager = manager;
        if (typeof isActive !== 'undefined') updates.isActive = isActive;

        const updatedDept = await Department.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true }
        )
        .populate('manager', 'name email role')
        .populate('members', 'name email role');

        if (!updatedDept) {
            return res.status(404).json({ error: 'Department not found' });
        }

        res.json({
            success: true,
            department: updatedDept,
        });
    } catch (error) {
        console.error('Update department error:', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (requires deleteDepartments permission)
export const deleteDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({ error: 'Department not found' });
        }

        await department.deleteOne();

        res.json({
            success: true,
            message: 'Department deleted successfully',
        });
    } catch (error) {
        console.error('Delete department error:', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Add member to department
// @route   POST /api/departments/:id/members
// @access  Private (Director, GM, Manager)
export const addMember = async (req, res) => {
    try {
        const { userId } = req.body;

        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({ error: 'Department not found' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if user is already a member
        if (department.members.includes(userId)) {
            return res.status(400).json({ error: 'User is already a member of this department' });
        }

        department.members.push(userId);
        await department.save();

        const updatedDept = await Department.findById(department._id)
            .populate('manager', 'name email role')
            .populate('members', 'name email role');

        res.json({
            success: true,
            department: updatedDept,
        });
    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Remove member from department
// @route   DELETE /api/departments/:id/members/:userId
// @access  Private (Director, GM, Manager)
export const removeMember = async (req, res) => {
    try {
        const { userId } = req.params;

        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({ error: 'Department not found' });
        }

        department.members = department.members.filter(
            member => member.toString() !== userId
        );
        await department.save();

        const updatedDept = await Department.findById(department._id)
            .populate('manager', 'name email role')
            .populate('members', 'name email role');

        res.json({
            success: true,
            department: updatedDept,
        });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ error: error.message });
    }
};

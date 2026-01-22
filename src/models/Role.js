import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Role name is required'],
            unique: true,
            trim: true,
        },
        displayName: {
            type: String,
            required: [true, 'Display name is required'],
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },
        level: {
            type: Number,
            default: 1,
            // 1 = Staff (lowest)
            // 2 = Manager
            // 3 = General Manager
            // 4 = Director (highest)
        },
        permissions: {
            // User Management
            viewUsers: {
                type: Boolean,
                default: false,
            },
            createUsers: {
                type: Boolean,
                default: false,
            },
            editUsers: {
                type: Boolean,
                default: false,
            },
            deleteUsers: {
                type: Boolean,
                default: false,
            },

            // Department Management
            viewDepartments: {
                type: Boolean,
                default: false,
            },
            createDepartments: {
                type: Boolean,
                default: false,
            },
            editDepartments: {
                type: Boolean,
                default: false,
            },
            deleteDepartments: {
                type: Boolean,
                default: false,
            },

            // Task Management
            viewAllTasks: {
                type: Boolean,
                default: false,
            },
            viewDepartmentTasks: {
                type: Boolean,
                default: false,
            },
            viewAssignedToMeTasks: {
                type: Boolean,
                default: true,
            },
            viewIAssignedTasks: {
                type: Boolean,
                default: true,
            },
            viewSelfTasks: {
                type: Boolean,
                default: true,
            },
            createTasks: {
                type: Boolean,
                default: true, // Everyone can create tasks
            },
            editOwnTasks: {
                type: Boolean,
                default: true,
            },
            editAllTasks: {
                type: Boolean,
                default: false,
            },
            deleteOwnTasks: {
                type: Boolean,
                default: false,
            },
            deleteAllTasks: {
                type: Boolean,
                default: false,
            },

            // Tab-Specific Filter Visibility Permissions
            // All Tasks Tab Filters
            filterAllTasksDepartment: {
                type: Boolean,
                default: false,
            },
            filterAllTasksPriority: {
                type: Boolean,
                default: true,
            },
            filterAllTasksRole: {
                type: Boolean,
                default: false,
            },
            filterAllTasksUser: {
                type: Boolean,
                default: false,
            },

            // Department Tasks Tab Filters
            filterDeptTasksDepartment: {
                type: Boolean,
                default: false,
            },
            filterDeptTasksPriority: {
                type: Boolean,
                default: true,
            },
            filterDeptTasksRole: {
                type: Boolean,
                default: false,
            },
            filterDeptTasksUser: {
                type: Boolean,
                default: false,
            },

            // Assigned to Me Tab Filters
            filterAssignedToMeDepartment: {
                type: Boolean,
                default: false,
            },
            filterAssignedToMePriority: {
                type: Boolean,
                default: true,
            },
            filterAssignedToMeRole: {
                type: Boolean,
                default: false,
            },
            filterAssignedToMeUser: {
                type: Boolean,
                default: false,
            },

            // I Assigned Tab Filters
            filterIAssignedDepartment: {
                type: Boolean,
                default: false,
            },
            filterIAssignedPriority: {
                type: Boolean,
                default: true,
            },
            filterIAssignedRole: {
                type: Boolean,
                default: false,
            },
            filterIAssignedUser: {
                type: Boolean,
                default: false,
            },

            // Self Tasks Tab Filters
            filterSelfTasksDepartment: {
                type: Boolean,
                default: false,
            },
            filterSelfTasksPriority: {
                type: Boolean,
                default: true,
            },
            filterSelfTasksRole: {
                type: Boolean,
                default: false,
            },
            filterSelfTasksUser: {
                type: Boolean,
                default: false,
            },

            // Approvals
            viewApprovals: {
                type: Boolean,
                default: false,
            },
            approveRejectTasks: {
                type: Boolean,
                default: false,
            },

            // Reports
            viewReports: {
                type: Boolean,
                default: false,
            },
            downloadReports: {
                type: Boolean,
                default: false,
            },

            // Role Management
            viewRoles: {
                type: Boolean,
                default: false,
            },
            createRoles: {
                type: Boolean,
                default: false,
            },
            deleteRoles: {
                type: Boolean,
                default: false,
            },
        },
        managedRoles: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role'
        }],
        isSystem: {
            type: Boolean,
            default: false,
        },
        isStatic: {
            type: Boolean,
            default: false,
            // Static roles (like Super Admin) cannot be edited or deleted
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

const Role = mongoose.model('Role', roleSchema);

export default Role;

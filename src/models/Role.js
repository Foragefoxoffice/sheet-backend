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
            editRoles: {
                type: Boolean,
                default: false,
            },
            deleteRoles: {
                type: Boolean,
                default: false,
            },
        },
        isSystem: {
            type: Boolean,
            default: false,
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

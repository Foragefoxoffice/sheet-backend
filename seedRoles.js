import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Role from './src/models/Role.js';
import connectDB from './src/config/database.js';

dotenv.config();

const defaultRoles = [
    {
        name: 'director',
        displayName: 'Director',
        description: 'Full system access with all permissions',
        level: 4, // Highest level
        isSystem: true,
        permissions: {
            viewUsers: true,
            createUsers: true,
            editUsers: true,
            deleteUsers: true,
            viewDepartments: true,
            createDepartments: true,
            editDepartments: true,
            deleteDepartments: true,
            viewAllTasks: true,
            createTasks: true,
            editOwnTasks: true,
            editAllTasks: true,
            deleteOwnTasks: true,
            deleteAllTasks: true,
            viewApprovals: true,
            approveRejectTasks: true,
            viewReports: true,
            downloadReports: true,
            viewRoles: true,
            createRoles: true,
            editRoles: true,
            deleteRoles: true,
        },
    },
    {
        name: 'generalmanager',
        displayName: 'General Manager',
        description: 'Full system access with all permissions',
        level: 3,
        isSystem: true,
        permissions: {
            viewUsers: true,
            createUsers: true,
            editUsers: true,
            deleteUsers: true,
            viewDepartments: true,
            createDepartments: true,
            editDepartments: true,
            deleteDepartments: true,
            viewAllTasks: true,
            createTasks: true,
            editOwnTasks: true,
            editAllTasks: true,
            deleteOwnTasks: true,
            deleteAllTasks: true,
            viewApprovals: true,
            approveRejectTasks: true,
            viewReports: true,
            downloadReports: true,
            viewRoles: true,
            createRoles: true,
            editRoles: true,
            deleteRoles: true,
        },
    },
    {
        name: 'manager',
        displayName: 'Manager',
        description: 'Can manage users in their department and handle tasks',
        level: 2,
        isSystem: true,
        permissions: {
            viewUsers: true,
            createUsers: true, // Can create users in their department
            editUsers: true,   // Can edit users in their department
            deleteUsers: true, // Can delete users in their department
            viewDepartments: true,
            createDepartments: false,
            editDepartments: false,
            deleteDepartments: false,
            viewAllTasks: true,
            createTasks: true,
            editOwnTasks: true,
            editAllTasks: true,
            deleteOwnTasks: true,
            deleteAllTasks: false,
            viewApprovals: true,
            approveRejectTasks: true,
            viewReports: true,
            downloadReports: true,
            viewRoles: false,
            createRoles: false,
            editRoles: false,
            deleteRoles: false,
        },
    },
    {
        name: 'staff',
        displayName: 'Staff',
        description: 'Task management access only',
        level: 1, // Lowest level
        isSystem: true,
        permissions: {
            viewUsers: false,      // No user access
            createUsers: false,    // No user access
            editUsers: false,      // No user access
            deleteUsers: false,    // No user access
            viewDepartments: false,
            createDepartments: false,
            editDepartments: false,
            deleteDepartments: false,
            viewAllTasks: false,   // Can only see their own tasks
            createTasks: true,
            editOwnTasks: true,
            editAllTasks: false,
            deleteOwnTasks: false,
            deleteAllTasks: false,
            viewApprovals: false,
            approveRejectTasks: false,
            viewReports: false,
            downloadReports: false,
            viewRoles: false,
            createRoles: false,
            editRoles: false,
            deleteRoles: false,
        },
    },
];

const seedRoles = async () => {
    try {
        await connectDB();

        console.log('🔄 Seeding default roles with hierarchy...');

        for (const roleData of defaultRoles) {
            const existingRole = await Role.findOne({ name: roleData.name });

            if (existingRole) {
                console.log(`✓ Role "${roleData.displayName}" already exists, updating...`);
                await Role.findByIdAndUpdate(existingRole._id, roleData);
            } else {
                console.log(`+ Creating role "${roleData.displayName}" (Level ${roleData.level})...`);
                await Role.create(roleData);
            }
        }

        console.log('\n✅ Default roles seeded successfully!');
        console.log('\n📊 Role Hierarchy:');
        console.log('Level 4: Director (can create all roles)');
        console.log('Level 3: General Manager (can create Manager & Staff)');
        console.log('Level 2: Manager (can create Staff only)');
        console.log('Level 1: Staff (cannot create users)');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding roles:', error);
        process.exit(1);
    }
};

seedRoles();

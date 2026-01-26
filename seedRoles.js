import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Role from './src/models/Role.js';
import connectDB from './src/config/database.js';

dotenv.config();

const defaultRoles = [
    {
        name: 'superadmin',
        displayName: 'Super Admin',
        description: 'Super Administrator with full system access including role management. This role cannot be edited or deleted.',
        level: 6, // Highest level
        isSystem: true,
        isStatic: true, // Cannot be edited or deleted
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
            // Filter Permissions
            filterAllTasksDepartment: true,
            filterAllTasksPriority: true,
            filterAllTasksRole: true,
            filterAllTasksUser: true,
            filterIAssignedDepartment: true,
            filterIAssignedPriority: true,
            filterIAssignedRole: true,
            filterIAssignedUser: true,
            filterSelfTasksDepartment: true,
            filterSelfTasksPriority: true,
            filterSelfTasksRole: true,
            filterSelfTasksUser: true,
        },
    },
    {
        name: 'maindirector',
        displayName: 'Main Director',
        description: 'Can assign tasks to anyone. Notifies dept head when assigning to executive-level staff.',
        level: 5,
        isSystem: true,
        isStatic: false,
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
            // Filter Permissions
            filterAllTasksDepartment: true,
            filterAllTasksPriority: true,
            filterAllTasksRole: true,
            filterAllTasksUser: true,
            filterIAssignedDepartment: true,
            filterIAssignedPriority: true,
            filterIAssignedRole: true,
            filterIAssignedUser: true,
        },
    },
    {
        name: 'director',
        displayName: 'Director',
        description: 'Can assign tasks only to GMs and Department Heads. Can view all tasks.',
        level: 4,
        isSystem: true,
        isStatic: false,
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
            // Filter Permissions
            filterAllTasksDepartment: true,
            filterAllTasksPriority: true,
            filterAllTasksRole: true,
            filterAllTasksUser: true,
            filterIAssignedDepartment: true,
            filterIAssignedPriority: true,
            filterIAssignedRole: true,
            filterIAssignedUser: true,
            filterSelfTasksDepartment: true,
            filterSelfTasksPriority: true,
            filterSelfTasksRole: true,
            filterSelfTasksUser: true,
        },
    },
    {
        name: 'generalmanager',
        displayName: 'General Manager',
        description: 'Can assign to Department Heads, Project Managers, and Standalone Roles. Can view all tasks.',
        level: 3,
        isSystem: true,
        isStatic: false,
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
            // Filter Permissions
            filterAllTasksDepartment: true,
            filterAllTasksPriority: true,
            filterAllTasksRole: true,
            filterAllTasksUser: true,
            filterIAssignedDepartment: true,
            filterIAssignedPriority: true,
            filterIAssignedRole: true,
            filterIAssignedUser: true,
        },
    },
    {
        name: 'departmenthead',
        displayName: 'Department Head',
        description: 'Can assign to other Dept Heads, PMs, Standalone Roles, and own department staff. Can view department tasks.',
        level: 2,
        isSystem: true,
        isStatic: false,
        permissions: {
            viewUsers: true,
            createUsers: false,
            editUsers: true,
            deleteUsers: true,
            viewDepartments: true,
            createDepartments: false,
            editDepartments: false,
            deleteDepartments: false,
            viewAllTasks: false,
            viewDepartmentTasks: true,
            createTasks: true,
            editOwnTasks: true,
            editAllTasks: false,
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
            // Filter Permissions
            filterDeptTasksDepartment: true,
            filterDeptTasksPriority: true,
            filterDeptTasksRole: true,
            filterDeptTasksUser: true,
            filterIAssignedDepartment: true,
            filterIAssignedPriority: true,
            filterIAssignedRole: true,
            filterIAssignedUser: true,
        },
    },
    {
        name: 'projectmanager',
        displayName: 'Project Manager',
        description: 'Can assign to Dept Heads, PMs, Standalone Roles, and own department staff. Can view only own tasks.',
        level: 2,
        isSystem: true,
        isStatic: false,
        permissions: {
            viewUsers: false,
            createUsers: false,
            editUsers: false,
            deleteUsers: false,
            viewDepartments: false,
            createDepartments: false,
            editDepartments: false,
            deleteDepartments: false,
            viewAllTasks: false,
            viewDepartmentTasks: false,
            createTasks: true,
            editOwnTasks: true,
            editAllTasks: false,
            deleteOwnTasks: true,
            deleteAllTasks: false,
            viewApprovals: false,
            approveRejectTasks: false,
            viewReports: false,
            downloadReports: false,
            viewRoles: false,
            createRoles: false,
            editRoles: false,
            deleteRoles: false,
            // Filter Permissions
            filterIAssignedPriority: true,
            filterSelfTasksPriority: true,
        },
    },
    {
        name: 'standalonerole',
        displayName: 'Standalone Role',
        description: 'Can assign to Dept Heads, PMs, Standalone Roles, and own department staff. Can view only own tasks.',
        level: 2,
        isSystem: true,
        isStatic: false,
        permissions: {
            viewUsers: false,
            createUsers: false,
            editUsers: false,
            deleteUsers: false,
            viewDepartments: false,
            createDepartments: false,
            editDepartments: false,
            deleteDepartments: false,
            viewAllTasks: false,
            viewDepartmentTasks: false,
            createTasks: true,
            editOwnTasks: true,
            editAllTasks: false,
            deleteOwnTasks: true,
            deleteAllTasks: false,
            viewApprovals: false,
            approveRejectTasks: false,
            viewReports: false,
            downloadReports: false,
            viewRoles: false,
            createRoles: false,
            editRoles: false,
            deleteRoles: false,
            // Filter Permissions
            filterIAssignedPriority: true,
            filterSelfTasksPriority: true,
        },
    },
    {
        name: 'staff',
        displayName: 'Staff',
        description: 'Can assign to Dept Heads, PMs, Standalone Roles, and own department staff. Notifies own dept head for cross-dept assignments.',
        level: 1, // Lowest level
        isSystem: true,
        isStatic: false,
        permissions: {
            viewUsers: false,
            createUsers: false,
            editUsers: false,
            deleteUsers: false,
            viewDepartments: false,
            createDepartments: false,
            editDepartments: false,
            deleteDepartments: false,
            viewAllTasks: false,
            viewDepartmentTasks: false,
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
            // Filter Permissions
            filterIAssignedPriority: true,
            filterSelfTasksPriority: true,
        },
    },
];

import User from './src/models/User.js';

const seedRoles = async () => {
    try {
        await connectDB();

        console.log('🔄 Seeding default roles with hierarchy...');

        // 1. Create/Update Valid Roles First
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

        console.log('✅ Default roles seeded/updated.');
        console.log('🔄 Starting cleanup of unwanted roles...');

        // Helper function to migrate and delete
        const migrateAndDelete = async (oldRoleName, newRoleName) => {
            const oldRole = await Role.findOne({ name: oldRoleName });
            const newRole = await Role.findOne({ name: newRoleName });

            if (oldRole && newRole) {
                console.log(`⚠️  Found obsolete role "${oldRoleName}". Migrating users to "${newRoleName}"...`);
                
                // Find users with the old role
                const result = await User.updateMany(
                    { role: oldRole._id }, 
                    { role: newRole._id }
                );
                
                console.log(`   Mapped ${result.modifiedCount} user(s) from ${oldRoleName} to ${newRoleName}.`);
                
                // Delete old role
                await Role.findByIdAndDelete(oldRole._id);
                console.log(`   Deleted obsolete role "${oldRoleName}".`);
            } else if (oldRole && !newRole) {
                console.warn(`⚠️  Cannot migrate "${oldRoleName}" because target "${newRoleName}" does not exist!`);
            }
        };

        // 2. Migrate and Clean Obsolete Roles
        // Manager -> Department Head
        await migrateAndDelete('manager', 'departmenthead');
        
        // Director2 -> Director (Rename)
        // Since we renamed 'director2' to 'director' in definitions, we need to migrate any existing 'director2' roles to 'director'
        await migrateAndDelete('director2', 'director');

        // Combined Role -> Project Manager
        await migrateAndDelete('projectmanagerandstandalone', 'projectmanager');

        console.log('\n✅ Cleanup completed successfully!');
        console.log('\n📊 Final Role Hierarchy:');
        console.log('Level 6: Super Admin (STATIC - cannot be edited/deleted, full system access)');
        console.log('Level 5: Main Director (can assign to anyone, notifies dept head for executive assignments)');
        console.log('Level 4: Director (can assign to GMs and Dept Heads only)');
        console.log('Level 3: General Manager (can assign to Dept Heads, PMs and Standalone Roles)');
        console.log('Level 2: Department Head (can assign to Dept Heads, PMs and Standalone Roles, own dept staff)');
        console.log('Level 2: Project Managers and Standalone Roles (can assign to Dept Heads, PMs and Standalone Roles, own dept staff)');
        // 3. Update managedRoles for each role
        console.log('🔄 Updating managedRoles permissions...');

        // Helper to get role ID by name
        const getRoleId = async (name) => {
            const role = await Role.findOne({ name });
            return role ? role._id : null;
        };

        const rolesMap = {};
        const allRoles = await Role.find({});
        allRoles.forEach(r => rolesMap[r.name] = r._id);

        // Define who can manage whom
        const roleManagementMap = {
            'maindirector': ['director', 'generalmanager', 'departmenthead', 'projectmanager', 'standalonerole', 'staff'],
            'director': ['generalmanager', 'departmenthead', 'projectmanager', 'standalonerole', 'staff'],
            'generalmanager': ['departmenthead', 'projectmanager', 'standalonerole', 'staff'],
        };

        for (const [managerName, managedNames] of Object.entries(roleManagementMap)) {
            const managerRoleId = rolesMap[managerName];
            if (managerRoleId) {
                const managedRoleIds = managedNames
                    .map(name => rolesMap[name])
                    .filter(id => id); // Filter out nulls

                await Role.findByIdAndUpdate(managerRoleId, {
                    managedRoles: managedRoleIds
                });
                console.log(`Updated managedRoles for ${managerName}`);
            }
        }

        console.log('\n✅ Cleanup and permissions update completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding roles:', error);
        process.exit(1);
    }
};

seedRoles();

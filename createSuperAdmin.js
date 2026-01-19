import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Role from './src/models/Role.js';

dotenv.config();

const createSuperAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');

        // Check if SuperAdmin role exists, if not create it
        let superAdminRole = await Role.findOne({ name: 'superadmin' });

        if (!superAdminRole) {
            console.log('Creating SuperAdmin role...');
            superAdminRole = await Role.create({
                name: 'superadmin',
                displayName: 'Super Admin',
                description: 'Super Administrator with full system access including role management',
                level: 5,
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
                    filterIAssignedDepartment: true,
                    filterIAssignedPriority: true,
                    filterIAssignedRole: true,
                    filterIAssignedUser: true,
                    filterSelfTasksDepartment: true,
                    filterSelfTasksPriority: true,
                    filterSelfTasksRole: true,
                    filterSelfTasksUser: true,
                },
                isSystem: true,
                isStatic: true, // Cannot be edited or deleted
            });
            console.log('✓ SuperAdmin role created');
        } else {
            console.log('✓ SuperAdmin role already exists');
        }

        // Check if super admin user already exists
        const existingSuperAdmin = await User.findOne({ role: superAdminRole._id });

        if (existingSuperAdmin) {
            console.log('✓ Super Admin user already exists');
            console.log(`Email: ${existingSuperAdmin.email}`);
            console.log(`WhatsApp: ${existingSuperAdmin.whatsapp}`);
            process.exit(0);
        }

        // Create super admin user
        const superAdminData = {
            name: 'Super Admin',
            email: 'superadmin@company.com',
            whatsapp: '919999999999',
            password: 'SuperAdmin@123',
            role: superAdminRole._id,
        };

        const superAdmin = await User.create(superAdminData);

        console.log('\n✓ Super Admin user created successfully!');
        console.log('=====================================');
        console.log('Login Credentials:');
        console.log(`Email: ${superAdminData.email}`);
        console.log(`WhatsApp: ${superAdminData.whatsapp}`);
        console.log(`Password: ${superAdminData.password}`);
        console.log('=====================================');
        console.log('\n⚠️  IMPORTANT: Please change the password after first login!');

        process.exit(0);
    } catch (error) {
        console.error('Error creating super admin:', error);
        process.exit(1);
    }
};

createSuperAdmin();

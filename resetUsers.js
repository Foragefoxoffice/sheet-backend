import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Role from './src/models/Role.js';
import connectDB from './src/config/database.js';

dotenv.config();

const resetUsers = async () => {
    try {
        await connectDB();

        console.log('🔄 Resetting users...\n');

        // Delete all existing users
        const deleteResult = await User.deleteMany({});
        console.log(`❌ Deleted ${deleteResult.deletedCount} existing users\n`);

        // Get roles
        const directorRole = await Role.findOne({ name: 'director' });
        const gmRole = await Role.findOne({ name: 'generalmanager' });
        const managerRole = await Role.findOne({ name: 'manager' });
        const staffRole = await Role.findOne({ name: 'staff' });

        if (!directorRole || !gmRole || !managerRole || !staffRole) {
            console.error('❌ Roles not found. Please run: node seedRoles.js first');
            process.exit(1);
        }

        // Create new users
        const newUsers = [
            {
                name: 'Admin Director',
                email: 'director@company.com',
                whatsapp: '919876543210',
                password: 'admin123',
                role: directorRole._id,
            },
            {
                name: 'General Manager',
                email: 'gm@company.com',
                whatsapp: '919876543211',
                password: 'admin123',
                role: gmRole._id,
            },
            {
                name: 'Manager One',
                email: 'manager1@company.com',
                whatsapp: '919876543212',
                password: 'admin123',
                role: managerRole._id,
            },
            {
                name: 'Manager Two',
                email: 'manager2@company.com',
                whatsapp: '919876543213',
                password: 'admin123',
                role: managerRole._id,
            },
            {
                name: 'Staff Member One',
                email: 'staff1@company.com',
                whatsapp: '919876543214',
                password: 'admin123',
                role: staffRole._id,
            },
            {
                name: 'Staff Member Two',
                email: 'staff2@company.com',
                whatsapp: '919876543215',
                password: 'admin123',
                role: staffRole._id,
            },
            {
                name: 'Staff Member Three',
                email: 'staff3@company.com',
                whatsapp: '919876543216',
                password: 'admin123',
                role: staffRole._id,
            },
        ];

        console.log('✅ Creating new users...\n');

        for (const userData of newUsers) {
            const user = await User.create(userData);
            const role = await Role.findById(user.role);
            console.log(`✓ Created: ${user.name} (${role.displayName}) - ${user.whatsapp}`);
        }

        console.log('\n📋 Login Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('All users have password: admin123');
        console.log('\nWhatsApp numbers for login (without +91):');
        console.log('  Director:    9876543210');
        console.log('  GM:          9876543211');
        console.log('  Manager 1:   9876543212');
        console.log('  Manager 2:   9876543213');
        console.log('  Staff 1:     9876543214');
        console.log('  Staff 2:     9876543215');
        console.log('  Staff 3:     6379034696');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        console.log(`\n✅ Successfully created ${newUsers.length} new users!`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
};

resetUsers();

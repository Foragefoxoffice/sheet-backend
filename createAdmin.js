import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Role from './src/models/Role.js';
import connectDB from './src/config/database.js';

dotenv.config();

const createAdminUser = async () => {
    try {
        await connectDB();

        console.log('🔄 Checking for admin user...');

        // Find Director role
        const directorRole = await Role.findOne({ name: 'director' });

        if (!directorRole) {
            console.error('❌ Director role not found. Please run seedRoles.js first.');
            process.exit(1);
        }

        // Check if admin already exists
        let adminUser = await User.findOne({ whatsapp: '919876543210' });

        if (adminUser) {
            console.log('✓ Admin user already exists, updating role to Director...');

            // Update to Director role
            adminUser.role = directorRole._id;
            await adminUser.save();

            console.log('\n✅ Admin user updated successfully!');
        } else {
            // Create new admin user
            adminUser = await User.create({
                name: 'Admin User',
                email: 'admin@taskmanager.com',
                whatsapp: '919876543210',
                password: 'admin123',
                role: directorRole._id,
            });

            console.log('\n✅ Admin user created successfully!');
        }

        console.log('\n📋 Login Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('WhatsApp: 9876543210 (enter this in login)');
        console.log('Password: admin123');
        console.log('Role: Director (Full Access)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n⚠️  Please change the password after first login!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

createAdminUser();

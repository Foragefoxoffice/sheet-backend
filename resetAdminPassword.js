import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Role from './src/models/Role.js';
import connectDB from './src/config/database.js';

dotenv.config();

const resetAdminPassword = async () => {
    try {
        await connectDB();

        console.log('🔄 Resetting admin password...');

        // Find Director role
        const directorRole = await Role.findOne({ name: 'director' });

        if (!directorRole) {
            console.error('❌ Director role not found. Please run: node seedRoles.js');
            process.exit(1);
        }

        // Find admin user
        let adminUser = await User.findOne({ whatsapp: '919876543210' });

        if (!adminUser) {
            console.log('Creating new admin user...');

            adminUser = await User.create({
                name: 'Admin User',
                email: 'admin@taskmanager.com',
                whatsapp: '919876543210',
                password: 'admin123', // Will be hashed by pre-save hook
                role: directorRole._id,
            });

            console.log('✅ Admin user created!');
        } else {
            console.log('Updating existing admin user...');

            // Set password (will be hashed by pre-save hook)
            adminUser.password = 'admin123';
            adminUser.role = directorRole._id;
            await adminUser.save();

            console.log('✅ Admin password reset!');
        }

        console.log('\n📋 Login Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('WhatsApp: 9876543210');
        console.log('Password: admin123');
        console.log('Role: Director');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Test the password
        const testUser = await User.findOne({ whatsapp: '919876543210' }).select('+password');
        const isMatch = await testUser.matchPassword('admin123');
        console.log('\n🔍 Password verification:', isMatch ? '✅ PASS' : '❌ FAIL');

        if (isMatch) {
            console.log('\n✅ You can now login with these credentials!');
        } else {
            console.log('\n❌ Password verification failed. Please try running the script again.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
};

resetAdminPassword();

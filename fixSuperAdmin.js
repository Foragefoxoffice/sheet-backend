import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Role from './src/models/Role.js';

dotenv.config();

const fixSuperAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');

        // Find SuperAdmin role
        const superAdminRole = await Role.findOne({ name: 'superadmin' });

        if (!superAdminRole) {
            console.log('❌ SuperAdmin role not found. Please run createSuperAdmin.js first.');
            process.exit(1);
        }

        // Delete existing super admin user with wrong WhatsApp format
        const deletedUser = await User.findOneAndDelete({
            $or: [
                { whatsapp: '+919999999999' },
                { email: 'superadmin@company.com' }
            ]
        });

        if (deletedUser) {
            console.log('✓ Deleted existing super admin user');
        }

        // Create new super admin user with correct format
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
        console.log(`WhatsApp: 9999999999 (enter in login form)`);
        console.log(`Password: ${superAdminData.password}`);
        console.log('=====================================');
        console.log('\n⚠️  IMPORTANT: Please change the password after first login!');
        console.log('\nNote: Enter WhatsApp number as 9999999999 (without country code) in the login form.');

        process.exit(0);
    } catch (error) {
        console.error('Error fixing super admin:', error);
        process.exit(1);
    }
};

fixSuperAdmin();

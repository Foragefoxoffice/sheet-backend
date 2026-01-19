import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Task from './src/models/Task.js';
import Role from './src/models/Role.js';
import connectDB from './src/config/database.js';

dotenv.config();

const resetUsersAndTasks = async () => {
    try {
        await connectDB();

        console.log('🔄 Starting cleanup process...');
        console.log('-----------------------------------');

        // 1. Delete all Tasks
        const taskDeleteResult = await Task.deleteMany({});
        console.log(`✅ Deleted all tasks: ${taskDeleteResult.deletedCount} tasks removed.`);

        // 2. Identify Super Admin Role
        const superAdminRole = await Role.findOne({ name: 'superadmin' });
        if (!superAdminRole) {
            console.error('❌ Super Admin Role not found! Cannot safely delete users.');
            process.exit(1);
        }

        // 3. Delete all Users EXCEPT Super Admin
        // We filter by role NOT being the super admin role ID
        const userDeleteResult = await User.deleteMany({
            role: { $ne: superAdminRole._id }
        });
        console.log(`✅ Deleted users (except Super Admin): ${userDeleteResult.deletedCount} users removed.`);

        // 4. Verify Super Admin exists
        const superAdminUser = await User.findOne({ role: superAdminRole._id });
        if (superAdminUser) {
            console.log(`ℹ️ Super Admin user preserved: ${superAdminUser.name} (${superAdminUser.email})`);
        } else {
            console.warn('⚠️ No Super Admin user found. You may need to run "node createSuperAdmin.js" to create one.');
        }

        console.log('-----------------------------------');
        console.log('✅ Cleanup complete! Roles were preserved.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        process.exit(1);
    }
};

resetUsersAndTasks();

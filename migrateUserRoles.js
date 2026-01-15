import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Role from './src/models/Role.js';
import connectDB from './src/config/database.js';

dotenv.config();

const migrateUserRoles = async () => {
    try {
        await connectDB();

        console.log('🔄 Migrating user roles from strings to ObjectIds...\n');

        // Get all users
        const users = await User.find();
        console.log(`Found ${users.length} users to check\n`);

        // Get all roles
        const roles = await Role.find();
        const roleMap = {};

        roles.forEach(role => {
            // Map old role names to new role IDs
            roleMap[role.name] = role._id;
            roleMap[role.name.toLowerCase()] = role._id;
            // Also map common variations
            if (role.name === 'director') roleMap['Director'] = role._id;
            if (role.name === 'generalmanager') {
                roleMap['GeneralManager'] = role._id;
                roleMap['General Manager'] = role._id;
            }
            if (role.name === 'manager') roleMap['Manager'] = role._id;
            if (role.name === 'staff') roleMap['Staff'] = role._id;
        });

        console.log('Role mapping:');
        Object.entries(roleMap).forEach(([key, value]) => {
            console.log(`  ${key} -> ${value}`);
        });
        console.log('');

        let migratedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const user of users) {
            try {
                const currentRole = user.role;

                // Check if role is already an ObjectId
                if (mongoose.Types.ObjectId.isValid(currentRole) && currentRole.toString().length === 24) {
                    // Try to verify it's a valid role
                    const roleExists = await Role.findById(currentRole);
                    if (roleExists) {
                        console.log(`✓ User ${user.name} already has valid role: ${roleExists.displayName}`);
                        skippedCount++;
                        continue;
                    }
                }

                // Role is a string, need to migrate
                const roleString = currentRole.toString();
                const newRoleId = roleMap[roleString];

                if (newRoleId) {
                    user.role = newRoleId;
                    await user.save();
                    const newRole = await Role.findById(newRoleId);
                    console.log(`✅ Migrated ${user.name}: "${roleString}" -> ${newRole.displayName}`);
                    migratedCount++;
                } else {
                    console.log(`⚠️  Could not find role mapping for: "${roleString}" (user: ${user.name})`);
                    // Default to Staff role
                    const staffRole = await Role.findOne({ name: 'staff' });
                    if (staffRole) {
                        user.role = staffRole._id;
                        await user.save();
                        console.log(`   Defaulted to Staff role`);
                        migratedCount++;
                    } else {
                        errorCount++;
                    }
                }
            } catch (error) {
                console.error(`❌ Error migrating user ${user.name}:`, error.message);
                errorCount++;
            }
        }

        console.log('\n📊 Migration Summary:');
        console.log(`✅ Migrated: ${migratedCount}`);
        console.log(`✓ Already valid: ${skippedCount}`);
        console.log(`❌ Errors: ${errorCount}`);
        console.log(`📝 Total: ${users.length}`);

        console.log('\n✅ Migration complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
};

migrateUserRoles();

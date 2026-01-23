
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Role from './src/models/Role.js';
import User from './src/models/User.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. Check Roles
        const allRoles = await Role.find({});
        console.log('\n--- All Roles ---');
        allRoles.forEach(r => {
            console.log(`ID: ${r._id}, Name: "${r.name}", Display: "${r.displayName}"`);
        });

        // 2. Test Filtering Logic
        const targets = ['manager', 'departmenthead', 'projectmanager', 'standalone'];
        const targetRoleIds = allRoles
            .filter(r => {
                const n = (r.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                const dn = (r.displayName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                const match = targets.some(t => n.includes(t) || dn.includes(t));
                if (match) console.log(`  [MATCH] ${r.name}`);
                return match;
            })
            .map(r => r._id);

        console.log(`\nTarget Role IDs: ${targetRoleIds}`);

        // 3. Check Users with these roles
        const usersWithRoles = await User.find({ role: { $in: targetRoleIds } }).select('name role department');
        console.log(`\nUsers with Target Roles (${usersWithRoles.length}):`);
        usersWithRoles.forEach(u => {
            console.log(`  User: ${u.name}, Role: ${u.role}, Dept: ${u.department}`);
        });
        
        // 4. Check Jahall specifically
        const jahall = await User.findOne({ name: /Jahall/i });
        if (jahall) {
            console.log('\n--- Jahall Debug ---');
            console.log(`ID: ${jahall._id}`);
            console.log(`Role ID: ${jahall.role}`);
            
            const jahallRole = await Role.findById(jahall.role);
            if (jahallRole) {
                console.log(`Role Name: ${jahallRole.name}`);
                console.log(`Role Display: ${jahallRole.displayName}`);
            } else {
                console.log('Role not found!');
            }
        } else {
            console.log('\nJahall not found');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
};

run();


import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import User from './src/models/User.js';
import Role from './src/models/Role.js';
import connectDB from './src/config/database.js';

dotenv.config();

const debugUsers = async () => {
    try {
        await connectDB();

        const users = await User.find().populate('role');
        let output = '--- Users ---\n';
        users.forEach(u => {
            output += `Name: ${u.name}\n`;
            output += `Email: ${u.email}\n`;
            // Check if role is populated or just an ID
            if (u.role && u.role.name) {
                output += `Role Name: ${u.role.name}\n`;
            } else {
                output += `Role Raw: ${JSON.stringify(u.role)}\n`;
            }
            output += '---\n';
        });

        fs.writeFileSync('users_dump_clean.txt', output, 'utf8');
        console.log('Done');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

debugUsers();

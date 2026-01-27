
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Role from './src/models/Role.js';
import connectDB from './src/config/database.js';

dotenv.config();

const debugUsers = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        const users = await User.find().populate('role');
        console.log('--- Users ---');
        users.forEach(u => {
            console.log(`Name: ${u.name}`);
            console.log(`Email: ${u.email}`);
            console.log(`Role: ${u.role ? (u.role.name || u.role) : 'N/A'}`);
            console.log(`Role Object: ${JSON.stringify(u.role)}`);
            console.log('---');
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

debugUsers();

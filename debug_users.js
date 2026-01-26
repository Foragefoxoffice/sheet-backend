
import mongoose from 'mongoose';
import User from './src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sheet-project');
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

const debugUsers = async () => {
    await connectDB();
    
    console.log('--- Searching for relevant users ---');
    
    const users = await User.find({
        $or: [
            { name: { $regex: 'Boopathi', $options: 'i' } },
            { name: { $regex: 'Pavitra', $options: 'i' } },
            { email: { $regex: 'accounts', $options: 'i' } }
        ]
    }).select('name email role designation');
    
    console.log(JSON.stringify(users, null, 2));
    
    process.exit();
};

debugUsers();

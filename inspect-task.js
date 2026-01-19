import 'dotenv/config';
import mongoose from 'mongoose';
import Task from './src/models/Task.js';

const inspectField = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const task = await Task.findOne({ sno: 7 });

        console.log('Task #7 raw data:');
        console.log(JSON.stringify(task.toObject(), null, 2));

        console.log('\n\napprovalStatus field:');
        console.log('Value:', task.approvalStatus);
        console.log('Type:', typeof task.approvalStatus);
        console.log('Strict equality to "Pending":', task.approvalStatus === 'Pending');
        console.log('Loose equality to "Pending":', task.approvalStatus == 'Pending');
        console.log('toString():', task.approvalStatus?.toString());

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

inspectField();

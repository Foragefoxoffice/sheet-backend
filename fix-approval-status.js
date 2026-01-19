import 'dotenv/config';
import mongoose from 'mongoose';
import Task from './src/models/Task.js';

const fixApprovalStatus = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find all tasks with Waiting for Approval status
        const waitingTasks = await Task.find({
            status: 'Waiting for Approval'
        });

        console.log(`\nFound ${waitingTasks.length} tasks with "Waiting for Approval" status`);
        console.log('\nChecking approvalStatus values...\n');

        for (const task of waitingTasks) {
            console.log(`Task #${task.sno}:`);
            console.log(`  approvalStatus: ${JSON.stringify(task.approvalStatus)}`);
            console.log(`  Type: ${typeof task.approvalStatus}`);

            // Fix if not 'Pending'
            if (task.approvalStatus !== 'Pending') {
                task.approvalStatus = 'Pending';
                await task.save();
                console.log(`  ✅ Fixed to 'Pending'`);
            } else {
                console.log(`  ✓ Already 'Pending'`);
            }
            console.log('---');
        }

        console.log('\n✅ All tasks updated!');
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixApprovalStatus();

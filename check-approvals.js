import 'dotenv/config';
import mongoose from 'mongoose';
import Task from './src/models/Task.js';

const checkApprovals = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find all tasks with Waiting for Approval status
        const waitingTasks = await Task.find({
            status: 'Waiting for Approval'
        }).select('sno task status approvalStatus createdByEmail assignedToEmail');

        console.log('\n=== Tasks with "Waiting for Approval" status ===');
        console.log(`Found ${waitingTasks.length} tasks\n`);

        waitingTasks.forEach(task => {
            console.log(`Task #${task.sno}: ${task.task}`);
            console.log(`  Status: ${task.status}`);
            console.log(`  Approval Status: ${task.approvalStatus}`);
            console.log(`  Created By: ${task.createdByEmail}`);
            console.log(`  Assigned To: ${task.assignedToEmail}`);
            console.log('---');
        });

        // Check what the approval query would return for a specific user
        const testEmail = process.argv[2];
        if (testEmail) {
            console.log(`\n=== Approval query for ${testEmail} ===`);
            const approvalTasks = await Task.find({
                createdByEmail: testEmail,
                status: 'Waiting for Approval',
                approvalStatus: 'Pending',
            });
            console.log(`Found ${approvalTasks.length} tasks for approval\n`);

            approvalTasks.forEach(task => {
                console.log(`Task #${task.sno}: ${task.task}`);
            });
        }

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkApprovals();

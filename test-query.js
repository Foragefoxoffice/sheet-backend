import 'dotenv/config';
import mongoose from 'mongoose';
import Task from './src/models/Task.js';

const testQuery = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const testEmail = 'director@company.com';

        console.log(`Testing query for: ${testEmail}\n`);
        console.log('Query conditions:');
        console.log(`  createdByEmail: "${testEmail}"`);
        console.log(`  status: "Waiting for Approval"`);
        console.log(`  approvalStatus: "Pending"`);
        console.log('');

        // Test exact query from approvalController
        const tasks = await Task.find({
            createdByEmail: testEmail,
            status: 'Waiting for Approval',
            approvalStatus: 'Pending',
        });

        console.log(`Result: Found ${tasks.length} tasks\n`);

        if (tasks.length > 0) {
            tasks.forEach(task => {
                console.log(`✓ Task #${task.sno}: ${task.task}`);
            });
        } else {
            console.log('❌ No tasks found with this query');

            // Try individual conditions
            console.log('\n--- Testing individual conditions ---\n');

            const byCreator = await Task.find({ createdByEmail: testEmail });
            console.log(`Tasks created by ${testEmail}: ${byCreator.length}`);

            const byStatus = await Task.find({ status: 'Waiting for Approval' });
            console.log(`Tasks with status "Waiting for Approval": ${byStatus.length}`);

            const byApproval = await Task.find({ approvalStatus: 'Pending' });
            console.log(`Tasks with approvalStatus "Pending": ${byApproval.length}`);

            const combined = await Task.find({
                createdByEmail: testEmail,
                status: 'Waiting for Approval'
            });
            console.log(`Tasks by creator AND status: ${combined.length}`);

            if (combined.length > 0) {
                console.log('\nThese tasks match creator and status but NOT approvalStatus:');
                combined.forEach(task => {
                    console.log(`  Task #${task.sno}: approvalStatus = ${JSON.stringify(task.approvalStatus)}`);
                });
            }
        }

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

testQuery();

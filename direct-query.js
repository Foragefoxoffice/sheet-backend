import 'dotenv/config';
import mongoose from 'mongoose';

const directQuery = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const tasksCollection = db.collection('tasks');

        const testEmail = 'director@company.com';

        console.log('Direct MongoDB query (bypassing Mongoose):');
        console.log(`  createdByEmail: "${testEmail}"`);
        console.log(`  status: "Waiting for Approval"`);
        console.log(`  approvalStatus: "Pending"`);
        console.log('');

        const tasks = await tasksCollection.find({
            createdByEmail: testEmail,
            status: 'Waiting for Approval',
            approvalStatus: 'Pending',
        }).toArray();

        console.log(`Result: Found ${tasks.length} tasks\n`);

        if (tasks.length > 0) {
            tasks.forEach(task => {
                console.log(`✓ Task #${task.sno}: ${task.task}`);
                console.log(`  approvalStatus: ${JSON.stringify(task.approvalStatus)}`);
            });
        }

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

directQuery();

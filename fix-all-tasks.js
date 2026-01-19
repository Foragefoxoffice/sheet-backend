import 'dotenv/config';
import mongoose from 'mongoose';

const fixAllTasks = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const tasksCollection = db.collection('tasks');

        // Update all tasks with "Waiting for Approval" status to have approvalStatus: "Pending"
        const result1 = await tasksCollection.updateMany(
            { status: 'Waiting for Approval' },
            { $set: { approvalStatus: 'Pending' } }
        );

        console.log(`✅ Updated ${result1.modifiedCount} tasks with "Waiting for Approval" status`);

        // Also set default approvalStatus for all tasks that don't have it
        const result2 = await tasksCollection.updateMany(
            { approvalStatus: { $exists: false } },
            { $set: { approvalStatus: 'Pending' } }
        );

        console.log(`✅ Updated ${result2.modifiedCount} tasks without approvalStatus field`);

        // Verify
        const count = await tasksCollection.countDocuments({
            status: 'Waiting for Approval',
            approvalStatus: 'Pending'
        });

        console.log(`\n✓ Verification: ${count} tasks now have status="Waiting for Approval" AND approvalStatus="Pending"`);

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixAllTasks();

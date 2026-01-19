import 'dotenv/config';
import mongoose from 'mongoose';

const checkBytes = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const tasksCollection = db.collection('tasks');

        // Get task #7
        const task = await tasksCollection.findOne({ sno: 7 });

        console.log('Task #7 approvalStatus:');
        console.log('Value:', task.approvalStatus);
        console.log('Type:', typeof task.approvalStatus);
        console.log('Length:', task.approvalStatus?.length);
        console.log('Char codes:', task.approvalStatus?.split('').map(c => c.charCodeAt(0)));
        console.log('');

        // Try different query variations
        console.log('Testing different query variations:\n');

        const test1 = await tasksCollection.countDocuments({ sno: 7, approvalStatus: 'Pending' });
        console.log(`1. sno: 7, approvalStatus: 'Pending' → ${test1} results`);

        const test2 = await tasksCollection.countDocuments({ sno: 7, approvalStatus: { $exists: true } });
        console.log(`2. sno: 7, approvalStatus exists → ${test2} results`);

        const test3 = await tasksCollection.countDocuments({ sno: 7, approvalStatus: { $ne: null } });
        console.log(`3. sno: 7, approvalStatus not null → ${test3} results`);

        const test4 = await tasksCollection.countDocuments({ sno: 7, approvalStatus: { $regex: /^Pending$/ } });
        console.log(`4. sno: 7, approvalStatus regex → ${test4} results`);

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkBytes();

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './src/config/database.js';

dotenv.config();

const dropEmailUniqueIndex = async () => {
    try {
        await connectDB();

        console.log('🔄 Dropping unique index on email field...');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Get all indexes
        const indexes = await usersCollection.indexes();
        console.log('\nCurrent indexes:', indexes.map(idx => idx.name));

        // Drop the email unique index if it exists
        try {
            await usersCollection.dropIndex('email_1');
            console.log('✅ Successfully dropped email_1 unique index');
        } catch (error) {
            if (error.code === 27) {
                console.log('ℹ️  email_1 index does not exist (already dropped or never created)');
            } else {
                throw error;
            }
        }

        // Verify indexes after drop
        const indexesAfter = await usersCollection.indexes();
        console.log('\nIndexes after drop:', indexesAfter.map(idx => idx.name));

        console.log('\n✅ Email field is now non-unique. Multiple users can have the same email address.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

dropEmailUniqueIndex();

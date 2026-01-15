import dotenv from 'dotenv';
import { sendDailyReminders } from './src/services/reminderService.js';

// Load environment variables
dotenv.config();

console.log('🧪 Testing Daily Reminder System...\n');
console.log('This will send reminders to all users with pending tasks.\n');

sendDailyReminders()
    .then(() => {
        console.log('\n✅ Test completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    });

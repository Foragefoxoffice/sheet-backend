import dotenv from 'dotenv';
dotenv.config();

import connectDB from '../config/database.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { sendWhatsAppTemplate } from '../services/notificationService.js';

const targetWhatsapp = '916383990217'; // With country code

async function runTest() {
    try {
        // Connect to database
        await connectDB();
        console.log('✅ Connected to database\n');

        // Find the user with this WhatsApp number
        const user = await User.findOne({
            $or: [
                { whatsapp: '916383990217' },
                { whatsapp: '6383990217' }
            ]
        });

        if (!user) {
            console.log('❌ No user found with WhatsApp number 6383990217');
            console.log('Will send test messages to this number directly.\n');
        } else {
            console.log(`✅ Found user: ${user.name} (${user.email})\n`);
        }

        // Find pending tasks for this user
        let pendingTasks;
        if (user) {
            pendingTasks = await Task.find({
                assignedTo: user._id,
                status: { $in: ['Pending', 'In Progress'] },
            }).sort({ dueDate: 1 });
        } else {
            pendingTasks = [];
        }

        console.log(`📋 Found ${pendingTasks.length} pending tasks\n`);

        if (pendingTasks.length === 0) {
            console.log('No pending tasks found. Sending a sample test message instead...\n');

            await sendWhatsAppTemplate(
                targetWhatsapp,
                'daily_pending_task_alert',
                [
                    user?.name || 'Test User',       // {{1}} - User name
                    '999',                            // {{2}} - Task ID
                    'Sample Test Task',               // {{3}} - Task Name
                    'High',                           // {{4}} - Priority
                    'February 20, 2026 2:30 PM',     // {{5}} - Due Date & Time
                    'This is a test reminder',        // {{6}} - Notes
                ],
                'en'
            );
            console.log('✅ Sample test message sent!\n');
        } else {
            // Send one message per pending task
            for (const task of pendingTasks) {
                const dueDate = new Date(task.dueDate).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });
                const dueTime = task.targetTime
                    ? new Date(`2000-01-01T${task.targetTime}`).toLocaleTimeString('en-US', {
                        hour: 'numeric', minute: 'numeric', hour12: true
                    })
                    : '';
                const dueDateTime = dueTime ? `${dueDate} ${dueTime}` : dueDate;

                console.log(`📤 Sending reminder for Task #${task.sno}: ${task.task}`);

                await sendWhatsAppTemplate(
                    targetWhatsapp,
                    'daily_pending_task_alert',
                    [
                        user.name,                                                    // {{1}} - User name
                        task.sno.toString(),                                          // {{2}} - Task ID
                        task.task,                                                    // {{3}} - Task Name
                        task.priority,                                                // {{4}} - Priority
                        dueDateTime,                                                  // {{5}} - Due Date & Time
                        (task.notes || 'No additional notes').replace(/[\n\t]/g, ' ') // {{6}} - Notes
                    ],
                    'en'
                );
                console.log(`✅ Sent!\n`);
            }
        }

        console.log(`\n🎉 Done! Sent ${pendingTasks.length || 1} message(s) to 6383990217`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

runTest();

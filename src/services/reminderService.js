import cron from 'node-cron';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { sendEmail } from './notificationService.js';

// Generate task list HTML for email
const generateTaskListHTML = (tasks) => {
    return tasks.map(task => {
        const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'Completed';
        const priorityColor = task.priority === 'High' ? '#ef4444' : task.priority === 'Medium' ? '#f59e0b' : '#10b981';

        return `
            <div style="margin-bottom: 15px; padding: 15px; background-color: #ffffff; border-radius: 6px; border-left: 4px solid ${priorityColor};">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <h3 style="margin: 0; font-size: 16px; color: #1f2937; font-weight: 600;">
                        ${task.task}
                    </h3>
                    <span style="display: inline-block; background-color: ${priorityColor}; color: #ffffff; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; white-space: nowrap; margin-left: 10px;">
                        ${task.priority}
                    </span>
                </div>
                <div style="font-size: 13px; color: #6b7280;">
                    <div style="margin-bottom: 4px;">
                        📅 Due: ${new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        ${isOverdue ? '<span style="color: #ef4444; font-weight: 600; margin-left: 8px;">⚠️ OVERDUE</span>' : ''}
                    </div>
                    <div>📊 Status: ${task.status}</div>
                </div>
            </div>
        `;
    }).join('');
};

// Send daily reminder to a user
const sendDailyReminderToUser = async (user, tasks) => {
    try {
        const overdueTasks = tasks.filter(task =>
            new Date(task.dueDate) < new Date() && task.status !== 'Completed'
        );

        const overdueHTML = overdueTasks.length > 0
            ? `<table role="presentation" style="width: 100%; border-collapse: collapse; margin: 16px 0 0;"><tr><td style="padding: 14px 20px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px;"><p style="margin: 0; font-size: 14px; color: #991b1b; font-weight: 600;">⚠️ ${overdueTasks.length} task${overdueTasks.length > 1 ? 's are' : ' is'} overdue!</p></td></tr></table>`
            : '';

        const emailData = {
            userName: user.name,
            pendingCount: tasks.length,
            overdueCount: overdueTasks.length,
            overdueHTML: overdueHTML,
            tasksList: generateTaskListHTML(tasks),
            taskLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/tasks`,
        };

        // Send email
        await sendEmail(
            user.email,
            `☀️ Daily Reminder: ${tasks.length} Pending Task${tasks.length > 1 ? 's' : ''}`,
            'dailyReminder',
            emailData
        );

        // Send WhatsApp if configured — one message per pending task
        if (user.whatsapp) {
            const { sendWhatsAppTemplate } = await import('./notificationService.js');
            const templateName = 'daily_pending_task_alert';

            for (const task of tasks) {
                const dueDate = new Date(task.dueDate).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });
                const dueTime = task.targetTime
                    ? new Date(`2000-01-01T${task.targetTime}`).toLocaleTimeString('en-US', {
                        hour: 'numeric', minute: 'numeric', hour12: true
                    })
                    : '';
                const dueDateTime = dueTime ? `${dueDate} ${dueTime}` : dueDate;

                await sendWhatsAppTemplate(
                    user.whatsapp,
                    templateName,
                    [
                        user.name,                        // {{1}} - User name
                        task.sno.toString(),              // {{2}} - Task ID
                        task.task,                        // {{3}} - Task Name
                        task.priority,                    // {{4}} - Priority
                        dueDateTime,                      // {{5}} - Due Date & Time
                        task.notes || 'No additional notes' // {{6}} - Notes
                    ],
                    'en'
                );
            }
        }

        console.log(`✅ Daily reminder sent to ${user.name} (${user.email})`);
    } catch (error) {
        console.error(`❌ Error sending reminder to ${user.email}:`, error);
    }
};

// Main function to send daily reminders
export const sendDailyReminders = async () => {
    try {
        console.log('🔔 Starting daily task reminders...');

        // Find all users with pending tasks
        const pendingTasks = await Task.find({
            status: { $in: ['Pending', 'In Progress'] },
        }).populate('assignedTo', 'name email whatsapp');

        // Group tasks by user
        const tasksByUser = {};
        pendingTasks.forEach(task => {
            if (task.assignedTo) {
                const userId = task.assignedTo._id.toString();
                if (!tasksByUser[userId]) {
                    tasksByUser[userId] = {
                        user: task.assignedTo,
                        tasks: [],
                    };
                }
                tasksByUser[userId].tasks.push(task);
            }
        });

        // Send reminders to each user
        const userCount = Object.keys(tasksByUser).length;
        console.log(`📊 Found ${userCount} user${userCount !== 1 ? 's' : ''} with pending tasks`);

        for (const userId in tasksByUser) {
            const { user, tasks } = tasksByUser[userId];
            await sendDailyReminderToUser(user, tasks);
        }

        console.log(`✅ Daily reminders completed! Sent to ${userCount} user${userCount !== 1 ? 's' : ''}`);
    } catch (error) {
        console.error('❌ Error in daily reminders:', error);
    }
};

// Schedule daily reminders at 9:00 AM
export const scheduleDailyReminders = () => {
    // Cron format: minute hour day month weekday
    // '0 9 * * *' = Every day at 9:00 AM
    cron.schedule('0 9 * * *', () => {
        console.log('\n⏰ Scheduled task triggered: Daily reminders at 9:00 AM');
        sendDailyReminders();
    }, {
        timezone: process.env.TIMEZONE || 'Asia/Kolkata' // Default to IST
    });

    console.log('⏰ Daily reminder scheduler initialized (9:00 AM every day)');
    console.log(`🌍 Timezone: ${process.env.TIMEZONE || 'Asia/Kolkata'}`);
};

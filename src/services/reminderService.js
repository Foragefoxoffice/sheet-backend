import cron from 'node-cron';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { sendEmail, sendWhatsApp } from './notificationService.js';

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

        const emailData = {
            userName: user.name,
            pendingCount: tasks.length,
            overdueCount: overdueTasks.length,
            tasksList: generateTaskListHTML(tasks),
            taskLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/tasks`,
        };

        // Prepare WhatsApp message
        const taskSummary = tasks.slice(0, 3).map((task, index) =>
            `${index + 1}. ${task.task} (${task.priority} - Due: ${new Date(task.dueDate).toLocaleDateString()})`
        ).join('\n');

        const moreTasksText = tasks.length > 3 ? `\n...and ${tasks.length - 3} more task${tasks.length - 3 > 1 ? 's' : ''}` : '';
        const overdueText = overdueTasks.length > 0 ? `\n\n⚠️ ${overdueTasks.length} task${overdueTasks.length > 1 ? 's are' : ' is'} overdue!` : '';

        const whatsappMessage = `☀️ *Good Morning ${user.name}!*\n\n📋 You have *${tasks.length} pending task${tasks.length > 1 ? 's' : ''}* today:\n\n${taskSummary}${moreTasksText}${overdueText}\n\n💪 Let's make today productive!\n\nView all: ${emailData.taskLink}`;

        // Send email
        await sendEmail(
            user.email,
            `☀️ Daily Reminder: ${tasks.length} Pending Task${tasks.length > 1 ? 's' : ''}`,
            'dailyReminder',
            emailData
        );

        // Send WhatsApp if configured
        if (user.whatsapp) {
            // Use template if configured, otherwise fallback to plain text
            const templateName = 'task_reminder_system_notification';
            if (templateName) {
                const { sendWhatsAppTemplate } = await import('./notificationService.js');

                // Format task summary for template ({{3}} - List)
                // New format: Line separated list
                // 1. Task Name - Priority
                // 2. Task Name - Priority
                const taskList = tasks.slice(0, 5).map((task, index) =>
                    `${index + 1}. ${task.task} - ${task.priority}`
                ).join('\n');

                // Add more tasks indicator if needed
                const fullTaskList = tasks.length > 5
                    ? `${taskList}\n...and ${tasks.length - 5} more`
                    : taskList;

                await sendWhatsAppTemplate(
                    user.whatsapp,
                    templateName,
                    [
                        user.name,                    // {{1}} - User name
                        tasks.length.toString(),      // {{2}} - Task count
                        fullTaskList                  // {{3}} - List
                    ],
                    'en'
                );
            } else {
                await sendWhatsApp(user.whatsapp, whatsappMessage);
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

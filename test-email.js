import dotenv from 'dotenv';
import { sendEmail } from './src/services/notificationService.js';

// Load environment variables
dotenv.config();

const testEmail = async () => {
    console.log('🧪 Testing Email Configuration...\n');

    const testData = {
        userName: 'Test User',
        taskTitle: 'Test Task - Email Configuration',
        taskNumber: '001',
        assignedBy: 'System Administrator',
        dueDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }),
        priority: 'High',
        notes: 'This is a test email to verify your notification system is working correctly.',
        taskLink: process.env.FRONTEND_URL || 'http://localhost:5173',
    };

    console.log('📧 Sending test email to: arunduraideveloper@gmail.com');
    console.log('📋 Email Configuration:');
    console.log(`   - Service: ${process.env.EMAIL_SERVICE || 'gmail'}`);
    console.log(`   - From: ${process.env.EMAIL_FROM || process.env.EMAIL_USER}`);
    console.log(`   - User: ${process.env.EMAIL_USER ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`   - Password: ${process.env.EMAIL_PASSWORD ? '✅ Configured' : '❌ Not configured'}\n`);

    const result = await sendEmail(
        'arunduraideveloper@gmail.com',
        '🧪 Test Email - Task Manager Notification System',
        'taskAssigned',
        testData
    );

    if (result.success) {
        console.log('✅ Test email sent successfully!');
        console.log(`📬 Message ID: ${result.messageId}`);
        console.log('\n✨ Check your inbox at arunduraideveloper@gmail.com');
    } else {
        console.log('❌ Failed to send test email');
        console.log(`Error: ${result.error || result.message}`);
        console.log('\n💡 Make sure you have configured:');
        console.log('   1. EMAIL_USER in .env');
        console.log('   2. EMAIL_PASSWORD (Gmail App Password) in .env');
        console.log('   3. Enabled 2FA on your Gmail account');
    }
};

testEmail().catch(console.error);

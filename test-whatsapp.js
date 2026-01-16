import 'dotenv/config';
import { sendWhatsAppTemplate } from './src/services/notificationService.js';

const phoneNumber = process.argv[2];
const type = process.argv[3] || 'assigned'; // assigned, status, approved, rejected

if (!phoneNumber) {
    console.error('Usage: node test-whatsapp.js <PHONE_NUMBER> [TYPE]');
    console.error('Types: assigned, status, approved, rejected');
    console.error('Example: node test-whatsapp.js 919876543210 status');
    process.exit(1);
}

const runTest = async () => {
    console.log(`Sending test WhatsApp template (${type}) to: ${phoneNumber}`);

    let templateName;
    let params;

    if (type === 'assigned') {
        templateName = process.env.WHATSAPP_TEMPLATE_TASK_ASSIGNED;
        params = [
            'Test User',      // User Name
            'Test Task 123',  // Task Title
            'Admin System',   // Assigned By
            'Today',          // Due Date
            'High'            // Priority
        ];
    } else if (type === 'status') {
        templateName = process.env.WHATSAPP_TEMPLATE_STATUS_UPDATED;
        params = [
            'Admin System',   // Created By (User Name)
            'Test Task 123',  // Task Title
            'Test User',      // Assigned User (Updater)
            'Completed'       // New Status
        ];
    } else if (type === 'approved') {
        templateName = process.env.WHATSAPP_TEMPLATE_TASK_APPROVED;
        params = [
            'Test User',      // Assigned User
            'Test Task 123',  // Task Title
            'Admin System',   // Approved By
            'Today'           // Date
        ];
    } else if (type === 'rejected') {
        templateName = process.env.WHATSAPP_TEMPLATE_TASK_REJECTED;
        params = [
            'Test User',      // Assigned User
            'Test Task 123',  // Task Title
            'Admin System',   // Rejected By
            'Incomplete Work' // Reason
        ];
    } else {
        console.error('Invalid type. Use: assigned, status, approved, rejected');
        process.exit(1);
    }

    if (!templateName) {
        console.error(`Error: Template for ${type} is not defined in .env`);
        process.exit(1);
    }

    console.log(`Using template: ${templateName}`);

    try {
        const result = await sendWhatsAppTemplate(phoneNumber, templateName, params, 'en');
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error sending message:', error);
    }
};

runTest();

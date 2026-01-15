import nodemailer from 'nodemailer';
import twilio from 'twilio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Email transporter configuration
const createEmailTransporter = () => {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
};

// Twilio WhatsApp client (optional)
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

// WhatsApp Business API configuration (alternative to Twilio)
const whatsappBusinessConfig = {
    apiUrl: process.env.WHATSAPP_API_URL, // e.g., https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
};

// Load email template
const loadEmailTemplate = (templateName) => {
    const templatePath = path.join(__dirname, '../templates/email', `${templateName}.html`);
    return fs.readFileSync(templatePath, 'utf-8');
};

// Replace placeholders in template
const renderTemplate = (template, data) => {
    let rendered = template;
    Object.keys(data).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        rendered = rendered.replace(regex, data[key] || '');
    });
    return rendered;
};

// Send Email
export const sendEmail = async (to, subject, templateName, data) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.log('Email not configured, skipping email notification');
            return { success: false, message: 'Email not configured' };
        }

        const transporter = createEmailTransporter();
        const template = loadEmailTemplate(templateName);
        const html = renderTemplate(template, data);

        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to,
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message };
    }
};

// Send WhatsApp via Business API with Template
const sendWhatsAppBusinessAPITemplate = async (to, templateName, languageCode, parameters) => {
    try {
        const response = await fetch(whatsappBusinessConfig.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${whatsappBusinessConfig.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: to.replace(/[^0-9]/g, ''), // Remove non-numeric characters
                type: 'template',
                template: {
                    name: templateName,
                    language: {
                        code: languageCode || 'en'
                    },
                    components: parameters ? [
                        {
                            type: 'body',
                            parameters: parameters.map(param => ({
                                type: 'text',
                                text: param
                            }))
                        }
                    ] : []
                },
            }),
        });

        const result = await response.json();

        if (response.ok) {
            console.log('WhatsApp template sent via Business API:', result.messages?.[0]?.id);
            return { success: true, messageId: result.messages?.[0]?.id };
        } else {
            console.error('WhatsApp Business API template error:', result);
            return { success: false, error: result.error?.message || 'Unknown error' };
        }
    } catch (error) {
        console.error('WhatsApp Business API template error:', error);
        return { success: false, error: error.message };
    }
};

// Send WhatsApp via Business API (plain text - fallback)
const sendWhatsAppBusinessAPI = async (to, message) => {
    try {
        const response = await fetch(whatsappBusinessConfig.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${whatsappBusinessConfig.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: to.replace(/[^0-9]/g, ''), // Remove non-numeric characters
                type: 'text',
                text: {
                    body: message,
                },
            }),
        });

        const result = await response.json();

        if (response.ok) {
            console.log('WhatsApp sent via Business API:', result.messages?.[0]?.id);
            return { success: true, messageId: result.messages?.[0]?.id };
        } else {
            console.error('WhatsApp Business API error:', result);
            return { success: false, error: result.error?.message || 'Unknown error' };
        }
    } catch (error) {
        console.error('WhatsApp Business API error:', error);
        return { success: false, error: error.message };
    }
};

// Send WhatsApp via Twilio
const sendWhatsAppTwilio = async (to, message) => {
    try {
        const whatsappNumber = to.startsWith('+') ? `whatsapp:${to}` : `whatsapp:+${to}`;
        const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

        const twilioMessage = await twilioClient.messages.create({
            body: message,
            from: fromNumber,
            to: whatsappNumber,
        });

        console.log('WhatsApp sent via Twilio:', twilioMessage.sid);
        return { success: true, messageId: twilioMessage.sid };
    } catch (error) {
        console.error('Twilio WhatsApp error:', error);
        return { success: false, error: error.message };
    }
};

// Send WhatsApp (auto-detect provider)
export const sendWhatsApp = async (to, message) => {
    try {
        // Check if WhatsApp Business API is configured
        if (whatsappBusinessConfig.apiUrl && whatsappBusinessConfig.accessToken) {
            return await sendWhatsAppBusinessAPI(to, message);
        }

        // Fall back to Twilio if configured
        if (twilioClient) {
            return await sendWhatsAppTwilio(to, message);
        }

        console.log('WhatsApp not configured, skipping WhatsApp notification');
        return { success: false, message: 'WhatsApp not configured' };
    } catch (error) {
        console.error('WhatsApp sending error:', error);
        return { success: false, error: error.message };
    }
};

// Send WhatsApp Template (for Business API)
export const sendWhatsAppTemplate = async (to, templateName, parameters, languageCode = 'en') => {
    try {
        // Only Business API supports templates
        if (whatsappBusinessConfig.apiUrl && whatsappBusinessConfig.accessToken) {
            return await sendWhatsAppBusinessAPITemplate(to, templateName, languageCode, parameters);
        }

        console.log('WhatsApp Business API not configured, cannot send template');
        return { success: false, message: 'WhatsApp Business API required for templates' };
    } catch (error) {
        console.error('WhatsApp template sending error:', error);
        return { success: false, error: error.message };
    }
};

// Notification functions for specific events

export const notifyTaskAssigned = async (task, assignedUser, createdByUser) => {
    const emailData = {
        userName: assignedUser.name,
        taskTitle: task.task,
        taskNumber: task.sno,
        assignedBy: createdByUser.name,
        dueDate: new Date(task.dueDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }),
        priority: task.priority,
        notes: task.notes || 'No additional notes',
        taskLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/tasks`,
    };

    const whatsappMessage = `🔔 *New Task Assigned*\n\n📋 *Task*: ${task.task}\n👤 *Assigned by*: ${createdByUser.name}\n📅 *Due*: ${emailData.dueDate}\n⚡ *Priority*: ${task.priority}\n\nView details: ${emailData.taskLink}`;

    // Send email
    await sendEmail(
        assignedUser.email,
        `New Task Assigned: ${task.task}`,
        'taskAssigned',
        emailData
    );

    // Send WhatsApp if user has WhatsApp number
    if (assignedUser.whatsapp) {
        // Use template if configured, otherwise fallback to plain text
        const templateName = process.env.WHATSAPP_TEMPLATE_TASK_ASSIGNED;
        if (templateName) {
            await sendWhatsAppTemplate(
                assignedUser.whatsapp,
                templateName,
                [
                    assignedUser.name,
                    task.task,
                    createdByUser.name,
                    emailData.dueDate,
                    task.priority
                ],
                'en'
            );
        } else {
            await sendWhatsApp(assignedUser.whatsapp, whatsappMessage);
        }
    }
};

export const notifyStatusChanged = async (task, assignedUser, createdByUser, newStatus) => {
    const emailData = {
        userName: createdByUser.name,
        taskTitle: task.task,
        taskNumber: task.sno,
        assignedTo: assignedUser.name,
        newStatus: newStatus,
        statusColor: newStatus === 'Completed' ? '#10B981' : '#F59E0B',
        taskLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/assigned-tasks`,
    };

    const statusEmoji = newStatus === 'Completed' ? '✅' : '🔄';
    const whatsappMessage = `${statusEmoji} *Task Status Updated*\n\n📋 *Task*: ${task.task}\n👤 *Updated by*: ${assignedUser.name}\n📊 *New Status*: ${newStatus}\n\nView details: ${emailData.taskLink}`;

    // Send email
    await sendEmail(
        createdByUser.email,
        `Task Status Updated: ${task.task}`,
        'statusChanged',
        emailData
    );

    // Send WhatsApp if user has WhatsApp number
    if (createdByUser.whatsapp) {
        // Use template if configured, otherwise fallback to plain text
        const templateName = process.env.WHATSAPP_TEMPLATE_STATUS_UPDATED;
        if (templateName) {
            await sendWhatsAppTemplate(
                createdByUser.whatsapp,
                templateName,
                [
                    createdByUser.name,
                    task.task,
                    assignedUser.name,
                    newStatus
                ],
                'en'
            );
        } else {
            await sendWhatsApp(createdByUser.whatsapp, whatsappMessage);
        }
    }
};

export const notifyTaskApproved = async (task, assignedUser, approvedByUser) => {
    const emailData = {
        userName: assignedUser.name,
        taskTitle: task.task,
        taskNumber: task.sno,
        approvedBy: approvedByUser.name,
        approvedDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }),
        taskLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/tasks`,
    };

    const whatsappMessage = `✅ *Task Approved*\n\n📋 *Task*: ${task.task}\n👤 *Approved by*: ${approvedByUser.name}\n📅 *Date*: ${emailData.approvedDate}\n\nGreat work! 🎉`;

    // Send email
    await sendEmail(
        assignedUser.email,
        `Task Approved: ${task.task}`,
        'taskApproved',
        emailData
    );

    // Send WhatsApp if user has WhatsApp number
    if (assignedUser.whatsapp) {
        // Use template if configured, otherwise fallback to plain text
        const templateName = process.env.WHATSAPP_TEMPLATE_TASK_APPROVED;
        if (templateName) {
            await sendWhatsAppTemplate(
                assignedUser.whatsapp,
                templateName,
                [
                    assignedUser.name,
                    task.task,
                    approvedByUser.name,
                    emailData.approvedDate
                ],
                'en'
            );
        } else {
            await sendWhatsApp(assignedUser.whatsapp, whatsappMessage);
        }
    }
};

export const notifyTaskRejected = async (task, assignedUser, rejectedByUser, reason) => {
    const emailData = {
        userName: assignedUser.name,
        taskTitle: task.task,
        taskNumber: task.sno,
        rejectedBy: rejectedByUser.name,
        rejectionReason: reason || 'No specific reason provided',
        rejectedDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }),
        taskLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/tasks`,
    };

    const whatsappMessage = `❌ *Task Returned*\n\n📋 *Task*: ${task.task}\n👤 *Returned by*: ${rejectedByUser.name}\n📝 *Reason*: ${reason || 'No specific reason'}\n\nPlease review and resubmit.\n\nView details: ${emailData.taskLink}`;

    // Send email
    await sendEmail(
        assignedUser.email,
        `Task Returned: ${task.task}`,
        'taskRejected',
        emailData
    );

    // Send WhatsApp if user has WhatsApp number
    if (assignedUser.whatsapp) {
        // Use template if configured, otherwise fallback to plain text
        const templateName = process.env.WHATSAPP_TEMPLATE_TASK_REJECTED;
        if (templateName) {
            await sendWhatsAppTemplate(
                assignedUser.whatsapp,
                templateName,
                [
                    assignedUser.name,
                    task.task,
                    rejectedByUser.name,
                    reason || 'No specific reason provided'
                ],
                'en'
            );
        } else {
            await sendWhatsApp(assignedUser.whatsapp, whatsappMessage);
        }
    }
};


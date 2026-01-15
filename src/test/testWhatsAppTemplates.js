import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const testPhoneNumber = '919042614797';

// WhatsApp Business API configuration
const whatsappConfig = {
    apiUrl: process.env.WHATSAPP_API_URL,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
};

// Send WhatsApp Template
const sendWhatsAppTemplate = async (to, templateName, parameters, languageCode = 'en') => {
    try {
        console.log(`\n📤 Sending template: ${templateName}`);
        console.log(`📱 To: ${to}`);
        console.log(`📝 Parameters:`, parameters);

        const response = await fetch(whatsappConfig.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${whatsappConfig.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: to.replace(/[^0-9]/g, ''),
                type: 'template',
                template: {
                    name: templateName,
                    language: {
                        code: languageCode
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
            console.log(`✅ Success! Message ID: ${result.messages?.[0]?.id}`);
            return { success: true, messageId: result.messages?.[0]?.id };
        } else {
            console.error(`❌ Error:`, result.error);
            return { success: false, error: result.error };
        }
    } catch (error) {
        console.error(`❌ Exception:`, error.message);
        return { success: false, error: error.message };
    }
};

// Test all templates
const testAllTemplates = async () => {
    console.log('🚀 Starting WhatsApp Template Tests');
    console.log('='.repeat(60));
    console.log(`📱 Test Number: ${testPhoneNumber}`);
    console.log(`🔗 API URL: ${whatsappConfig.apiUrl}`);
    console.log('='.repeat(60));

    const results = [];

    // Test 1: Task Assigned
    console.log('\n\n📋 TEST 1: Task Assigned Template');
    console.log('-'.repeat(60));
    const test1 = await sendWhatsAppTemplate(
        testPhoneNumber,
        process.env.WHATSAPP_TEMPLATE_TASK_ASSIGNED,
        [
            'Arun Durai',
            'Complete monthly sales report',
            'Sarah Manager',
            'January 20, 2026',
            'High'
        ]
    );
    results.push({ template: 'Task Assigned', ...test1 });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

    // Test 2: Status Updated
    console.log('\n\n📊 TEST 2: Status Updated Template');
    console.log('-'.repeat(60));
    const test2 = await sendWhatsAppTemplate(
        testPhoneNumber,
        process.env.WHATSAPP_TEMPLATE_STATUS_UPDATED,
        [
            'Sarah Manager',
            'Complete monthly sales report',
            'Arun Durai',
            'Completed'
        ]
    );
    results.push({ template: 'Status Updated', ...test2 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Daily Reminder
    console.log('\n\n⏰ TEST 3: Daily Reminder Template');
    console.log('-'.repeat(60));
    const test3 = await sendWhatsAppTemplate(
        testPhoneNumber,
        process.env.WHATSAPP_TEMPLATE_DAILY_REMINDER,
        [
            'Arun Durai',
            '3',
            '1. Complete report - High, 2. Review proposal - Medium, 3. Team meeting - Low'
        ]
    );
    results.push({ template: 'Daily Reminder', ...test3 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 4: Task Approved
    console.log('\n\n✅ TEST 4: Task Approved Template');
    console.log('-'.repeat(60));
    const test4 = await sendWhatsAppTemplate(
        testPhoneNumber,
        process.env.WHATSAPP_TEMPLATE_TASK_APPROVED,
        [
            'Arun Durai',
            'Complete monthly sales report',
            'Sarah Manager',
            'January 15, 2026'
        ]
    );
    results.push({ template: 'Task Approved', ...test4 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 5: Task Rejected
    console.log('\n\n❌ TEST 5: Task Rejected Template');
    console.log('-'.repeat(60));
    const test5 = await sendWhatsAppTemplate(
        testPhoneNumber,
        process.env.WHATSAPP_TEMPLATE_TASK_REJECTED,
        [
            'Arun Durai',
            'Complete monthly sales report',
            'Sarah Manager',
            'Missing data in section 3'
        ]
    );
    results.push({ template: 'Task Rejected', ...test5 });

    // Summary
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    results.forEach((result, index) => {
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${index + 1}. ${result.template}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        if (!result.success) {
            console.log(`   Error: ${JSON.stringify(result.error)}`);
        }
    });

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Successful: ${successCount}/${results.length}`);
    console.log(`❌ Failed: ${failCount}/${results.length}`);
    console.log('='.repeat(60));

    if (failCount > 0) {
        console.log('\n⚠️  Please check:');
        console.log('   1. Template names match exactly in Meta Business Manager');
        console.log('   2. Templates are approved and active');
        console.log('   3. WhatsApp API credentials are correct');
        console.log('   4. Phone number is registered for testing');
    }
};

// Run tests
testAllTemplates().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

// Test Email Script for VM Production
// Usage: node scripts/test-email.js

import { sendEmail } from '../server/outlook-email-vm.js';

async function testEmail() {
  try {
    console.log('🧪 Testing email configuration...\n');
    
    const testEmailAddress = process.env.MICROSOFT_EMAIL_FROM || 'contato@vittaverde.com';
    
    console.log(`📧 Sending test email to: ${testEmailAddress}`);
    
    const result = await sendEmail({
      to: testEmailAddress,
      subject: '✅ VittaVerde - Test Email from VM',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #059669;">✅ Email Configuration Working!</h1>
          <p>This is a test email from VittaVerde platform running on VM.</p>
          <div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #059669;">System Status</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Microsoft 365 Integration: ✅ Working</li>
              <li>Email Service: ✅ Active</li>
              <li>Environment: ${process.env.NODE_ENV || 'production'}</li>
              <li>Timestamp: ${new Date().toISOString()}</li>
            </ul>
          </div>
          <p style="color: #666; font-size: 14px;">
            If you received this email, your email configuration is working correctly!
          </p>
        </div>
      `
    });
    
    if (result.success) {
      console.log('\n✅ SUCCESS! Test email sent successfully!');
      console.log(`📬 Check inbox: ${testEmailAddress}`);
    } else {
      console.error('\n❌ FAILED to send test email');
      console.error('Error:', result.error);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

testEmail();

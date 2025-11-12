// 📧 Email Service - Unified Email Sending
// Uses database configuration from /admin/email-config
// 
// This service ALWAYS uses the database configuration for email sending.
// No OAuth or Replit connectors - pure database config for production reliability.

import {
  sendEmailVM as sendEmail,
  sendWelcomeEmailVM as sendWelcomeEmail,
  sendOrderConfirmationEmailVM as sendOrderConfirmationEmail,
  sendAnvisaUpdateEmailVM as sendAnvisaUpdateEmail,
  sendVerificationEmailVM as sendVerificationEmail
} from './outlook-email-vm.js';

console.log('📧 Email Service: Usando configuração do banco de dados');
console.log('⚙️ Configure em /admin/email-config');

// Export all email functions using database config
export { 
  sendEmail, 
  sendWelcomeEmail, 
  sendOrderConfirmationEmail, 
  sendAnvisaUpdateEmail, 
  sendVerificationEmail 
};

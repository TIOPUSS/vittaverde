#!/usr/bin/env -S tsx

/**
 * Script para testar envio de email com Replit OAuth
 * 
 * Uso: tsx scripts/test-email.ts <email_destino>
 * Exemplo: tsx scripts/test-email.ts seu-email@gmail.com
 */

import { sendVerificationEmail } from '../server/email-service.js';

const email = process.argv[2];

if (!email) {
  console.error('❌ Erro: Você precisa fornecer um email de destino');
  console.log('\nUso: tsx scripts/test-email.ts <email_destino>');
  console.log('Exemplo: tsx scripts/test-email.ts seu-email@gmail.com\n');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('❌ Erro: Email inválido');
  process.exit(1);
}

console.log('📧 Testando envio de email de verificação...\n');
console.log(`📮 Destinatário: ${email}`);
console.log(`🔐 Código de teste: 123456\n`);

try {
  const result = await sendVerificationEmail(email, 'Usuário Teste', '123456');
  
  console.log('\n✅ Email enviado com sucesso!');
  console.log(JSON.stringify(result, null, 2));
  console.log('\n📬 Verifique sua caixa de entrada (e spam)!\n');
  
} catch (error: any) {
  console.error('\n❌ Erro ao enviar email:');
  console.error(error.message);
  
  if (error.message.includes('Outlook not connected')) {
    console.log('\n💡 SOLUÇÃO:');
    console.log('1. Certifique-se de que conectou sua conta Outlook no Replit');
    console.log('2. A integração foi configurada, mas pode precisar de autorização');
    console.log('3. Verifique se seu token OAuth não expirou\n');
  } else if (error.message.includes('credentials')) {
    console.log('\n💡 SOLUÇÃO:');
    console.log('Configure suas credenciais Microsoft 365 em:');
    console.log('- /admin/email-config (produção/VM)');
    console.log('- OU use a integração OAuth do Replit (desenvolvimento)\n');
  }
  
  process.exit(1);
}

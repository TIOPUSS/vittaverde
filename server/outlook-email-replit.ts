import { Client } from '@microsoft/microsoft-graph-client';

// Replit OAuth Email Service
// Uses Replit's Outlook integration for email sending

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=outlook',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Outlook not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
async function getUncachableOutlookClient() {
  const accessToken = await getAccessToken();

  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => accessToken
    }
  });
}

// Get the authenticated user's email address
async function getAuthenticatedUserEmail(): Promise<string> {
  try {
    const client = await getUncachableOutlookClient();
    const user = await client.api('/me').select('mail,userPrincipalName').get();
    return user.mail || user.userPrincipalName;
  } catch (error) {
    console.error('Error getting authenticated user email:', error);
    throw new Error('Unable to get authenticated user email from Outlook');
  }
}

// Send email using Replit OAuth
export async function sendEmailReplit(options: EmailOptions) {
  try {
    const client = await getUncachableOutlookClient();
    const fromEmail = await getAuthenticatedUserEmail();

    const message = {
      subject: options.subject,
      body: {
        contentType: 'HTML',
        content: options.html
      },
      toRecipients: [
        {
          emailAddress: {
            address: options.to
          }
        }
      ]
    };

    await client
      .api('/me/sendMail')
      .post({
        message,
        saveToSentItems: true
      });

    console.log(`✅ Email enviado via Replit OAuth para ${options.to} de ${fromEmail}`);
    return { success: true, from: fromEmail };
  } catch (error: any) {
    console.error('❌ Erro ao enviar email via Replit OAuth:', error.message);
    throw error;
  }
}

// Send verification email with 6-digit code
export async function sendVerificationEmailReplit(to: string, name: string, code: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .code-box { background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0; border: 2px dashed #10b981; }
        .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #10b981; font-family: 'Courier New', monospace; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .warning { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Código de Verificação</h1>
        </div>
        <div class="content">
          <p>Olá, ${name}!</p>
          
          <p>Use o código abaixo para verificar seu email e ativar sua conta na <strong>VittaVerde</strong>:</p>
          
          <div class="code-box">
            <div class="code">${code}</div>
          </div>
          
          <p><strong>Este código é válido por 24 horas.</strong></p>
          
          <div class="warning">
            <strong>⚠️ Importante:</strong> Se você não solicitou este código, ignore este email. Sua conta está segura.
          </div>
          
          <p>Atenciosamente,<br><strong>Equipe VittaVerde</strong></p>
        </div>
        <div class="footer">
          <p>VittaVerde - Cannabis Medicinal Legal no Brasil</p>
          <p>CNPJ: 37.000.632/0001-65</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmailReplit({
    to,
    subject: '🔐 Código de Verificação - VittaVerde',
    html
  });
}

// Send welcome email
export async function sendWelcomeEmailReplit(to: string, name: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌿 Bem-vindo à VittaVerde!</h1>
        </div>
        <div class="content">
          <p>Olá, ${name}!</p>
          
          <p>É um prazer recebê-lo(a) na <strong>VittaVerde</strong>, sua plataforma de acesso legal a produtos medicinais à base de cannabis.</p>
          
          <p><strong>Próximos passos:</strong></p>
          <ol>
            <li>Complete seu cadastro com informações de saúde</li>
            <li>Agende uma consulta com nossos especialistas</li>
            <li>Obtenha sua autorização ANVISA</li>
            <li>Acesse produtos de qualidade com segurança</li>
          </ol>
          
          <p>Estamos aqui para ajudar você em cada etapa da jornada!</p>
          
          <p>Atenciosamente,<br><strong>Equipe VittaVerde</strong></p>
        </div>
        <div class="footer">
          <p>VittaVerde - Cannabis Medicinal Legal no Brasil</p>
          <p>CNPJ: 37.000.632/0001-65</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmailReplit({
    to,
    subject: '🌿 Bem-vindo à VittaVerde - Sua jornada começa aqui!',
    html
  });
}

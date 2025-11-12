import { Client } from '@microsoft/microsoft-graph-client';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
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
// Always call this function again to get a fresh client.
export async function getUncachableOutlookClient() {
  const accessToken = await getAccessToken();

  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => accessToken
    }
  });
}

// Send email using Outlook
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  try {
    const client = await getUncachableOutlookClient();

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

    await client.api('/me/sendMail').post({
      message,
      saveToSentItems: true
    });

    console.log(`✅ Email enviado com sucesso para ${options.to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    throw error;
  }
}

// Send welcome email to new patient
export async function sendWelcomeEmail(to: string, name: string) {
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
          
          <p style="text-align: center;">
            <a href="${process.env.REPLIT_DEV_DOMAIN || 'https://vittaverde.com'}/login" class="button">
              Acessar Minha Conta
            </a>
          </p>
          
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

  return sendEmail({
    to,
    subject: '🌿 Bem-vindo à VittaVerde - Sua jornada começa aqui!',
    html
  });
}

// Send order confirmation email
export async function sendOrderConfirmationEmail(
  to: string, 
  name: string, 
  orderNumber: string,
  products: Array<{ name: string; quantity: number; price: string }>
) {
  const productsHtml = products.map(p => 
    `<li><strong>${p.name}</strong> - ${p.quantity}x - R$ ${p.price}</li>`
  ).join('');

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
        .order-number { background: white; padding: 15px; border-radius: 6px; text-align: center; font-size: 18px; font-weight: bold; color: #10b981; margin: 20px 0; }
        .products { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Pedido Confirmado!</h1>
        </div>
        <div class="content">
          <p>Olá, ${name}!</p>
          
          <p>Seu pedido foi confirmado com sucesso!</p>
          
          <div class="order-number">
            Pedido #${orderNumber}
          </div>
          
          <div class="products">
            <h3>Produtos:</h3>
            <ul>
              ${productsHtml}
            </ul>
          </div>
          
          <p><strong>Próximas etapas:</strong></p>
          <ul>
            <li>Processaremos sua autorização ANVISA</li>
            <li>Iniciaremos a intermediação da importação</li>
            <li>Você receberá atualizações por email</li>
          </ul>
          
          <p>Acompanhe seu pedido em tempo real na plataforma.</p>
          
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

  return sendEmail({
    to,
    subject: `✅ Pedido #${orderNumber} Confirmado - VittaVerde`,
    html
  });
}

// Send email verification
export async function sendVerificationEmail(to: string, name: string, verificationCode: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .code-box { background: white; border: 3px dashed #10b981; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center; }
        .code { font-size: 48px; font-weight: bold; letter-spacing: 8px; color: #059669; font-family: 'Courier New', monospace; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        @media only screen and (max-width: 600px) {
          .code { font-size: 36px; letter-spacing: 4px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Verifique seu Email</h1>
        </div>
        <div class="content">
          <p>Olá, ${name}!</p>
          
          <p>Bem-vindo à <strong>VittaVerde</strong>! Para concluir seu cadastro e ativar sua conta, use o código de verificação abaixo:</p>
          
          <div class="code-box">
            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; text-transform: uppercase; font-weight: 600;">Seu Código de Verificação</p>
            <div class="code">${verificationCode}</div>
            <p style="margin: 15px 0 0 0; color: #6b7280; font-size: 14px;">Digite este código na plataforma</p>
          </div>
          
          <div class="alert">
            <strong>⏰ Código válido por 24 horas</strong><br>
            Este código de verificação expira em 24 horas. Se expirar, você pode solicitar um novo código na página de verificação.
          </div>
          
          <p><strong>Por que verificar?</strong></p>
          <ul>
            <li>Garante que você receberá todas as atualizações importantes</li>
            <li>Protege sua conta contra acessos não autorizados</li>
            <li>Permite recuperação de senha quando necessário</li>
          </ul>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            <strong>Não solicitou este cadastro?</strong><br>
            Se você não criou uma conta na VittaVerde, pode ignorar este email com segurança.
          </p>
          
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

  return sendEmail({
    to,
    subject: '🔐 Código de Verificação - VittaVerde',
    html
  });
}

// Send ANVISA authorization update
export async function sendAnvisaUpdateEmail(
  to: string,
  name: string,
  status: string,
  trackingCode: string
) {
  const statusMessages: Record<string, { title: string; message: string; emoji: string }> = {
    'em_analise': {
      title: 'Autorização em Análise',
      message: 'Sua solicitação de autorização ANVISA está sendo processada. Acompanhe o status com o código de rastreamento.',
      emoji: '📋'
    },
    'aprovado': {
      title: 'Autorização Aprovada!',
      message: 'Parabéns! Sua autorização ANVISA foi aprovada. Você já pode prosseguir com sua compra.',
      emoji: '✅'
    },
    'pendente_documentacao': {
      title: 'Documentação Pendente',
      message: 'Precisamos de documentos adicionais para prosseguir com sua autorização. Acesse a plataforma para enviar.',
      emoji: '📄'
    }
  };

  const statusInfo = statusMessages[status] || statusMessages['em_analise'];

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
        .tracking { background: white; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${statusInfo.emoji} ${statusInfo.title}</h1>
        </div>
        <div class="content">
          <p>Olá, ${name}!</p>
          
          <p>${statusInfo.message}</p>
          
          <div class="tracking">
            <strong>Código de Rastreamento:</strong><br>
            <span style="font-size: 20px; color: #10b981; font-weight: bold;">${trackingCode}</span>
          </div>
          
          <p style="text-align: center;">
            <a href="${process.env.REPLIT_DEV_DOMAIN || 'https://vittaverde.com'}/rastreamento" class="button">
              Acompanhar Autorização
            </a>
          </p>
          
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

  return sendEmail({
    to,
    subject: `${statusInfo.emoji} ${statusInfo.title} - VittaVerde`,
    html
  });
}

import nodemailer from 'nodemailer';

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
}

/**
 * Generates a premium digit card for each digit of the code
 */
function renderCodeDigits(code: string): string {
  return code.split('').map(d => `
    <td style="padding: 0 5px;">
      <div style="
        width: 58px;
        height: 68px;
        background: linear-gradient(145deg, #1e1b4b 0%, #0f0a2e 100%);
        border: 2px solid rgba(168, 85, 247, 0.5);
        border-radius: 16px;
        text-align: center;
        line-height: 64px;
        font-size: 32px;
        font-weight: 900;
        color: #e9d5ff;
        letter-spacing: 1px;
        font-family: 'Courier New', Courier, monospace;
      ">${d}</div>
    </td>
  `).join('');
}

/**
 * Builds the complete email HTML shell with premium dark design
 */
function buildEmailTemplate(options: {
  badgeText: string;
  badgeColor: string;
  iconEmoji: string;
  title: string;
  subtitle: string;
  codeLabel: string;
  code: string;
  expirationMinutes: number;
  warningText: string;
  footerYear?: number;
}): string {
  const year = options.footerYear || new Date().getFullYear();
  
  return `<!DOCTYPE html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${options.title} — BoraMarka</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { margin: 0; padding: 0; }
    body, table, td { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: #09090b; }
    img { border: 0; display: block; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .email-padding { padding: 32px 20px !important; }
      .digit-cell { padding: 0 3px !important; }
      .digit-box { width: 48px !important; height: 56px !important; font-size: 26px !important; line-height: 52px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <!-- Preheader (hidden preview text) -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    Seu código de verificação BoraMarka: ${options.code} &nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌
  </div>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b;">
    <tr>
      <td align="center" style="padding: 40px 16px 60px 16px;">

        <!-- Email Container -->
        <table role="presentation" class="email-container" width="520" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; width: 100%;">

          <!-- Top Gradient Accent Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #f97316, #ec4899, #8b5cf6, #6366f1); border-radius: 20px 20px 0 0;"></td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background-color: #18181b; border-left: 1px solid #27272a; border-right: 1px solid #27272a;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td class="email-padding" style="padding: 48px 44px 20px 44px; text-align: center;">

                    <!-- Badge -->
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto 28px auto;">
                      <tr>
                        <td style="
                          background-color: ${options.badgeColor};
                          border-radius: 100px;
                          padding: 6px 16px;
                          font-size: 10px;
                          font-weight: 800;
                          color: #ffffff;
                          text-transform: uppercase;
                          letter-spacing: 1.5px;
                          text-align: center;
                        ">
                          BORAMARKA • ${options.badgeText}
                        </td>
                      </tr>
                    </table>

                    <!-- Logo Area -->
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto 32px auto;">
                      <tr>
                        <td style="
                          background: linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%);
                          height: 44px;
                          border-radius: 12px;
                          text-align: center;
                          padding: 0 28px;
                        ">
                          <span style="font-size: 20px; font-weight: 900; color: #ffffff; letter-spacing: -0.3px; line-height: 44px;">
                            ${options.iconEmoji} BoraMarka
                          </span>
                        </td>
                      </tr>
                    </table>

                    <!-- Title -->
                    <h1 style="
                      font-size: 22px;
                      font-weight: 800;
                      color: #fafafa;
                      margin: 0 0 12px 0;
                      text-align: center;
                      letter-spacing: -0.5px;
                      line-height: 1.3;
                    ">
                      ${options.title}
                    </h1>

                    <!-- Subtitle -->
                    <p style="
                      font-size: 14px;
                      color: #a1a1aa;
                      line-height: 1.7;
                      margin: 0 0 32px 0;
                      text-align: center;
                      font-weight: 500;
                    ">
                      ${options.subtitle}
                    </p>

                  </td>
                </tr>

                <!-- Code Section -->
                <tr>
                  <td class="email-padding" style="padding: 0 44px 32px 44px; text-align: center;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="
                          background: linear-gradient(160deg, #1e1b4b 0%, #0c0a1e 100%);
                          border: 1.5px solid rgba(139, 92, 246, 0.3);
                          border-radius: 20px;
                          padding: 28px 20px;
                          text-align: center;
                        ">
                          <!-- Code Label -->
                          <div style="
                            font-size: 10px;
                            font-weight: 800;
                            color: #c084fc;
                            text-transform: uppercase;
                            letter-spacing: 3px;
                            margin-bottom: 18px;
                          ">
                            ${options.codeLabel}
                          </div>

                          <!-- Code Digits -->
                          <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto;">
                            <tr>
                              ${renderCodeDigits(options.code)}
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Expiration Notice -->
                <tr>
                  <td class="email-padding" style="padding: 0 44px 40px 44px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="
                          background-color: #27272a;
                          border: 1px solid #3f3f46;
                          border-radius: 14px;
                          padding: 14px 20px;
                          text-align: center;
                        ">
                          <p style="font-size: 12px; color: #a1a1aa; line-height: 1.7; margin: 0; font-weight: 500;">
                            Este código expira em <strong style="color: #e4e4e7;">${options.expirationMinutes} minutos</strong>.<br>
                            ${options.warningText}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="
              background-color: #0f0f12;
              border-top: 1px solid #27272a;
              border-left: 1px solid #27272a;
              border-right: 1px solid #27272a;
              border-bottom: 1px solid #27272a;
              border-radius: 0 0 20px 20px;
              padding: 24px 44px 28px 44px;
              text-align: center;
            ">
              <p style="font-size: 11px; color: #71717a; margin: 0 0 4px 0; font-weight: 600;">
                © ${year} BoraMarka — Sua agenda cheia, sem complicação.
              </p>
              <p style="font-size: 10px; color: #52525b; margin: 0;">
                Plataforma de Agendamentos & Gestão Inteligente.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendPasswordResetEmail(toEmail: string, username: string, code: string): Promise<boolean> {
  const from = process.env.SMTP_FROM || 'BoraMarka <contatoboramarka@gmail.com>';

  const transporter = createTransporter();
  if (!transporter) {
    console.log('\n======================================================');
    console.log('📧 [MAILER DEV FALLBACK] E-mail de Recuperação de Senha');
    console.log(`Para: ${toEmail} (Usuário: ${username})`);
    console.log(`🔑 Código de Verificação: [ ${code} ]`);
    console.log('Válido por 15 minutos.');
    console.log('======================================================\n');
    return true;
  }

  try {
    const htmlContent = buildEmailTemplate({
      badgeText: 'SEGURANÇA',
      badgeColor: '#7c3aed',
      iconEmoji: '🔒',
      title: 'Redefinição de Senha',
      subtitle: `Olá, <strong style="color:#e4e4e7;">${username}</strong>. Recebemos uma solicitação para redefinir a senha da sua conta. Use o código abaixo para prosseguir:`,
      codeLabel: 'CÓDIGO DE AUTORIZAÇÃO',
      code,
      expirationMinutes: 15,
      warningText: 'Se você não fez esta solicitação, pode ignorar este e-mail.',
    });

    await transporter.sendMail({
      from,
      to: toEmail,
      subject: `🔑 Código de Recuperação: ${code} — BoraMarka`,
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail via Nodemailer:', error);
    return false;
  }
}

export async function sendEmailVerificationCode(toEmail: string, username: string, code: string): Promise<boolean> {
  const from = process.env.SMTP_FROM || 'BoraMarka <contatoboramarka@gmail.com>';

  const transporter = createTransporter();
  if (!transporter) {
    console.log('\n======================================================');
    console.log('📧 [VERIFICAÇÃO DE E-MAIL - BORAMARKA]');
    console.log(`Para: ${toEmail} (Usuário: ${username})`);
    console.log(`✨ CÓDIGO DE VERIFICAÇÃO (4 DÍGITOS): [ ${code} ]`);
    console.log('Válido por 10 minutos.');
    console.log('======================================================\n');
    return true;
  }

  try {
    const htmlContent = buildEmailTemplate({
      badgeText: 'VERIFICAÇÃO',
      badgeColor: '#db2777',
      iconEmoji: '👋',
      title: 'Confirme seu E-mail',
      subtitle: `Olá, <strong style="color:#e4e4e7;">${username}</strong>! Insira o código abaixo na tela de cadastro para verificar seu endereço de e-mail com segurança.`,
      codeLabel: 'SEU CÓDIGO DE ACESSO',
      code,
      expirationMinutes: 10,
      warningText: 'Se você não iniciou esta ação no BoraMarka, pode ignorar este e-mail.',
    });

    await transporter.sendMail({
      from,
      to: toEmail,
      subject: `✨ Seu Código de Verificação BoraMarka: ${code}`,
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail de verificação via Nodemailer:', error);
    return false;
  }
}

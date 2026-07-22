import nodemailer from 'nodemailer';

export async function sendPasswordResetEmail(toEmail: string, username: string, code: string): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'BoraMarka <contatoboramarka@gmail.com>';

  if (!host || !user || !pass) {
    console.log('\n======================================================');
    console.log('📧 [MAILER DEV FALLBACK] E-mail de Recuperação de Senha');
    console.log(`Para: ${toEmail} (Usuário: ${username})`);
    console.log(`🔑 Código de Verificação: [ ${code} ]`);
    console.log('Válido por 15 minutos.');
    console.log('======================================================\n');
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperar Senha — BoraMarka</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          body {
            margin: 0;
            padding: 0;
            background-color: #0b0f19;
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #f1f5f9;
          }
          table {
            border-collapse: collapse;
          }
        </style>
      </head>
      <body>
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 60px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #111827; border-radius: 28px; border: 1.5px solid #1f2937; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);">
                
                <!-- Sleek Top Branding Line -->
                <tr>
                  <td height="6" style="background: linear-gradient(90deg, #8b5cf6 0%, #ec4899 50%, #f43f5e 100%);"></td>
                </tr>

                <!-- Main Content Area -->
                <tr>
                  <td style="padding: 56px 48px 44px 48px; text-align: center;">
                    
                    <!-- Logo Mark -->
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin-bottom: 36px;">
                      <tr>
                        <td style="background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); width: 48px; height: 48px; border-radius: 14px; text-align: center; color: #ffffff; font-weight: 800; font-size: 24px; line-height: 48px; box-shadow: 0 4px 20px rgba(139, 92, 246, 0.45);">
                          B
                        </td>
                        <td style="padding-left: 14px; text-align: left;">
                          <div style="font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; line-height: 1;">
                            Bora<span style="color: #8b5cf6;">Marka</span>
                          </div>
                          <div style="font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">
                            Segurança da Conta
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Header Title -->
                    <h1 style="font-size: 24px; font-weight: 800; color: #ffffff; margin: 0 0 16px 0; letter-spacing: -0.5px; line-height: 1.2;">
                      Redefinição de Senha
                    </h1>
                    
                    <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6; margin: 0 0 36px 0; font-weight: 500;">
                      Olá, <strong>${username}</strong>. Recebemos uma solicitação para redefinir a senha da sua conta no BoraMarka. Use o código de 4 dígitos abaixo para prosseguir:
                    </p>

                    <!-- Code Hero Section (Expanded) -->
                    <div style="background-color: #1e1b4b; border: 1.5px solid #6d28d9; border-radius: 24px; padding: 32px 28px; margin-bottom: 36px; box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);">
                      <div style="font-size: 11px; font-weight: 800; color: #d8b4fe; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 20px;">
                        CÓDIGO DE AUTORIZAÇÃO
                      </div>
                      
                      <!-- Digit Cards Layout (Enlarged) -->
                      <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center">
                        <tr>
                          ${code.split('').map(d => `
                            <td style="padding: 0 6px;">
                              <div style="width: 64px; height: 72px; background-color: #111827; border: 2px solid #a855f7; border-radius: 16px; text-align: center; line-height: 68px; font-size: 34px; font-weight: 800; color: #f3e8ff; text-shadow: 0 0 12px rgba(168, 85, 247, 0.6); box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);">
                                ${d}
                              </div>
                            </td>
                          `).join('')}
                        </tr>
                      </table>
                    </div>

                    <!-- Expiration / Warning notice -->
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                      <tr>
                        <td style="background-color: #1f2937; border: 1px solid #374151; border-radius: 16px; padding: 16px 20px; text-align: center; font-size: 13.5px; color: #9ca3af; line-height: 1.6;">
                          ⏱️ Este código expira em <strong>15 minutos</strong>. Se você não fez esta solicitação, pode ignorar este e-mail com segurança.
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Elegant Footer Area -->
                <tr>
                  <td style="padding: 28px 48px 40px 48px; background-color: #1f2937; border-top: 1px solid #374151; text-align: center;">
                    <p style="font-size: 11px; color: #9ca3af; margin: 0 0 6px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                      BoraMarka — Sua agenda cheia, sem complicação.
                    </p>
                    <p style="font-size: 11px; color: #6b7280; margin: 0;">
                      Plataforma de Agendamentos & Gestão Inteligente.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

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
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'BoraMarka <contatoboramarka@gmail.com>';

  if (!host || !user || !pass) {
    console.log('\n======================================================');
    console.log('📧 [VERIFICAÇÃO DE E-MAIL - BORAMARKA]');
    console.log(`Para: ${toEmail} (Usuário: ${username})`);
    console.log(`✨ CÓDIGO DE VERIFICAÇÃO (4 DÍGITOS): [ ${code} ]`);
    console.log('Válido por 10 minutos.');
    console.log('======================================================\n');
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verificação de Conta — BoraMarka</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          body {
            margin: 0;
            padding: 0;
            background-color: #0b0f19;
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #f1f5f9;
          }
          table {
            border-collapse: collapse;
          }
        </style>
      </head>
      <body>
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 60px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #111827; border-radius: 28px; border: 1.5px solid #1f2937; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);">
                
                <!-- Sleek Top Branding Line -->
                <tr>
                  <td height="6" style="background: linear-gradient(90deg, #ec4899 0%, #8b5cf6 50%, #6366f1 100%);"></td>
                </tr>

                <!-- Main Content Area -->
                <tr>
                  <td style="padding: 56px 48px 44px 48px; text-align: center;">
                    
                    <!-- Logo Mark -->
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin-bottom: 36px;">
                      <tr>
                        <td style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); width: 48px; height: 48px; border-radius: 14px; text-align: center; color: #ffffff; font-weight: 800; font-size: 22px; line-height: 48px; box-shadow: 0 4px 20px rgba(236, 72, 153, 0.45);">
                          ⚡
                        </td>
                        <td style="padding-left: 14px; text-align: left;">
                          <div style="font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; line-height: 1;">
                            Bora<span style="color: #ec4899;">Marka</span>
                          </div>
                          <div style="font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">
                            Verificação de E-mail
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Header Title -->
                    <h1 style="font-size: 24px; font-weight: 800; color: #ffffff; margin: 0 0 16px 0; letter-spacing: -0.5px; line-height: 1.2;">
                      Confirme seu Cadastro
                    </h1>
                    
                    <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6; margin: 0 0 36px 0; font-weight: 500;">
                      Olá, <strong>${username}</strong>! Use o código de 4 dígitos abaixo para verificar o seu endereço de e-mail e ativar a sua conta:
                    </p>

                    <!-- Code Hero Section (Expanded) -->
                    <div style="background-color: #1e1b4b; border: 1.5px solid #6d28d9; border-radius: 24px; padding: 32px 28px; margin-bottom: 36px; box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);">
                      <div style="font-size: 11px; font-weight: 800; color: #d8b4fe; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 20px;">
                        SEU CÓDIGO DE ACESSO
                      </div>
                      
                      <!-- Digit Cards Layout (Enlarged) -->
                      <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center">
                        <tr>
                          ${code.split('').map(d => `
                            <td style="padding: 0 6px;">
                              <div style="width: 64px; height: 72px; background-color: #111827; border: 2px solid #a855f7; border-radius: 16px; text-align: center; line-height: 68px; font-size: 34px; font-weight: 800; color: #f3e8ff; text-shadow: 0 0 12px rgba(168, 85, 247, 0.6); box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);">
                                ${d}
                              </div>
                            </td>
                          `).join('')}
                        </tr>
                      </table>
                    </div>

                    <!-- Expiration / Warning notice -->
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                      <tr>
                        <td style="background-color: #1f2937; border: 1px solid #374151; border-radius: 16px; padding: 16px 20px; text-align: center; font-size: 13.5px; color: #9ca3af; line-height: 1.6;">
                          ⏱️ Este código expira em <strong>10 minutos</strong>. Se você não iniciou esta ação, pode ignorar este e-mail com segurança.
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Elegant Footer Area -->
                <tr>
                  <td style="padding: 28px 48px 40px 48px; background-color: #1f2937; border-top: 1px solid #374151; text-align: center;">
                    <p style="font-size: 11px; color: #9ca3af; margin: 0 0 6px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                      BoraMarka — Sua agenda cheia, sem complicação.
                    </p>
                    <p style="font-size: 11px; color: #6b7280; margin: 0;">
                      Plataforma de Agendamentos & Gestão Inteligente.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

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

import nodemailer from 'nodemailer';

export async function sendPasswordResetEmail(toEmail: string, username: string, code: string): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'BoraMarka <noreply@boramarka.com.br>';

  // Se SMTP não estiver configurado, usa fallback para console (ideal para desenvolvimento)
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
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #050507; color: #ffffff; margin: 0; padding: 40px 20px; }
          .container { max-width: 500px; margin: 0 auto; background: #0c0c12; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
          .header { display: flex; align-items: center; margin-bottom: 24px; }
          .logo { width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #8b5cf6, #ec4899); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; color: #ffffff; margin-right: 12px; }
          .title { font-size: 20px; font-weight: 800; color: #ffffff; margin: 0; }
          .subtitle { font-size: 12px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
          .content { margin-top: 24px; font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.8); }
          .code-box { background: rgba(139, 92, 246, 0.1); border: 1px dashed rgba(139, 92, 246, 0.4); border-radius: 16px; padding: 20px; text-align: center; margin: 28px 0; }
          .code { font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #a78bfa; margin: 0; }
          .footer { font-size: 12px; color: rgba(255,255,255,0.3); margin-top: 32px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 16px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">B</div>
            <div>
              <div class="title">BoraMarka</div>
              <div class="subtitle">Recuperação de Senha</div>
            </div>
          </div>
          <div class="content">
            <p>Olá <strong>${username}</strong>,</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta no BoraMarka. Utilize o código de verificação abaixo para continuar:</p>
            
            <div class="code-box">
              <div class="code">${code}</div>
            </div>

            <p style="font-size: 13px; color: rgba(255,255,255,0.5);">Este código é válido por <strong>15 minutos</strong>. Se você não solicitou a redefinição de senha, ignore este e-mail.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} BoraMarka — Sistema de Agendamentos. Todos os direitos reservados.
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from,
      to: toEmail,
      subject: `🔑 Código de Recuperação de Senha: ${code} — BoraMarka`,
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail via Nodemailer:', error);
    return false;
  }
}

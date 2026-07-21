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

export async function sendEmailVerificationCode(toEmail: string, username: string, code: string): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'BoraMarka <noreply@boramarka.com.br>';

  // Se SMTP não estiver configurado, usa fallback para console (ideal para desenvolvimento)
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
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; background-color: #050507; color: #ffffff; margin: 0; padding: 40px 20px; }
          .container { max-width: 500px; margin: 0 auto; background: #0c0c14; border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 36px; box-shadow: 0 24px 48px rgba(0,0,0,0.6); }
          .header { text-align: center; margin-bottom: 28px; }
          .badge { display: inline-block; padding: 6px 16px; border-radius: 999px; background: rgba(236, 72, 153, 0.12); border: 1px solid rgba(236, 72, 153, 0.3); color: #ec4899; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; }
          .logo { font-size: 28px; font-weight: 900; background: linear-gradient(135deg, #a78bfa, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0; }
          .title { font-size: 20px; font-weight: 800; color: #ffffff; margin-top: 16px; margin-bottom: 8px; }
          .subtitle { font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.5; margin: 0; }
          .code-box { background: linear-gradient(135deg, rgba(167, 139, 250, 0.08), rgba(236, 72, 153, 0.08)); border: 1.5px dashed rgba(236, 72, 153, 0.35); border-radius: 20px; padding: 24px; text-align: center; margin: 32px 0; }
          .code { font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: 900; letter-spacing: 14px; color: #f472b6; text-shadow: 0 0 20px rgba(244, 114, 182, 0.4); margin: 0; padding-left: 14px; }
          .footer { font-size: 12px; color: rgba(255,255,255,0.3); margin-top: 36px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px; text-align: center; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="badge">BoraMarka • Verificação</div>
            <h1 class="logo">🤙 BoraMarka</h1>
            <div class="title">Confirme seu E-mail</div>
            <p class="subtitle">Olá, <strong>${username}</strong>! Insira o código abaixo na tela de cadastro para verificar seu endereço de e-mail com segurança:</p>
          </div>
          
          <div class="code-box">
            <div class="code">${code}</div>
          </div>

          <p style="font-size: 13px; color: rgba(255,255,255,0.4); text-align: center; margin: 0;">Este código expira em <strong>10 minutos</strong>.<br>Se você não iniciou esta ação no BoraMarka, pode ignorar este e-mail.</p>
          
          <div class="footer">
            &copy; ${new Date().getFullYear()} BoraMarka — Sua agenda cheia, sem complicação.<br>
            Plataforma de Agendamentos & Gestão Inteligente.
          </div>
        </div>
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

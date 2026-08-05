import nodemailer from 'nodemailer';

let cachedTransporter: nodemailer.Transporter | null = null;
let transporterVerified = false;

function createTransporter(): nodemailer.Transporter | null {
  // Retorna transporter cacheado se já verificado
  if (cachedTransporter && transporterVerified) return cachedTransporter;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const user = process.env.SMTP_USER?.replace(/^["']|["']$/g, '').trim();
  const rawPass = process.env.SMTP_PASS || '';
  const pass = rawPass.replace(/^["']|["']$/g, '').trim();

  if (!user || !pass) {
    console.warn('⚠️ [MAILER] SMTP não configurado — faltando:', !user ? 'SMTP_USER' : '', !pass ? 'SMTP_PASS' : '');
    return null;
  }

  const isGmail = host.includes('gmail');

  console.log(`📧 [MAILER] Criando transporter: host=${host}, user=${user}, gmail=${isGmail}`);

  // Para Gmail: usar service:'gmail' que auto-configura porta 465 SSL
  // Isso é MUITO mais confiável que STARTTLS (porta 587) em cloud
  if (isGmail) {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
      pool: true,
      maxConnections: 3,
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 20000,
    });
  } else {
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      pool: true,
      maxConnections: 3,
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 20000,
    });
  }

  return cachedTransporter;
}

/**
 * Verifica a conexão SMTP e loga o resultado
 */
async function verifyTransporter(transporter: nodemailer.Transporter): Promise<boolean> {
  if (transporterVerified) return true;
  try {
    await transporter.verify();
    transporterVerified = true;
    console.log('✅ [MAILER] Conexão SMTP verificada com sucesso!');
    return true;
  } catch (err: any) {
    console.error('❌ [MAILER] Falha na verificação SMTP:', err.message);
    console.error('❌ [MAILER] Código do erro:', err.code || 'N/A');
    console.error('❌ [MAILER] Stack:', err.stack);
    // Reseta o cache para tentar de novo na próxima vez
    cachedTransporter = null;
    transporterVerified = false;
    return false;
  }
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
    // Verifica conexão SMTP antes de enviar
    const isConnected = await verifyTransporter(transporter);
    if (!isConnected) {
      console.error('❌ [MAILER] Conexão SMTP não disponível para reset de senha');
      return false;
    }

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

    console.log(`📧 [MAILER] Enviando email de reset para: ${toEmail}`);
    const info = await transporter.sendMail({
      from,
      to: toEmail,
      subject: `Código de Recuperação: ${code} — BoraMarka`,
      html: htmlContent,
    });
    console.log(`✅ [MAILER] Reset email enviado! messageId=${info.messageId}, response=${info.response}`);

    return true;
  } catch (error: any) {
    console.error('❌ [MAILER] Erro ao enviar e-mail de reset:', error.message);
    console.error('❌ [MAILER] Código:', error.code, '| Comando:', error.command, '| Resposta:', error.response);
    // Reseta cache para reconectar na próxima tentativa
    cachedTransporter = null;
    transporterVerified = false;
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
    // Verifica conexão SMTP antes de enviar
    const isConnected = await verifyTransporter(transporter);
    if (!isConnected) {
      console.error('❌ [MAILER] Conexão SMTP não disponível para verificação de email');
      return false;
    }

    const htmlContent = buildEmailTemplate({
      badgeText: 'VERIFICAÇÃO',
      badgeColor: '#db2777',
      iconEmoji: '',
      title: 'Confirme seu E-mail',
      subtitle: `Olá, <strong style="color:#e4e4e7;">${username}</strong>! Insira o código abaixo na tela de cadastro para verificar seu endereço de e-mail com segurança.`,
      codeLabel: 'SEU CÓDIGO DE ACESSO',
      code,
      expirationMinutes: 10,
      warningText: 'Se você não iniciou esta ação no BoraMarka, pode ignorar este e-mail.',
    });

    console.log(`📧 [MAILER] Enviando código de verificação para: ${toEmail}`);
    const info = await transporter.sendMail({
      from,
      to: toEmail,
      subject: `Seu Código de Verificação BoraMarka: ${code}`,
      html: htmlContent,
    });
    console.log(`✅ [MAILER] Verificação enviada! messageId=${info.messageId}, response=${info.response}`);

    return true;
  } catch (error: any) {
    console.error('❌ [MAILER] Erro ao enviar e-mail de verificação:', error.message);
    console.error('❌ [MAILER] Código:', error.code, '| Comando:', error.command, '| Resposta:', error.response);
    cachedTransporter = null;
    transporterVerified = false;
    return false;
  }
}

export async function sendWelcomeEmail(toEmail: string, username: string, businessName?: string): Promise<boolean> {
  const from = process.env.SMTP_FROM || 'BoraMarka <contatoboramarka@gmail.com>';
  const transporter = createTransporter();
  const name = businessName || username || 'Profissional';

  if (!transporter) {
    console.log('\n======================================================');
    console.log('[BOAS-VINDAS - BORAMARKA]');
    console.log(`Para: ${toEmail} (${name})`);
    console.log('E-mail de boas-vindas enviado com sucesso (modo log).');
    console.log('======================================================\n');
    return true;
  }

  try {
    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao BoraMarka</title>
</head>
<body style="margin: 0; padding: 0; background-color: #090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Preheader -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    Sua conta BoraMarka foi ativada. Veja como começar em 3 passos simples.
  </div>

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #090d16; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
          
          <!-- Top Accent Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #8b5cf6 0%, #ec4899 100%);"></td>
          </tr>

          <!-- Content Padding Area -->
          <tr>
            <td style="padding: 36px 32px 32px 32px;">

              <!-- Header: Logo & Badge -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="left">
                    <span style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">
                      Bora<span style="color: #ec4899;">Marka</span>
                    </span>
                  </td>
                  <td align="right">
                    <span style="background-color: rgba(139, 92, 246, 0.12); color: #a78bfa; border: 1px solid rgba(139, 92, 246, 0.25); padding: 4px 10px; border-radius: 99px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
                      CONTA ATIVA
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Main Title & Intro -->
              <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 800; line-height: 1.3; color: #ffffff; letter-spacing: -0.3px;">
                Sua agenda inteligente está pronta, ${name}
              </h1>
              <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                Seu cadastro foi concluído com sucesso. Você recebeu <strong style="color: #cbd5e1;">7 dias de teste gratuito</strong> com acesso ilimitado a todas as ferramentas de agendamento e gestão.
              </p>

              <!-- Section Title -->
              <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: #64748b; margin-bottom: 16px;">
                GUIA DE INÍCIO RÁPIDO
              </div>

              <!-- Step 1 -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 12px; background-color: rgba(255, 255, 255, 0.02); border: 1px solid #1e293b; border-radius: 14px;">
                <tr>
                  <td style="padding: 16px;">
                    <table border="0" cellspacing="0" cellpadding="0" width="100%">
                      <tr>
                        <td width="36" valign="top">
                          <div style="width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); color: #ffffff; font-size: 13px; font-weight: 800; text-align: center; line-height: 28px;">
                            1
                          </div>
                        </td>
                        <td style="padding-left: 12px;">
                          <div style="font-size: 14px; font-weight: 700; color: #f1f5f9; margin-bottom: 4px;">
                            Ajuste seus Serviços
                          </div>
                          <div style="font-size: 12px; line-height: 1.5; color: #94a3b8;">
                            Configuramos sugestões para o seu setor. Personalize preços, durações e descrições no painel.
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Step 2 -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 12px; background-color: rgba(255, 255, 255, 0.02); border: 1px solid #1e293b; border-radius: 14px;">
                <tr>
                  <td style="padding: 16px;">
                    <table border="0" cellspacing="0" cellpadding="0" width="100%">
                      <tr>
                        <td width="36" valign="top">
                          <div style="width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); color: #ffffff; font-size: 13px; font-weight: 800; text-align: center; line-height: 28px;">
                            2
                          </div>
                        </td>
                        <td style="padding-left: 12px;">
                          <div style="font-size: 14px; font-weight: 700; color: #f1f5f9; margin-bottom: 4px;">
                            Defina seus Horários
                          </div>
                          <div style="font-size: 12px; line-height: 1.5; color: #94a3b8;">
                            Defina os dias de atendimento e intervalos para que os clientes realizem agendamentos automaticamente.
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Step 3 -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px; background-color: rgba(255, 255, 255, 0.02); border: 1px solid #1e293b; border-radius: 14px;">
                <tr>
                  <td style="padding: 16px;">
                    <table border="0" cellspacing="0" cellpadding="0" width="100%">
                      <tr>
                        <td width="36" valign="top">
                          <div style="width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); color: #ffffff; font-size: 13px; font-weight: 800; text-align: center; line-height: 28px;">
                            3
                          </div>
                        </td>
                        <td style="padding-left: 12px;">
                          <div style="font-size: 14px; font-weight: 700; color: #f1f5f9; margin-bottom: 4px;">
                            Divulgue seu Link Público
                          </div>
                          <div style="font-size: 12px; line-height: 1.5; color: #94a3b8;">
                            Adicione o link da sua agenda na bio do Instagram ou envie diretamente pelo WhatsApp aos seus clientes.
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="https://boramarka.com.br/login" target="_blank" style="display: inline-block; width: 80%; max-width: 320px; padding: 14px 24px; background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%); color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; text-align: center; border-radius: 99px; box-shadow: 0 8px 20px rgba(124, 58, 237, 0.35);">
                      Acessar Painel de Controle
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <div style="height: 1px; background-color: #1e293b; margin-bottom: 20px;"></div>

              <!-- Footer info -->
              <div style="font-size: 11px; line-height: 1.6; color: #64748b; text-align: center;">
                Dúvidas ou suporte? Responda a este e-mail ou entre em contato via <a href="https://boramarka.com.br" style="color: #a78bfa; text-decoration: none;">boramarka.com.br</a>
                <br>
                © ${new Date().getFullYear()} BoraMarka. Todos os direitos reservados.
              </div>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await transporter.sendMail({
      from,
      to: toEmail,
      subject: `Bem-vindo ao BoraMarka, ${name}!`,
      html: htmlContent,
    });

    console.log(`✅ E-mail de boas-vindas enviado para ${toEmail}`);
    return true;
  } catch (error: any) {
    console.error('❌ Erro ao enviar e-mail de boas-vindas:', error.message);
    return false;
  }
}

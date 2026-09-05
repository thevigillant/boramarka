import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { createAuditLog } from '../utils/auditLogger';
import { sendPasswordResetEmail, sendEmailVerificationCode, sendWelcomeEmail } from '../utils/mailer';
import { sendVerificationCodeSchema, verifyCodeSchema, registerSchema, loginSchema } from '../utils/validators';
import { createRefreshToken, verifyAndRotateRefreshToken, revokeRefreshToken } from '../services/refreshTokenService';

const verifyAttempts = new Map<string, { count: number; expiresAt: number }>();
const resetAttempts = new Map<string, { count: number; expiresAt: number }>();

export default async function authRoutes(app: FastifyInstance) {
  // GET /api/auth/check — Check if any admin account exists
  app.get('/check', async () => {
    const count = await prisma.admin.count();
    return { hasAccount: count > 0 };
  });

  // POST /api/auth/send-verification-code — Envia código de 4 dígitos por e-mail
  app.post('/send-verification-code', async (request, reply) => {
    const parsed = sendVerificationCodeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message });
    }
    const { email, username } = parsed.data;

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = (username || '').trim().toLowerCase();

    // Valida se o usuário ou e-mail já existem no banco
    if (cleanUsername) {
      const existingUser = await prisma.admin.findUnique({ where: { username: cleanUsername } });
      if (existingUser) {
        return reply.status(409).send({ error: 'Este nome de usuário já está em uso.' });
      }
    }

    const existingEmail = await prisma.admin.findFirst({ where: { email: cleanEmail } });
    if (existingEmail) {
      return reply.status(409).send({ error: 'Este endereço de e-mail já está cadastrado.' });
    }

    // Gera código numérico de 4 dígitos
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Reseta tentativas prévias para este e-mail
    verifyAttempts.delete(cleanEmail);

    // Armazena no PostgreSQL (persiste entre restarts/deploys)
    await prisma.verificationCode.upsert({
      where: { email: cleanEmail },
      create: { email: cleanEmail, code, expiresAt },
      update: { code, expiresAt },
    });

    const hasEmailProvider = Boolean(process.env.RESEND_API_KEY || (process.env.SMTP_USER && process.env.SMTP_PASS));

    let emailSent = false;
    if (hasEmailProvider) {
      try {
        emailSent = await sendEmailVerificationCode(cleanEmail, cleanUsername || 'Profissional', code);
      } catch (err: any) {
        console.error('❌ [EMAIL] Erro ao enviar código de verificação:', err.message);
      }
    }

    if (!emailSent) {
      console.log('\n======================================================');
      console.log('📧 [FALLBACK DE VERIFICAÇÃO DE E-MAIL]');
      console.log(`Para: ${cleanEmail}`);
      console.log(`✨ CÓDIGO DE VERIFICAÇÃO (4 DÍGITOS): [ ${code} ]`);
      console.log('======================================================\n');
    }

    return {
      success: true,
      message: emailSent
        ? `Código de verificação de 4 dígitos enviado para ${cleanEmail}`
        : `Código de verificação enviado para ${cleanEmail}`,
    };
  });

  // POST /api/auth/verify-code — Valida o código de 4 dígitos com proteção anti-força bruta (max 5 tentativas)
  app.post('/verify-code', async (request, reply) => {
    const { email, code } = request.body as { email: string; code: string };

    if (!email?.trim() || !code?.trim()) {
      return reply.status(400).send({ error: 'E-mail e código são obrigatórios.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    const attemptKey = cleanEmail;
    const now = Date.now();
    const currentAttempt = verifyAttempts.get(attemptKey);

    if (currentAttempt && currentAttempt.expiresAt > now && currentAttempt.count >= 5) {
      await prisma.verificationCode.deleteMany({ where: { email: cleanEmail } });
      verifyAttempts.delete(attemptKey);
      return reply.status(429).send({ error: 'Muitas tentativas incorretas. O código foi cancelado por segurança. Solicite um novo código.' });
    }

    const storedData = await prisma.verificationCode.findUnique({
      where: { email: cleanEmail },
    });

    if (!storedData) {
      return reply.status(400).send({ error: 'Nenhum código ativo encontrado para este e-mail. Solicite um novo código.' });
    }

    if (new Date() > storedData.expiresAt) {
      await prisma.verificationCode.delete({ where: { email: cleanEmail } });
      return reply.status(400).send({ error: 'O código de verificação expirou (10 min). Solicite um novo.' });
    }

    if (storedData.code !== cleanCode) {
      const newCount = (currentAttempt && currentAttempt.expiresAt > now) ? currentAttempt.count + 1 : 1;
      verifyAttempts.set(attemptKey, { count: newCount, expiresAt: now + 15 * 60 * 1000 });
      const remaining = 5 - newCount;
      if (remaining <= 0) {
        await prisma.verificationCode.deleteMany({ where: { email: cleanEmail } });
        verifyAttempts.delete(attemptKey);
        return reply.status(429).send({ error: 'Limite de 5 tentativas excedido. O código foi cancelado por segurança. Solicite um novo.' });
      }
      return reply.status(400).send({ error: `Código de verificação incorreto. Você tem mais ${remaining} tentativa(s).` });
    }

    // Código correto -> limpa contador e remove do banco
    verifyAttempts.delete(attemptKey);
    await prisma.verificationCode.delete({ where: { email: cleanEmail } });

    return {
      verified: true,
      message: 'E-mail verificado com sucesso!',
    };
  });

  // POST /api/auth/register — Create the admin account (only if none exists)
  app.post('/register', async (request, reply) => {
    // Permite múltiplos registros
    const {
      username,
      email,
      password,
      businessName,
      cnpj,
      phone,
      description,
      photoUrl,
      address,
      operatingHours,
      category,
      businessType,
    } = request.body as {
      username: string;
      email?: string;
      password: string;
      businessName?: string;
      cnpj?: string;
      phone?: string;
      description?: string;
      photoUrl?: string;
      address?: string;
      operatingHours?: string;
      category?: string;
      businessType?: 'SERVICES' | 'PRODUCTS';
    };

    if (!username?.trim() || !password) {
      return reply.status(400).send({ error: 'Usuário e senha são obrigatórios' });
    }

    if (password.length < 8) {
      return reply.status(400).send({ error: 'A senha deve ter pelo menos 8 caracteres, com letras e números' });
    }

    // 🛡️ Exige ao menos 1 letra e 1 número para evitar senhas triviais
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return reply.status(400).send({ error: 'A senha deve conter pelo menos 1 letra e 1 número' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const chosenCategory = category?.trim() || 'barber';
    const chosenBusinessType: 'SERVICES' | 'PRODUCTS' =
      businessType === 'PRODUCTS' || chosenCategory === 'confectionery' || chosenCategory === 'crafts'
        ? 'PRODUCTS'
        : 'SERVICES';

    let admin;
    try {
      admin = await prisma.admin.create({
        data: {
          username: username.trim().toLowerCase(),
          email: email?.trim().toLowerCase() || '',
          passwordHash,
          businessName: businessName?.trim() || '',
          cnpj: cnpj?.trim() || '',
          phone: phone?.trim() || '',
          description: description?.trim() || '',
          photoUrl: photoUrl?.trim() || '',
          address: address?.trim() || '',
          operatingHours: operatingHours || '',
          category: chosenCategory,
          businessType: chosenBusinessType,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return reply.status(409).send({ error: 'Este nome de usuário já está em uso. Escolha outro.' });
      }
      throw error;
    }

    const token = app.jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      { expiresIn: '24h' }
    );

    // Se for BoraEnkomenda (PRODUTOS), cria configurações de loja BoraEnkomenda e categorias padrão
    if (chosenBusinessType === 'PRODUCTS') {
      try {
        await prisma.orderSettings.create({
          data: {
            adminId: admin.id,
            enabled: true,
            storeName: admin.businessName || 'Minha Loja de Encomendas',
            storeDescription: admin.description || 'Produtos artesanais sob encomenda.',
            depositPercentage: 50.0,
            allowScheduledPickup: true,
            allowDelivery: true,
            deliveryFee: 10.0,
            minAdvanceDays: 2,
            pixKey: admin.phone || '',
          },
        });

        // Cria categoria inicial de confeitaria/encomenda
        const cat = await prisma.productCategory.create({
          data: {
            name: chosenCategory === 'crafts' ? 'Artesanato & Lembranças' : 'Bolos & Tortas',
            adminId: admin.id,
            position: 0,
          },
        });

        // Cria um produto de demonstração para encomenda
        await prisma.product.create({
          data: {
            name: chosenCategory === 'crafts' ? 'Kit Lembrancinhas Personalizadas' : 'Bolo Vulcão Ninho & Chocolate',
            description: 'Feito sob encomenda com ingredientes selecionados. Escolha o sabor e detalhes.',
            price: chosenCategory === 'crafts' ? 120.0 : 85.0,
            minDaysNotice: 2,
            maxQuantityPerOrder: 10,
            unitLabel: chosenCategory === 'crafts' ? 'kit' : 'unidade',
            available: true,
            featured: true,
            position: 0,
            categoryId: cat.id,
            adminId: admin.id,
            customFields: {
              create: [
                {
                  label: 'Sabor da Massa / Detalhe',
                  fieldType: 'SELECT',
                  options: JSON.stringify(['Chocolate Tradicional', 'Baunilha Fina', 'Cenoura Especial']),
                  required: true,
                  position: 0,
                },
                {
                  label: 'Nome para Dedicatória no Topo',
                  fieldType: 'TEXT',
                  options: '[]',
                  required: false,
                  position: 1,
                },
              ],
            },
          },
        });
      } catch (err: any) {
        console.error('Erro ao semear dados iniciais de BoraEnkomenda:', err.message);
      }
    }

    // Se for BoraMarka (SERVIÇOS), semeia os serviços de autônomos por hora
    if (chosenBusinessType === 'SERVICES') {
      const defaultServices: Record<string, Array<{ name: string; price: number; durationMinutes: number; description: string }>> = {
        barber: [
          { name: 'Corte Social / Degradê', price: 35.0, durationMinutes: 30, description: 'Corte moderno com acabamento e alinhamento do pezinho' },
          { name: 'Barba Completa + Toalha Quente', price: 30.0, durationMinutes: 25, description: 'Modelagem de barba com esfoliação e toalha quente' },
          { name: 'Combo Cabelo & Barba Premium', price: 60.0, durationMinutes: 50, description: 'Corte completo + barba tratada e finalizada' },
        ],
        beauty: [
          { name: 'Pé & Mão Completo', price: 55.0, durationMinutes: 50, description: 'Cutilagem, esmaltação e hidratação das mãos e pés' },
          { name: 'Escova & Modelagem', price: 60.0, durationMinutes: 45, description: 'Lavagem especial com lavatório e escova modelada' },
          { name: 'Esmaltação em Gel', price: 70.0, durationMinutes: 60, description: 'Aplicação e secagem com luz UV de alta durabilidade' },
        ],
        tattoo: [
          { name: 'Sessão Tatuagem (1 hora)', price: 150.0, durationMinutes: 60, description: 'Sessão inicial de tatuagem personalizada' },
          { name: 'Aplicação de Piercing', price: 70.0, durationMinutes: 30, description: 'Perfuração asséptica com joia em titânio inclusa' },
        ],
        aesthetics: [
          { name: 'Design de Sobrancelha com Henna', price: 45.0, durationMinutes: 35, description: 'Mapeamento facial e pigmentação com henna' },
          { name: 'Limpeza de Pele Profunda', price: 130.0, durationMinutes: 60, description: 'Higienização, extração de cravos e máscara calmante' },
        ],
        health: [
          { name: 'Avaliação Física & Anamnese', price: 80.0, durationMinutes: 45, description: 'Medição de dobras, bioimpedância e metas' },
          { name: 'Treino Acompanhado / Personal (1h)', price: 90.0, durationMinutes: 60, description: 'Sessão individual com correção postural' },
        ],
        pet: [
          { name: 'Banho & Tosa Higiênica', price: 50.0, durationMinutes: 45, description: 'Banho com shampoo neutro e higienização' },
          { name: 'Banho & Tosa Completa', price: 80.0, durationMinutes: 60, description: 'Banho completo e tosa da raça' },
        ],
        clinic: [
          { name: 'Consulta Inicial / Avaliação', price: 150.0, durationMinutes: 50, description: 'Primeira consulta diagnóstica e plano de tratamento' },
          { name: 'Sessão de Acompanhamento', price: 120.0, durationMinutes: 40, description: 'Retorno e acompanhamento evolutivo' },
        ],
      };

      const initialServices = defaultServices[chosenCategory] || defaultServices.barber;

      try {
        for (const s of initialServices) {
          await prisma.service.create({
            data: {
              adminId: admin.id,
              name: s.name,
              price: s.price,
              duration: s.durationMinutes,
              description: s.description,
            },
          });
        }
      } catch (err: any) {
        console.error('Erro ao semear serviços padrão para categoria:', err.message);
      }
    }

    // Cria a assinatura com 7 dias de trial grátis
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    await prisma.subscription.create({
      data: {
        adminId: admin.id,
        status: 'trialing',
        plan: 'mensal',
        trialEndsAt: trialEndsAt,
      }
    });

    // Envia e-mail de boas-vindas assincronamente (não trava resposta)
    if (admin.email) {
      sendWelcomeEmail(admin.email, admin.username, admin.businessName).catch(err => {
        console.error('Erro ao enviar e-mail de boas-vindas:', err.message);
      });
    }

    const refreshToken = await createRefreshToken(admin.id);

    return reply.status(201).send({
      token,
      refreshToken,
      username: admin.username,
      businessName: admin.businessName,
      role: admin.role,
    });
  });

  // POST /api/auth/login — Autentica tanto Administradores quanto Operadores
  // 🛡️ Rate limit específico: 5 tentativas/min por IP (anti-brute-force)
  app.post('/login', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
        errorResponseBuilder: () => ({
          statusCode: 429,
          error: 'Muitas tentativas de login. Aguarde 1 minuto antes de tentar novamente.',
        }),
      },
    },
  }, async (request, reply) => {
    const { username, password, companyUsername } = request.body as {
      username: string;
      password: string;
      companyUsername?: string;
    };

    if (!username?.trim() || !password) {
      return reply.status(400).send({ error: 'Usuário e senha são obrigatórios' });
    }

    let cleanCompany = (companyUsername || '').trim();
    let cleanUser = username.trim();

    // Se o usuário digitou no formato "empresa/operador" ou "@empresa/operador"
    if (!cleanCompany && cleanUser.includes('/')) {
      const parts = cleanUser.split('/');
      cleanCompany = parts[0].replace(/^@/, '').trim();
      cleanUser = parts[1].trim();
    } else if (cleanCompany) {
      cleanCompany = cleanCompany.replace(/^@/, '').trim();
    }

    // A. FLUXO SE ESPECIFICOU A EMPRESA (Login de Colaborador)
    if (cleanCompany) {
      const cleanCompanyLower = cleanCompany.toLowerCase();
      const cleanUserLower = cleanUser.toLowerCase();

      // 1. Busca a empresa (Admin principal)
      const targetAdmin = await prisma.admin.findFirst({
        where: {
          OR: [
            { username: cleanCompanyLower },
            { email: cleanCompanyLower },
          ],
        },
      });

      if (!targetAdmin) {
        return reply.status(401).send({ error: 'Empresa não encontrada. Verifique o usuário ou e-mail da empresa.' });
      }

      // 2. Busca o colaborador nesta empresa específica
      const operator = await prisma.userPermission.findFirst({
        where: {
          adminId: targetAdmin.id,
          OR: [
            { userName: cleanUser },
            { email: cleanUserLower },
          ],
        },
        include: {
          admin: true,
        },
      });

      if (!operator) {
        return reply.status(401).send({ error: `Colaborador "${cleanUser}" não encontrado na empresa "${targetAdmin.businessName || targetAdmin.username}".` });
      }

      if (!operator.active) {
        return reply.status(403).send({ error: 'Este perfil de colaborador está temporariamente suspenso pelo administrador.' });
      }

      if (!operator.passwordHash) {
        return reply.status(400).send({ error: 'Este colaborador ainda não possui uma senha configurada. Peça ao administrador para definir sua senha em Segurança & Permissões.' });
      }

      const validOperatorPassword = await bcrypt.compare(password, operator.passwordHash);
      if (!validOperatorPassword) {
        return reply.status(401).send({ error: 'Senha incorreta para este colaborador. Tente novamente.' });
      }

      const permissionsPayload = {
        canAgendamentos: operator.canAgendamentos,
        canEstornos: operator.canEstornos,
        canClientes: operator.canClientes,
        canHorarios: operator.canHorarios,
        canServicos: operator.canServicos,
        canLinks: operator.canLinks,
        canCupons: operator.canCupons,
        canMemberships: operator.canMemberships,
        canFinanceiro: operator.canFinanceiro,
        canRh: operator.canRh,
        canFaturamento: operator.canFaturamento,
        canSeguranca: operator.canSeguranca,
        canPersonalizar: operator.canPersonalizar,
        canSocial: operator.canSocial,
        canAudit: operator.canAudit,
        canTrash: operator.canTrash,
      };

      const token = app.jwt.sign(
        {
          id: operator.adminId,
          operatorId: operator.id,
          username: operator.userName,
          role: 'operator',
          roleTitle: operator.roleTitle,
          permissions: permissionsPayload,
        },
        { expiresIn: '24h' }
      );

      request.user = { id: operator.adminId, username: operator.userName, role: 'operator' };
      await createAuditLog(request, {
        action: 'LOGIN',
        entity: 'AUTH',
        entityId: operator.id,
        details: `Operador "${operator.userName}" (${operator.roleTitle}) efetuou login no sistema da empresa "${operator.admin.businessName}".`,
        adminId: operator.adminId,
      });

      return {
        token,
        username: operator.userName,
        businessName: operator.admin.businessName,
        role: 'operator',
        roleTitle: operator.roleTitle,
        permissions: permissionsPayload,
      };
    }

    // B. FLUXO PADRÃO (Sem empresa especificada)
    const cleanLower = cleanUser.toLowerCase();

    // 1. Tenta autenticar como Admin principal
    const admin = await prisma.admin.findFirst({
      where: {
        OR: [
          { username: cleanLower },
          { email: cleanLower },
        ],
      },
    });

    if (admin) {
      const validPassword = await bcrypt.compare(password, admin.passwordHash);
      if (validPassword) {
        const token = app.jwt.sign(
          { id: admin.id, username: admin.username, role: admin.role },
          { expiresIn: '24h' }
        );

        request.user = { id: admin.id, username: admin.username, role: admin.role };
        await createAuditLog(request, {
          action: 'LOGIN',
          entity: 'AUTH',
          entityId: admin.id,
          details: `Efetuou login no sistema como Administrador "${admin.username}"`,
          adminId: admin.id,
        });

        const refreshToken = await createRefreshToken(admin.id);

        return {
          token,
          refreshToken,
          username: admin.username,
          businessName: admin.businessName,
          role: admin.role,
        };
      }
    }

    // 2. Tenta autenticar como Operador (fallback sem empresa informada)
    const operator = await prisma.userPermission.findFirst({
      where: {
        OR: [
          { userName: cleanUser },
          { email: cleanLower },
        ],
      },
      include: {
        admin: true,
      },
    });

    if (operator) {
      if (!operator.active) {
        return reply.status(403).send({ error: 'Este perfil de colaborador está temporariamente suspenso pelo administrador.' });
      }

      if (!operator.passwordHash) {
        return reply.status(400).send({ error: 'Este colaborador ainda não possui uma senha configurada. Peça ao administrador para definir sua senha em Segurança & Permissões.' });
      }

      const validOperatorPassword = await bcrypt.compare(password, operator.passwordHash);
      if (validOperatorPassword) {
        const permissionsPayload = {
          canAgendamentos: operator.canAgendamentos,
          canEstornos: operator.canEstornos,
          canClientes: operator.canClientes,
          canHorarios: operator.canHorarios,
          canServicos: operator.canServicos,
          canLinks: operator.canLinks,
          canCupons: operator.canCupons,
          canMemberships: operator.canMemberships,
          canFinanceiro: operator.canFinanceiro,
          canRh: operator.canRh,
          canFaturamento: operator.canFaturamento,
          canSeguranca: operator.canSeguranca,
          canPersonalizar: operator.canPersonalizar,
          canSocial: operator.canSocial,
          canAudit: operator.canAudit,
          canTrash: operator.canTrash,
        };

        const token = app.jwt.sign(
          {
            id: operator.adminId,
            operatorId: operator.id,
            username: operator.userName,
            role: 'operator',
            roleTitle: operator.roleTitle,
            permissions: permissionsPayload,
          },
          { expiresIn: '24h' }
        );

        request.user = { id: operator.adminId, username: operator.userName, role: 'operator' };
        await createAuditLog(request, {
          action: 'LOGIN',
          entity: 'AUTH',
          entityId: operator.id,
          details: `Operador "${operator.userName}" (${operator.roleTitle}) efetuou login no sistema.`,
          adminId: operator.adminId,
        });

        return {
          token,
          username: operator.userName,
          businessName: operator.admin.businessName,
          role: 'operator',
          roleTitle: operator.roleTitle,
          permissions: permissionsPayload,
        };
      }
    }

    return reply.status(401).send({ error: 'Credenciais inválidas. Verifique os dados de acesso e a senha.' });
  });

  // POST /api/auth/change-password
  app.post('/change-password', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'Não autorizado' });
    }

    const { currentPassword, newPassword } = request.body as {
      currentPassword: string;
      newPassword: string;
    };

    if (!currentPassword || !newPassword) {
      return reply.status(400).send({ error: 'Senha atual e nova senha são obrigatórias' });
    }

    if (newPassword.length < 8) {
      return reply.status(400).send({ error: 'A nova senha deve ter pelo menos 8 caracteres, com letras e números' });
    }

    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return reply.status(400).send({ error: 'A nova senha deve conter pelo menos 1 letra e 1 número' });
    }

    const user = request.user as { id: number };
    const admin = await prisma.admin.findUnique({ where: { id: user.id } });

    if (!admin) {
      return reply.status(404).send({ error: 'Admin não encontrado' });
    }

    const validPassword = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!validPassword) {
      return reply.status(401).send({ error: 'Senha atual incorreta' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.admin.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { message: 'Senha alterada com sucesso' };
  });

  // POST /api/auth/forgot-password
  app.post('/forgot-password', async (request, reply) => {
    const { email } = request.body as { email: string };

    if (!email || !email.trim()) {
      return reply.status(400).send({ error: 'E-mail é obrigatório' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Busca admin pelo e-mail ou nome de usuário
    const admin = await prisma.admin.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { username: cleanEmail },
        ],
      },
    });

    const successMessage = 'Se o e-mail estiver cadastrado, você receberá o código de verificação em instantes.';

    if (!admin || !admin.email) {
      return { message: successMessage };
    }

    // Gera um código de 6 dígitos numéricos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // Expirar em 15 minutos

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        resetToken: code,
        resetTokenExpiry,
      },
    });

    await sendPasswordResetEmail(admin.email, admin.username, code);

    return { 
      message: successMessage,
    };
  });

  // POST /api/auth/reset-password — Redefine a senha com proteção anti-força bruta
  app.post('/reset-password', async (request, reply) => {
    const { email, code, newPassword } = request.body as {
      email: string;
      code: string;
      newPassword: string;
    };

    if (!email || !code || !newPassword) {
      return reply.status(400).send({ error: 'E-mail, código e nova senha são obrigatórios' });
    }

    if (newPassword.length < 8) {
      return reply.status(400).send({ error: 'A nova senha deve ter pelo menos 8 caracteres, com letras e números' });
    }

    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return reply.status(400).send({ error: 'A nova senha deve conter pelo menos 1 letra e 1 número' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    const attemptKey = cleanEmail;
    const now = Date.now();
    const currentAttempt = resetAttempts.get(attemptKey);

    const admin = await prisma.admin.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { username: cleanEmail },
        ],
      },
    });

    if (currentAttempt && currentAttempt.expiresAt > now && currentAttempt.count >= 5) {
      if (admin) {
        await prisma.admin.update({
          where: { id: admin.id },
          data: { resetToken: null, resetTokenExpiry: null },
        });
      }
      resetAttempts.delete(attemptKey);
      return reply.status(429).send({ error: 'Muitas tentativas incorretas. O código foi cancelado por segurança. Solicite uma nova recuperação.' });
    }

    if (!admin || !admin.resetToken || admin.resetToken !== cleanCode) {
      const newCount = (currentAttempt && currentAttempt.expiresAt > now) ? currentAttempt.count + 1 : 1;
      resetAttempts.set(attemptKey, { count: newCount, expiresAt: now + 15 * 60 * 1000 });
      const remaining = 5 - newCount;
      if (remaining <= 0) {
        if (admin) {
          await prisma.admin.update({
            where: { id: admin.id },
            data: { resetToken: null, resetTokenExpiry: null },
          });
        }
        resetAttempts.delete(attemptKey);
        return reply.status(429).send({ error: 'Limite de 5 tentativas excedido. O código foi cancelado por segurança. Solicite uma nova recuperação.' });
      }
      return reply.status(400).send({ error: `Código de verificação inválido ou incorreto. Você tem mais ${remaining} tentativa(s).` });
    }

    if (!admin.resetTokenExpiry || admin.resetTokenExpiry < new Date()) {
      resetAttempts.delete(attemptKey);
      return reply.status(400).send({ error: 'O código de verificação expirou. Solicite um novo código.' });
    }

    resetAttempts.delete(attemptKey);
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    await createAuditLog(request, {
      action: 'PASSWORD_RESET',
      entity: 'AUTH',
      entityId: admin.id,
      details: `Redefiniu a senha via código de e-mail com sucesso.`,
      adminId: admin.id,
    });

    return { message: 'Senha redefinida com sucesso! Você já pode acessar sua conta.' };
  });

  // POST /api/auth/refresh — Renova o JWT token através de um refresh token válido
  app.post('/refresh', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken?: string };

    if (!refreshToken) {
      return reply.status(400).send({ error: 'Refresh token é obrigatório.' });
    }

    const rotated = await verifyAndRotateRefreshToken(refreshToken);
    if (!rotated) {
      return reply.status(401).send({ error: 'Refresh token inválido ou expirado. Efetue login novamente.' });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: rotated.adminId },
    });

    if (!admin) {
      return reply.status(401).send({ error: 'Usuário não encontrado.' });
    }

    const token = app.jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      { expiresIn: '24h' }
    );

    return {
      token,
      refreshToken: rotated.newToken,
    };
  });

  // POST /api/auth/logout — Revoga o refresh token atual
  app.post('/logout', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken?: string };

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    return { message: 'Sessão encerrada com sucesso.' };
  });
}


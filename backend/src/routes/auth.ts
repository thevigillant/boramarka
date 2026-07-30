import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { createAuditLog } from '../utils/auditLogger';
import { sendPasswordResetEmail, sendEmailVerificationCode, sendWelcomeEmail } from '../utils/mailer';

// In-memory verification code store with expiration (10 min)
const verificationStore = new Map<string, { code: string; expiresAt: number }>();

export default async function authRoutes(app: FastifyInstance) {
  // GET /api/auth/check — Check if any admin account exists
  app.get('/check', async () => {
    const count = await prisma.admin.count();
    return { hasAccount: count > 0 };
  });

  // POST /api/auth/send-verification-code — Envia código de 4 dígitos por e-mail
  app.post('/send-verification-code', async (request, reply) => {
    const { email, username } = request.body as { email: string; username?: string };

    if (!email?.trim() || !/\S+@\S+\.\S+/.test(email.trim())) {
      return reply.status(400).send({ error: 'E-mail inválido.' });
    }

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
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutos

    verificationStore.set(cleanEmail, { code, expiresAt });

    const isSmtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

    let emailSent = false;
    if (isSmtpConfigured) {
      try {
        const timeoutPromise = new Promise<boolean>((resolve) =>
          setTimeout(() => resolve(false), 4500)
        );
        emailSent = await Promise.race([
          sendEmailVerificationCode(cleanEmail, cleanUsername || 'Profissional', code),
          timeoutPromise,
        ]);
      } catch (err: any) {
        console.error('Erro ao enviar e-mail por SMTP:', err.message);
      }
    }

    if (!emailSent) {
      console.log('\n======================================================');
      console.log('📧 [FALLBACK DE VERIFICAÇÃO DE E-MAIL]');
      console.log(`Para: ${cleanEmail}`);
      console.log(`✨ CÓDIGO DE VERIFICAÇÃO (4 DÍGITOS): [ ${code} ]`);
      console.log('======================================================\n');
    }

    const isProd = process.env.NODE_ENV === 'production';

    return {
      success: true,
      message: emailSent
        ? `Código de verificação de 4 dígitos enviado para ${cleanEmail}`
        : `Código de verificação enviado para ${cleanEmail}`,
      devCode: (emailSent || isProd) ? undefined : code,
    };
  });

  // POST /api/auth/verify-code — Valida o código de 4 dígitos digitado pelo usuário
  app.post('/verify-code', async (request, reply) => {
    const { email, code } = request.body as { email: string; code: string };

    if (!email?.trim() || !code?.trim()) {
      return reply.status(400).send({ error: 'E-mail e código são obrigatórios.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    const storedData = verificationStore.get(cleanEmail);

    if (!storedData) {
      return reply.status(400).send({ error: 'Nenhum código encontrado para este e-mail. Solicite um novo código.' });
    }

    if (Date.now() > storedData.expiresAt) {
      verificationStore.delete(cleanEmail);
      return reply.status(400).send({ error: 'O código de verificação expirou (10 min). Solicite um novo.' });
    }

    if (storedData.code !== cleanCode) {
      return reply.status(400).send({ error: 'Código de verificação incorreto. Verifique os 4 dígitos e tente novamente.' });
    }

    // Código correto -> remove do store
    verificationStore.delete(cleanEmail);

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
    };

    if (!username?.trim() || !password) {
      return reply.status(400).send({ error: 'Usuário e senha são obrigatórios' });
    }

    if (password.length < 6) {
      return reply.status(400).send({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const chosenCategory = category?.trim() || 'barber';

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
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return reply.status(409).send({ error: 'Este nome de usuário já está em uso. Escolha outro.' });
      }
      throw error;
    }

    const token = app.jwt.sign({
      id: admin.id,
      username: admin.username,
      role: admin.role,
    });

    // Auto-seed default services based on category
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
        { name: 'Avaliação & Decalque', price: 50.0, durationMinutes: 30, description: 'Criação de arte e teste de posicionamento' },
      ],
      aesthetics: [
        { name: 'Design de Sobrancelha com Henna', price: 45.0, durationMinutes: 35, description: 'Mapeamento facial e pigmentação com henna' },
        { name: 'Extensão de Cílios (Volume Russo)', price: 120.0, durationMinutes: 90, description: 'Aplicação fio a fio com curvatura marcante' },
        { name: 'Limpeza de Pele Profunda', price: 130.0, durationMinutes: 60, description: 'Higienização, extração de cravos e máscara calmante' },
      ],
      health: [
        { name: 'Avaliação Física & Anamnese', price: 80.0, durationMinutes: 45, description: 'Medição de dobras, bioimpedância e metas' },
        { name: 'Treino Acompanhado / Personal (1h)', price: 90.0, durationMinutes: 60, description: 'Sessão individual com correção postural' },
        { name: 'Fisioterapia & Liberação Miofascial', price: 120.0, durationMinutes: 50, description: 'Alívio de dores e liberação muscular profunda' },
      ],
      pet: [
        { name: 'Banho & Tosa Higiênica (Pequeno Porte)', price: 50.0, durationMinutes: 45, description: 'Banho com shampoo neutro, corte de unhas e higienização' },
        { name: 'Banho & Tosa Completa (Médio/Grande Porte)', price: 80.0, durationMinutes: 60, description: 'Banho completo com toalha morna e tosa da raça' },
        { name: 'Hidratação de Pelagem Profunda', price: 35.0, durationMinutes: 20, description: 'Tratamento de brilho e maciez dos pelos' },
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

    return reply.status(201).send({
      token,
      username: admin.username,
      businessName: admin.businessName,
      role: admin.role,
    });
  });

  // POST /api/auth/login — Autentica tanto Administradores quanto Operadores
  app.post('/login', async (request, reply) => {
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

        return {
          token,
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

    if (newPassword.length < 6) {
      return reply.status(400).send({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
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

    return { message: successMessage };
  });

  // POST /api/auth/reset-password
  app.post('/reset-password', async (request, reply) => {
    const { email, code, newPassword } = request.body as {
      email: string;
      code: string;
      newPassword: string;
    };

    if (!email || !code || !newPassword) {
      return reply.status(400).send({ error: 'E-mail, código e nova senha são obrigatórios' });
    }

    if (newPassword.length < 6) {
      return reply.status(400).send({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    const admin = await prisma.admin.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { username: cleanEmail },
        ],
      },
    });

    if (!admin || !admin.resetToken || admin.resetToken !== cleanCode) {
      return reply.status(400).send({ error: 'Código de verificação inválido ou incorreto' });
    }

    if (!admin.resetTokenExpiry || admin.resetTokenExpiry < new Date()) {
      return reply.status(400).send({ error: 'O código de verificação expirou. Solicite um novo código.' });
    }

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
}


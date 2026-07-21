import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { createAuditLog } from '../utils/auditLogger';
import { sendPasswordResetEmail, sendEmailVerificationCode } from '../utils/mailer';

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

    const emailSent = await sendEmailVerificationCode(cleanEmail, cleanUsername || 'Profissional', code);

    if (!emailSent) {
      return reply.status(500).send({ error: 'Erro ao enviar e-mail de verificação. Verifique as configurações de SMTP.' });
    }

    return {
      success: true,
      message: `Código de verificação de 4 dígitos enviado para ${cleanEmail}`,
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
    };

    if (!username?.trim() || !password) {
      return reply.status(400).send({ error: 'Usuário e senha são obrigatórios' });
    }

    if (password.length < 6) {
      return reply.status(400).send({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

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
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return reply.status(409).send({ error: 'Este nome de usuário já está em uso. Escolha outro.' });
      }
      throw error;
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

    const token = app.jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      { expiresIn: '24h' }
    );

    return reply.status(201).send({
      token,
      username: admin.username,
      businessName: admin.businessName,
      role: admin.role,
    });
  });

  // POST /api/auth/login
  app.post('/login', async (request, reply) => {
    const { username, password } = request.body as {
      username: string;
      password: string;
    };

    if (!username || !password) {
      return reply.status(400).send({ error: 'Usuário e senha são obrigatórios' });
    }

    const admin = await prisma.admin.findUnique({
      where: { username: username.trim().toLowerCase() },
    });

    if (!admin) {
      return reply.status(401).send({ error: 'Credenciais inválidas' });
    }

    const validPassword = await bcrypt.compare(password, admin.passwordHash);
    if (!validPassword) {
      return reply.status(401).send({ error: 'Credenciais inválidas' });
    }

    const token = app.jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      { expiresIn: '24h' }
    );

    // Record login audit log
    request.user = { id: admin.id, username: admin.username, role: admin.role };
    await createAuditLog(request, {
      action: 'LOGIN',
      entity: 'AUTH',
      entityId: admin.id,
      details: `Efetuou login no sistema como "${admin.username}"`,
      adminId: admin.id,
    });

    return {
      token,
      username: admin.username,
      role: admin.role,
    };
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


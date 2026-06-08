import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';

export default async function authRoutes(app: FastifyInstance) {
  // GET /api/auth/check — Check if any admin account exists
  app.get('/check', async () => {
    const count = await prisma.admin.count();
    return { hasAccount: count > 0 };
  });

  // POST /api/auth/register — Create the admin account (only if none exists)
  app.post('/register', async (request, reply) => {
    // Permite múltiplos registros
    const {
      username,
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

    const token = app.jwt.sign(
      { id: admin.id, username: admin.username },
      { expiresIn: '24h' }
    );

    return reply.status(201).send({
      token,
      username: admin.username,
      businessName: admin.businessName,
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
      { id: admin.id, username: admin.username },
      { expiresIn: '24h' }
    );

    return {
      token,
      username: admin.username,
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
}

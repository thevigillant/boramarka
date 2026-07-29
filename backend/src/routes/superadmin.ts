import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../db';
import bcrypt from 'bcryptjs';

export async function authenticateSuperAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const user = request.user as { id: number; username: string; role: string };
    if (user.role !== 'superadmin') {
      return reply.status(403).send({ error: 'Acesso negado. Apenas super administradores podem acessar esta área.' });
    }
  } catch (err) {
    return reply.status(401).send({ error: 'Não autorizado. Faça login novamente.' });
  }
}

export default async function superadminRoutes(app: FastifyInstance) {
  // All superadmin routes require superadmin authentication
  app.addHook('onRequest', authenticateSuperAdmin);

  // ═══════════════════════════════════════════
  //  STATS GLOBAS
  // ═══════════════════════════════════════════
  app.get('/stats', async () => {
    const [totalUsers, totalBookings, activeSubscriptions, trialingSubscriptions] = await Promise.all([
      prisma.admin.count({ where: { role: { not: 'superadmin' } } }),
      prisma.booking.count(),
      prisma.subscription.count({ where: { status: 'active' } }),
      prisma.subscription.count({ where: { status: 'trialing' } }),
    ]);

    // Calcular faturamento mensal estimado (ex: cada active paga R$ 29.90/mês)
    const estimatedMonthlyRevenue = activeSubscriptions * 29.90;

    return {
      totalUsers,
      totalBookings,
      activeSubscriptions,
      trialingSubscriptions,
      estimatedMonthlyRevenue,
    };
  });

  // ═══════════════════════════════════════════
  //  USERS LIST
  // ═══════════════════════════════════════════
  app.get('/users', async () => {
    const users = await prisma.admin.findMany({
      where: { role: { not: 'superadmin' } },
      select: {
        id: true,
        username: true,
        businessName: true,
        cnpj: true,
        phone: true,
        createdAt: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            expiresAt: true,
            trialEndsAt: true,
          }
        },
        _count: {
          select: {
            links: true,
            services: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Mapear para contar o número de clientes únicos (bookings) de cada usuário
    const usersWithBookingsCount = await Promise.all(
      users.map(async (u) => {
        const bookingsCount = await prisma.booking.count({
          where: {
            timeSlot: {
              link: {
                adminId: u.id
              }
            }
          }
        });
        return {
          ...u,
          bookingsCount,
        };
      })
    );

    return usersWithBookingsCount;
  });

  // ═══════════════════════════════════════════
  //  UPDATE USER SUBSCRIPTION (PLAN / STATUS)
  // ═══════════════════════════════════════════
  app.put('/users/:id/subscription', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { plan, status, expiresAt } = request.body as {
      plan?: string;
      status?: string;
      expiresAt?: string;
    };

    const adminId = parseInt(id);
    if (isNaN(adminId)) {
      return reply.status(400).send({ error: 'ID inválido' });
    }

    const sub = await prisma.subscription.findUnique({
      where: { adminId }
    });

    if (!sub) {
      return reply.status(404).send({ error: 'Assinatura não encontrada' });
    }

    const updatedSub = await prisma.subscription.update({
      where: { adminId },
      data: {
        plan: plan || sub.plan,
        status: status || sub.status,
        expiresAt: expiresAt ? new Date(expiresAt) : sub.expiresAt,
      }
    });

    return updatedSub;
  });

  // ═══════════════════════════════════════════
  //  DELETE USER
  // ═══════════════════════════════════════════
  app.delete('/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const adminId = parseInt(id);
    if (isNaN(adminId)) {
      return reply.status(400).send({ error: 'ID inválido' });
    }

    // O Prisma deleta em cascata por causa de onDelete: Cascade nos relacionamentos
    await prisma.admin.delete({
      where: { id: adminId }
    });

    return { success: true, message: 'Profissional e todos os seus dados foram excluídos com sucesso' };
  });

  // ═══════════════════════════════════════════
  //  IMPERSONATE USER (LOGIN AS PROFESSIONAL)
  // ═══════════════════════════════════════════
  app.post('/users/:id/impersonate', async (request, reply) => {
    const { id } = request.params as { id: string };
    const adminId = parseInt(id);
    if (isNaN(adminId)) {
      return reply.status(400).send({ error: 'ID inválido' });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId }
    });

    if (!admin) {
      return reply.status(404).send({ error: 'Profissional não encontrado' });
    }

    // Generate token for this user as admin role
    const token = app.jwt.sign({
      id: admin.id,
      username: admin.username,
      role: 'admin'
    });

    return { token, username: admin.username };
  });

  // POST /api/superadmin/impersonate-self — Impersonate self as professional
  app.post('/impersonate-self', async (request, reply) => {
    const user = request.user as { id: number; username: string };
    
    // Generate token for the superadmin self as admin role
    const token = app.jwt.sign({
      id: user.id,
      username: user.username,
      role: 'admin'
    });

    return { token, username: user.username };
  });

  // GET /api/superadmin/me — Current SuperAdmin info & permissions
  app.get('/me', async (request: FastifyRequest) => {
    const user = request.user as { id: number; username: string };
    const admin = await prisma.admin.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        businessName: true,
        role: true,
        permissions: true,
      },
    });

    let permissions = {
      canManageUsers: true,
      canManageSubscriptions: true,
      canManageSuperAdmins: true,
      canAccessSupport: true,
      canViewFinancials: true,
    };

    if (admin?.permissions) {
      try {
        permissions = { ...permissions, ...JSON.parse(admin.permissions) };
      } catch (e) {
        // default fallback
      }
    }

    return {
      ...admin,
      permissions,
    };
  });

  // ═══════════════════════════════════════════
  //  LIST ALL SUPERADMIN ACCOUNTS
  // ═══════════════════════════════════════════
  app.get('/admins', async () => {
    const superadmins = await prisma.admin.findMany({
      where: { role: 'superadmin' },
      select: {
        id: true,
        username: true,
        businessName: true,
        phone: true,
        email: true,
        role: true,
        permissions: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return superadmins.map(sa => {
      let perms = {
        canManageUsers: true,
        canManageSubscriptions: true,
        canManageSuperAdmins: true,
        canAccessSupport: true,
        canViewFinancials: true,
      };
      try {
        if (sa.permissions) perms = { ...perms, ...JSON.parse(sa.permissions) };
      } catch (e) {}
      return { ...sa, parsedPermissions: perms };
    });
  });

  // ═══════════════════════════════════════════
  //  CREATE NEW SUPERADMIN ACCOUNT WITH PERMISSIONS
  // ═══════════════════════════════════════════
  app.post('/admins', async (request: FastifyRequest, reply: FastifyReply) => {
    const { username, password, businessName, phone, email, permissions } = request.body as {
      username: string;
      password: string;
      businessName?: string;
      phone?: string;
      email?: string;
      permissions?: Record<string, boolean>;
    };

    if (!username?.trim() || !password?.trim()) {
      return reply.status(400).send({ error: 'Usuário e senha são obrigatórios.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = await prisma.admin.findUnique({
      where: { username: cleanUsername },
    });

    if (existing) {
      return reply.status(400).send({ error: 'Este nome de usuário já existe na plataforma.' });
    }

    const defaultPerms = {
      canManageUsers: true,
      canManageSubscriptions: true,
      canManageSuperAdmins: false,
      canAccessSupport: true,
      canViewFinancials: false,
    };

    const finalPermissions = JSON.stringify(permissions ? { ...defaultPerms, ...permissions } : defaultPerms);
    const passwordHash = await bcrypt.hash(password.trim(), 10);

    const newSuperAdmin = await prisma.admin.create({
      data: {
        username: cleanUsername,
        passwordHash,
        role: 'superadmin',
        businessName: businessName?.trim() || 'Gestor BoraMarka',
        phone: phone?.trim() || '',
        email: email?.trim() || '',
        category: 'admin',
        permissions: finalPermissions,
      },
      select: {
        id: true,
        username: true,
        businessName: true,
        phone: true,
        email: true,
        role: true,
        permissions: true,
        createdAt: true,
      },
    });

    return reply.status(201).send(newSuperAdmin);
  });

  // ═══════════════════════════════════════════
  //  UPDATE SUPERADMIN PERMISSIONS
  // ═══════════════════════════════════════════
  app.put('/admins/:id/permissions', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { permissions } = request.body as { permissions: Record<string, boolean> };
    const adminId = parseInt(id);

    if (isNaN(adminId)) {
      return reply.status(400).send({ error: 'ID inválido' });
    }

    const updated = await prisma.admin.update({
      where: { id: adminId },
      data: {
        permissions: JSON.stringify(permissions),
      },
      select: {
        id: true,
        username: true,
        permissions: true,
      },
    });

    return updated;
  });

  // ═══════════════════════════════════════════
  //  CREATE NEW PROFESSIONAL USER (BY SUPERADMIN)
  // ═══════════════════════════════════════════
  app.post('/create-user', async (request: FastifyRequest, reply: FastifyReply) => {
    const { username, password, businessName, phone, email, plan } = request.body as {
      username: string;
      password: string;
      businessName: string;
      phone?: string;
      email?: string;
      plan?: string;
    };

    if (!username?.trim() || !password?.trim() || !businessName?.trim()) {
      return reply.status(400).send({ error: 'Nome da empresa, usuário e senha são obrigatórios.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = await prisma.admin.findUnique({
      where: { username: cleanUsername },
    });

    if (existing) {
      return reply.status(400).send({ error: 'Este nome de usuário já está em uso.' });
    }

    const passwordHash = await bcrypt.hash(password.trim(), 10);

    // Data de expiração do teste (30 dias)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    const newUser = await prisma.admin.create({
      data: {
        username: cleanUsername,
        passwordHash,
        businessName: businessName.trim(),
        phone: phone?.trim() || '',
        email: email?.trim() || '',
        role: 'user',
        subscription: {
          create: {
            plan: plan || 'mensal',
            status: 'trialing',
            trialEndsAt,
            expiresAt: trialEndsAt,
          },
        },
      },
      select: {
        id: true,
        username: true,
        businessName: true,
        phone: true,
        email: true,
        createdAt: true,
      },
    });

    return reply.status(201).send(newUser);
  });

  // ═══════════════════════════════════════════
  //  GRANT 30-DAY TRIAL TO USER (1-CLICK QUICK ACTION)
  // ═══════════════════════════════════════════
  app.post('/users/:id/grant-trial', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const adminId = parseInt(id);

    if (isNaN(adminId)) {
      return reply.status(400).send({ error: 'ID inválido' });
    }

    const sub = await prisma.subscription.findUnique({ where: { adminId } });
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 30);

    if (!sub) {
      const createdSub = await prisma.subscription.create({
        data: {
          adminId,
          plan: 'mensal',
          status: 'trialing',
          trialEndsAt: newExpiresAt,
          expiresAt: newExpiresAt,
        },
      });
      return createdSub;
    }

    const updatedSub = await prisma.subscription.update({
      where: { adminId },
      data: {
        status: 'trialing',
        trialEndsAt: newExpiresAt,
        expiresAt: newExpiresAt,
      },
    });

    return updatedSub;
  });
}

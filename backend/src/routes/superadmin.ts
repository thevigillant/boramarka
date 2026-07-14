import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../db';

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
}

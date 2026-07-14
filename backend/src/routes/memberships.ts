import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authenticate } from '../plugins/auth';

export default async function membershipRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', authenticate);

  // ═══════════════════════════════════════════
  //  MEMBERSHIP PLANS
  // ═══════════════════════════════════════════

  // GET /api/admin/memberships/plans — List plans
  app.get('/plans', async (request) => {
    const user = request.user as { id: number };
    return prisma.membershipPlan.findMany({
      where: { adminId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { subscriptions: { where: { status: 'active' } } }
        }
      }
    });
  });

  // POST /api/admin/memberships/plans — Create a plan
  app.post('/plans', async (request, reply) => {
    const user = request.user as { id: number };
    const { name, description, price, interval } = request.body as {
      name: string;
      description?: string;
      price: number;
      interval: 'monthly' | 'yearly';
    };

    if (!name?.trim() || !price || !interval) {
      return reply.status(400).send({ error: 'Nome, preço e intervalo são obrigatórios' });
    }

    const plan = await prisma.membershipPlan.create({
      data: {
        name: name.trim(),
        description: description?.trim() || '',
        price,
        interval,
        adminId: user.id,
      }
    });

    return reply.status(201).send(plan);
  });

  // DELETE /api/admin/memberships/plans/:id — Delete plan
  app.delete('/plans/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };

    const plan = await prisma.membershipPlan.findFirst({
      where: { id: parseInt(id), adminId: user.id }
    });

    if (!plan) {
      return reply.status(404).send({ error: 'Plano de assinatura não encontrado' });
    }

    // Set to inactive or delete
    await prisma.membershipPlan.delete({
      where: { id: plan.id }
    });

    return reply.status(204).send();
  });

  // ═══════════════════════════════════════════
  //  CLIENT SUBSCRIPTIONS
  // ═══════════════════════════════════════════

  // GET /api/admin/memberships/subscriptions — List active subscribers
  app.get('/subscriptions', async (request) => {
    const user = request.user as { id: number };
    return prisma.clientSubscription.findMany({
      where: { plan: { adminId: user.id } },
      orderBy: { createdAt: 'desc' },
      include: {
        plan: true
      }
    });
  });

  // POST /api/admin/memberships/subscriptions — Create a client subscription manually
  app.post('/subscriptions', async (request, reply) => {
    const user = request.user as { id: number };
    const { clientName, clientPhone, planId, monthsDuration } = request.body as {
      clientName: string;
      clientPhone: string;
      planId: number;
      monthsDuration?: number;
    };

    if (!clientName?.trim() || !clientPhone || !planId) {
      return reply.status(400).send({ error: 'Nome, celular e plano são obrigatórios' });
    }

    // Verify plan belongs to admin
    const plan = await prisma.membershipPlan.findFirst({
      where: { id: planId, adminId: user.id }
    });

    if (!plan) {
      return reply.status(404).send({ error: 'Plano não encontrado' });
    }

    const cleanPhone = clientPhone.replace(/\D/g, '');

    // Calculate expiration date
    const duration = monthsDuration || (plan.interval === 'yearly' ? 12 : 1);
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + duration);

    const subscription = await prisma.clientSubscription.create({
      data: {
        clientName: clientName.trim(),
        clientPhone: cleanPhone,
        status: 'active',
        expiresAt,
        planId: plan.id,
      },
      include: {
        plan: true
      }
    });

    return reply.status(201).send(subscription);
  });

  // DELETE /api/admin/memberships/subscriptions/:id — Cancel/delete subscriber
  app.delete('/subscriptions/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };

    const subscription = await prisma.clientSubscription.findFirst({
      where: {
        id: parseInt(id),
        plan: { adminId: user.id }
      }
    });

    if (!subscription) {
      return reply.status(404).send({ error: 'Assinatura não encontrada' });
    }

    await prisma.clientSubscription.delete({
      where: { id: subscription.id }
    });

    return reply.status(204).send();
  });
}

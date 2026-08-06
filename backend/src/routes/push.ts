import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { getVapidPublicKey, isPushConfigured } from '../services/pushNotification';

export default async function pushRoutes(app: FastifyInstance) {
  // GET /api/push/vapid-key — Public VAPID key for client subscription
  app.get('/vapid-key', async () => {
    const key = getVapidPublicKey();
    return { vapidPublicKey: key, configured: isPushConfigured() };
  });

  // POST /api/push/subscribe — Register push subscription for a client
  app.post('/subscribe', async (request, reply) => {
    const { token, subscription, clientPhone } = request.body as {
      token: string;
      subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
      clientPhone: string;
    };

    if (!token || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth || !clientPhone) {
      return reply.status(400).send({ error: 'Dados incompletos para registar push subscription.' });
    }

    const link = await prisma.schedulingLink.findUnique({
      where: { token },
      select: { adminId: true },
    });

    if (!link) {
      return reply.status(404).send({ error: 'Link de agendamento não encontrado.' });
    }

    const cleanPhone = clientPhone.replace(/\D/g, '');

    const existing = await prisma.pushSubscription.findFirst({
      where: { endpoint: subscription.endpoint, adminId: link.adminId },
    });

    if (existing) {
      await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          clientPhone: cleanPhone,
        },
      });
    } else {
      await prisma.pushSubscription.create({
        data: {
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          clientPhone: cleanPhone,
          adminId: link.adminId,
        },
      });
    }

    console.log(`🔔 Push subscription registada para ${cleanPhone} (admin ${link.adminId})`);
    return { success: true };
  });

  // POST /api/push/subscribe-admin — Register push subscription for gestor (admin)
  app.post('/subscribe-admin', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) return reply.status(401).send({ error: 'Não autorizado' });
      const jwtToken = authHeader.replace('Bearer ', '');
      const decoded = app.jwt.verify<{ id: number }>(jwtToken);
      const adminId = decoded.id;

      const { subscription } = request.body as {
        subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
      };

      if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
        return reply.status(400).send({ error: 'Dados de assinatura incompletos.' });
      }

      const existing = await prisma.pushSubscription.findFirst({
        where: { endpoint: subscription.endpoint, adminId },
      });

      if (existing) {
        await prisma.pushSubscription.update({
          where: { id: existing.id },
          data: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
        });
      } else {
        await prisma.pushSubscription.create({
          data: {
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            clientPhone: 'GESTOR',
            adminId,
          },
        });
      }

      return { success: true };
    } catch (err: any) {
      return reply.status(401).send({ error: 'Autenticação inválida.' });
    }
  });
}

import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authenticate, requirePermission } from '../plugins/auth';
import { createAuditLog } from '../utils/auditLogger';

export default async function orderSettingsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);
  app.addHook('preHandler', requirePermission('canPersonalizar'));

  // GET /api/order-settings — Get settings for the authenticated admin
  app.get('/', async (request) => {
    const user = request.user as { id: number };

    let settings = await prisma.orderSettings.findUnique({
      where: { adminId: user.id },
    });

    const admin = await prisma.admin.findUnique({
      where: { id: user.id },
      select: { businessName: true, description: true, bannerUrl: true, pixKey: true, phone: true },
    });

    if (!settings) {
      // Cria configurações padrão se ainda não existirem
      settings = await prisma.orderSettings.create({
        data: {
          adminId: user.id,
          enabled: true,
          storeName: admin?.businessName || 'Minha Loja de Encomendas',
          storeDescription: admin?.description || 'Produtos artesanais feitos sob encomenda.',
          bannerUrl: admin?.bannerUrl || '',
          depositPercentage: 50.0,
          allowScheduledPickup: true,
          allowDelivery: true,
          deliveryFee: 10.0,
          minAdvanceDays: 2,
          pixKey: admin?.pixKey || admin?.phone || '',
        },
      });
    } else if (admin?.pixKey && admin.pixKey.trim() !== '' && admin.pixKey.trim() !== settings.pixKey) {
      // Auto-reparo: se o profissional alterou a chave no perfil geral, sincroniza com orderSettings
      settings = await prisma.orderSettings.update({
        where: { adminId: user.id },
        data: { pixKey: admin.pixKey.trim() },
      });
    }

    return settings;
  });

  // PUT /api/order-settings — Update settings
  app.put('/', async (request, reply) => {
    const user = request.user as { id: number; role?: string; permissions?: Record<string, boolean> };
    const {
      enabled,
      storeName,
      storeDescription,
      bannerUrl,
      minOrderAmount,
      depositPercentage,
      allowScheduledPickup,
      allowDelivery,
      deliveryFee,
      minAdvanceDays,
      whatsappNotifications,
      pixKey,
    } = request.body as {
      enabled?: boolean;
      storeName?: string;
      storeDescription?: string;
      bannerUrl?: string;
      minOrderAmount?: number;
      depositPercentage?: number;
      allowScheduledPickup?: boolean;
      allowDelivery?: boolean;
      deliveryFee?: number;
      minAdvanceDays?: number;
      whatsappNotifications?: boolean;
      pixKey?: string;
    };

    // Bloqueia alteração de chave Pix por operadores sem permissão financeira
    if (pixKey !== undefined && user.role === 'operator' && !user.permissions?.canFinanceiro) {
      return reply.status(403).send({ error: 'Apenas administradores ou operadores com permissão financeira podem alterar a Chave Pix da loja.' });
    }

    const updated = await prisma.orderSettings.upsert({
      where: { adminId: user.id },
      create: {
        adminId: user.id,
        enabled: enabled !== undefined ? enabled : true,
        storeName: storeName?.trim() || '',
        storeDescription: storeDescription?.trim() || '',
        bannerUrl: bannerUrl || '',
        minOrderAmount: minOrderAmount !== undefined ? Number(minOrderAmount) : 0,
        depositPercentage: depositPercentage !== undefined ? Number(depositPercentage) : 50,
        allowScheduledPickup: allowScheduledPickup !== undefined ? allowScheduledPickup : true,
        allowDelivery: allowDelivery !== undefined ? allowDelivery : true,
        deliveryFee: deliveryFee !== undefined ? Number(deliveryFee) : 0,
        minAdvanceDays: minAdvanceDays !== undefined ? Number(minAdvanceDays) : 2,
        whatsappNotifications: whatsappNotifications !== undefined ? whatsappNotifications : true,
        pixKey: pixKey?.trim() || '',
      },
      update: {
        ...(enabled !== undefined && { enabled }),
        ...(storeName !== undefined && { storeName: storeName.trim() }),
        ...(storeDescription !== undefined && { storeDescription: storeDescription.trim() }),
        ...(bannerUrl !== undefined && { bannerUrl }),
        ...(minOrderAmount !== undefined && { minOrderAmount: Number(minOrderAmount) }),
        ...(depositPercentage !== undefined && { depositPercentage: Number(depositPercentage) }),
        ...(allowScheduledPickup !== undefined && { allowScheduledPickup }),
        ...(allowDelivery !== undefined && { allowDelivery }),
        ...(deliveryFee !== undefined && { deliveryFee: Number(deliveryFee) }),
        ...(minAdvanceDays !== undefined && { minAdvanceDays: Number(minAdvanceDays) }),
        ...(whatsappNotifications !== undefined && { whatsappNotifications }),
        ...(pixKey !== undefined && { pixKey: pixKey.trim() }),
      },
    });

    // Sincroniza a chave Pix com o perfil do profissional (Admin.pixKey)
    if (pixKey !== undefined && pixKey.trim() !== '') {
      await prisma.admin.update({
        where: { id: user.id },
        data: { pixKey: pixKey.trim() },
      }).catch((err) => console.error('Erro ao sincronizar admin.pixKey:', err));
    }

    await createAuditLog(request, {
      action: 'UPDATE_ORDER_SETTINGS',
      entity: 'ORDER_SETTINGS',
      entityId: updated.id,
      details: 'Atualizou as configurações da loja BoraEnkomenda',
      adminId: user.id,
    });

    return updated;
  });
}

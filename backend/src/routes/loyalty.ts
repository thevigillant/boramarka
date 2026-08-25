import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import crypto from 'crypto';
import { authenticate, requirePermission } from '../plugins/auth';
import { updateLoyaltyConfigSchema, loyaltyStampActionSchema } from '../utils/validators';

/**
 * Generate a unique coupon code for loyalty rewards
 */
function generateLoyaltyCouponCode(): string {
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `FIDELIDADE-${randomSuffix}`;
}

/**
 * Process automatic loyalty stamp addition when a booking is completed
 */
export async function addLoyaltyStampOnCompletion(adminId: number, clientPhone: string, clientName: string) {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        loyaltyEnabled: true,
        loyaltyTarget: true,
        loyaltyRewardType: true,
        loyaltyRewardValue: true,
      },
    });

    if (!admin || !admin.loyaltyEnabled || !clientPhone) return;

    let card = await prisma.loyaltyCard.findUnique({
      where: {
        adminId_clientPhone: {
          adminId,
          clientPhone,
        },
      },
    });

    if (!card) {
      card = await prisma.loyaltyCard.create({
        data: {
          adminId,
          clientPhone,
          clientName: clientName || 'Cliente',
          stampsCount: 1,
        },
      });
    } else {
      const newStamps = card.stampsCount + 1;
      let newRewards = card.rewardsEarned;
      let newCouponCode = card.rewardCouponCode;

      // Check if target reached
      if (newStamps >= admin.loyaltyTarget) {
        newRewards += 1;
        newCouponCode = generateLoyaltyCouponCode();
      }

      await prisma.loyaltyCard.update({
        where: { id: card.id },
        data: {
          stampsCount: newStamps >= admin.loyaltyTarget ? 0 : newStamps,
          rewardsEarned: newRewards,
          rewardCouponCode: newCouponCode,
          clientName: clientName || card.clientName,
        },
      });
    }
  } catch (err) {
    console.error('[LOYALTY] Erro ao processar selo de fidelidade:', err);
  }
}

export default async function loyaltyRoutes(app: FastifyInstance) {
  // 🔒 Admin: Get Loyalty Program Config
  app.get('/config', { preHandler: [authenticate, requirePermission('canCupons')] }, async (request, reply) => {
    const user = request.user as { id: number };

    const admin = await prisma.admin.findUnique({
      where: { id: user.id },
      select: {
        loyaltyEnabled: true,
        loyaltyTarget: true,
        loyaltyRewardType: true,
        loyaltyRewardValue: true,
      },
    });

    if (!admin) return reply.status(404).send({ error: 'Administrador não encontrado' });

    return reply.send(admin);
  });

  // 🔒 Admin: Update Loyalty Program Config
  app.put('/config', { preHandler: [authenticate, requirePermission('canCupons')] }, async (request, reply) => {
    const user = request.user as { id: number };
    const parsed = updateLoyaltyConfigSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message });
    }
    const { loyaltyEnabled, loyaltyTarget, loyaltyRewardType, loyaltyRewardValue } = parsed.data;

    const updated = await prisma.admin.update({
      where: { id: user.id },
      data: {
        loyaltyEnabled: typeof loyaltyEnabled === 'boolean' ? loyaltyEnabled : undefined,
        loyaltyTarget: typeof loyaltyTarget === 'number' && loyaltyTarget > 0 ? loyaltyTarget : undefined,
        loyaltyRewardType: loyaltyRewardType ? String(loyaltyRewardType) : undefined,
        loyaltyRewardValue: typeof loyaltyRewardValue === 'number' ? loyaltyRewardValue : undefined,
      },
      select: {
        loyaltyEnabled: true,
        loyaltyTarget: true,
        loyaltyRewardType: true,
        loyaltyRewardValue: true,
      },
    });

    return reply.send(updated);
  });

  // 🔒 Admin: Get all Client Loyalty Cards
  app.get('/cards', { preHandler: [authenticate, requirePermission('canCupons')] }, async (request, reply) => {
    const user = request.user as { id: number };

    const cards = await prisma.loyaltyCard.findMany({
      where: { adminId: user.id },
      orderBy: { updatedAt: 'desc' },
    });

    return reply.send(cards);
  });

  // 🔒 Admin: Manual Stamp Increment/Adjustment
  app.post('/stamp', { preHandler: [authenticate, requirePermission('canCupons')] }, async (request, reply) => {
    const user = request.user as { id: number };
    const parsed = loyaltyStampActionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message });
    }
    const { clientPhone, clientName, action } = parsed.data;
    const cleanPhone = clientPhone.replace(/\D/g, '');

    let card = await prisma.loyaltyCard.findUnique({
      where: {
        adminId_clientPhone: {
          adminId: user.id,
          clientPhone: cleanPhone,
        },
      },
    });

    const admin = await prisma.admin.findUnique({
      where: { id: user.id },
      select: { loyaltyTarget: true },
    });

    const target = admin?.loyaltyTarget || 10;

    if (!card) {
      card = await prisma.loyaltyCard.create({
        data: {
          adminId: user.id,
          clientPhone: cleanPhone,
          clientName: clientName || 'Cliente',
          stampsCount: action === 'add' ? 1 : 0,
        },
      });
    } else {
      let newCount = card.stampsCount;
      if (action === 'add') newCount += 1;
      if (action === 'remove') newCount = Math.max(0, newCount - 1);
      if (action === 'reset') newCount = 0;

      let newRewards = card.rewardsEarned;
      let newCoupon = card.rewardCouponCode;

      if (newCount >= target) {
        newRewards += 1;
        newCoupon = generateLoyaltyCouponCode();
        newCount = 0; // reset after full card
      }

      card = await prisma.loyaltyCard.update({
        where: { id: card.id },
        data: {
          stampsCount: newCount,
          rewardsEarned: newRewards,
          rewardCouponCode: newCoupon,
          clientName: clientName || card.clientName,
        },
      });
    }

    return reply.send({ success: true, card });
  });

  // 🌐 Public: Check Loyalty Status by Phone (for client booking page & profile)
  app.get('/public/:username/:clientPhone', async (request, reply) => {
    const { username, clientPhone } = request.params as { username: string; clientPhone: string };
    const cleanPhone = clientPhone.replace(/\D/g, '');

    const admin = await prisma.admin.findFirst({
      where: {
        OR: [{ username }, { customDomain: username }],
      },
      select: {
        id: true,
        loyaltyEnabled: true,
        loyaltyTarget: true,
        loyaltyRewardType: true,
        loyaltyRewardValue: true,
      },
    });

    if (!admin || !admin.loyaltyEnabled) {
      return reply.send({ enabled: false });
    }

    const card = await prisma.loyaltyCard.findUnique({
      where: {
        adminId_clientPhone: {
          adminId: admin.id,
          clientPhone: cleanPhone,
        },
      },
    });

    return reply.send({
      enabled: true,
      target: admin.loyaltyTarget,
      rewardType: admin.loyaltyRewardType,
      rewardValue: admin.loyaltyRewardValue,
      stampsCount: card ? card.stampsCount : 0,
      rewardsEarned: card ? card.rewardsEarned : 0,
      rewardCouponCode: card ? card.rewardCouponCode : '',
    });
  });
}

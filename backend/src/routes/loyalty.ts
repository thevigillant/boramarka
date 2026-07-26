import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import crypto from 'crypto';

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

        // Create coupon in Coupon table so client can apply it during booking
        try {
          await prisma.coupon.create({
            data: {
              adminId,
              code: newCouponCode,
              discountType: admin.loyaltyRewardType,
              discountValue: admin.loyaltyRewardValue,
              active: true,
            },
          });
        } catch (err: any) {
          console.error('Erro ao gerar cupom de fidelidade:', err.message);
        }

        // Reset stamps after reward or set remaining
        await prisma.loyaltyCard.update({
          where: { id: card.id },
          data: {
            stampsCount: 0,
            rewardsEarned: newRewards,
            rewardCouponCode: newCouponCode,
            clientName: clientName || card.clientName,
          },
        });
        console.log(`🎁 Recompensa de Fidelidade gerada para ${clientName} (${clientPhone}): Cupom ${newCouponCode}`);
        return;
      } else {
        await prisma.loyaltyCard.update({
          where: { id: card.id },
          data: {
            stampsCount: newStamps,
            clientName: clientName || card.clientName,
          },
        });
      }
    }
  } catch (error: any) {
    console.error('Erro ao processar selo de fidelidade:', error.message);
  }
}

export default async function loyaltyRoutes(app: FastifyInstance) {
  // 🔒 Admin: Get Loyalty Program Config
  app.get('/config', async (request, reply) => {
    try {
      await request.jwtVerify();
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
    } catch (error: any) {
      return reply.status(401).send({ error: 'Não autorizado' });
    }
  });

  // 🔒 Admin: Update Loyalty Program Config
  app.put('/config', async (request, reply) => {
    try {
      await request.jwtVerify();
      const user = request.user as { id: number };
      const { loyaltyEnabled, loyaltyTarget, loyaltyRewardType, loyaltyRewardValue } = request.body as any;

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
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // 🔒 Admin: Get all Client Loyalty Cards
  app.get('/cards', async (request, reply) => {
    try {
      await request.jwtVerify();
      const user = request.user as { id: number };

      const cards = await prisma.loyaltyCard.findMany({
        where: { adminId: user.id },
        orderBy: { updatedAt: 'desc' },
      });

      return reply.send(cards);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // 🔒 Admin: Manual Stamp Increment/Adjustment
  app.post('/stamp', async (request, reply) => {
    try {
      await request.jwtVerify();
      const user = request.user as { id: number };
      const { clientPhone, clientName, action } = request.body as { clientPhone: string; clientName?: string; action: 'add' | 'remove' | 'reset' };

      if (!clientPhone) {
        return reply.status(400).send({ error: 'Telefone do cliente é obrigatório' });
      }

      let card = await prisma.loyaltyCard.findUnique({
        where: {
          adminId_clientPhone: {
            adminId: user.id,
            clientPhone,
          },
        },
      });

      if (!card && action === 'add') {
        await addLoyaltyStampOnCompletion(user.id, clientPhone, clientName || 'Cliente');
        return reply.send({ success: true, message: 'Selo adicionado' });
      }

      if (!card) {
        return reply.status(404).send({ error: 'Cartão de fidelidade não encontrado para este cliente' });
      }

      if (action === 'add') {
        await addLoyaltyStampOnCompletion(user.id, clientPhone, clientName || card.clientName);
      } else if (action === 'remove') {
        const newStamps = Math.max(0, card.stampsCount - 1);
        await prisma.loyaltyCard.update({
          where: { id: card.id },
          data: { stampsCount: newStamps },
        });
      } else if (action === 'reset') {
        await prisma.loyaltyCard.update({
          where: { id: card.id },
          data: { stampsCount: 0 },
        });
      }

      return reply.send({ success: true, message: 'Cartão de fidelidade atualizado' });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // 🌐 Public: Check Loyalty Status by Phone (for client booking page & profile)
  app.get('/public/:username/:clientPhone', async (request, reply) => {
    try {
      const { username, clientPhone } = request.params as { username: string; clientPhone: string };

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
            clientPhone,
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
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
}

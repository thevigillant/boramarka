import { prisma } from '../db';

export async function checkAndUpdateSubscription(adminId: number) {
  let subscription = await prisma.subscription.findUnique({
    where: { adminId }
  });

  if (!subscription) {
    // If user has no subscription record, create a 7-day trial subscription
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    subscription = await prisma.subscription.create({
      data: {
        adminId,
        status: 'trialing',
        plan: 'mensal',
        trialEndsAt,
      }
    });
  }

  // Auto-expire trials
  if (subscription.status === 'trialing' && subscription.trialEndsAt && new Date() > subscription.trialEndsAt) {
    subscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'inactive' }
    });
  }

  // Auto-expire active subscriptions
  if (subscription.status === 'active' && subscription.expiresAt && new Date() > subscription.expiresAt) {
    subscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'inactive' }
    });
  }

  return subscription;
}

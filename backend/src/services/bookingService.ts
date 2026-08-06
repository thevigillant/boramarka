import { prisma } from '../db';

export async function cleanupExpiredBookings(token: string) {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const expiredBookings = await prisma.booking.findMany({
    where: {
      status: 'AGUARDANDO_PAGAMENTO',
      createdAt: { lt: fifteenMinutesAgo },
      timeSlot: { link: { token } }
    },
    select: { id: true, timeSlotId: true }
  });

  if (expiredBookings.length > 0) {
    const expiredBookingIds = expiredBookings.map(b => b.id);
    const expiredSlotIds = expiredBookings.map(b => b.timeSlotId);
    await prisma.$transaction([
      prisma.booking.deleteMany({ where: { id: { in: expiredBookingIds } } }),
      prisma.timeSlot.updateMany({
        where: { id: { in: expiredSlotIds } },
        data: { isAvailable: true }
      })
    ]);
    console.log(`[JIT CLEANUP] Liberou ${expiredBookings.length} slots expirados para o link ${token}`);
  }
}

export function generateCancellationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'BM-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

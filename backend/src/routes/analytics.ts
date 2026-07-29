import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authenticate } from '../plugins/auth';

export default async function analyticsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  // ═══════════════════════════════════════════
  //  GET /api/admin/analytics — Dashboard analytics data
  // ═══════════════════════════════════════════
  app.get('/', async (request) => {
    const user = request.user as { id: number };
    const adminId = user.id;

    const now = new Date();

    // ── Revenue by Month (last 6 months) ──
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const allBookings = await prisma.booking.findMany({
      where: {
        timeSlot: { link: { adminId } },
        createdAt: { gte: sixMonthsAgo },
        status: { not: 'CANCELADO' },
      },
      select: {
        paidAmount: true,
        totalAmount: true,
        createdAt: true,
      },
    });

    // Build revenue by month map
    const revenueMap: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      revenueMap[key] = 0;
    }

    allBookings.forEach((b) => {
      const key = `${b.createdAt.getFullYear()}-${String(b.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (revenueMap[key] !== undefined) {
        revenueMap[key] += b.totalAmount || b.paidAmount || 0;
      }
    });

    const revenueByMonth = Object.entries(revenueMap).map(([month, total]) => ({
      month,
      total: Math.round(total * 100) / 100,
    }));

    // ── Bookings by Weekday ──
    const bookingsWithDate = await prisma.booking.findMany({
      where: {
        timeSlot: { link: { adminId } },
        status: { not: 'CANCELADO' },
      },
      select: {
        timeSlot: { select: { date: true } },
      },
    });

    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun=0 ... Sat=6
    bookingsWithDate.forEach((b) => {
      if (b.timeSlot?.date) {
        const [y, m, d] = b.timeSlot.date.split('-').map(Number);
        const dayOfWeek = new Date(y, m - 1, d).getDay();
        weekdayCounts[dayOfWeek]++;
      }
    });

    const bookingsByWeekday = weekdayCounts.map((count, day) => ({ day, count }));

    // ── Top Services ──
    const bookingsWithService = await prisma.booking.findMany({
      where: {
        timeSlot: { link: { adminId } },
        status: { not: 'CANCELADO' },
      },
      select: {
        totalAmount: true,
        paidAmount: true,
        timeSlot: {
          select: {
            link: {
              select: {
                service: {
                  select: { name: true, price: true },
                },
              },
            },
          },
        },
      },
    });

    const serviceMap: Record<string, { count: number; revenue: number }> = {};
    bookingsWithService.forEach((b) => {
      const serviceName = b.timeSlot?.link?.service?.name || 'Sem serviço';
      if (!serviceMap[serviceName]) {
        serviceMap[serviceName] = { count: 0, revenue: 0 };
      }
      serviceMap[serviceName].count++;
      serviceMap[serviceName].revenue += b.totalAmount || b.paidAmount || 0;
    });

    const topServices = Object.entries(serviceMap)
      .map(([name, data]) => ({
        name,
        count: data.count,
        revenue: Math.round(data.revenue * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // ── Status Distribution ──
    const allStatuses = await prisma.booking.findMany({
      where: {
        timeSlot: { link: { adminId } },
      },
      select: { status: true },
    });

    const statusDistribution: Record<string, number> = {};
    allStatuses.forEach((b) => {
      statusDistribution[b.status] = (statusDistribution[b.status] || 0) + 1;
    });

    // ── Revenue comparison (this month vs last month) ──
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    let revenueThisMonth = 0;
    let revenueLastMonth = 0;
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

    revenueThisMonth = revenueMap[thisMonthKey] || 0;
    revenueLastMonth = revenueMap[lastMonthKey] || 0;

    const revenueTrend = revenueLastMonth > 0
      ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
      : revenueThisMonth > 0 ? 100 : 0;

    return {
      revenueByMonth,
      bookingsByWeekday,
      topServices,
      statusDistribution,
      trends: {
        revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
        revenueLastMonth: Math.round(revenueLastMonth * 100) / 100,
        revenueChangePercent: revenueTrend,
      },
    };
  });
}

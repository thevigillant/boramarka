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
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Month map initialization for the last 6 months
    const revenueMap: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      revenueMap[key] = 0;
    }

    // 1. Fetch Paid Transactions (Receivables that are marked paid)
    const paidTransactions = await prisma.transaction.findMany({
      where: {
        adminId,
        type: 'receivable',
        paid: true,
      },
      select: {
        amount: true,
        paid: true,
        paidAt: true,
        dueDate: true,
        createdAt: true,
        notes: true,
        category: true,
        description: true,
        clientName: true,
      },
    });

    paidTransactions.forEach((t) => {
      let txDate: Date = t.createdAt;
      if (t.paidAt) {
        const parsed = new Date(t.paidAt.includes('T') ? t.paidAt : `${t.paidAt}T12:00:00Z`);
        if (!isNaN(parsed.getTime())) txDate = parsed;
      } else if (t.dueDate) {
        const parsed = new Date(t.dueDate.includes('T') ? t.dueDate : `${t.dueDate}T12:00:00Z`);
        if (!isNaN(parsed.getTime())) txDate = parsed;
      }

      if (txDate >= sixMonthsAgo) {
        const key = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
        if (revenueMap[key] !== undefined) {
          revenueMap[key] += t.amount || 0;
        }
      }
    });

    // 2. Fetch Bookings (Ensure bookings not logged in transactions are counted)
    const allBookings = await prisma.booking.findMany({
      where: {
        timeSlot: { link: { adminId } },
        createdAt: { gte: sixMonthsAgo },
        status: { not: 'CANCELADO' },
      },
      select: {
        id: true,
        paidAmount: true,
        totalAmount: true,
        createdAt: true,
        status: true,
        clientName: true,
        timeSlot: {
          select: {
            date: true,
            link: {
              select: {
                service: { select: { name: true, price: true } },
              },
            },
          },
        },
      },
    });

    allBookings.forEach((b) => {
      const alreadyInTx = paidTransactions.some((t) =>
        t.notes?.includes(`Booking #${b.id}`) ||
        (t.clientName === b.clientName && t.category === 'Restante de Agendamento')
      );

      if (!alreadyInTx) {
        const amount = (b.status === 'PAGO' || b.status === 'CONFIRMADO')
          ? (b.totalAmount || b.paidAmount || 0)
          : (b.paidAmount || 0);

        if (amount > 0) {
          const key = `${b.createdAt.getFullYear()}-${String(b.createdAt.getMonth() + 1).padStart(2, '0')}`;
          if (revenueMap[key] !== undefined) {
            revenueMap[key] += amount;
          }
        }
      }
    });

    // 3. Fetch Orders (BoraEnkomenda)
    const allOrders = await prisma.order.findMany({
      where: {
        adminId,
        createdAt: { gte: sixMonthsAgo },
        status: { not: 'CANCELADO' },
      },
      include: {
        items: true,
      },
    });

    allOrders.forEach((ord) => {
      const alreadyInTx = paidTransactions.some((t) =>
        t.notes?.includes(ord.orderNumber)
      );

      if (!alreadyInTx) {
        let orderRevenue = 0;
        if (ord.status === 'ENTREGUE' || ord.status === 'PRONTO' || ord.status === 'CONFIRMADO') {
          orderRevenue = ord.total;
        } else if (ord.depositPaid) {
          orderRevenue = ord.depositAmount;
        }

        if (orderRevenue > 0) {
          const key = `${ord.createdAt.getFullYear()}-${String(ord.createdAt.getMonth() + 1).padStart(2, '0')}`;
          if (revenueMap[key] !== undefined) {
            revenueMap[key] += orderRevenue;
          }
        }
      }
    });

    const revenueByMonth = Object.entries(revenueMap).map(([month, total]) => ({
      month,
      total: Math.round(total * 100) / 100,
    }));

    // ── Movement by Weekday (Bookings + Orders + Transactions) ──
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun=0 ... Sat=6

    allBookings.forEach((b) => {
      if (b.timeSlot?.date) {
        const parts = b.timeSlot.date.split('-').map(Number);
        if (parts.length === 3) {
          const dayOfWeek = new Date(parts[0], parts[1] - 1, parts[2]).getDay();
          if (!isNaN(dayOfWeek)) weekdayCounts[dayOfWeek]++;
        }
      } else {
        weekdayCounts[b.createdAt.getDay()]++;
      }
    });

    allOrders.forEach((ord) => {
      if (ord.deliveryDate) {
        const parts = ord.deliveryDate.split('-').map(Number);
        if (parts.length === 3) {
          const dayOfWeek = new Date(parts[0], parts[1] - 1, parts[2]).getDay();
          if (!isNaN(dayOfWeek)) weekdayCounts[dayOfWeek]++;
        }
      } else {
        weekdayCounts[ord.createdAt.getDay()]++;
      }
    });

    if (allBookings.length === 0 && allOrders.length === 0) {
      paidTransactions.forEach((t) => {
        let d = t.createdAt;
        if (t.dueDate) {
          const parts = t.dueDate.split('-').map(Number);
          if (parts.length === 3) {
            const parsed = new Date(parts[0], parts[1] - 1, parts[2]);
            if (!isNaN(parsed.getTime())) d = parsed;
          }
        }
        weekdayCounts[d.getDay()]++;
      });
    }

    const bookingsByWeekday = weekdayCounts.map((count, day) => ({ day, count }));

    // ── Top Services & Products ──
    const itemMap: Record<string, { count: number; revenue: number }> = {};

    allBookings.forEach((b) => {
      const serviceName = b.timeSlot?.link?.service?.name || 'Atendimento Geral';
      if (!itemMap[serviceName]) {
        itemMap[serviceName] = { count: 0, revenue: 0 };
      }
      itemMap[serviceName].count++;
      itemMap[serviceName].revenue += b.totalAmount || b.paidAmount || 0;
    });

    allOrders.forEach((ord) => {
      if (ord.items && ord.items.length > 0) {
        ord.items.forEach((item) => {
          const prodName = item.productName || 'Produto';
          if (!itemMap[prodName]) {
            itemMap[prodName] = { count: 0, revenue: 0 };
          }
          itemMap[prodName].count += Math.round(item.quantity) || 1;
          itemMap[prodName].revenue += item.subtotal || (item.unitPrice * item.quantity) || 0;
        });
      } else {
        const orderLabel = `Pedido ${ord.orderNumber}`;
        if (!itemMap[orderLabel]) {
          itemMap[orderLabel] = { count: 0, revenue: 0 };
        }
        itemMap[orderLabel].count++;
        itemMap[orderLabel].revenue += ord.total;
      }
    });

    if (Object.keys(itemMap).length === 0) {
      paidTransactions.forEach((t) => {
        const catName = t.category || t.description || 'Receita Financeira';
        if (!itemMap[catName]) {
          itemMap[catName] = { count: 0, revenue: 0 };
        }
        itemMap[catName].count++;
        itemMap[catName].revenue += t.amount;
      });
    }

    const topServices = Object.entries(itemMap)
      .map(([name, data]) => ({
        name,
        count: data.count,
        revenue: Math.round(data.revenue * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // ── Status Distribution ──
    const statusDistribution: Record<string, number> = {};

    allBookings.forEach((b) => {
      let st = b.status;
      if (st === 'PAGO') st = 'CONFIRMADO';
      statusDistribution[st] = (statusDistribution[st] || 0) + 1;
    });

    allOrders.forEach((ord) => {
      let mappedStatus = 'PENDENTE';
      if (ord.status === 'CONFIRMADO' || ord.status === 'EM_PRODUCAO') {
        mappedStatus = 'CONFIRMADO';
      } else if (ord.status === 'PRONTO' || ord.status === 'ENTREGUE') {
        mappedStatus = 'CONCLUIDO';
      } else if (ord.status === 'CANCELADO') {
        mappedStatus = 'CANCELADO';
      }
      statusDistribution[mappedStatus] = (statusDistribution[mappedStatus] || 0) + 1;
    });

    if (Object.keys(statusDistribution).length === 0) {
      paidTransactions.forEach((t) => {
        const st = t.paid ? 'CONCLUIDO' : 'PENDENTE';
        statusDistribution[st] = (statusDistribution[st] || 0) + 1;
      });
    }

    // ── Revenue comparison (this month vs last month) ──
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

    const revenueThisMonth = revenueMap[thisMonthKey] || 0;
    const revenueLastMonth = revenueMap[lastMonthKey] || 0;

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

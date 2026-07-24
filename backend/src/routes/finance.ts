import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authenticate } from '../plugins/auth';

export default async function financeRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  // ═══════════════════════════════════════════
  //  STATS
  // ═══════════════════════════════════════════
  app.get('/stats', async (request) => {
    const user = request.user as { id: number };
    const transactions = await prisma.transaction.findMany({
      where: { adminId: user.id }
    });

    const totalReceivable = transactions
      .filter(t => t.type === 'receivable')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPayable = transactions
      .filter(t => t.type === 'payable')
      .reduce((sum, t) => sum + t.amount, 0);

    const receivedAmount = transactions
      .filter(t => t.type === 'receivable' && t.paid)
      .reduce((sum, t) => sum + t.amount, 0);

    const paidAmount = transactions
      .filter(t => t.type === 'payable' && t.paid)
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingReceivable = totalReceivable - receivedAmount;
    const pendingPayable = totalPayable - paidAmount;

    return {
      totalReceivable,
      totalPayable,
      receivedAmount,
      paidAmount,
      pendingReceivable,
      pendingPayable,
      balance: receivedAmount - paidAmount,
    };
  });

  // ═══════════════════════════════════════════
  //  REVENUE REPORT BY SERVICE & PERIOD (Etapa 3-F)
  // ═══════════════════════════════════════════
  app.get('/revenue-report', async (request) => {
    const user = request.user as { id: number };
    const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };

    const whereSlot: any = {
      link: { adminId: user.id }
    };

    if (startDate || endDate) {
      whereSlot.date = {};
      if (startDate) whereSlot.date.gte = startDate;
      if (endDate) whereSlot.date.lte = endDate;
    }

    const bookings = await prisma.booking.findMany({
      where: {
        timeSlot: whereSlot
      },
      include: {
        timeSlot: {
          include: {
            link: {
              include: {
                service: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    let overallTotalRevenue = 0;
    let overallPendingRevenue = 0;
    let overallCompletedBookings = 0;

    const serviceMap = new Map<string, {
      serviceId: number | null;
      serviceName: string;
      totalBookings: number;
      completedBookings: number;
      totalRevenue: number;
      pendingRevenue: number;
    }>();

    bookings.forEach(b => {
      const serviceName = b.timeSlot?.link?.service?.name || b.timeSlot?.link?.title || 'Serviço Personalizado';
      const serviceId = b.timeSlot?.link?.service?.id || null;
      const price = b.totalAmount || b.timeSlot?.link?.service?.price || 0;
      const isCompleted = b.status === 'CONCLUIDO' || b.status === 'CONFIRMADO';
      const isCancelled = b.status === 'cancelled' || b.status === 'CANCELADO';

      if (isCancelled) return;

      if (!serviceMap.has(serviceName)) {
        serviceMap.set(serviceName, {
          serviceId,
          serviceName,
          totalBookings: 0,
          completedBookings: 0,
          totalRevenue: 0,
          pendingRevenue: 0
        });
      }

      const item = serviceMap.get(serviceName)!;
      item.totalBookings += 1;

      if (isCompleted) {
        item.completedBookings += 1;
        item.totalRevenue += price;
        overallTotalRevenue += price;
        overallCompletedBookings += 1;
      } else {
        item.pendingRevenue += price;
        overallPendingRevenue += price;
      }
    });

    const byService = Array.from(serviceMap.values()).map(s => {
      const avgTicket = s.completedBookings > 0 ? s.totalRevenue / s.completedBookings : 0;
      const percentage = overallTotalRevenue > 0 ? (s.totalRevenue / overallTotalRevenue) * 100 : 0;
      return {
        ...s,
        avgTicket: Number(avgTicket.toFixed(2)),
        percentageOfTotal: Number(percentage.toFixed(1))
      };
    });

    // Sort by revenue descending
    byService.sort((a, b) => b.totalRevenue - a.totalRevenue);

    const overallAvgTicket = overallCompletedBookings > 0 ? overallTotalRevenue / overallCompletedBookings : 0;

    return {
      period: {
        startDate: startDate || null,
        endDate: endDate || null
      },
      summary: {
        totalRevenue: overallTotalRevenue,
        pendingRevenue: overallPendingRevenue,
        totalCompletedBookings: overallCompletedBookings,
        averageTicket: Number(overallAvgTicket.toFixed(2))
      },
      byService
    };
  });

  // ═══════════════════════════════════════════
  //  LIST TRANSACTIONS
  // ═══════════════════════════════════════════
  app.get('/transactions', async (request) => {
    const user = request.user as { id: number };
    const { type, paid } = request.query as { type?: string; paid?: string };

    const where: any = { adminId: user.id };
    if (type) where.type = type;
    if (paid !== undefined) where.paid = paid === 'true';

    return prisma.transaction.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });
  });

  // ═══════════════════════════════════════════
  //  CREATE TRANSACTION
  // ═══════════════════════════════════════════
  app.post('/transactions', async (request, reply) => {
    const user = request.user as { id: number };
    const { type, description, amount, dueDate, clientName, category, notes, paid } =
      request.body as {
        type: string;
        description: string;
        amount: number;
        dueDate: string;
        clientName?: string;
        category?: string;
        notes?: string;
        paid?: boolean;
      };

    if (!type || !description?.trim() || !amount || !dueDate) {
      return reply.status(400).send({ error: 'Tipo, descrição, valor e data são obrigatórios' });
    }

    if (!['receivable', 'payable'].includes(type)) {
      return reply.status(400).send({ error: 'Tipo deve ser "receivable" ou "payable"' });
    }

    const transaction = await prisma.transaction.create({
      data: {
        type,
        description: description.trim(),
        amount,
        dueDate,
        paid: !!paid,
        paidAt: paid ? new Date().toISOString().split('T')[0] : null,
        clientName: clientName?.trim() || '',
        category: category?.trim() || '',
        notes: notes?.trim() || '',
        adminId: user.id,
      },
    });

    return reply.status(201).send(transaction);
  });

  // ═══════════════════════════════════════════
  //  TOGGLE PAID STATUS
  // ═══════════════════════════════════════════
  app.put('/transactions/:id/toggle', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };

    const transaction = await prisma.transaction.findFirst({
      where: { id: parseInt(id), adminId: user.id },
    });

    if (!transaction) {
      return reply.status(404).send({ error: 'Transação não encontrada' });
    }

    const updated = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: {
        paid: !transaction.paid,
        paidAt: !transaction.paid ? new Date().toISOString().split('T')[0] : null,
      },
    });

    return updated;
  });

  // ═══════════════════════════════════════════
  //  DELETE TRANSACTION
  // ═══════════════════════════════════════════
  app.delete('/transactions/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };

    try {
      await prisma.transaction.delete({ 
        where: { id: parseInt(id), adminId: user.id } 
      });
      return reply.status(204).send();
    } catch {
      return reply.status(404).send({ error: 'Transação não encontrada' });
    }
  });
}

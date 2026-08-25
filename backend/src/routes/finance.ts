import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authenticate, requirePermission } from '../plugins/auth';
import { createTransactionSchema } from '../utils/validators';

export default async function financeRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);
  app.addHook('preHandler', requirePermission('canFinanceiro'));

  // ═══════════════════════════════════════════
  //  STATS
  // ═══════════════════════════════════════════
  app.get('/stats', async (request) => {
    const user = request.user as { id: number };

    // Auto-reconcile remaining balance for active bookings where deposit/sinal was paid
    const activeBookings = await prisma.booking.findMany({
      where: {
        timeSlot: { link: { adminId: user.id } },
        status: { in: ['PAGO', 'CONFIRMADO'] }
      },
      include: {
        timeSlot: {
          include: {
            link: { include: { service: true } }
          }
        }
      }
    });

    const existingTransactions = await prisma.transaction.findMany({
      where: { adminId: user.id }
    });

    for (const b of activeBookings) {
      const servicePrice = b.timeSlot.link.service?.price || 0;
      const fullPrice = b.totalAmount > 0 ? b.totalAmount : servicePrice;
      const paid = b.paidAmount || 0;
      const remaining = Math.max(0, fullPrice - paid);

      if (remaining > 0) {
        const hasPendingTx = existingTransactions.some(t =>
          t.clientName === b.clientName &&
          t.type === 'receivable' &&
          !t.paid &&
          t.amount === remaining
        );

        if (!hasPendingTx) {
          await prisma.transaction.create({
            data: {
              type: 'receivable',
              description: `Restante a receber no atendimento - ${b.clientName}`,
              amount: remaining,
              dueDate: b.timeSlot.date,
              paid: false,
              clientName: b.clientName,
              category: 'Restante de Agendamento',
              notes: `Valor restante a ser pago no dia do atendimento (${b.timeSlot.date})`,
              adminId: user.id
            }
          });
        }
      }
    }

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
    const parsed = createTransactionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message });
    }
    const { type, description, amount, dueDate, clientName, category, notes, paid } = parsed.data;

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
      where: { id: parseInt(id), adminId: user.id },
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

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

    // Auto-reconcile active & completed orders from BoraEnkomenda
    const activeOrders = await prisma.order.findMany({
      where: {
        adminId: user.id,
        status: { in: ['NOVO', 'CONFIRMADO', 'EM_PRODUCAO', 'PRONTO', 'ENTREGUE'] }
      }
    });

    const existingTransactions = await prisma.transaction.findMany({
      where: { adminId: user.id }
    });

    // 1. Reconciliação de Agendamentos
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
              notes: `Valor restante a ser pago no dia do atendimento (${b.timeSlot.date}) [Booking #${b.id}]`,
              adminId: user.id
            }
          });
        }
      }
    }

    // 2. Reconciliação de Encomendas (BoraEnkomenda)
    for (const ord of activeOrders) {
      const isDelivered = ord.status === 'ENTREGUE';

      if (isDelivered) {
        // Pedido entregue: garante que o valor total esteja contabilizado como pago
        const hasPaidTx = existingTransactions.some(t =>
          t.type === 'receivable' &&
          t.paid &&
          (t.notes.includes(ord.orderNumber) || (t.clientName === ord.clientName && Math.abs(t.amount - ord.total) < 0.01))
        );

        if (!hasPaidTx) {
          await prisma.transaction.create({
            data: {
              type: 'receivable',
              description: `Encomenda Concluída ${ord.orderNumber} - ${ord.clientName}`,
              amount: ord.total,
              dueDate: ord.deliveryDate,
              paid: true,
              paidAt: ord.deliveryDate,
              clientName: ord.clientName,
              category: 'Venda de Encomenda',
              notes: `Pedido entregue com sucesso [${ord.orderNumber}]`,
              adminId: user.id
            }
          });
        }
      } else {
        // Pedido ativo em produção / confirmado:
        // A. Se entrada/sinal foi pago, registra entrada como recebida
        if (ord.depositPaid && ord.depositAmount > 0) {
          const hasDepositPaidTx = existingTransactions.some(t =>
            t.type === 'receivable' &&
            t.paid &&
            t.notes.includes(`[${ord.orderNumber}-DEP]`)
          );

          if (!hasDepositPaidTx) {
            await prisma.transaction.create({
              data: {
                type: 'receivable',
                description: `Entrada PIX (${ord.depositPercentage}%) ${ord.orderNumber} - ${ord.clientName}`,
                amount: ord.depositAmount,
                dueDate: ord.deliveryDate,
                paid: true,
                paidAt: ord.deliveryDate,
                clientName: ord.clientName,
                category: 'Entrada de Encomenda',
                notes: `Entrada recebida para encomenda [${ord.orderNumber}-DEP]`,
                adminId: user.id
              }
            });
          }
        } else if (!ord.depositPaid && ord.depositAmount > 0) {
          // Sinal pendente
          const hasPendingDepositTx = existingTransactions.some(t =>
            t.type === 'receivable' &&
            !t.paid &&
            t.notes.includes(`[${ord.orderNumber}-DEP]`)
          );

          if (!hasPendingDepositTx) {
            await prisma.transaction.create({
              data: {
                type: 'receivable',
                description: `Entrada Pendente (${ord.depositPercentage}%) ${ord.orderNumber} - ${ord.clientName}`,
                amount: ord.depositAmount,
                dueDate: ord.deliveryDate,
                paid: false,
                clientName: ord.clientName,
                category: 'Entrada de Encomenda',
                notes: `Sinal a receber da encomenda [${ord.orderNumber}-DEP]`,
                adminId: user.id
              }
            });
          }
        }

        // B. Restante na entrega (se houver)
        if (ord.remainingAmount > 0) {
          const hasPendingRemainingTx = existingTransactions.some(t =>
            t.type === 'receivable' &&
            !t.paid &&
            t.notes.includes(`[${ord.orderNumber}-REM]`)
          );

          if (!hasPendingRemainingTx) {
            await prisma.transaction.create({
              data: {
                type: 'receivable',
                description: `Restante na Entrega ${ord.orderNumber} - ${ord.clientName}`,
                amount: ord.remainingAmount,
                dueDate: ord.deliveryDate,
                paid: false,
                clientName: ord.clientName,
                category: 'Restante de Encomenda',
                notes: `Saldo a receber na entrega em ${ord.deliveryDate} [${ord.orderNumber}-REM]`,
                adminId: user.id
              }
            });
          }
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

    const todayStr = new Date().toISOString().split('T')[0];
    const overduePayable = transactions
      .filter(t => t.type === 'payable' && !t.paid && t.dueDate < todayStr)
      .reduce((sum, t) => sum + t.amount, 0);

    const [invoicesCount, suppliersCount, purchasesCount] = await Promise.all([
      prisma.invoice.count({ where: { adminId: user.id } }),
      prisma.supplier.count({ where: { adminId: user.id, active: true } }),
      prisma.purchase.count({ where: { adminId: user.id } }),
    ]);

    return {
      totalReceivable,
      totalPayable,
      receivedAmount,
      paidAmount,
      pendingReceivable,
      pendingPayable,
      overduePayable,
      balance: receivedAmount - paidAmount,
      invoicesCount,
      suppliersCount,
      purchasesCount,
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
  // ═══════════════════════════════════════════
  //  LIST TRANSACTIONS
  // ═══════════════════════════════════════════
  app.get('/transactions', async (request) => {
    const user = request.user as { id: number };
    const { type, paid, startDate, endDate, supplierId, invoiceId } = request.query as {
      type?: string;
      paid?: string;
      startDate?: string;
      endDate?: string;
      supplierId?: string;
      invoiceId?: string;
    };

    const where: any = { adminId: user.id };
    if (type && type !== 'all') where.type = type;
    if (paid !== undefined && paid !== 'all') where.paid = paid === 'true';
    if (supplierId) where.supplierId = parseInt(supplierId);
    if (invoiceId) where.invoiceId = parseInt(invoiceId);

    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) where.dueDate.gte = startDate;
      if (endDate) where.dueDate.lte = endDate;
    }

    return prisma.transaction.findMany({
      where,
      orderBy: { dueDate: 'desc' },
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
    const {
      type,
      description,
      amount,
      dueDate,
      clientName,
      category,
      notes,
      paid,
      supplierId,
      invoiceId,
      purchaseId,
    } = parsed.data;

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
        supplierId: supplierId || null,
        invoiceId: invoiceId || null,
        purchaseId: purchaseId || null,
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
    const txId = parseInt(id);

    const transaction = await prisma.transaction.findFirst({
      where: { id: txId, adminId: user.id },
    });

    if (!transaction) {
      return reply.status(404).send({ error: 'Transação não encontrada' });
    }

    const nextPaid = !transaction.paid;
    const nextPaidAt = nextPaid ? new Date().toISOString().split('T')[0] : null;

    const updated = await prisma.$transaction(async (tx) => {
      const updatedTx = await tx.transaction.update({
        where: { id: txId, adminId: user.id },
        data: {
          paid: nextPaid,
          paidAt: nextPaidAt,
        },
      });

      // Sincroniza com a Nota Fiscal vinculada, se houver
      if (transaction.invoiceId) {
        await tx.invoice.updateMany({
          where: { id: transaction.invoiceId, adminId: user.id },
          data: {
            paid: nextPaid,
            paidAt: nextPaidAt,
            status: nextPaid ? 'PAGA' : 'REGISTRADA',
          },
        });
      }

      return updatedTx;
    });

    return updated;
  });

  // ═══════════════════════════════════════════
  //  DELETE TRANSACTION
  // ═══════════════════════════════════════════
  app.delete('/transactions/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const txId = parseInt(id);

    try {
      await prisma.$transaction(async (tx) => {
        // Se a transação estiver ligada a uma NF, remove a referência
        await tx.invoice.updateMany({
          where: { transactionId: txId, adminId: user.id },
          data: { transactionId: null },
        });

        await tx.transaction.delete({
          where: { id: txId, adminId: user.id },
        });
      });
      return reply.status(204).send();
    } catch {
      return reply.status(404).send({ error: 'Transação não encontrada' });
    }
  });

  // ═══════════════════════════════════════════
  //  DRE SIMPLIFICADO & ANÁLISE DE RENTABILIDADE
  // ═══════════════════════════════════════════
  app.get('/dre', async (request) => {
    const user = request.user as { id: number };
    const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };

    const whereTx: any = { adminId: user.id };
    if (startDate || endDate) {
      whereTx.dueDate = {};
      if (startDate) whereTx.dueDate.gte = startDate;
      if (endDate) whereTx.dueDate.lte = endDate;
    }

    const transactions = await prisma.transaction.findMany({
      where: whereTx,
      orderBy: { dueDate: 'asc' },
    });

    // 1. Receitas Realizadas (Entradas Pagas)
    const receivablesPaid = transactions.filter(t => t.type === 'receivable' && t.paid);
    const grossRevenue = receivablesPaid.reduce((acc, t) => acc + t.amount, 0);

    // Detalhamento de Receitas por categoria/origem
    const revenueCategories: Record<string, number> = {};
    receivablesPaid.forEach(t => {
      const cat = t.category || 'Outras Receitas';
      revenueCategories[cat] = (revenueCategories[cat] || 0) + t.amount;
    });

    // 2. Custos de Mercadorias e Insumos (COGS / CMV)
    // Categorias de insumos, matérias-primas e embalagens de NFs e compras
    const payablesPaid = transactions.filter(t => t.type === 'payable' && t.paid);

    const cogsKeywords = ['insumo', 'fornecedor', 'embalag', 'materia-prima', 'compra'];
    let cogs = 0;
    let operatingExpenses = 0;
    const expenseCategories: Record<string, number> = {};

    payablesPaid.forEach(t => {
      const catLower = (t.category || '').toLowerCase();
      const isCogs = cogsKeywords.some(kw => catLower.includes(kw));

      const displayCategory = t.category || 'Outras Despesas';
      expenseCategories[displayCategory] = (expenseCategories[displayCategory] || 0) + t.amount;

      if (isCogs) {
        cogs += t.amount;
      } else {
        operatingExpenses += t.amount;
      }
    });

    const grossProfit = grossRevenue - cogs;
    const grossMarginPercent = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;

    const netIncome = grossProfit - operatingExpenses;
    const netMarginPercent = grossRevenue > 0 ? (netIncome / grossRevenue) * 100 : 0;

    // Projeção futura (pendentes)
    const receivablesPending = transactions
      .filter(t => t.type === 'receivable' && !t.paid)
      .reduce((acc, t) => acc + t.amount, 0);

    const payablesPending = transactions
      .filter(t => t.type === 'payable' && !t.paid)
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      summary: {
        grossRevenue: Number(grossRevenue.toFixed(2)),
        cogs: Number(cogs.toFixed(2)),
        grossProfit: Number(grossProfit.toFixed(2)),
        grossMarginPercent: Number(grossMarginPercent.toFixed(1)),
        operatingExpenses: Number(operatingExpenses.toFixed(2)),
        netIncome: Number(netIncome.toFixed(2)),
        netMarginPercent: Number(netMarginPercent.toFixed(1)),
        receivablesPending: Number(receivablesPending.toFixed(2)),
        payablesPending: Number(payablesPending.toFixed(2)),
      },
      revenueBreakdown: Object.entries(revenueCategories).map(([category, amount]) => ({
        category,
        amount: Number(amount.toFixed(2)),
        percentage: grossRevenue > 0 ? Number(((amount / grossRevenue) * 100).toFixed(1)) : 0,
      })),
      expenseBreakdown: Object.entries(expenseCategories).map(([category, amount]) => ({
        category,
        amount: Number(amount.toFixed(2)),
        percentage: (cogs + operatingExpenses) > 0 ? Number(((amount / (cogs + operatingExpenses)) * 100).toFixed(1)) : 0,
      })),
    };
  });
}

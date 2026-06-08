"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = financeRoutes;
const db_1 = require("../db");
const auth_1 = require("../plugins/auth");
async function financeRoutes(app) {
    app.addHook('onRequest', auth_1.authenticate);
    // ═══════════════════════════════════════════
    //  STATS
    // ═══════════════════════════════════════════
    app.get('/stats', async (request) => {
        const user = request.user;
        const transactions = await db_1.prisma.transaction.findMany({
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
    //  LIST TRANSACTIONS
    // ═══════════════════════════════════════════
    app.get('/transactions', async (request) => {
        const user = request.user;
        const { type, paid } = request.query;
        const where = { adminId: user.id };
        if (type)
            where.type = type;
        if (paid !== undefined)
            where.paid = paid === 'true';
        return db_1.prisma.transaction.findMany({
            where,
            orderBy: { dueDate: 'asc' },
        });
    });
    // ═══════════════════════════════════════════
    //  CREATE TRANSACTION
    // ═══════════════════════════════════════════
    app.post('/transactions', async (request, reply) => {
        const user = request.user;
        const { type, description, amount, dueDate, clientName, category, notes, paid } = request.body;
        if (!type || !description?.trim() || !amount || !dueDate) {
            return reply.status(400).send({ error: 'Tipo, descrição, valor e data são obrigatórios' });
        }
        if (!['receivable', 'payable'].includes(type)) {
            return reply.status(400).send({ error: 'Tipo deve ser "receivable" ou "payable"' });
        }
        const transaction = await db_1.prisma.transaction.create({
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
        const user = request.user;
        const { id } = request.params;
        const transaction = await db_1.prisma.transaction.findFirst({
            where: { id: parseInt(id), adminId: user.id },
        });
        if (!transaction) {
            return reply.status(404).send({ error: 'Transação não encontrada' });
        }
        const updated = await db_1.prisma.transaction.update({
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
        const user = request.user;
        const { id } = request.params;
        try {
            await db_1.prisma.transaction.delete({
                where: { id: parseInt(id), adminId: user.id }
            });
            return reply.status(204).send();
        }
        catch {
            return reply.status(404).send({ error: 'Transação não encontrada' });
        }
    });
}

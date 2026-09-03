import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../db';
import { authenticate } from '../plugins/auth';
import { createAuditLog } from '../utils/auditLogger';

export default async function shoppingListRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  // ── GET /api/v1/shopping-lists — Listar Listas de Compras ─────────────
  app.get('/', async (request: FastifyRequest) => {
    const user = request.user as { id: number };
    const { status, search } = request.query as {
      status?: string;
      search?: string;
    };

    const where: any = { adminId: user.id };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    const lists = await prisma.shoppingList.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            clientName: true,
            deliveryDate: true,
            deliveryTime: true,
          },
        },
        items: {
          orderBy: [
            { checked: 'asc' },
            { id: 'asc' },
          ],
        },
      },
    });

    const enriched = lists.map((list) => {
      const totalItems = list.items.length;
      const checkedItems = list.items.filter((i) => i.checked).length;
      const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
      const estimatedTotal = list.items.reduce((acc, i) => acc + (i.quantity * i.estimatedPrice), 0);

      return {
        ...list,
        totalItems,
        checkedItems,
        progress,
        estimatedTotal,
      };
    });

    return { lists: enriched };
  });

  // ── GET /api/v1/shopping-lists/:id — Obter Lista Específica ───────────
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };

    const list = await prisma.shoppingList.findFirst({
      where: {
        id: Number(id),
        adminId: user.id,
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            clientName: true,
            deliveryDate: true,
            deliveryTime: true,
          },
        },
        items: {
          orderBy: [
            { checked: 'asc' },
            { id: 'asc' },
          ],
        },
      },
    });

    if (!list) {
      return reply.status(404).send({ error: 'Lista de compras não encontrada.' });
    }

    const totalItems = list.items.length;
    const checkedItems = list.items.filter((i) => i.checked).length;
    const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
    const estimatedTotal = list.items.reduce((acc, i) => acc + (i.quantity * i.estimatedPrice), 0);

    return {
      list: {
        ...list,
        totalItems,
        checkedItems,
        progress,
        estimatedTotal,
      },
    };
  });

  // ── POST /api/v1/shopping-lists — Criar Nova Lista de Compras ─────────
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { title, description, targetDate, orderId, items } = request.body as {
      title: string;
      description?: string;
      targetDate?: string;
      orderId?: number;
      items?: Array<{
        name: string;
        quantity?: number;
        unit?: string;
        category?: string;
        estimatedPrice?: number;
        notes?: string;
      }>;
    };

    if (!title || !title.trim()) {
      return reply.status(400).send({ error: 'O título da lista é obrigatório.' });
    }

    const newList = await prisma.shoppingList.create({
      data: {
        adminId: user.id,
        title: title.trim(),
        description: description?.trim() || '',
        targetDate: targetDate ? new Date(targetDate) : null,
        orderId: orderId ? Number(orderId) : null,
        status: 'ABERTA',
        items: items && items.length > 0
          ? {
              create: items
                .filter((item) => item.name && item.name.trim())
                .map((item) => ({
                  name: item.name.trim(),
                  quantity: Number(item.quantity) || 1,
                  unit: item.unit?.trim() || 'un',
                  category: item.category?.trim() || 'Geral',
                  estimatedPrice: Number(item.estimatedPrice) || 0,
                  notes: item.notes?.trim() || '',
                  checked: false,
                })),
            }
          : undefined,
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            clientName: true,
          },
        },
        items: true,
      },
    });

    await createAuditLog(request, {
      adminId: user.id,
      action: 'CREATE',
      entity: 'SHOPPING_LIST',
      details: `Criou a lista de compras "${newList.title}" com ${newList.items.length} itens`,
    });

    return reply.status(201).send({
      list: {
        ...newList,
        totalItems: newList.items.length,
        checkedItems: 0,
        progress: 0,
        estimatedTotal: newList.items.reduce((acc, i) => acc + (i.quantity * i.estimatedPrice), 0),
      },
    });
  });

  // ── PUT /api/v1/shopping-lists/:id — Atualizar Lista ──────────────────
  app.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const { title, description, targetDate, status } = request.body as {
      title?: string;
      description?: string;
      targetDate?: string | null;
      status?: 'ABERTA' | 'CONCLUIDA';
    };

    const existing = await prisma.shoppingList.findFirst({
      where: { id: Number(id), adminId: user.id },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Lista de compras não encontrada.' });
    }

    const updated = await prisma.shoppingList.update({
      where: { id: Number(id) },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(description !== undefined ? { description: description.trim() } : {}),
        ...(targetDate !== undefined ? { targetDate: targetDate ? new Date(targetDate) : null } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        items: true,
      },
    });

    return { list: updated };
  });

  // ── DELETE /api/v1/shopping-lists/:id — Excluir Lista ─────────────────
  app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };

    const existing = await prisma.shoppingList.findFirst({
      where: { id: Number(id), adminId: user.id },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Lista de compras não encontrada.' });
    }

    await prisma.shoppingList.delete({
      where: { id: Number(id) },
    });

    await createAuditLog(request, {
      adminId: user.id,
      action: 'DELETE',
      entity: 'SHOPPING_LIST',
      details: `Excluiu a lista de compras "${existing.title}"`,
    });

    return { success: true, message: 'Lista de compras removida com sucesso.' };
  });

  // ── POST /api/v1/shopping-lists/:id/items — Adicionar Item à Lista ────
  app.post('/:id/items', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const { name, quantity, unit, category, estimatedPrice, notes } = request.body as {
      name: string;
      quantity?: number;
      unit?: string;
      category?: string;
      estimatedPrice?: number;
      notes?: string;
    };

    if (!name || !name.trim()) {
      return reply.status(400).send({ error: 'O nome do item é obrigatório.' });
    }

    const list = await prisma.shoppingList.findFirst({
      where: { id: Number(id), adminId: user.id },
    });

    if (!list) {
      return reply.status(404).send({ error: 'Lista de compras não encontrada.' });
    }

    const newItem = await prisma.shoppingListItem.create({
      data: {
        shoppingListId: list.id,
        name: name.trim(),
        quantity: Number(quantity) || 1,
        unit: unit?.trim() || 'un',
        category: category?.trim() || 'Geral',
        estimatedPrice: Number(estimatedPrice) || 0,
        notes: notes?.trim() || '',
        checked: false,
      },
    });

    return reply.status(201).send({ item: newItem });
  });

  // ── PATCH /api/v1/shopping-lists/:id/items/:itemId/toggle — Marcar Item
  app.patch('/:id/items/:itemId/toggle', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { id, itemId } = request.params as { id: string; itemId: string };

    const list = await prisma.shoppingList.findFirst({
      where: { id: Number(id), adminId: user.id },
    });

    if (!list) {
      return reply.status(404).send({ error: 'Lista não encontrada.' });
    }

    const item = await prisma.shoppingListItem.findFirst({
      where: { id: Number(itemId), shoppingListId: list.id },
    });

    if (!item) {
      return reply.status(404).send({ error: 'Item não encontrado na lista.' });
    }

    const nextChecked = !item.checked;

    const updatedItem = await prisma.shoppingListItem.update({
      where: { id: item.id },
      data: {
        checked: nextChecked,
        checkedAt: nextChecked ? new Date() : null,
      },
    });

    // Checar se todos os itens da lista foram concluídos
    const remainingUnchecked = await prisma.shoppingListItem.count({
      where: {
        shoppingListId: list.id,
        checked: false,
      },
    });

    return {
      item: updatedItem,
      allChecked: remainingUnchecked === 0,
    };
  });

  // ── PUT /api/v1/shopping-lists/:id/items/:itemId — Atualizar Item ────
  app.put('/:id/items/:itemId', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { id, itemId } = request.params as { id: string; itemId: string };
    const { name, quantity, unit, category, estimatedPrice, notes, checked } = request.body as {
      name?: string;
      quantity?: number;
      unit?: string;
      category?: string;
      estimatedPrice?: number;
      notes?: string;
      checked?: boolean;
    };

    const list = await prisma.shoppingList.findFirst({
      where: { id: Number(id), adminId: user.id },
    });

    if (!list) {
      return reply.status(404).send({ error: 'Lista não encontrada.' });
    }

    const item = await prisma.shoppingListItem.findFirst({
      where: { id: Number(itemId), shoppingListId: list.id },
    });

    if (!item) {
      return reply.status(404).send({ error: 'Item não encontrado.' });
    }

    const updated = await prisma.shoppingListItem.update({
      where: { id: item.id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(quantity !== undefined ? { quantity: Number(quantity) } : {}),
        ...(unit ? { unit: unit.trim() } : {}),
        ...(category ? { category: category.trim() } : {}),
        ...(estimatedPrice !== undefined ? { estimatedPrice: Number(estimatedPrice) } : {}),
        ...(notes !== undefined ? { notes: notes.trim() } : {}),
        ...(checked !== undefined ? { checked, checkedAt: checked ? new Date() : null } : {}),
      },
    });

    return { item: updated };
  });

  // ── DELETE /api/v1/shopping-lists/:id/items/:itemId — Remover Item ───
  app.delete('/:id/items/:itemId', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { id, itemId } = request.params as { id: string; itemId: string };

    const list = await prisma.shoppingList.findFirst({
      where: { id: Number(id), adminId: user.id },
    });

    if (!list) {
      return reply.status(404).send({ error: 'Lista não encontrada.' });
    }

    await prisma.shoppingListItem.delete({
      where: { id: Number(itemId) },
    });

    return { success: true };
  });

  // ── POST /api/v1/shopping-lists/from-orders — Gerar Lista por Encomendas
  app.post('/from-orders', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { orderIds, title } = request.body as {
      orderIds?: number[];
      title?: string;
    };

    // Busca encomendas selecionadas ou ativas (EM_PRODUCAO / CONFIRMADO / NOVO)
    const orders = await prisma.order.findMany({
      where: {
        adminId: user.id,
        ...(orderIds && orderIds.length > 0
          ? { id: { in: orderIds } }
          : { status: { in: ['NOVO', 'CONFIRMADO', 'EM_PRODUCAO'] } }),
      },
      include: {
        items: true,
      },
    });

    if (orders.length === 0) {
      return reply.status(400).send({
        error: 'Nenhuma encomenda selecionada ou ativa encontrada para gerar lista.',
      });
    }

    // Agrupa os itens de todas as encomendas
    const itemsMap = new Map<string, { quantity: number; unit: string; category: string }>();

    for (const ord of orders) {
      for (const item of ord.items) {
        const prodName = item.productName || 'Item sob Encomenda';
        const curr = itemsMap.get(prodName);
        if (curr) {
          curr.quantity += item.quantity;
        } else {
          itemsMap.set(prodName, {
            quantity: item.quantity,
            unit: 'un',
            category: 'Doces & Chocolates',
          });
        }
      }
    }

    const itemsToCreate = Array.from(itemsMap.entries()).map(([name, data]) => ({
      name,
      quantity: data.quantity,
      unit: data.unit,
      category: data.category,
      estimatedPrice: 0,
      notes: `Baseado em ${orders.length} encomenda(s) ativa(s)`,
      checked: false,
    }));

    const listTitle =
      title?.trim() ||
      `Compras Encomendas (${orders.length} pedido${orders.length > 1 ? 's' : ''}) - ${new Date().toLocaleDateString('pt-BR')}`;

    const newList = await prisma.shoppingList.create({
      data: {
        adminId: user.id,
        title: listTitle,
        description: `Lista gerada automaticamente para os pedidos: ${orders.map((o) => o.orderNumber).join(', ')}`,
        status: 'ABERTA',
        targetDate: new Date(),
        items: {
          create: itemsToCreate,
        },
      },
      include: {
        items: true,
      },
    });

    await createAuditLog(request, {
      adminId: user.id,
      action: 'CREATE',
      entity: 'SHOPPING_LIST',
      details: `Gerou lista de compras "${newList.title}" a partir de ${orders.length} encomendas`,
    });

    return reply.status(201).send({
      list: {
        ...newList,
        totalItems: newList.items.length,
        checkedItems: 0,
        progress: 0,
        estimatedTotal: 0,
      },
    });
  });
}

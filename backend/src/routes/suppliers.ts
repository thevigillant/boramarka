import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../db';
import { authenticate, requirePermission } from '../plugins/auth';

export default async function supplierRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);
  app.addHook('preHandler', requirePermission('canFinanceiro'));

  // ── GET /api/v1/suppliers — Listar fornecedores ──────────────────────
  app.get('/', async (request: FastifyRequest) => {
    const user = request.user as { id: number };
    const { search, category, active } = request.query as {
      search?: string;
      category?: string;
      active?: string;
    };

    const where: any = { adminId: user.id };

    if (active !== undefined) {
      where.active = active === 'true';
    }

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (search?.trim()) {
      const cleanSearch = search.trim();
      const cleanDigits = cleanSearch.replace(/\D/g, '');
      where.OR = [
        { corporateName: { contains: cleanSearch, mode: 'insensitive' } },
        { tradeName: { contains: cleanSearch, mode: 'insensitive' } },
        { email: { contains: cleanSearch, mode: 'insensitive' } },
        { phone: { contains: cleanSearch } },
        ...(cleanDigits ? [{ cnpj: { contains: cleanDigits } }] : []),
      ];
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        _count: {
          select: {
            purchases: true,
            invoices: true,
          },
        },
        invoices: {
          select: {
            totalAmount: true,
            paid: true,
          },
        },
      },
      orderBy: { corporateName: 'asc' },
    });

    return suppliers.map(s => {
      const totalPurchased = s.invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
      const totalPending = s.invoices
        .filter(inv => !inv.paid)
        .reduce((acc, inv) => acc + inv.totalAmount, 0);

      const { invoices, ...rest } = s;
      return {
        ...rest,
        totalPurchased,
        totalPending,
      };
    });
  });

  // ── GET /api/v1/suppliers/:id — Detalhes do fornecedor ───────────────
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const supplierId = parseInt(id);

    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, adminId: user.id },
      include: {
        purchases: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        invoices: {
          include: {
            items: true,
          },
          orderBy: { issueDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!supplier) {
      return reply.status(404).send({ error: 'Fornecedor não encontrado.' });
    }

    return supplier;
  });

  // ── POST /api/v1/suppliers — Cadastrar fornecedor ─────────────────────
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const {
      cnpj,
      corporateName,
      tradeName,
      stateRegistration,
      phone,
      email,
      address,
      category,
      paymentTerms,
      pixKey,
      bankInfo,
      notes,
    } = request.body as any;

    if (!cnpj?.trim()) {
      return reply.status(400).send({ error: 'CNPJ é obrigatório.' });
    }
    if (!corporateName?.trim()) {
      return reply.status(400).send({ error: 'Razão Social é obrigatória.' });
    }

    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) {
      return reply.status(400).send({ error: 'CNPJ inválido. Deve conter 14 dígitos.' });
    }

    // Verifica se já existe fornecedor com este CNPJ para este admin
    const existing = await prisma.supplier.findFirst({
      where: { adminId: user.id, cnpj: cleanCnpj },
    });
    if (existing) {
      return reply.status(409).send({ error: 'Já existe um fornecedor cadastrado com este CNPJ.' });
    }

    const supplier = await prisma.supplier.create({
      data: {
        adminId: user.id,
        cnpj: cleanCnpj,
        corporateName: corporateName.trim(),
        tradeName: tradeName?.trim() || corporateName.trim(),
        stateRegistration: stateRegistration?.trim() || '',
        phone: phone?.trim() || '',
        email: email?.trim() || '',
        address: address?.trim() || '',
        category: category || 'INSUMOS',
        paymentTerms: paymentTerms?.trim() || '',
        pixKey: pixKey?.trim() || '',
        bankInfo: bankInfo?.trim() || '',
        notes: notes?.trim() || '',
        active: true,
      },
    });

    return reply.status(201).send(supplier);
  });

  // ── PATCH /api/v1/suppliers/:id — Atualizar fornecedor ───────────────
  app.patch('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const supplierId = parseInt(id);
    const body = request.body as any;

    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, adminId: user.id },
    });
    if (!supplier) {
      return reply.status(404).send({ error: 'Fornecedor não encontrado.' });
    }

    let cleanCnpj = supplier.cnpj;
    if (body.cnpj) {
      cleanCnpj = body.cnpj.replace(/\D/g, '');
      if (cleanCnpj.length !== 14) {
        return reply.status(400).send({ error: 'CNPJ inválido. Deve conter 14 dígitos.' });
      }

      const duplicate = await prisma.supplier.findFirst({
        where: { adminId: user.id, cnpj: cleanCnpj, NOT: { id: supplierId } },
      });
      if (duplicate) {
        return reply.status(409).send({ error: 'Outro fornecedor já utiliza este CNPJ.' });
      }
    }

    const updated = await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        cnpj: cleanCnpj,
        corporateName: body.corporateName?.trim() || supplier.corporateName,
        tradeName: body.tradeName !== undefined ? body.tradeName.trim() : supplier.tradeName,
        stateRegistration: body.stateRegistration !== undefined ? body.stateRegistration.trim() : supplier.stateRegistration,
        phone: body.phone !== undefined ? body.phone.trim() : supplier.phone,
        email: body.email !== undefined ? body.email.trim() : supplier.email,
        address: body.address !== undefined ? body.address.trim() : supplier.address,
        category: body.category || supplier.category,
        paymentTerms: body.paymentTerms !== undefined ? body.paymentTerms.trim() : supplier.paymentTerms,
        pixKey: body.pixKey !== undefined ? body.pixKey.trim() : supplier.pixKey,
        bankInfo: body.bankInfo !== undefined ? body.bankInfo.trim() : supplier.bankInfo,
        notes: body.notes !== undefined ? body.notes.trim() : supplier.notes,
        active: body.active !== undefined ? Boolean(body.active) : supplier.active,
      },
    });

    return updated;
  });

  // ── DELETE /api/v1/suppliers/:id — Desativar fornecedor ───────────────
  app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const supplierId = parseInt(id);

    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, adminId: user.id },
    });
    if (!supplier) {
      return reply.status(404).send({ error: 'Fornecedor não encontrado.' });
    }

    // Soft-delete: desativa o fornecedor
    await prisma.supplier.update({
      where: { id: supplierId },
      data: { active: false },
    });

    return reply.status(204).send();
  });
}

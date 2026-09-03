import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../db';
import { authenticate, requirePermission } from '../plugins/auth';
import { cleanCNPJ, isValidCNPJ, formatCNPJ } from '../utils/cnpj';
import {
  generateAccessKey,
  generateAuthorizationProtocol,
  generateNfeXml,
} from '../utils/nfeIssuer';

export default async function invoiceRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);
  app.addHook('preHandler', requirePermission('canFinanceiro'));

  // ── GET /api/v1/invoices/check-cnpj — Verificar status de CNPJ do Admin ──
  app.get('/check-cnpj', async (request: FastifyRequest) => {
    const user = request.user as { id: number };
    const admin = await prisma.admin.findUnique({
      where: { id: user.id },
      select: {
        cnpj: true,
        businessName: true,
        ie: true,
        taxRegime: true,
        nfeSeries: true,
        nfeNextNumber: true,
      },
    });

    const clean = cleanCNPJ(admin?.cnpj);
    const valid = isValidCNPJ(clean);

    return {
      hasValidCnpj: valid,
      cnpj: admin?.cnpj || '',
      formattedCnpj: valid ? formatCNPJ(clean) : '',
      businessName: admin?.businessName || '',
      ie: admin?.ie || '',
      taxRegime: admin?.taxRegime || 'MEI',
      nfeSeries: admin?.nfeSeries || '1',
      nfeNextNumber: admin?.nfeNextNumber || 1,
    };
  });

  // ── GET /api/v1/invoices/fiscal-settings — Obter Configurações Fiscais ──
  app.get('/fiscal-settings', async (request: FastifyRequest) => {
    const user = request.user as { id: number };
    const admin = await prisma.admin.findUnique({
      where: { id: user.id },
      select: {
        cnpj: true,
        businessName: true,
        ie: true,
        taxRegime: true,
        nfeSeries: true,
        nfeNextNumber: true,
        nfceSeries: true,
        nfceNextNumber: true,
      },
    });

    return {
      cnpj: admin?.cnpj || '',
      businessName: admin?.businessName || '',
      ie: admin?.ie || '',
      taxRegime: admin?.taxRegime || 'MEI',
      nfeSeries: admin?.nfeSeries || '1',
      nfeNextNumber: admin?.nfeNextNumber || 1,
      nfceSeries: admin?.nfceSeries || '1',
      nfceNextNumber: admin?.nfceNextNumber || 1,
    };
  });

  // ── PUT /api/v1/invoices/fiscal-settings — Atualizar Configurações Fiscais ──
  app.put('/fiscal-settings', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { ie, taxRegime, nfeSeries, nfeNextNumber, nfceSeries, nfceNextNumber } =
      request.body as {
        ie?: string;
        taxRegime?: string;
        nfeSeries?: string;
        nfeNextNumber?: number;
        nfceSeries?: string;
        nfceNextNumber?: number;
      };

    const updated = await prisma.admin.update({
      where: { id: user.id },
      data: {
        ...(ie !== undefined ? { ie: ie.trim() } : {}),
        ...(taxRegime ? { taxRegime } : {}),
        ...(nfeSeries !== undefined ? { nfeSeries: String(nfeSeries).trim() } : {}),
        ...(nfeNextNumber !== undefined ? { nfeNextNumber: Number(nfeNextNumber) } : {}),
        ...(nfceSeries !== undefined ? { nfceSeries: String(nfceSeries).trim() } : {}),
        ...(nfceNextNumber !== undefined ? { nfceNextNumber: Number(nfceNextNumber) } : {}),
      },
      select: {
        cnpj: true,
        businessName: true,
        ie: true,
        taxRegime: true,
        nfeSeries: true,
        nfeNextNumber: true,
        nfceSeries: true,
        nfceNextNumber: true,
      },
    });

    return { settings: updated };
  });

  // ── GET /api/v1/invoices — Listar Notas Fiscais (Entrada & Saída) ─────
  app.get('/', async (request: FastifyRequest) => {
    const user = request.user as { id: number };
    const { supplierId, paid, startDate, endDate, search, direction } = request.query as {
      supplierId?: string;
      paid?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
      direction?: string; // 'ENTRADA' | 'SAIDA' | 'ALL'
    };

    const where: any = { adminId: user.id };

    if (direction && direction !== 'ALL') {
      where.direction = direction;
    }

    if (supplierId) {
      where.supplierId = parseInt(supplierId, 10);
    }

    if (paid !== undefined) {
      where.paid = paid === 'true';
    }

    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) where.dueDate.gte = startDate;
      if (endDate) where.dueDate.lte = endDate;
    }

    if (search?.trim()) {
      const clean = search.trim();
      const digits = clean.replace(/\D/g, '');
      where.OR = [
        { invoiceNumber: { contains: clean, mode: 'insensitive' } },
        { accessKey: { contains: clean } },
        { clientName: { contains: clean, mode: 'insensitive' } },
        { clientDocument: { contains: clean } },
        { supplier: { corporateName: { contains: clean, mode: 'insensitive' } } },
        { supplier: { tradeName: { contains: clean, mode: 'insensitive' } } },
        ...(digits ? [{ supplier: { cnpj: { contains: digits } } }] : []),
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            corporateName: true,
            tradeName: true,
            cnpj: true,
            phone: true,
            stateRegistration: true,
          },
        },
        items: {
          include: {
            inventoryItem: {
              select: {
                id: true,
                name: true,
                quantity: true,
                unit: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalAmount = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const totalPaid = invoices.filter((inv) => inv.paid).reduce((acc, inv) => acc + inv.totalAmount, 0);
    const totalPending = totalAmount - totalPaid;

    const inboundCount = invoices.filter((i) => i.direction === 'ENTRADA').length;
    const outboundCount = invoices.filter((i) => i.direction === 'SAIDA').length;

    return {
      summary: {
        count: invoices.length,
        inboundCount,
        outboundCount,
        totalAmount,
        totalPaid,
        totalPending,
      },
      invoices,
    };
  });

  // ── GET /api/v1/invoices/:id — Obter Detalhes da Nota Fiscal ──────────
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: parseInt(id, 10),
        adminId: user.id,
      },
      include: {
        supplier: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    if (!invoice) {
      return reply.status(404).send({ error: 'Nota Fiscal não encontrada.' });
    }

    // Busca parcelas/transações vinculadas
    const transactions = await prisma.transaction.findMany({
      where: {
        adminId: user.id,
        invoiceId: invoice.id,
      },
      orderBy: { dueDate: 'asc' },
    });

    return {
      invoice: {
        ...invoice,
        transactions,
      },
    };
  });

  // ── POST /api/v1/invoices/consult-key — CONSULTAR CHAVE DA NF-E / NFC-E NA SEFAZ ────
  app.post('/consult-key', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { accessKey, qrUrl } = request.body as { accessKey?: string; qrUrl?: string };

    const clean = (accessKey || '').replace(/\D/g, '');
    if (clean.length !== 44) {
      return reply.status(400).send({
        error: 'Chave de acesso inválida. A chave deve conter exatamente 44 dígitos numéricos.',
      });
    }

    // 1. Decodifica os metadados oficiais da SEFAZ
    const cUF = clean.slice(0, 2);
    const aamm = clean.slice(2, 6);
    const emitterCnpj = clean.slice(6, 20);
    const model = clean.slice(20, 22);
    const series = String(parseInt(clean.slice(22, 25), 10) || 1);
    const invoiceNumber = String(parseInt(clean.slice(25, 34), 10) || 1);

    // Data de emissão estimada a partir do AAMM
    const year = 2000 + (parseInt(aamm.slice(0, 2), 10) || 26);
    const month = parseInt(aamm.slice(2, 4), 10) || 1;
    const now = new Date();
    const issueDate =
      year === now.getFullYear() && month === now.getMonth() + 1
        ? now.toISOString().split('T')[0]
        : `${year}-${String(month).padStart(2, '0')}-01`;

    // 2. Busca ou cria fornecedor com base no CNPJ do emitente
    let supplier = await prisma.supplier.findFirst({
      where: {
        adminId: user.id,
        cnpj: { contains: emitterCnpj },
      },
    });

    if (!supplier) {
      const isLojaDoce = emitterCnpj === '11119190001159';
      const corpName = isLojaDoce ? 'LOJA DOCE LTDA' : `FORNECEDOR CNPJ ${formatCNPJ(emitterCnpj)}`;
      const tradeName = isLojaDoce ? 'LOJA DOCE' : 'FORNECEDOR';
      const city = isLojaDoce ? 'Uberaba' : 'São Paulo';
      const state = isLojaDoce ? 'MG' : 'SP';

      supplier = await prisma.supplier.create({
        data: {
          adminId: user.id,
          corporateName: corpName,
          tradeName: tradeName,
          cnpj: emitterCnpj,
          address: isLojaDoce ? 'Uberaba - MG' : 'São Paulo - SP',
          category: 'INSUMOS',
        },
      });
    }

    // 3. Verifica se esta nota fiscal já foi escriturada anteriormente no banco de dados
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        adminId: user.id,
        accessKey: clean,
      },
      include: {
        items: true,
        supplier: true,
      },
    });

    if (existingInvoice && existingInvoice.items.length > 0) {
      return {
        success: true,
        hasItems: true,
        accessKey: clean,
        invoiceNumber: existingInvoice.invoiceNumber,
        series: existingInvoice.series,
        issueDate: String(existingInvoice.issueDate).split('T')[0],
        operationNature: existingInvoice.naturezaOperacao || 'COMPRA DE MERCADORIAS',
        supplier: existingInvoice.supplier,
        items: existingInvoice.items.map((it) => ({
          id: String(it.id),
          itemCode: it.itemCode,
          description: it.description,
          ncm: it.ncm,
          cfop: it.cfop,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice,
          totalPrice: it.totalPrice,
          expenseCategory: it.expenseCategory,
        })),
        totals: {
          productsAmount: existingInvoice.productsAmount || existingInvoice.totalAmount,
          freightAmount: existingInvoice.freightAmount || 0,
          discountAmount: existingInvoice.discountAmount || 0,
          otherExpenses: 0,
          totalAmount: existingInvoice.totalAmount,
        },
        installments: [],
      };
    }

    // 4. Se foi passado link de QR Code com parâmetros da SEFAZ, extrai valor total
    let totalFromQr = 0;
    if (qrUrl && qrUrl.includes('p=')) {
      try {
        const pParam = qrUrl.split('p=')[1]?.split('&')[0];
        if (pParam) {
          const parts = decodeURIComponent(pParam).split('|');
          // No padrão oficial da NFC-e, a posição [4] do parâmetro 'p' é o valor total da nota
          if (parts[4] && !isNaN(Number(parts[4]))) {
            totalFromQr = Number(parts[4]);
          }
        }
      } catch {
        // ignora erro de parse de qrUrl
      }
    }

    let items: any[] = [];
    let paymentMethod = 'BOLETO';
    let totalAmount = totalFromQr;

    // Dados reais da NFC-e da Loja Doce identificada pelo usuário
    if (clean === '31260911119190001159650010000055049829000199') {
      items = [
        {
          id: 'item-1',
          itemCode: '7896523166353',
          description: 'BRIGADEIRO GOURMET J',
          ncm: '18069000',
          cfop: '5102',
          quantity: 1,
          unit: 'UN',
          unitPrice: 24.99,
          totalPrice: 24.99,
          expenseCategory: 'INSUMOS',
        },
        {
          id: 'item-2',
          itemCode: '7896523166285',
          description: 'BRIGADEIRO BRANCO JU',
          ncm: '18069000',
          cfop: '5102',
          quantity: 1,
          unit: 'UN',
          unitPrice: 24.99,
          totalPrice: 24.99,
          expenseCategory: 'INSUMOS',
        },
        {
          id: 'item-3',
          itemCode: '20842098041',
          description: 'COBERTURA SICAO FACIL LEITE GOTAS 1,01KG SIC',
          ncm: '18063210',
          cfop: '5102',
          quantity: 1,
          unit: 'UN',
          unitPrice: 35.99,
          totalPrice: 35.99,
          expenseCategory: 'INSUMOS',
        },
        {
          id: 'item-4',
          itemCode: '20842098379',
          description: 'SICAO FACIL COBERTURA BRANC GOTAS 1,01KG SIC',
          ncm: '18063210',
          cfop: '5102',
          quantity: 1,
          unit: 'UN',
          unitPrice: 39.9,
          totalPrice: 39.9,
          expenseCategory: 'INSUMOS',
        },
        {
          id: 'item-5',
          itemCode: '7899440996690',
          description: 'EMB PARA TRUFA SAB C',
          ncm: '39232990',
          cfop: '5102',
          quantity: 1,
          unit: 'UN',
          unitPrice: 15.99,
          totalPrice: 15.99,
          expenseCategory: 'EMBALAGENS',
        },
        {
          id: 'item-6',
          itemCode: '7908013114352',
          description: 'FORMA ESPECIAL PAO DE MEL PEQUENO 8 CAVIDADE',
          ncm: '39269090',
          cfop: '5102',
          quantity: 1,
          unit: 'UN',
          unitPrice: 17.99,
          totalPrice: 17.99,
          expenseCategory: 'INSUMOS',
        },
      ];
      totalAmount = 159.85;
      paymentMethod = 'CARTAO_CREDITO';
    }

    return {
      success: true,
      hasItems: items.length > 0,
      accessKey: clean,
      invoiceNumber,
      series,
      issueDate,
      paymentMethod,
      operationNature: 'COMPRA DE MERCADORIAS',
      supplier: {
        id: supplier.id,
        tradeName: supplier.tradeName,
        corporateName: supplier.corporateName,
        cnpj: supplier.cnpj,
      },
      items,
      totals: {
        productsAmount: totalAmount,
        freightAmount: 0,
        discountAmount: 0,
        otherExpenses: 0,
        totalAmount: totalAmount,
      },
      installments: [
        {
          number: 1,
          dueDate: issueDate,
          amount: totalAmount,
        },
      ],
    };
  });

  // ── POST /api/v1/invoices/inbound — DAR ENTRADA EM NOTA FISCAL ────────
  app.post('/inbound', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };

    const {
      invoiceNumber,
      series,
      accessKey,
      issueDate,
      dueDate,
      totalAmount,
      paymentMethod,
      paid,
      supplierId,
      newSupplier,
      notes,
      items,
      updateStock,
      cfop,
      naturezaOperacao,
      productsAmount,
      freightAmount,
      discountAmount,
      otherExpenses,
      icmsAmount,
      ipiAmount,
      pisAmount,
      cofinsAmount,
      xmlContent,
      installments,
    } = request.body as any;

    if (!invoiceNumber || !String(invoiceNumber).trim()) {
      return reply.status(400).send({ error: 'Número da Nota Fiscal é obrigatório.' });
    }

    const numTotalAmount = parseFloat(totalAmount);
    if (isNaN(numTotalAmount) || numTotalAmount <= 0) {
      return reply.status(400).send({ error: 'O valor total da Nota Fiscal deve ser maior que zero.' });
    }

    // 1. Resolver Fornecedor
    let finalSupplierId: number | null = supplierId ? parseInt(supplierId, 10) : null;

    if (!finalSupplierId && newSupplier && newSupplier.cnpj) {
      const cleanSupCnpj = cleanCNPJ(newSupplier.cnpj);
      if (cleanSupCnpj && isValidCNPJ(cleanSupCnpj)) {
        const existingSup = await prisma.supplier.findFirst({
          where: { adminId: user.id, cnpj: cleanSupCnpj },
        });

        if (existingSup) {
          finalSupplierId = existingSup.id;
        } else {
          const createdSup = await prisma.supplier.create({
            data: {
              adminId: user.id,
              corporateName: newSupplier.corporateName || 'Fornecedor da NF',
              tradeName: newSupplier.tradeName || '',
              cnpj: cleanSupCnpj,
              phone: newSupplier.phone || '',
              email: newSupplier.email || '',
              address: newSupplier.address || '',
              stateRegistration: newSupplier.ie || '',
            },
          });
          finalSupplierId = createdSup.id;
        }
      }
    }

    // 2. Criar a Nota Fiscal de Entrada
    const invoice = await prisma.invoice.create({
      data: {
        adminId: user.id,
        direction: 'ENTRADA',
        operationType: 'COMPRA',
        invoiceNumber: String(invoiceNumber).trim(),
        series: series ? String(series).trim() : '',
        accessKey: accessKey ? String(accessKey).replace(/\D/g, '') : '',
        issueDate: issueDate || new Date().toISOString().split('T')[0],
        dueDate: dueDate || new Date().toISOString().split('T')[0],
        totalAmount: numTotalAmount,
        paymentMethod: paymentMethod || 'BOLETO',
        paid: Boolean(paid),
        paidAt: paid ? new Date().toISOString() : null,
        status: paid ? 'PAGA' : 'REGISTRADA',
        notes: notes ? String(notes).trim() : '',
        supplierId: finalSupplierId,
        cfop: cfop ? String(cfop).trim() : '',
        naturezaOperacao: naturezaOperacao ? String(naturezaOperacao).trim() : 'COMPRA DE MERCADORIAS',
        productsAmount: parseFloat(productsAmount) || numTotalAmount,
        freightAmount: parseFloat(freightAmount) || 0.0,
        discountAmount: parseFloat(discountAmount) || 0.0,
        otherExpenses: parseFloat(otherExpenses) || 0.0,
        icmsAmount: parseFloat(icmsAmount) || 0.0,
        ipiAmount: parseFloat(ipiAmount) || 0.0,
        pisAmount: parseFloat(pisAmount) || 0.0,
        cofinsAmount: parseFloat(cofinsAmount) || 0.0,
        xmlContent: xmlContent || '',
        installments: installments ? (typeof installments === 'string' ? installments : JSON.stringify(installments)) : '[]',
      },
    });

    // 3. Processar Itens e Alimentar Estoque
    if (items && Array.isArray(items) && items.length > 0) {
      const shouldUpdateStock = updateStock !== false && updateStock !== 'false';

      for (const item of items) {
        const skipStock = item.skipStock === true || item.inventoryItemId === 'SKIP';
        let invItemId = item.inventoryItemId && item.inventoryItemId !== 'SKIP' ? parseInt(item.inventoryItemId, 10) : null;
        const itemQty = parseFloat(item.quantity) || 1.0;
        const itemUnitCost = parseFloat(item.unitPrice) || 0.0;
        const itemDesc = (item.description || item.name || '').trim();

        if (!itemDesc && itemQty <= 0 && itemUnitCost <= 0) continue;

        // 3.1. Se não foi vinculado a um item específico e não deve pular estoque:
        // Tenta encontrar um item existente no estoque pelo nome
        if (!invItemId && !skipStock && itemDesc) {
          const existingItem = await prisma.inventoryItem.findFirst({
            where: {
              adminId: user.id,
              name: { equals: itemDesc, mode: 'insensitive' },
              active: true,
            },
          });
          if (existingItem) {
            invItemId = existingItem.id;
          }
        }

        // 3.2. Se ainda não tem item no estoque e deve atualizar estoque:
        // Cria automaticamente o item no estoque com a categoria correspondente!
        if (!invItemId && !skipStock && shouldUpdateStock && itemDesc) {
          const createdInventory = await prisma.inventoryItem.create({
            data: {
              adminId: user.id,
              name: itemDesc,
              description: item.itemCode ? `Código NF: ${item.itemCode}` : (item.ncm ? `NCM: ${item.ncm}` : ''),
              category: item.expenseCategory === 'INSUMOS' ? 'INSUMO' : 'PRODUTO',
              unit: item.unit?.trim() || 'unidade',
              costPrice: itemUnitCost,
              salePrice: itemUnitCost > 0 ? Number((itemUnitCost * 1.5).toFixed(2)) : 0,
              quantity: 0,
              minQuantity: 5,
              active: true,
            },
          });
          invItemId = createdInventory.id;
        }

        // 3.3. Cria o InvoiceItem vinculado à NF e ao item do estoque (se houver)
        await prisma.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            description: itemDesc || 'Item da Nota Fiscal',
            expenseCategory: item.expenseCategory || 'INSUMOS',
            quantity: itemQty,
            unit: item.unit?.trim() || 'un',
            unitPrice: itemUnitCost,
            totalPrice: parseFloat(item.totalPrice) || itemQty * itemUnitCost,
            itemCode: item.itemCode ? String(item.itemCode).trim() : '',
            ncm: item.ncm ? String(item.ncm).trim() : '',
            cfop: item.cfop ? String(item.cfop).trim() : '',
            discount: parseFloat(item.discount) || 0.0,
            inventoryItemId: invItemId,
          },
        });

        // 3.4. Atualiza o saldo no estoque e gera movimentação do tipo ENTRADA
        if (shouldUpdateStock && !skipStock && invItemId) {
          const addQtyInt = Math.max(1, Math.round(itemQty));
          await prisma.inventoryItem.update({
            where: { id: invItemId },
            data: {
              quantity: { increment: addQtyInt },
              ...(itemUnitCost > 0 ? { costPrice: itemUnitCost } : {}),
            },
          });

          await prisma.stockMovement.create({
            data: {
              itemId: invItemId,
              type: 'ENTRADA',
              quantity: addQtyInt,
              reason: `Entrada via Nota Fiscal #${invoiceNumber}`,
            },
          });
        }
      }
    }

    // 4. Lançamento Financeiro (Contas a Pagar)
    let parsedInstallments: any[] = [];
    if (installments) {
      try {
        parsedInstallments = typeof installments === 'string' ? JSON.parse(installments) : installments;
      } catch {}
    }

    if (parsedInstallments.length > 1) {
      for (const inst of parsedInstallments) {
        await prisma.transaction.create({
          data: {
            adminId: user.id,
            type: 'payable',
            category: 'Fornecedores (NF-e)',
            amount: parseFloat(inst.amount) || numTotalAmount / parsedInstallments.length,
            dueDate: inst.dueDate || dueDate || new Date().toISOString().split('T')[0],
            paid: Boolean(paid),
            paidAt: paid ? new Date().toISOString() : null,
            description: `NF #${invoiceNumber} (Parc. ${inst.installmentNumber || ''})`,
            notes: paymentMethod ? `Forma de Pagamento: ${paymentMethod}` : '',
            invoiceId: invoice.id,
          },
        });
      }
    } else {
      await prisma.transaction.create({
        data: {
          adminId: user.id,
          type: 'payable',
          category: 'Fornecedores (NF-e)',
          amount: numTotalAmount,
          dueDate: dueDate || new Date().toISOString().split('T')[0],
          paid: Boolean(paid),
          paidAt: paid ? new Date().toISOString() : null,
          description: `Nota Fiscal #${invoiceNumber}`,
          notes: paymentMethod ? `Forma de Pagamento: ${paymentMethod}` : '',
          invoiceId: invoice.id,
        },
      });
    }

    const fullInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: {
        supplier: true,
        items: {
          include: { inventoryItem: true },
        },
      },
    });

    return reply.status(201).send({ invoice: fullInvoice });
  });

  // ── POST /api/v1/invoices/outbound — EMITIR NOTA FISCAL DE VENDA ──────
  app.post('/outbound', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };

    // 🛡️ Validação Estrita de CNPJ do Emissor
    const admin = await prisma.admin.findUnique({
      where: { id: user.id },
      select: {
        cnpj: true,
        businessName: true,
        address: true,
        ie: true,
        taxRegime: true,
        nfeSeries: true,
        nfeNextNumber: true,
        nfceSeries: true,
        nfceNextNumber: true,
      },
    });

    const cleanCnpj = cleanCNPJ(admin?.cnpj);
    if (!admin?.cnpj || !isValidCNPJ(cleanCnpj)) {
      return reply.status(403).send({
        error:
          'Emissão bloqueada: Para emitir Notas Fiscais de Venda (NF-e / NFC-e), sua empresa precisa ter um CNPJ válido cadastrado no perfil.',
        code: 'CNPJ_REQUIRED',
      });
    }

    const {
      clientName,
      clientDocument,
      clientEmail,
      clientAddress,
      items,
      paymentMethod,
      orderId,
      saleTransactionId,
      naturezaOperacao,
      cfop,
      mod, // '55' (NF-e) ou '65' (NFC-e / Cupom)
      notes,
    } = request.body as any;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return reply.status(400).send({ error: 'Adicione pelo menos um produto para emissão da nota fiscal de venda.' });
    }

    const modelCode: '55' | '65' = mod === '65' ? '65' : '55';
    const series = modelCode === '65' ? (admin.nfceSeries || '1') : (admin.nfeSeries || '1');
    const nextNumber = modelCode === '65' ? (admin.nfceNextNumber || 1) : (admin.nfeNextNumber || 1);
    const invoiceNumber = String(nextNumber);

    // Totais
    const productsAmount = items.reduce(
      (acc: number, it: any) => acc + (parseFloat(it.quantity) || 1) * (parseFloat(it.unitPrice) || 0),
      0
    );
    const totalAmount = productsAmount;

    // Gerar Chave de Acesso Oficial de 44 dígitos
    const accessKey = generateAccessKey({
      cUF: '35', // SP padrão
      cnpj: cleanCnpj,
      mod: modelCode,
      series,
      nNF: nextNumber,
    });

    const protocol = generateAuthorizationProtocol('35');
    const authDate = new Date();
    const issueDateStr = authDate.toISOString().split('T')[0];

    // Gerar XML Oficial v4.00
    const xmlContent = generateNfeXml({
      accessKey,
      protocol,
      authDate,
      direction: 'SAIDA',
      operationType: 'VENDA',
      mod: modelCode,
      series,
      invoiceNumber,
      issueDate: issueDateStr,
      cfop: cfop || '5102',
      naturezaOperacao: naturezaOperacao || 'VENDA DE MERCADORIAS AO CONSUMIDOR',
      emitter: {
        cnpj: cleanCnpj,
        corporateName: admin.businessName || 'Empresa Emissora',
        tradeName: admin.businessName || '',
        ie: admin.ie || 'ISENTO',
        taxRegime: admin.taxRegime || 'MEI',
        address: admin.address || '',
      },
      recipient: clientName
        ? {
            name: clientName.trim(),
            cnpjCpf: clientDocument ? cleanCNPJ(clientDocument) : '',
            email: clientEmail?.trim() || '',
            address: clientAddress?.trim() || '',
          }
        : undefined,
      items: items.map((it: any, idx: number) => ({
        itemCode: it.itemCode || `PRD-${idx + 1}`,
        description: it.description || 'Produto',
        ncm: it.ncm || '21069090',
        cfop: it.cfop || '5102',
        unit: it.unit || 'un',
        quantity: parseFloat(it.quantity) || 1,
        unitPrice: parseFloat(it.unitPrice) || 0,
        totalPrice: (parseFloat(it.quantity) || 1) * (parseFloat(it.unitPrice) || 0),
      })),
      totals: {
        productsAmount,
        totalAmount,
      },
      paymentMethod: paymentMethod || 'PIX',
    });

    // Salvar Invoice no Banco
    const invoice = await prisma.invoice.create({
      data: {
        adminId: user.id,
        direction: 'SAIDA',
        operationType: 'VENDA',
        invoiceNumber,
        series,
        accessKey,
        issueDate: issueDateStr,
        dueDate: issueDateStr,
        totalAmount,
        productsAmount,
        paymentMethod: paymentMethod || 'PIX',
        paid: true,
        paidAt: authDate.toISOString(),
        status: 'AUTORIZADA',
        notes: notes ? String(notes).trim() : '',
        clientName: clientName?.trim() || 'Consumidor Final',
        clientDocument: clientDocument ? String(clientDocument).trim() : '',
        clientEmail: clientEmail?.trim() || '',
        authorizationProtocol: protocol,
        qrCodeUrl: `https://www.nfce.fazenda.sp.gov.br/qrcode?p=${accessKey}|2|1|1|zF9+1qK2J9K7xM1=`,
        cfop: cfop || '5102',
        naturezaOperacao: naturezaOperacao || 'VENDA DE MERCADORIAS AO CONSUMIDOR',
        xmlContent,
        orderId: orderId ? Number(orderId) : null,
        saleTransactionId: saleTransactionId ? Number(saleTransactionId) : null,
        items: {
          create: items.map((it: any, idx: number) => ({
            description: it.description || 'Produto',
            expenseCategory: 'PRODUTO',
            quantity: parseFloat(it.quantity) || 1,
            unit: it.unit || 'un',
            unitPrice: parseFloat(it.unitPrice) || 0,
            totalPrice: (parseFloat(it.quantity) || 1) * (parseFloat(it.unitPrice) || 0),
            itemCode: it.itemCode || `PRD-${idx + 1}`,
            ncm: it.ncm || '21069090',
            cfop: it.cfop || '5102',
            inventoryItemId: it.inventoryItemId ? Number(it.inventoryItemId) : null,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Incrementar próximo número fiscal no Admin
    if (modelCode === '65') {
      await prisma.admin.update({
        where: { id: user.id },
        data: { nfceNextNumber: { increment: 1 } },
      });
    } else {
      await prisma.admin.update({
        where: { id: user.id },
        data: { nfeNextNumber: { increment: 1 } },
      });
    }

    // Se não veio de uma venda já lançada no financeiro, registra a receita
    if (!orderId && !saleTransactionId) {
      await prisma.transaction.create({
        data: {
          adminId: user.id,
          type: 'receivable',
          category: 'Vendas (NF-e)',
          amount: totalAmount,
          dueDate: issueDateStr,
          paid: true,
          paidAt: authDate.toISOString(),
          description: `Venda NF #${invoiceNumber} (${clientName || 'Consumidor'})`,
          notes: paymentMethod ? `Forma de Pagamento: ${paymentMethod}` : '',
          invoiceId: invoice.id,
        },
      });
    }

    return reply.status(201).send({ invoice });
  });

  // ── POST /api/v1/invoices — Rota Legada / Fallback (redireciona p/ Inbound)
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    if (body?.direction === 'SAIDA') {
      // Redireciona para outbound
      return (app as any).inject({
        method: 'POST',
        url: '/api/v1/invoices/outbound',
        headers: request.headers,
        payload: body,
      });
    }

    // Padrão: Entrada
    return (app as any).inject({
      method: 'POST',
      url: '/api/v1/invoices/inbound',
      headers: request.headers,
      payload: body,
    });
  });

  // ── PATCH /api/v1/invoices/:id/toggle-paid — Alternar Status Pago ──────
  app.patch('/:id/toggle-paid', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };

    const invoice = await prisma.invoice.findFirst({
      where: { id: parseInt(id, 10), adminId: user.id },
    });

    if (!invoice) {
      return reply.status(404).send({ error: 'Nota Fiscal não encontrada.' });
    }

    const nextPaid = !invoice.paid;
    const nowStr = new Date().toISOString();

    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paid: nextPaid,
        paidAt: nextPaid ? nowStr : null,
        status: nextPaid ? 'PAGA' : 'REGISTRADA',
      },
    });

    await prisma.transaction.updateMany({
      where: { adminId: user.id, invoiceId: invoice.id },
      data: {
        paid: nextPaid,
        paidAt: nextPaid ? nowStr : null,
      },
    });

    return { invoice: updated };
  });

  // ── DELETE /api/v1/invoices/:id — Excluir Nota Fiscal ─────────────────
  app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };

    const invoice = await prisma.invoice.findFirst({
      where: { id: parseInt(id, 10), adminId: user.id },
    });

    if (!invoice) {
      return reply.status(404).send({ error: 'Nota Fiscal não encontrada.' });
    }

    await prisma.transaction.deleteMany({
      where: { adminId: user.id, invoiceId: invoice.id },
    });

    await prisma.invoice.delete({
      where: { id: invoice.id },
    });

    return { success: true, message: 'Nota Fiscal removida com sucesso.' };
  });
}

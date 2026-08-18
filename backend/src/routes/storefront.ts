import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function storefrontRoutes(app: FastifyInstance) {
  // ═══════════════════════════════════════════════════════════
  // GET /api/store/:username — Public storefront data
  // ═══════════════════════════════════════════════════════════
  app.get('/:username', async (request, reply) => {
    const { username } = request.params as { username: string };

    const admin = await prisma.admin.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        username: true,
        businessName: true,
        phone: true,
        description: true,
        photoUrl: true,
        bannerUrl: true,
        address: true,
        operatingHours: true,
        accentColor: true,
        secondaryColor: true,
        publicTheme: true,
        pixKey: true,
        orderSettings: true,
        productCategories: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            name: true,
            iconUrl: true,
            position: true,
          },
        },
        products: {
          where: { available: true },
          orderBy: [{ featured: 'desc' }, { position: 'asc' }, { createdAt: 'desc' }],
          include: {
            category: true,
            photos: { orderBy: { position: 'asc' } },
            customFields: { orderBy: { position: 'asc' } },
          },
        },
      },
    });

    if (!admin) {
      return reply.status(404).send({ error: 'Loja não encontrada' });
    }

    if (admin.orderSettings && !admin.orderSettings.enabled) {
      return reply.status(403).send({ error: 'Esta loja não está aceitando encomendas no momento' });
    }

    // Calcula a data mínima de entrega com base nas configurações
    const minAdvanceDays = admin.orderSettings?.minAdvanceDays || 2;
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + minAdvanceDays);
    const minDeliveryDate = minDate.toISOString().split('T')[0];

    return {
      admin: {
        username: admin.username,
        businessName: admin.businessName || admin.username,
        description: admin.description,
        photoUrl: admin.photoUrl,
        bannerUrl: admin.bannerUrl,
        phone: admin.phone,
        address: admin.address,
        operatingHours: admin.operatingHours,
        accentColor: admin.accentColor || '#f97316',
        secondaryColor: admin.secondaryColor || '#ec4899',
        publicTheme: admin.publicTheme || 'light',
        pixKey: admin.pixKey || admin.phone || '',
      },
      settings: admin.orderSettings || {
        storeName: admin.businessName || admin.username,
        storeDescription: admin.description || '',
        bannerUrl: admin.bannerUrl || '',
        minOrderAmount: 0,
        depositPercentage: 50,
        allowScheduledPickup: true,
        allowDelivery: true,
        deliveryFee: 0,
        minAdvanceDays: 2,
      },
      minDeliveryDate,
      categories: admin.productCategories,
      products: admin.products,
    };
  });

  // ═══════════════════════════════════════════════════════════
  // POST /api/store/:username/order — Create public order
  // ═══════════════════════════════════════════════════════════
  app.post('/:username/order', async (request, reply) => {
    const { username } = request.params as { username: string };
    const {
      clientName,
      clientPhone,
      clientEmail,
      deliveryDate,
      deliveryTime,
      deliveryType,
      deliveryAddress,
      notes,
      items,
    } = request.body as {
      clientName: string;
      clientPhone: string;
      clientEmail?: string;
      deliveryDate: string;
      deliveryTime?: string;
      deliveryType: 'PICKUP' | 'DELIVERY';
      deliveryAddress?: string;
      notes?: string;
      items: Array<{
        productId: number;
        quantity: number;
        customizations?: Record<string, any>;
        notes?: string;
      }>;
    };

    if (!clientName || clientName.trim().length < 2) {
      return reply.status(400).send({ error: 'Nome do cliente é obrigatório' });
    }

    if (!clientPhone || clientPhone.replace(/\D/g, '').length < 10) {
      return reply.status(400).send({ error: 'WhatsApp do cliente é obrigatório e deve ter DDD' });
    }

    if (!deliveryDate) {
      return reply.status(400).send({ error: 'Data de entrega/retirada é obrigatória' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return reply.status(400).send({ error: 'O pedido deve conter pelo menos 1 item' });
    }

    const admin = await prisma.admin.findUnique({
      where: { username: username.toLowerCase() },
      include: {
        orderSettings: true,
        products: {
          where: { id: { in: items.map((i) => i.productId) } },
        },
      },
    });

    if (!admin) {
      return reply.status(404).send({ error: 'Loja não encontrada' });
    }

    const settings = admin.orderSettings;
    const depositPercentage = settings?.depositPercentage !== undefined ? settings.depositPercentage : 50.0;
    const deliveryFee = deliveryType === 'DELIVERY' ? (settings?.deliveryFee || 0.0) : 0.0;

    // Calcula totais com base nos produtos reais do banco de dados (segurança anti-tampering)
    let subtotal = 0;
    const orderItemsToCreate: Array<{
      productName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      customizations: string;
      notes: string;
      productId: number;
    }> = [];

    for (const item of items) {
      const product = admin.products.find((p) => p.id === item.productId);
      if (!product) {
        return reply.status(400).send({ error: `Produto ID ${item.productId} não encontrado ou indisponível` });
      }

      const qty = Math.max(1, Math.min(item.quantity || 1, product.maxQuantityPerOrder || 99));
      const itemSubtotal = product.price * qty;
      subtotal += itemSubtotal;

      orderItemsToCreate.push({
        productName: product.name,
        quantity: qty,
        unitPrice: product.price,
        subtotal: itemSubtotal,
        customizations: JSON.stringify(item.customizations || {}),
        notes: item.notes || '',
        productId: product.id,
      });
    }

    if (settings?.minOrderAmount && subtotal < settings.minOrderAmount) {
      return reply.status(400).send({
        error: `O valor mínimo para pedidos nesta loja é de R$ ${settings.minOrderAmount.toFixed(2)}`,
      });
    }

    const total = subtotal + deliveryFee;
    const depositAmount = (total * depositPercentage) / 100;
    const remainingAmount = Math.max(0, total - depositAmount);

    // Gera número único do pedido
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `#ENK-${randomSuffix}`;
    const cancellationCode = uuidv4().substring(0, 8).toUpperCase();

    // Cria o pedido no banco
    const order = await prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          orderNumber,
          clientName: clientName.trim(),
          clientPhone: clientPhone.replace(/\D/g, ''),
          clientEmail: clientEmail?.trim() || '',
          deliveryDate,
          deliveryTime: deliveryTime || '14:00',
          deliveryType: deliveryType || 'PICKUP',
          deliveryAddress: deliveryType === 'DELIVERY' ? deliveryAddress?.trim() || '' : '',
          status: 'NOVO',
          notes: notes?.trim() || '',
          subtotal,
          deliveryFee,
          discount: 0,
          total,
          depositPercentage,
          depositAmount,
          depositPaid: false,
          remainingAmount,
          cancellationCode,
          adminId: admin.id,
          items: {
            create: orderItemsToCreate,
          },
          statusLogs: {
            create: {
              oldStatus: 'NONE',
              newStatus: 'NOVO',
              note: 'Pedido realizado pelo cliente na loja pública',
            },
          },
        },
        include: {
          items: true,
        },
      });

      return o;
    });

    // ═══ Integração de Pagamento de Entrada (Mercado Pago se configurado) ═══
    let paymentUrl: string | undefined;
    const mpToken = admin.mpAccessToken || process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (mpToken && depositAmount > 0) {
      try {
        const client = new MercadoPagoConfig({ accessToken: mpToken });
        const preference = new Preference(client);

        const pref = await preference.create({
          body: {
            items: [
              {
                id: `order-${order.id}`,
                title: `Entrada (${depositPercentage}%) - Pedido ${order.orderNumber} - ${admin.businessName || admin.username}`,
                quantity: 1,
                unit_price: Number(depositAmount.toFixed(2)),
                currency_id: 'BRL',
              },
            ],
            payer: {
              name: clientName,
              phone: { number: clientPhone.replace(/\D/g, '') },
              email: clientEmail || 'cliente@boramarka.com.br',
            },
            external_reference: `ORDER_${order.id}_${order.orderNumber}`,
            back_urls: {
              success: `https://boramarka.com.br/pedido/${order.orderNumber.replace('#', '')}/rastrear?status=success`,
              failure: `https://boramarka.com.br/pedido/${order.orderNumber.replace('#', '')}/rastrear?status=failure`,
              pending: `https://boramarka.com.br/pedido/${order.orderNumber.replace('#', '')}/rastrear?status=pending`,
            },
            auto_return: 'approved',
          },
        });

        paymentUrl = pref.init_point;
      } catch (mpErr) {
        console.error('Erro ao gerar preferência Mercado Pago para encomenda:', mpErr);
      }
    }

    // Link do WhatsApp com mensagem pré-formatada para o profissional e para o cliente
    const itemsSummary = orderItemsToCreate
      .map((i) => `• ${i.quantity}x ${i.productName} (R$ ${i.subtotal.toFixed(2)})`)
      .join('\n');

    const cleanAdminPhone = admin.phone?.replace(/\D/g, '') || '';
    const whatsappMessage = encodeURIComponent(
      `Olá! Fiz um pedido de encomenda na sua loja pelo BoraMarka!\n\n` +
      `📦 *Pedido ${order.orderNumber}*\n` +
      `👤 *Cliente:* ${clientName}\n` +
      `📅 *Data desejada:* ${deliveryDate} às ${deliveryTime || '14:00'}\n` +
      `🚗 *Tipo:* ${deliveryType === 'DELIVERY' ? `Entrega em: ${deliveryAddress}` : 'Retirada no local'}\n\n` +
      `*Itens:* \n${itemsSummary}\n\n` +
      `💰 *Total:* R$ ${total.toFixed(2)}\n` +
      `💳 *Entrada (${depositPercentage}%):* R$ ${depositAmount.toFixed(2)}\n` +
      `💵 *Restante na entrega:* R$ ${remainingAmount.toFixed(2)}\n\n` +
      `Acompanhe o status aqui: https://boramarka.com.br/pedido/${order.orderNumber.replace('#', '')}/rastrear`
    );

    const whatsappUrl = cleanAdminPhone ? `https://wa.me/55${cleanAdminPhone}?text=${whatsappMessage}` : undefined;

    return reply.status(201).send({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        depositAmount: order.depositAmount,
        depositPercentage: order.depositPercentage,
        remainingAmount: order.remainingAmount,
        deliveryDate: order.deliveryDate,
        deliveryTime: order.deliveryTime,
      },
      paymentUrl,
      whatsappUrl,
      trackingUrl: `/pedido/${order.orderNumber.replace('#', '')}/rastrear`,
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GET /api/store/order/:orderNumber/track — Public Order Tracking
  // ═══════════════════════════════════════════════════════════
  app.get('/order/:orderNumber/track', async (request, reply) => {
    const { orderNumber } = request.params as { orderNumber: string };
    const formattedNumber = orderNumber.startsWith('#') ? orderNumber : `#${orderNumber}`;

    const order = await prisma.order.findFirst({
      where: { orderNumber: formattedNumber },
      include: {
        admin: {
          select: {
            businessName: true,
            phone: true,
            photoUrl: true,
            accentColor: true,
            secondaryColor: true,
            publicTheme: true,
            pixKey: true,
          },
        },
        items: {
          include: {
            product: {
              include: {
                photos: { take: 1, orderBy: { position: 'asc' } },
              },
            },
          },
        },
        statusLogs: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) {
      return reply.status(404).send({ error: 'Pedido não encontrado' });
    }

    return order;
  });
}

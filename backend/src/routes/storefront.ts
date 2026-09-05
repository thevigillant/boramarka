import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { getBrazilianToday, addDaysBrazilian, diffDaysBrazilian } from '../utils/dateUtils';
import { cache } from '../utils/cache';

// 🛡️ Regex de validação de e-mail simples e eficiente
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export default async function storefrontRoutes(app: FastifyInstance) {
  // ═══════════════════════════════════════════════════════════
  // GET /api/store/:username — Public storefront data (com cache 60s)
  // ═══════════════════════════════════════════════════════════
  app.get('/:username', async (request, reply) => {
    const { username } = request.params as { username: string };
    const cleanUsername = username?.toLowerCase().trim();
    const cacheKey = `storefront:${cleanUsername}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const admin = await prisma.admin.findUnique({
      where: { username: cleanUsername },
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
        mpAccessToken: true,
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

    // Sincronização e auto-reparo de Chave PIX proativo na consulta da loja
    if (admin.pixKey && admin.orderSettings && admin.orderSettings.pixKey !== admin.pixKey.trim()) {
      prisma.orderSettings.update({
        where: { id: admin.orderSettings.id },
        data: { pixKey: admin.pixKey.trim() },
      }).catch(() => {});
    } else if (!admin.pixKey && admin.orderSettings?.pixKey) {
      prisma.admin.update({
        where: { id: admin.id },
        data: { pixKey: admin.orderSettings.pixKey.trim() },
      }).catch(() => {});
    }

    if (admin.orderSettings && !admin.orderSettings.enabled) {
      return reply.status(403).send({ error: 'Esta loja não está aceitando encomendas no momento' });
    }

    // Calcula a data mínima de entrega com base nas configurações e fuso de Brasília
    const minAdvanceDays = admin.orderSettings?.minAdvanceDays || 2;
    const minDeliveryDate = addDaysBrazilian(minAdvanceDays);

    const hasMercadoPago = Boolean(admin.mpAccessToken && admin.mpAccessToken.trim().length > 0);
    // 🛡️ SEGURANÇA: Purga credenciais em memória imediatamente para impedir vazamento acidental
    delete (admin as any).mpAccessToken;
    delete (admin as any).pixKey;

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
        // 🛡️ SEGURANÇA: pixKey e mpAccessToken NUNCA são expostos no GET da vitrine
        // A pixKey só trafega dentro do payload de resposta do POST /order
        hasMercadoPago,
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

    cache.set(cacheKey, responseData, 60);
    return responseData;
  });

  // ═══════════════════════════════════════════════════════════
  // POST /api/store/:username/order — Create public order
  // 🛡️ Rate limit específico: 10 req/min por IP (anti-bot / anti-spam)
  // ═══════════════════════════════════════════════════════════
  app.post('/:username/order', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
        errorResponseBuilder: () => ({
          statusCode: 429,
          error: 'Muitas tentativas. Por favor, aguarde 1 minuto antes de enviar outro pedido.',
        }),
      },
    },
  }, async (request, reply) => {
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
      paymentOption = 'DEPOSIT', // 'DEPOSIT' | 'FULL'
      paymentMethod = 'PIX', // 'PIX' | 'MERCADOPAGO'
    } = request.body as {
      clientName: string;
      clientPhone: string;
      clientEmail?: string;
      deliveryDate: string;
      deliveryTime?: string;
      deliveryType: 'PICKUP' | 'DELIVERY';
      deliveryAddress?: string;
      notes?: string;
      paymentOption?: 'DEPOSIT' | 'FULL';
      paymentMethod?: 'PIX' | 'MERCADOPAGO';
      items: Array<{
        productId: number;
        quantity: number;
        customizations?: Record<string, any>;
        notes?: string;
      }>;
    };

    const { items } = request.body as { items: Array<{ productId: number; quantity: number; customizations?: Record<string, any>; notes?: string }> };

    // ── Validações obrigatórias ──
    if (!clientName || clientName.trim().length < 2) {
      return reply.status(400).send({ error: 'Nome do cliente é obrigatório (mín. 2 caracteres)' });
    }
    if (clientName.trim().length > 120) {
      return reply.status(400).send({ error: 'Nome muito longo (máx. 120 caracteres)' });
    }

    if (!clientPhone || clientPhone.replace(/\D/g, '').length < 10) {
      return reply.status(400).send({ error: 'WhatsApp do cliente é obrigatório e deve ter DDD' });
    }

    // 🛡️ Validação de formato de e-mail (previne XSS/Injection via campo de texto livre)
    if (clientEmail && clientEmail.trim()) {
      if (!EMAIL_REGEX.test(clientEmail.trim())) {
        return reply.status(400).send({ error: 'Formato de e-mail inválido' });
      }
    }

    if (!deliveryDate) {
      return reply.status(400).send({ error: 'Data de entrega/retirada é obrigatória' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return reply.status(400).send({ error: 'O pedido deve conter pelo menos 1 item' });
    }

    // 🛡️ Limite de tamanho dos campos livres (prevenção de payload stuffing / DoS)
    if (deliveryAddress && deliveryAddress.trim().length > 300) {
      return reply.status(400).send({ error: 'Endereço de entrega muito longo (máx. 300 caracteres)' });
    }
    if (notes && notes.trim().length > 500) {
      return reply.status(400).send({ error: 'Observações muito longas (máx. 500 caracteres)' });
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

    // 🛡️ Validação de Segurança: Impede datas no passado ou que violem a antecedência mínima
    const minAdvanceDays = settings?.minAdvanceDays !== undefined ? settings.minAdvanceDays : 1;
    const todayStr = getBrazilianToday();
    const diffDays = diffDaysBrazilian(deliveryDate, todayStr);

    if (diffDays < minAdvanceDays) {
      const minDateFormatted = addDaysBrazilian(minAdvanceDays);
      const [y, m, d] = minDateFormatted.split('-');
      return reply.status(400).send({
        error: `Esta loja exige pelo menos ${minAdvanceDays} dia(s) de antecedência para encomendas. Data mais próxima: ${d}/${m}/${y}`,
      });
    }

    const isFullPayment = paymentOption === 'FULL';
    const baseDepositPct = settings?.depositPercentage !== undefined ? settings.depositPercentage : 50.0;
    const depositPercentage = isFullPayment ? 100.0 : baseDepositPct;
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

      // 🛡️ Limita o tamanho de cada campo de customização
      const sanitizedCustomizations: Record<string, any> = {};
      if (item.customizations) {
        for (const [key, value] of Object.entries(item.customizations)) {
          const safeKey = String(key).substring(0, 100);
          const safeValue = typeof value === 'string' ? value.substring(0, 250) : value;
          sanitizedCustomizations[safeKey] = safeValue;
        }
      }

      orderItemsToCreate.push({
        productName: product.name,
        quantity: qty,
        unitPrice: product.price,
        subtotal: itemSubtotal,
        customizations: JSON.stringify(sanitizedCustomizations),
        notes: (item.notes || '').substring(0, 250),
        productId: product.id,
      });
    }

    if (settings?.minOrderAmount && subtotal < settings.minOrderAmount) {
      return reply.status(400).send({
        error: `O valor mínimo para pedidos nesta loja é de R$ ${settings.minOrderAmount.toFixed(2)}`,
      });
    }

    const total = subtotal + deliveryFee;
    const depositAmount = isFullPayment ? total : (total * depositPercentage) / 100;
    const remainingAmount = Math.max(0, total - depositAmount);

    // 🛡️ Código de rastreamento com 16 chars hexadecimais (mais resistente a enumeração)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `#ENK-${randomSuffix}`;
    const cancellationCode = uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase();

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

    // Invalida cache da vitrine da loja
    cache.invalidate(`storefront:${cleanUsername}`);

    // ═══ Resolução dinâmica de Frontend URL para Links & Webhooks ═══
    const originHeader = (request.headers.origin as string) || (request.headers.referer ? new URL(request.headers.referer as string).origin : '');
    const frontendBaseUrl = originHeader || process.env.FRONTEND_URL || (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',')[0] : 'http://localhost:5173');

    // ═══ Integração de Pagamento de Entrada (Mercado Pago se configurado e solicitado) ═══
    let paymentUrl: string | undefined;
    const mpToken = admin.mpAccessToken || process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (paymentMethod === 'MERCADOPAGO' && mpToken && depositAmount > 0) {
      try {
        const client = new MercadoPagoConfig({ accessToken: mpToken });
        const preference = new Preference(client);

        const pref = await preference.create({
          body: {
            items: [
              {
                id: `order-${order.id}`,
                title: isFullPayment
                  ? `Pagamento Total - Pedido ${order.orderNumber} - ${admin.businessName || admin.username}`
                  : `Entrada (${depositPercentage}%) - Pedido ${order.orderNumber} - ${admin.businessName || admin.username}`,
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
              success: `${frontendBaseUrl}/pedido/${order.orderNumber.replace('#', '')}/rastrear?status=success`,
              failure: `${frontendBaseUrl}/pedido/${order.orderNumber.replace('#', '')}/rastrear?status=failure`,
              pending: `${frontendBaseUrl}/pedido/${order.orderNumber.replace('#', '')}/rastrear?status=pending`,
            },
            auto_return: 'approved',
          },
        });

        paymentUrl = pref.init_point;
      } catch (mpErr) {
        console.error('Erro ao gerar preferência Mercado Pago para encomenda:', mpErr);
      }
    }

    // Informações para pagamento via PIX (prioriza a chave Pix oficial cadastrada no perfil do profissional)
    const storePixKey = admin.pixKey?.trim() || settings?.pixKey?.trim() || admin.phone || '';

    // Garante sincronização em background caso o settings estivesse com chave antiga
    if (admin.pixKey && settings && settings.pixKey !== admin.pixKey.trim()) {
      prisma.orderSettings.update({
        where: { id: settings.id },
        data: { pixKey: admin.pixKey.trim() },
      }).catch(() => {});
    }
    
    // Telefone oficial do WhatsApp do profissional (SEMPRE o cadastrado no perfil)
    let rawAdminPhone = (admin.phone || '').replace(/\D/g, '');
    let formattedWhatsAppPhone = '';
    if (rawAdminPhone.length >= 10) {
      if ((rawAdminPhone.length === 12 || rawAdminPhone.length === 13) && rawAdminPhone.startsWith('55')) {
        formattedWhatsAppPhone = rawAdminPhone;
      } else {
        formattedWhatsAppPhone = `55${rawAdminPhone}`;
      }
    }
    const paymentLabel = isFullPayment ? 'Valor Total (100%)' : `Entrada (${depositPercentage}%)`;

    // Link do WhatsApp com mensagem pré-formatada para o profissional e para o cliente
    const itemsSummary = orderItemsToCreate
      .map((i) => `• ${i.quantity}x ${i.productName} (R$ ${i.subtotal.toFixed(2)})`)
      .join('\n');

    const whatsappMessage = encodeURIComponent(
      `Olá! Acabei de fazer um pedido de encomenda na sua loja!\n\n` +
      `📦 *Pedido:* ${order.orderNumber}\n` +
      `👤 *Cliente:* ${clientName}\n` +
      `📅 *Data desejada:* ${deliveryDate} às ${deliveryTime || '14:00'}\n` +
      `🚗 *Tipo:* ${deliveryType === 'DELIVERY' ? `Entrega em: ${deliveryAddress}` : 'Retirada no local'}\n\n` +
      `*Itens:* \n${itemsSummary}\n\n` +
      `💰 *Total do Pedido:* R$ ${total.toFixed(2)}\n` +
      `💳 *${paymentLabel} para pagar via PIX:* R$ ${depositAmount.toFixed(2)}\n` +
      (remainingAmount > 0 ? `💵 *Restante na entrega:* R$ ${remainingAmount.toFixed(2)}\n\n` : `🎉 *Pagamento integral antecipado!*\n\n`) +
      `Segue o comprovante em anexo! 👇\n\n` +
      `Link do pedido: ${frontendBaseUrl}/pedido/${order.orderNumber.replace('#', '')}/rastrear`
    );

    const whatsappUrl = formattedWhatsAppPhone
      ? `https://wa.me/${formattedWhatsAppPhone}?text=${whatsappMessage}`
      : `https://api.whatsapp.com/send?text=${whatsappMessage}`;

    const trackingCode = order.cancellationCode;
    const trackingUrl = `/pedido/${order.orderNumber.replace('#', '')}/rastrear?code=${trackingCode}`;

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
        clientName: order.clientName,
        clientPhone: order.clientPhone,
      },
      pixInfo: {
        pixKey: storePixKey,
        merchantName: settings?.storeName || admin.businessName || admin.username,
        amount: depositAmount,
        paymentOption: isFullPayment ? 'FULL' : 'DEPOSIT',
        paymentLabel,
        remainingAmount,
        orderNumber: order.orderNumber,
      },
      paymentUrl,
      whatsappUrl,
      trackingUrl,
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GET /api/store/order/:orderNumber/track — Public Order Tracking (Masked PII)
  // 🛡️ Rate limit específico: 30 req/min por IP (anti-enumeração de pedidos)
  // ═══════════════════════════════════════════════════════════
  app.get('/order/:orderNumber/track', {
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
        errorResponseBuilder: () => ({
          statusCode: 429,
          error: 'Muitas consultas. Por favor, aguarde antes de consultar novamente.',
        }),
      },
    },
  }, async (request, reply) => {
    const { orderNumber } = request.params as { orderNumber: string };
    const { code } = (request.query || {}) as { code?: string };
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

    // 🛡️ Prevenção contra Vazamento de Endereços e Dados Pessoais (LGPD / OWASP)
    // Se o código de segurança do pedido foi fornecido e é válido, retorna completo
    const isOwnerAuthorized = code && order.cancellationCode && code.trim().toUpperCase() === order.cancellationCode.toUpperCase();

    if (isOwnerAuthorized) {
      return order;
    }

    // Caso seja consulta anônima ou enumeração de número de pedido, retorna dados mascarados
    const maskName = (name: string) => {
      if (!name) return '';
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].length > 2 ? `${parts[0][0]}***` : parts[0];
      return `${parts[0]} ${parts[parts.length - 1][0]}.`;
    };

    const maskPhone = (phone: string) => {
      if (!phone) return '';
      const digits = phone.replace(/\D/g, '');
      if (digits.length <= 4) return '***';
      return `(${digits.slice(0, 2)}) 9****-${digits.slice(-4)}`;
    };

    const maskEmail = (email: string) => {
      if (!email || !email.includes('@')) return '';
      const [local, domain] = email.split('@');
      return `${local.slice(0, 1)}***@${domain}`;
    };

    const maskAddress = (address: string) => {
      if (!address) return '';
      const parts = address.split('-');
      if (parts.length > 1) {
        return `Rua *** - ${parts.slice(1).join('-').trim()}`;
      }
      return 'Endereço cadastrado para entrega (Oculto por proteção)';
    };

    return {
      ...order,
      clientName: maskName(order.clientName),
      clientPhone: maskPhone(order.clientPhone),
      clientEmail: maskEmail(order.clientEmail),
      deliveryAddress: maskAddress(order.deliveryAddress),
      cancellationCode: undefined, // Nunca expõe o código na consulta anônima
    };
  });
}

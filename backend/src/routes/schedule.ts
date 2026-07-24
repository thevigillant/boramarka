import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { sendWhatsAppMessage, generateBookingMessage } from '../services/whatsapp';
import { checkAndUpdateSubscription } from '../services/subscription';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { getGoogleCalendarEvents } from '../services/googleCalendar';
import { getVapidPublicKey, isPushConfigured } from '../services/pushNotification';

async function cleanupExpiredBookings(token: string) {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const expiredBookings = await prisma.booking.findMany({
    where: {
      status: 'AGUARDANDO_PAGAMENTO',
      createdAt: { lt: fifteenMinutesAgo },
      timeSlot: { link: { token } }
    },
    select: { id: true, timeSlotId: true }
  });

  if (expiredBookings.length > 0) {
    const expiredBookingIds = expiredBookings.map(b => b.id);
    const expiredSlotIds = expiredBookings.map(b => b.timeSlotId);
    await prisma.$transaction([
      prisma.booking.deleteMany({ where: { id: { in: expiredBookingIds } } }),
      prisma.timeSlot.updateMany({
        where: { id: { in: expiredSlotIds } },
        data: { isAvailable: true }
      })
    ]);
    console.log(`[JIT CLEANUP] Liberou ${expiredBookings.length} slots expirados para o link ${token}`);
  }
}

function generateCancellationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'BM-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default async function scheduleRoutes(app: FastifyInstance) {
  // GET /api/schedule/p/:username — Get public profile + services catalog
  app.get('/p/:username', async (request, reply) => {
    const { username } = request.params as { username: string };

    const admin = await prisma.admin.findUnique({
      where: { username },
      select: {
        id: true,
        businessName: true,
        description: true,
        photoUrl: true,
        phone: true,
        address: true,
        accentColor: true,
        secondaryColor: true,
        publicTheme: true,
        bannerUrl: true,
        services: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
            description: true,
            links: {
              select: {
                token: true
              },
              take: 1
            }
          }
        }
      }
    });

    if (!admin) {
      return reply.status(404).send({ error: 'Profissional não encontrado' });
    }

    const sub = await checkAndUpdateSubscription(admin.id);
    const isInactive = sub.status === 'inactive';

    const mappedServices = admin.services.map((s: any) => ({
      id: s.id,
      name: s.name,
      price: s.price,
      duration: s.duration,
      description: s.description,
      token: s.links?.[0]?.token || null
    }));

    return {
      businessName: admin.businessName,
      description: admin.description,
      photoUrl: admin.photoUrl,
      phone: isInactive ? '' : admin.phone,
      address: admin.address,
      services: mappedServices,
      isInactive,
      accentColor: admin.accentColor,
      secondaryColor: admin.secondaryColor,
      publicTheme: admin.publicTheme,
      bannerUrl: admin.bannerUrl,
    };
  });

  // GET /api/schedule/by-host — Get public profile + services catalog by Hostname
  app.get('/by-host', async (request, reply) => {
    const { host } = request.query as { host: string };
    if (!host) {
      return reply.status(400).send({ error: 'Host não informado' });
    }

    // Parse host to determine if it is a subdomain
    const hostname = host.split(':')[0]; // remove port
    const parts = hostname.split('.');
    
    let admin = null;
    
    // Check if it's a subdomain (e.g. salao.boramarka.com.br or salao.localhost)
    const isSubdomain = parts.length > 2 && 
      parts[0] !== 'www' && 
      parts[0] !== 'admin' && 
      parts[0] !== 'api';

    // Also support local testing with subdomains (e.g. salao.localhost)
    const isLocalSubdomain = parts.length === 2 && parts[1] === 'localhost' && parts[0] !== 'www';

    if (isSubdomain || isLocalSubdomain) {
      const subdomain = parts[0];
      admin = await prisma.admin.findUnique({
        where: { username: subdomain },
        include: {
          services: {
            select: {
              id: true,
              name: true,
              price: true,
              duration: true,
              description: true,
              links: {
                select: {
                  token: true
                },
                take: 1
              }
            }
          }
        }
      });
    } else {
      // Custom Domain (e.g. agendar.salao.com)
      admin = await prisma.admin.findFirst({
        where: { customDomain: hostname },
        include: {
          services: {
            select: {
              id: true,
              name: true,
              price: true,
              duration: true,
              description: true,
              links: {
                select: {
                  token: true
                },
                take: 1
              }
            }
          }
        }
      });

      // Verify custom domain requires premium plan
      if (admin) {
        const sub = await checkAndUpdateSubscription(admin.id);
        if (sub.plan !== 'premium' || sub.status !== 'active') {
          return reply.status(403).send({ error: 'Recurso de domínio próprio exclusivo do Plano Premium ativo.' });
        }
      }
    }

    if (!admin) {
      return reply.status(404).send({ error: 'Estabelecimento não encontrado' });
    }

    const sub = await checkAndUpdateSubscription(admin.id);
    const isInactive = sub.status === 'inactive';

    const mappedServices = admin.services.map((s: any) => ({
      id: s.id,
      name: s.name,
      price: s.price,
      duration: s.duration,
      description: s.description,
      token: s.links?.[0]?.token || null
    }));

    return {
      businessName: admin.businessName,
      description: admin.description,
      photoUrl: admin.photoUrl,
      phone: isInactive ? '' : admin.phone,
      address: admin.address,
      services: mappedServices,
      isInactive,
      accentColor: admin.accentColor,
      secondaryColor: admin.secondaryColor,
      publicTheme: admin.publicTheme,
      bannerUrl: admin.bannerUrl,
    };
  });

  // GET /api/schedule/:token — Get available slots for a scheduling link
  app.get('/:token', async (request, reply) => {
    const { token } = request.params as { token: string };

    // Run JIT Cleanup
    await cleanupExpiredBookings(token);

    const link = await prisma.schedulingLink.findUnique({
      where: { token },
      include: {
        service: true,
        admin: true,
        timeSlots: {
          where: { isAvailable: true },
          orderBy: [{ date: 'asc' }, { time: 'asc' }],
          select: {
            id: true,
            date: true,
            time: true,
          },
        },
      },
    });

    if (!link) {
      return reply.status(404).send({ error: 'Link de agendamento não encontrado' });
    }

    const sub = await checkAndUpdateSubscription(link.adminId);
    if (sub.status === 'inactive') {
      return reply.status(403).send({ error: 'Os agendamentos deste profissional estão suspensos temporariamente devido à assinatura pendente.' });
    }

    // Fetch and filter out slots conflicting with Google Calendar if connected
    let filteredTimeSlots = link.timeSlots;
    if (link.timeSlots.length > 0) {
      try {
        const sortedSlots = [...link.timeSlots].sort((a, b) => a.date.localeCompare(b.date));
        const minDate = sortedSlots[0].date;
        const maxDate = sortedSlots[sortedSlots.length - 1].date;
        
        const startISO = `${minDate}T00:00:00Z`;
        const endISO = `${maxDate}T23:59:59Z`;

        const googleEvents = await getGoogleCalendarEvents(link.adminId, startISO, endISO).catch((err) => {
          console.error('Error fetching Google Calendar events for filtering:', err);
          return [];
        });

        if (googleEvents.length > 0) {
          const serviceDuration = link.service?.duration || 30;
          filteredTimeSlots = link.timeSlots.filter(slot => {
            const slotStart = new Date(`${slot.date}T${slot.time}:00`);
            const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60 * 1000);

            for (const event of googleEvents) {
              let eventStart: Date;
              let eventEnd: Date;

              if (event.start.dateTime && event.end.dateTime) {
                eventStart = new Date(event.start.dateTime);
                eventEnd = new Date(event.end.dateTime);
              } else if (event.start.date && event.end.date) {
                eventStart = new Date(`${event.start.date}T00:00:00`);
                eventEnd = new Date(`${event.end.date}T00:00:00`);
              } else {
                continue;
              }

              if (slotStart < eventEnd && slotEnd > eventStart) {
                return false;
              }
            }
            return true;
          });
        }
      } catch (err) {
        console.error('Failed to apply Google Calendar filtering:', err);
      }
    }

    // Group slots by date
    const slotsByDate: Record<string, { id: number; time: string }[]> = {};
    for (const slot of filteredTimeSlots) {
      if (!slotsByDate[slot.date]) {
        slotsByDate[slot.date] = [];
      }
      slotsByDate[slot.date].push({ id: slot.id, time: slot.time });
    }

    // Buscar cupons ativos deste profissional
    const coupons = await prisma.coupon.findMany({
      where: {
        adminId: link.adminId,
        active: true
      },
      select: {
        code: true,
        discountType: true,
        discountValue: true
      }
    });

    // Buscar upsells/serviços adicionais recomendados para este serviço
    let availableUpsells: any[] = [];
    if (link.serviceId) {
      const specificUpsells = await prisma.serviceUpsell.findMany({
        where: { mainServiceId: link.serviceId },
        include: {
          addonService: {
            select: {
              id: true,
              name: true,
              price: true,
              duration: true,
              description: true,
              upsellDiscount: true,
            },
          },
        },
      });

      if (specificUpsells.length > 0) {
        availableUpsells = specificUpsells.map((u) => u.addonService);
      }
    }

    // Fallback: se não houver upsells específicos cadastrados, oferecer outros serviços ativos do mesmo profissional
    if (availableUpsells.length === 0) {
      availableUpsells = await prisma.service.findMany({
        where: {
          adminId: link.adminId,
          isUpsellable: true,
          id: link.serviceId ? { not: link.serviceId } : undefined,
        },
        select: {
          id: true,
          name: true,
          price: true,
          duration: true,
          description: true,
          upsellDiscount: true,
        },
        take: 6,
      });
    }

    return {
      title: link.title,
      dates: Object.keys(slotsByDate).sort(),
      slotsByDate,
      bookingFeeEnabled: link.bookingFeeEnabled,
      bookingFeeAmount: link.bookingFeeAmount,
      serviceName: link.service?.name || '',
      servicePrice: link.service?.price || 0,
      activeCoupons: coupons,
      availableUpsells,
      accentColor: link.admin.accentColor,
      secondaryColor: link.admin.secondaryColor,
      publicTheme: link.admin.publicTheme,
    };
  });

  // POST /api/schedule/:token/book — Book a time slot
  app.post('/:token/book', async (request, reply) => {
    const { token } = request.params as { token: string };
    const { timeSlotId, clientName, clientPhone, payFullPrice, addonIds } = request.body as {
      timeSlotId: number;
      clientName: string;
      clientPhone: string;
      payFullPrice?: boolean;
      addonIds?: number[];
    };

    // Validate input
    if (!timeSlotId || !clientName?.trim() || !clientPhone?.trim()) {
      return reply.status(400).send({
        error: 'Nome, telefone e horário são obrigatórios',
      });
    }

    // Clean phone number (keep only digits)
    const cleanPhone = clientPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 13) {
      return reply.status(400).send({
        error: 'Número de telefone inválido',
      });
    }

    // Run JIT Cleanup before booking
    await cleanupExpiredBookings(token);

    // Verify the link exists
    const link = await prisma.schedulingLink.findUnique({
      where: { token },
      include: { service: true }
    });
    if (!link) {
      return reply.status(404).send({ error: 'Link não encontrado' });
    }

    const sub = await checkAndUpdateSubscription(link.adminId);
    if (sub.status === 'inactive') {
      return reply.status(403).send({ error: 'Os agendamentos deste profissional estão suspensos temporariamente devido à assinatura pendente.' });
    }

    // Verify slot exists, belongs to this link, and is available
    const slot = await prisma.timeSlot.findFirst({
      where: {
        id: timeSlotId,
        linkId: link.id,
      },
    });

    if (!slot) {
      return reply.status(404).send({ error: 'Horário não encontrado' });
    }

    if (!slot.isAvailable) {
      return reply.status(409).send({ error: 'Este horário já foi reservado. Escolha outro.' });
    }

    // Check if client has active subscription
    const activeSub = await prisma.clientSubscription.findFirst({
      where: {
        clientPhone: cleanPhone,
        status: 'active',
        expiresAt: { gt: new Date() },
        plan: { adminId: link.adminId }
      }
    });

    const isFeeRequired = link.bookingFeeEnabled && link.bookingFeeAmount > 0 && !activeSub;

    // Fetch addon details & calculate total amount
    const mainPrice = link.service?.price || 0;
    let computedTotal = mainPrice;
    const selectedAddonsData: Array<{ id: number; name: string; price: number; duration: number }> = [];

    if (Array.isArray(addonIds) && addonIds.length > 0) {
      const addons = await prisma.service.findMany({
        where: {
          id: { in: addonIds },
          adminId: link.adminId,
          isUpsellable: true,
        },
      });

      for (const addon of addons) {
        const discount = addon.upsellDiscount > 0 ? addon.upsellDiscount : 0;
        const finalPrice = Math.max(0, addon.price * (1 - discount / 100));
        computedTotal += finalPrice;
        selectedAddonsData.push({
          id: addon.id,
          name: addon.name,
          price: finalPrice,
          duration: addon.duration,
        });
      }
    }

    // Check if Booking Fee is enabled and required (not bypassed by active membership)
    if (isFeeRequired) {
      const admin = await prisma.admin.findUnique({
        where: { id: link.adminId },
        select: { mpAccessToken: true, businessName: true, phone: true }
      });

      if (!admin?.mpAccessToken) {
        return reply.status(400).send({
          error: 'Este profissional ainda não configurou as credenciais do Mercado Pago para receber a taxa de agendamento.'
        });
      }

      // Create booking in "AGUARDANDO_PAGAMENTO" state
      const booking = await prisma.$transaction(async (tx) => {
        const freshSlot = await tx.timeSlot.findUnique({ where: { id: timeSlotId } });
        if (!freshSlot?.isAvailable) {
          throw new Error('SLOT_TAKEN');
        }

        await tx.timeSlot.update({
          where: { id: timeSlotId },
          data: { isAvailable: false },
        });

        return tx.booking.create({
          data: {
            clientName: clientName.trim(),
            clientPhone: cleanPhone,
            timeSlotId,
            status: 'AGUARDANDO_PAGAMENTO',
            cancellationCode: generateCancellationCode(),
            selectedAddons: JSON.stringify(selectedAddonsData),
            totalAmount: computedTotal,
          },
          include: {
            timeSlot: true,
          },
        });
      }).catch((err) => {
        if (err.message === 'SLOT_TAKEN') {
          return null;
        }
        throw err;
      });

      if (!booking) {
        return reply.status(409).send({ error: 'Este horário acabou de ser reservado. Escolha outro.' });
      }

      // Determine payment amount: full computed price or just the booking fee
      const paymentAmount = payFullPrice && computedTotal > 0
        ? computedTotal
        : link.bookingFeeAmount;
      const paymentLabel = payFullPrice && link.service?.price
        ? `Pagamento Total - ${admin.businessName || 'Profissional'}`
        : `Taxa de Agendamento - ${admin.businessName || 'Profissional'}`;

      // If mpAccessToken is SIMULADOR, return simulation URL
      if (admin.mpAccessToken === 'SIMULADOR') {
        return reply.status(201).send({
          booking: {
            id: booking.id,
            clientName: booking.clientName,
            clientPhone: booking.clientPhone,
            date: booking.timeSlot.date,
            time: booking.timeSlot.time,
            cancellationCode: booking.cancellationCode,
          },
          paymentRequired: true,
          paymentAmount,
          payFullPrice: !!payFullPrice,
          paymentUrl: `/agendar/${token}/pagar-simulado?bookingId=${booking.id}`,
        });
      } else {
        // Create actual Mercado Pago Preference
        try {
          const mpClient = new MercadoPagoConfig({ accessToken: admin.mpAccessToken });
          const preference = new Preference(mpClient);

          const baseUrl = process.env.CORS_ORIGIN 
            ? process.env.CORS_ORIGIN.split(',')[0] 
            : 'http://localhost:5173';
          const backendUrl = process.env.BACKEND_URL || process.env.RAILWAY_STATIC_URL || 'http://localhost:3001';

          const response = await preference.create({
            body: {
              items: [
                {
                  id: `fee_${booking.id}`,
                  title: paymentLabel,
                  quantity: 1,
                  unit_price: paymentAmount,
                  currency_id: 'BRL',
                }
              ],
              external_reference: booking.id.toString(),
              back_urls: {
                success: `${baseUrl}/agendar/${token}/sucesso?bookingId=${booking.id}&payment=success`,
                failure: `${baseUrl}/agendar/${token}/sucesso?bookingId=${booking.id}&payment=failure`,
                pending: `${baseUrl}/agendar/${token}/sucesso?bookingId=${booking.id}&payment=pending`
              },
              auto_return: 'approved',
              ...(backendUrl.startsWith('https://') ? { notification_url: `${backendUrl}/api/schedule/webhook` } : {})
            }
          });

          return reply.status(201).send({
            booking: {
              id: booking.id,
              clientName: booking.clientName,
              clientPhone: booking.clientPhone,
              date: booking.timeSlot.date,
              time: booking.timeSlot.time,
              cancellationCode: booking.cancellationCode,
            },
            paymentRequired: true,
            paymentAmount,
            payFullPrice: !!payFullPrice,
            paymentUrl: response.init_point,
          });
        } catch (error) {
          console.error('Erro ao gerar checkout do profissional:', error);
          // Rollback booking creation
          await prisma.$transaction([
            prisma.booking.delete({ where: { id: booking.id } }),
            prisma.timeSlot.update({ where: { id: timeSlotId }, data: { isAvailable: true } })
          ]);
          return reply.status(500).send({ error: 'Erro ao conectar ao Mercado Pago do profissional.' });
        }
      }
    }

    // Normal Flow (no booking fee required)
    const booking = await prisma.$transaction(async (tx) => {
      const freshSlot = await tx.timeSlot.findUnique({ where: { id: timeSlotId } });
      if (!freshSlot?.isAvailable) {
        throw new Error('SLOT_TAKEN');
      }

      await tx.timeSlot.update({
        where: { id: timeSlotId },
        data: { isAvailable: false },
      });

      return tx.booking.create({
        data: {
          clientName: clientName.trim(),
          clientPhone: cleanPhone,
          timeSlotId,
          status: 'PENDENTE',
          cancellationCode: generateCancellationCode(),
          selectedAddons: JSON.stringify(selectedAddonsData),
          totalAmount: computedTotal,
        },
        include: {
          timeSlot: true,
        },
      });
    }).catch((err) => {
      if (err.message === 'SLOT_TAKEN') {
        return null;
      }
      throw err;
    });

    if (!booking) {
      return reply.status(409).send({ error: 'Este horário acabou de ser reservado. Escolha outro.' });
    }

    // Generate and send WhatsApp message to client with cancellation link
    const frontendUrl = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',')[0] : 'http://localhost:5173';
    const cancelUrl = `${frontendUrl}/agendar/cancelar/${token}/${booking.id}?code=${booking.cancellationCode}`;
    const message = generateBookingMessage(
      clientName.trim(),
      booking.timeSlot.date,
      booking.timeSlot.time,
      link.service?.name,
      booking.cancellationCode,
      cancelUrl
    );
    const whatsappResult = await sendWhatsAppMessage(cleanPhone, message);

    // Notify the professional via WhatsApp
    const adminForNotify = await prisma.admin.findUnique({
      where: { id: link.adminId },
      select: { phone: true, businessName: true }
    });
    if (adminForNotify?.phone) {
      const formattedDate = booking.timeSlot.date.split('-').reverse().join('/');
      const adminMsg = [
        `🔔 *Novo Agendamento!*`,
        '',
        `👤 Cliente: *${clientName.trim()}*`,
        `📞 Tel: ${cleanPhone}`,
        `📅 Data: *${formattedDate}*`,
        `🕐 Hora: *${booking.timeSlot.time}*`,
        `💼 Serviço: *${link.service?.name || 'Serviço'}*`,
        `🔑 Cód. Cancelamento: *${booking.cancellationCode}*`,
        '',
        `Confira no seu painel BoraMarka! 🚀`,
      ].join('\n');
      await sendWhatsAppMessage(adminForNotify.phone, adminMsg);
    }

    return reply.status(201).send({
      booking: {
        id: booking.id,
        clientName: booking.clientName,
        clientPhone: booking.clientPhone,
        date: booking.timeSlot.date,
        time: booking.timeSlot.time,
        cancellationCode: booking.cancellationCode,
      },
      whatsapp: whatsappResult,
    });
  });

  // GET /api/schedule/booking/:id — Get details of a booking
  app.get('/booking/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
      include: {
        timeSlot: {
          include: {
            link: {
              include: {
                admin: {
                  select: {
                    businessName: true,
                    phone: true,
                    username: true
                  }
                },
                service: {
                  select: {
                    name: true,
                    price: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!booking) {
      return reply.status(404).send({ error: 'Agendamento não encontrado' });
    }

    return {
      id: booking.id,
      clientName: booking.clientName,
      clientPhone: booking.clientPhone,
      date: booking.timeSlot.date,
      time: booking.timeSlot.time,
      businessName: booking.timeSlot.link.admin.businessName,
      businessPhone: booking.timeSlot.link.admin.phone,
      businessUsername: booking.timeSlot.link.admin.username,
      serviceName: booking.timeSlot.link.service?.name || 'Serviço',
      price: booking.timeSlot.link.service?.price || 0,
      paidAmount: booking.paidAmount,
      status: booking.status,
      cancellationCode: booking.cancellationCode,
      refundStatus: booking.refundStatus,
    };
  });

  // POST /api/schedule/booking/:id/cancel — Public cancellation with 2-hour deadline check & refund handling
  app.post('/booking/:id/cancel', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { code } = (request.body || {}) as { code?: string };

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
      include: {
        timeSlot: {
          include: {
            link: {
              include: {
                admin: {
                  select: {
                    id: true,
                    businessName: true,
                    phone: true
                  }
                },
                service: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!booking) {
      return reply.status(404).send({ error: 'Agendamento não encontrado' });
    }

    // Optional validation of cancellation code if supplied
    if (code && booking.cancellationCode && code.trim().toUpperCase() !== booking.cancellationCode.toUpperCase()) {
      return reply.status(400).send({ error: 'Código de cancelamento inválido.' });
    }

    // Check cancellation policy (2-hour limit)
    const appointmentDate = new Date(`${booking.timeSlot.date}T${booking.timeSlot.time}:00-03:00`);
    const now = new Date();
    const diffMs = appointmentDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 2) {
      return reply.status(400).send({
        error: 'PRAZO_LIMITE_EXPIRADO',
        message: 'Cancelamentos online só são permitidos com até 2 horas de antecedência. Por favor, entre em contato direto com o profissional.',
        businessPhone: booking.timeSlot.link.admin.phone
      });
    }

    // Free the time slot so another client can book it immediately
    await prisma.timeSlot.update({
      where: { id: booking.timeSlotId },
      data: { isAvailable: true },
    });

    const isRefundPending = booking.paidAmount > 0;

    if (isRefundPending) {
      // Mark booking as CANCELADO with PENDING refund status
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CANCELADO',
          refundStatus: 'PENDING',
          refundAmount: booking.paidAmount
        }
      });

      // Notify Professional via WhatsApp
      const adminPhone = booking.timeSlot.link.admin.phone;
      if (adminPhone) {
        const formattedDate = booking.timeSlot.date.split('-').reverse().join('/');
        const adminRefundMsg = [
          `⚠️ *Solicitação de Estorno!*`,
          '',
          `👤 Cliente: *${booking.clientName}* (${booking.clientPhone})`,
          `💼 Serviço: *${booking.timeSlot.link.service?.name || 'Serviço'}*`,
          `📅 Data: *${formattedDate} às ${booking.timeSlot.time}*`,
          `💰 Sinal/Valor Pago: *R$ ${booking.paidAmount.toFixed(2)}*`,
          '',
          `O agendamento foi cancelado e a vaga liberada. Acesse seu painel BoraMarka para processar o estorno! 🚀`
        ].join('\n');
        await sendWhatsAppMessage(adminPhone, adminRefundMsg);
      }

      // Notify Client via WhatsApp
      const formattedDate = booking.timeSlot.date.split('-').reverse().join('/');
      const clientCancelMsg = [
        `❌ *Agendamento Cancelado!*`,
        '',
        `Olá ${booking.clientName}, seu agendamento para *${booking.timeSlot.link.service?.name || 'Serviço'}* em ${formattedDate} às *${booking.timeSlot.time}* foi cancelado.`,
        '',
        `💰 *Reembolso/Estorno:* Como havia um sinal de *R$ ${booking.paidAmount.toFixed(2)}* pago, a solicitação de estorno foi enviada ao profissional para devolução.`,
      ].join('\n');
      await sendWhatsAppMessage(booking.clientPhone, clientCancelMsg);

      return {
        success: true,
        refundPending: true,
        refundAmount: booking.paidAmount,
        message: 'Agendamento cancelado com sucesso. A solicitação de estorno do sinal foi enviada ao profissional.'
      };
    } else {
      // Normal cancellation without paid deposit
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'CANCELADO' }
      });

      // Send WhatsApp notification
      const cancelMessage = `❌ *Cancelamento automático:* Olá ${booking.clientName}, seu agendamento para *${booking.timeSlot.link.service?.name || 'Serviço'}* no dia ${booking.timeSlot.date} às *${booking.timeSlot.time}* foi CANCELADO com sucesso.`;
      await sendWhatsAppMessage(booking.clientPhone, cancelMessage);

      return { success: true, refundPending: false };
    }
  });

  // POST /api/schedule/booking/:id/reschedule — Public reschedule with 2-hour deadline check
  app.post('/booking/:id/reschedule', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { newTimeSlotId } = request.body as { newTimeSlotId: number };

    if (!newTimeSlotId) {
      return reply.status(400).send({ error: 'Novo horário não especificado.' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
      include: {
        timeSlot: {
          include: {
            link: {
              include: {
                admin: {
                  select: {
                    businessName: true,
                    phone: true
                  }
                },
                service: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!booking) {
      return reply.status(404).send({ error: 'Agendamento não encontrado.' });
    }

    // Check rescheduling policy (2-hour limit)
    const appointmentDate = new Date(`${booking.timeSlot.date}T${booking.timeSlot.time}:00-03:00`);
    const now = new Date();
    const diffMs = appointmentDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 2) {
      return reply.status(400).send({
        error: 'PRAZO_LIMITE_EXPIRADO',
        message: 'Reagendamentos online só são permitidos com até 2 horas de antecedência. Por favor, entre em contato direto com o profissional.',
        businessPhone: booking.timeSlot.link.admin.phone
      });
    }

    // Verify new slot is available and belongs to the same scheduling link
    const newSlot = await prisma.timeSlot.findUnique({
      where: { id: newTimeSlotId },
    });

    if (!newSlot || !newSlot.isAvailable || newSlot.linkId !== booking.timeSlot.linkId) {
      return reply.status(400).send({ error: 'O horário selecionado não está mais disponível.' });
    }

    // Reschedule: Atomic swap of slot availability and booking assignment
    await prisma.$transaction(async (tx) => {
      // 1. Free old slot
      await tx.timeSlot.update({
        where: { id: booking.timeSlotId },
        data: { isAvailable: true }
      });
      // 2. Reserve new slot
      await tx.timeSlot.update({
        where: { id: newTimeSlotId },
        data: { isAvailable: false }
      });
      // 3. Update booking
      await tx.booking.update({
        where: { id: booking.id },
        data: { timeSlotId: newTimeSlotId }
      });
    });

    // Send WhatsApp notification
    const rescheduleMessage = `🗓️ *Remarcação automática:* Olá ${booking.clientName}, seu agendamento para *${booking.timeSlot.link.service?.name || 'Serviço'}* foi alterado de *${booking.timeSlot.date} às ${booking.timeSlot.time}* para o dia *${newSlot.date} às ${newSlot.time}* com sucesso.`;
    await sendWhatsAppMessage(booking.clientPhone, rescheduleMessage);

    return { success: true };
  });

  // POST /api/schedule/booking/:id/confirm-simulation — Public endpoint to simulate payment approval
  app.post('/booking/:id/confirm-simulation', async (request, reply) => {
    const { id } = request.params as { id: string };

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
      include: {
        timeSlot: {
          include: {
            link: {
              include: { service: true, admin: true }
            }
          }
        }
      }
    });

    if (!booking) {
      return reply.status(404).send({ error: 'Agendamento não encontrado' });
    }

    if (booking.status !== 'AGUARDANDO_PAGAMENTO') {
      return { success: true, message: 'Agendamento já processado.' };
    }

    // Determine the payment amount — check if the original preference was for full price
    const link = booking.timeSlot.link;
    const servicePrice = link.service?.price || 0;
    const feeAmount = link.bookingFeeAmount;
    // If paidAmount would be service price, it was a full payment; otherwise it's the fee
    // We'll use request body to determine, but for simulation we check a query param or default to fee
    const { payFullPrice } = request.body as { payFullPrice?: boolean };
    const paidAmount = payFullPrice ? servicePrice : feeAmount;
    const isFullPayment = payFullPrice && servicePrice > 0;
    const paymentLabel = isFullPayment ? 'Pagamento Total do Serviço' : 'Taxa de Agendamento';

    // Update status and paidAmount
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'PAGO', paidAmount }
    });

    // Create transaction in professional's cash flow
    await prisma.transaction.create({
      data: {
        type: 'receivable',
        description: `${paymentLabel} - ${booking.clientName}`,
        amount: paidAmount,
        dueDate: new Date().toISOString().split('T')[0],
        paid: true,
        paidAt: new Date().toISOString().split('T')[0],
        clientName: booking.clientName,
        category: paymentLabel,
        notes: 'Pago via Simulador de Testes',
        adminId: link.adminId
      }
    });

    // Send WhatsApp notification to client
    const formattedDate = booking.timeSlot.date.split('-').reverse().join('/');
    const clientMsg = [
      `Olá, ${booking.clientName}! ✅`,
      '',
      isFullPayment
        ? `Seu agendamento foi *confirmado*! Recebemos o pagamento total de R$ ${paidAmount.toFixed(2)}. Nada a pagar no dia! 🎉`
        : `Seu agendamento foi *confirmado*! Recebemos o pagamento da taxa de agendamento de R$ ${paidAmount.toFixed(2)}.`,
      `📅 Data: *${formattedDate}*`,
      `🕐 Hora: *${booking.timeSlot.time}*`,
      `💼 Serviço: *${link.service?.name || 'Serviço'}*`,
      '',
      `Obrigado pela preferência! 😊`,
    ].join('\n');
    await sendWhatsAppMessage(booking.clientPhone, clientMsg);

    // Notify the professional via WhatsApp
    if (link.admin?.phone) {
      const adminMsg = [
        `🔔 *Novo Agendamento Confirmado!*`,
        '',
        `👤 Cliente: *${booking.clientName}*`,
        `📞 Tel: ${booking.clientPhone}`,
        `📅 Data: *${formattedDate}*`,
        `🕐 Hora: *${booking.timeSlot.time}*`,
        `💼 Serviço: *${link.service?.name || 'Serviço'}*`,
        `💰 ${paymentLabel}: *R$ ${paidAmount.toFixed(2)}*`,
        '',
        `Confira no seu painel BoraMarka! 🚀`,
      ].join('\n');
      await sendWhatsAppMessage(link.admin.phone, adminMsg);
    }

    return {
      success: true,
      booking: {
        id: updated.id,
        clientName: updated.clientName,
        clientPhone: updated.clientPhone,
        date: booking.timeSlot.date,
        time: booking.timeSlot.time
      }
    };
  });

  // POST /api/schedule/webhook-fee — Webhook for client payments
  app.post('/webhook-fee', async (request, reply) => {
    // Return 200 immediately to Mercado Pago
    reply.status(200).send();

    const query = request.query as any;
    const body = request.body as any;
    const type = query.type || body?.type;
    const dataId = query['data.id'] || body?.data?.id;

    if (type === 'payment' && dataId) {
      try {
        const admins = await prisma.admin.findMany({
          where: { mpAccessToken: { notIn: ['', 'SIMULADOR'] } },
          select: { id: true, mpAccessToken: true }
        });

        let paymentInfo = null;
        let matchedAdmin = null;

        for (const admin of admins) {
          const response = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
            headers: { Authorization: `Bearer ${admin.mpAccessToken}` }
          });
          if (response.ok) {
            paymentInfo = await response.json();
            matchedAdmin = admin;
            break;
          }
        }

        if (paymentInfo && paymentInfo.status === 'approved' && matchedAdmin) {
          const bookingId = parseInt(paymentInfo.external_reference);
          if (!isNaN(bookingId)) {
            const booking = await prisma.booking.findUnique({
              where: { id: bookingId },
              include: {
                timeSlot: {
                  include: {
                    link: {
                      include: { service: true }
                    }
                  }
                }
              }
            });

            if (booking && booking.status === 'AGUARDANDO_PAGAMENTO') {
              // Determine if this was a full payment or just the fee
              // We compare the payment amount with the service price
              const paidMpAmount = paymentInfo.transaction_amount || booking.timeSlot.link.bookingFeeAmount;
              const servicePrice = booking.timeSlot.link.service?.price || 0;
              const isFullPayment = servicePrice > 0 && paidMpAmount >= servicePrice;
              const paymentLabel = isFullPayment ? 'Pagamento Total do Serviço' : 'Taxa de Agendamento';

              // Update status and paidAmount
              await prisma.booking.update({
                where: { id: bookingId },
                data: { status: 'PAGO', paidAmount: paidMpAmount }
              });

              // Create transaction
              await prisma.transaction.create({
                data: {
                  type: 'receivable',
                  description: `${paymentLabel} - ${booking.clientName}`,
                  amount: paidMpAmount,
                  dueDate: new Date().toISOString().split('T')[0],
                  paid: true,
                  paidAt: new Date().toISOString().split('T')[0],
                  clientName: booking.clientName,
                  category: paymentLabel,
                  notes: `Pago via Mercado Pago (Ref: ${dataId})`,
                  adminId: matchedAdmin.id
                }
              });

              // Send WhatsApp message to client
              const formattedDate = booking.timeSlot.date.split('-').reverse().join('/');
              const clientMessage = [
                `Olá, ${booking.clientName}! ✅`,
                '',
                isFullPayment
                  ? `Seu agendamento foi *confirmado*! Recebemos o pagamento total de R$ ${paidMpAmount.toFixed(2)}. Nada a pagar no dia! 🎉`
                  : `Seu agendamento foi *confirmado*! Recebemos o pagamento da taxa de agendamento de R$ ${paidMpAmount.toFixed(2)}.`,
                `📅 Data: *${formattedDate}*`,
                `🕐 Hora: *${booking.timeSlot.time}*`,
                `💼 Serviço: *${booking.timeSlot.link.service?.name || 'Serviço'}*`,
                '',
                `Obrigado pela preferência! 😊`,
              ].join('\n');
              await sendWhatsAppMessage(booking.clientPhone, clientMessage);

              // Notify the professional via WhatsApp
              const adminForWebhook = await prisma.admin.findUnique({
                where: { id: matchedAdmin.id },
                select: { phone: true }
              });
              if (adminForWebhook?.phone) {
                const adminMsg = [
                  `🔔 *Novo Agendamento Confirmado!*`,
                  '',
                  `👤 Cliente: *${booking.clientName}*`,
                  `📞 Tel: ${booking.clientPhone}`,
                  `📅 Data: *${formattedDate}*`,
                  `🕐 Hora: *${booking.timeSlot.time}*`,
                  `💼 Serviço: *${booking.timeSlot.link.service?.name || 'Serviço'}*`,
                  `💰 ${paymentLabel}: *R$ ${paidMpAmount.toFixed(2)}*`,
                  '',
                  `Confira no seu painel BoraMarka! 🚀`,
                ].join('\n');
                await sendWhatsAppMessage(adminForWebhook.phone, adminMsg);
              }

              console.log(`✅ Webhook-Fee: ${paymentLabel} de R$ ${paidMpAmount} para Booking ID ${bookingId}`);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao processar webhook-fee do Mercado Pago:', error);
      }
    }
  });

  // GET /api/schedule/:token/validate-coupon — Validate a coupon code
  app.get('/:token/validate-coupon', async (request, reply) => {
    const { token } = request.params as { token: string };
    const { code } = request.query as { code: string };

    if (!code?.trim()) {
      return reply.status(400).send({ error: 'Código do cupom é obrigatório' });
    }

    const cleanCode = code.trim().toUpperCase();

    const link = await prisma.schedulingLink.findUnique({
      where: { token }
    });

    if (!link) {
      return reply.status(404).send({ error: 'Link de agendamento não encontrado' });
    }

    const coupon = await prisma.coupon.findFirst({
      where: {
        adminId: link.adminId,
        code: cleanCode,
        active: true
      }
    });

    if (!coupon) {
      return reply.status(404).send({ error: 'Cupom inválido ou expirado' });
    }

    return {
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue
    };
  });

  // GET /api/schedule/:token/validate-subscription — Verify if client has an active subscription
  app.get('/:token/validate-subscription', async (request, reply) => {
    const { token } = request.params as { token: string };
    const { phone } = request.query as { phone: string };

    if (!phone?.trim()) {
      return reply.status(400).send({ error: 'Telefone é obrigatório' });
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');

    const link = await prisma.schedulingLink.findUnique({
      where: { token }
    });

    if (!link) {
      return reply.status(404).send({ error: 'Link de agendamento não encontrado' });
    }

    // Find any active client subscription for this admin's membership plans
    const subscription = await prisma.clientSubscription.findFirst({
      where: {
        clientPhone: cleanPhone,
        status: 'active',
        expiresAt: { gt: new Date() },
        plan: { adminId: link.adminId }
      },
      include: {
        plan: true
      }
    });

    if (!subscription) {
      return { active: false };
    }

    return {
      active: true,
      clientName: subscription.clientName,
      planName: subscription.plan.name,
      expiresAt: subscription.expiresAt
    };
  });

  // ═══════════════════════════════════════════
  //  PUSH NOTIFICATIONS (PUBLIC)
  // ═══════════════════════════════════════════

  // GET /api/schedule/vapid-key — Public VAPID key for client subscription
  app.get('/vapid-key', async () => {
    const key = getVapidPublicKey();
    return { vapidPublicKey: key, configured: isPushConfigured() };
  });

  // POST /api/schedule/push-subscribe — Register push subscription for a client
  app.post('/push-subscribe', async (request, reply) => {
    const { token, subscription, clientPhone } = request.body as {
      token: string;
      subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
      clientPhone: string;
    };

    if (!token || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth || !clientPhone) {
      return reply.status(400).send({ error: 'Dados incompletos para registar push subscription.' });
    }

    // Find the scheduling link to get adminId
    const link = await prisma.schedulingLink.findUnique({
      where: { token },
      select: { adminId: true },
    });

    if (!link) {
      return reply.status(404).send({ error: 'Link de agendamento não encontrado.' });
    }

    const cleanPhone = clientPhone.replace(/\D/g, '');

    // Upsert — avoid duplicate subscriptions for same endpoint
    const existing = await prisma.pushSubscription.findFirst({
      where: { endpoint: subscription.endpoint, adminId: link.adminId },
    });

    if (existing) {
      await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          clientPhone: cleanPhone,
        },
      });
    } else {
      await prisma.pushSubscription.create({
        data: {
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          clientPhone: cleanPhone,
          adminId: link.adminId,
        },
      });
    }

    console.log(`🔔 Push subscription registada para ${cleanPhone} (admin ${link.adminId})`);
    return { success: true };
  });
}

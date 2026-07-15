import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { sendWhatsAppMessage, generateBookingMessage } from '../services/whatsapp';
import { checkAndUpdateSubscription } from '../services/subscription';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { getGoogleCalendarEvents } from '../services/googleCalendar';

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

    return {
      title: link.title,
      dates: Object.keys(slotsByDate).sort(),
      slotsByDate,
      bookingFeeEnabled: link.bookingFeeEnabled,
      bookingFeeAmount: link.bookingFeeAmount,
      serviceName: link.service?.name || '',
      servicePrice: link.service?.price || 0,
    };
  });

  // POST /api/schedule/:token/book — Book a time slot
  app.post('/:token/book', async (request, reply) => {
    const { token } = request.params as { token: string };
    const { timeSlotId, clientName, clientPhone } = request.body as {
      timeSlotId: number;
      clientName: string;
      clientPhone: string;
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

    // Check if Booking Fee is enabled and required (not bypassed by active membership)
    if (isFeeRequired) {
      const admin = await prisma.admin.findUnique({
        where: { id: link.adminId },
        select: { mpAccessToken: true, businessName: true }
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

      // If mpAccessToken is SIMULADOR, return simulation URL
      if (admin.mpAccessToken === 'SIMULADOR') {
        return reply.status(201).send({
          booking: {
            id: booking.id,
            clientName: booking.clientName,
            clientPhone: booking.clientPhone,
            date: booking.timeSlot.date,
            time: booking.timeSlot.time,
          },
          paymentRequired: true,
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

          const response = await preference.create({
            body: {
              items: [
                {
                  id: `fee_${booking.id}`,
                  title: `Taxa de Agendamento - ${admin.businessName || 'Profissional'}`,
                  quantity: 1,
                  unit_price: link.bookingFeeAmount,
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
            }
          });

          return reply.status(201).send({
            booking: {
              id: booking.id,
              clientName: booking.clientName,
              clientPhone: booking.clientPhone,
              date: booking.timeSlot.date,
              time: booking.timeSlot.time,
            },
            paymentRequired: true,
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

    // Generate and send WhatsApp message
    const message = generateBookingMessage(
      clientName.trim(),
      booking.timeSlot.date,
      booking.timeSlot.time
    );
    const whatsappResult = await sendWhatsAppMessage(cleanPhone, message);

    return reply.status(201).send({
      booking: {
        id: booking.id,
        clientName: booking.clientName,
        clientPhone: booking.clientPhone,
        date: booking.timeSlot.date,
        time: booking.timeSlot.time,
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
    };
  });

  // POST /api/schedule/booking/:id/cancel — Public cancellation with 2-hour deadline check
  app.post('/booking/:id/cancel', async (request, reply) => {
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

    // Check cancellation policy (2-hour limit)
    // Parse date and time in Brazilian timezone (-03:00)
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

    // Cancel booking: Restore slot and delete booking
    await prisma.$transaction(async (tx) => {
      await tx.timeSlot.update({
        where: { id: booking.timeSlotId },
        data: { isAvailable: true },
      });
      await tx.booking.delete({
        where: { id: booking.id }
      });
    });

    // Send WhatsApp notification
    const cancelMessage = `❌ *Cancelamento automático:* Olá ${booking.clientName}, seu agendamento para *${booking.timeSlot.link.service?.name || 'Serviço'}* no dia ${booking.timeSlot.date} às *${booking.timeSlot.time}* foi CANCELADO com sucesso.`;
    await sendWhatsAppMessage(booking.clientPhone, cancelMessage);

    return { success: true };
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

    // Update status to PAGO
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'PAGO' }
    });

    // Create fee transaction in professional's cash flow
    const link = booking.timeSlot.link;
    await prisma.transaction.create({
      data: {
        type: 'receivable',
        description: `Taxa de Agendamento - ${booking.clientName}`,
        amount: link.bookingFeeAmount,
        dueDate: new Date().toISOString().split('T')[0],
        paid: true,
        paidAt: new Date().toISOString().split('T')[0],
        clientName: booking.clientName,
        category: 'Taxa de Agendamento',
        notes: 'Pago via Simulador de Testes',
        adminId: link.adminId
      }
    });

    // Send WhatsApp notification
    const formattedDate = booking.timeSlot.date.split('-').reverse().join('/');
    const message = [
      `Olá, ${booking.clientName}! ✅`,
      '',
      `Seu agendamento foi *confirmado*! Recebemos o pagamento da taxa de agendamento de R$ ${link.bookingFeeAmount.toFixed(2)}.`,
      `📅 Data: *${formattedDate}*`,
      `🕐 Hora: *${booking.timeSlot.time}*`,
      `💼 Serviço: *${link.service?.name || 'Serviço'}*`,
      '',
      `Obrigado pela preferência! 😊`,
    ].join('\n');

    await sendWhatsAppMessage(booking.clientPhone, message);

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
              // Update status to PAGO
              await prisma.booking.update({
                where: { id: bookingId },
                data: { status: 'PAGO' }
              });

              // Create transaction
              await prisma.transaction.create({
                data: {
                  type: 'receivable',
                  description: `Taxa de Agendamento - ${booking.clientName}`,
                  amount: booking.timeSlot.link.bookingFeeAmount,
                  dueDate: new Date().toISOString().split('T')[0],
                  paid: true,
                  paidAt: new Date().toISOString().split('T')[0],
                  clientName: booking.clientName,
                  category: 'Taxa de Agendamento',
                  notes: `Pago via Mercado Pago (Ref: ${dataId})`,
                  adminId: matchedAdmin.id
                }
              });

              // Send WhatsApp message
              const formattedDate = booking.timeSlot.date.split('-').reverse().join('/');
              const message = [
                `Olá, ${booking.clientName}! ✅`,
                '',
                `Seu agendamento foi *confirmado*! Recebemos o pagamento da taxa de agendamento de R$ ${booking.timeSlot.link.bookingFeeAmount.toFixed(2)}.`,
                `📅 Data: *${formattedDate}*`,
                `🕐 Hora: *${booking.timeSlot.time}*`,
                `💼 Serviço: *${booking.timeSlot.link.service?.name || 'Serviço'}*`,
                '',
                `Obrigado pela preferência! 😊`,
              ].join('\n');

              await sendWhatsAppMessage(booking.clientPhone, message);
              console.log(`✅ Webhook-Fee: Pagamento aprovado de R$ ${booking.timeSlot.link.bookingFeeAmount} para Booking ID ${bookingId}`);
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
}

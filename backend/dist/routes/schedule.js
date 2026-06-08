"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = scheduleRoutes;
const db_1 = require("../db");
const whatsapp_1 = require("../services/whatsapp");
async function scheduleRoutes(app) {
    // GET /api/schedule/p/:username — Get all links for an admin profile
    app.get('/p/:username', async (request, reply) => {
        const { username } = request.params;
        const admin = await db_1.prisma.admin.findUnique({
            where: { username },
            select: {
                id: true,
                businessName: true,
                description: true,
                photoUrl: true,
                phone: true,
                address: true,
                links: {
                    where: { deletedAt: null },
                    select: {
                        id: true,
                        token: true,
                        title: true,
                        service: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                duration: true,
                                description: true
                            }
                        }
                    }
                },
                services: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        duration: true,
                        description: true
                    }
                }
            }
        });
        if (!admin) {
            return reply.status(404).send({ error: 'Profissional não encontrado' });
        }
        // Build a unified service list: services that have links use the link token,
        // services without links are still shown but without a booking link
        const linkedServiceIds = new Set(admin.links.filter(l => l.service).map(l => l.service.id));
        const unlinkedServices = admin.services
            .filter(s => !linkedServiceIds.has(s.id))
            .map(s => ({
            id: null,
            token: null,
            title: s.name,
            service: s
        }));
        return {
            businessName: admin.businessName,
            description: admin.description,
            photoUrl: admin.photoUrl,
            phone: admin.phone,
            address: admin.address,
            links: [...admin.links, ...unlinkedServices]
        };
    });
    // GET /api/schedule/:token — Get available slots for a scheduling link
    app.get('/:token', async (request, reply) => {
        const { token } = request.params;
        const link = await db_1.prisma.schedulingLink.findUnique({
            where: { token },
            include: {
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
        // Group slots by date
        const slotsByDate = {};
        for (const slot of link.timeSlots) {
            if (!slotsByDate[slot.date]) {
                slotsByDate[slot.date] = [];
            }
            slotsByDate[slot.date].push({ id: slot.id, time: slot.time });
        }
        return {
            title: link.title,
            dates: Object.keys(slotsByDate).sort(),
            slotsByDate,
        };
    });
    // POST /api/schedule/:token/book — Book a time slot
    app.post('/:token/book', async (request, reply) => {
        const { token } = request.params;
        const { timeSlotId, clientName, clientPhone } = request.body;
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
        // Verify the link exists
        const link = await db_1.prisma.schedulingLink.findUnique({
            where: { token },
        });
        if (!link) {
            return reply.status(404).send({ error: 'Link não encontrado' });
        }
        // Verify slot exists, belongs to this link, and is available
        const slot = await db_1.prisma.timeSlot.findFirst({
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
        // Create booking and mark slot as unavailable (atomic transaction)
        const booking = await db_1.prisma.$transaction(async (tx) => {
            // Double-check availability inside transaction
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
        const message = (0, whatsapp_1.generateBookingMessage)(clientName.trim(), booking.timeSlot.date, booking.timeSlot.time);
        const whatsappResult = await (0, whatsapp_1.sendWhatsAppMessage)(cleanPhone, message);
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
}

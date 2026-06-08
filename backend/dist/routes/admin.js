"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = adminRoutes;
const db_1 = require("../db");
const auth_1 = require("../plugins/auth");
const uuid_1 = require("uuid");
async function adminRoutes(app) {
    // All admin routes require authentication
    app.addHook('onRequest', auth_1.authenticate);
    // ═══════════════════════════════════════════
    //  STATS
    // ═══════════════════════════════════════════
    app.get('/stats', async (request) => {
        const user = request.user;
        const [totalLinks, totalSlots, totalBookings, availableSlots] = await Promise.all([
            db_1.prisma.schedulingLink.count({ where: { adminId: user.id } }),
            db_1.prisma.timeSlot.count({ where: { link: { adminId: user.id } } }),
            db_1.prisma.booking.count({ where: { timeSlot: { link: { adminId: user.id } } } }),
            db_1.prisma.timeSlot.count({ where: { isAvailable: true, link: { adminId: user.id } } }),
        ]);
        return { totalLinks, totalSlots, totalBookings, availableSlots };
    });
    // ═══════════════════════════════════════════
    //  PROFILE
    // ═══════════════════════════════════════════
    app.get('/profile', async (request) => {
        const user = request.user;
        const admin = await db_1.prisma.admin.findUnique({ where: { id: user.id } });
        if (!admin)
            return { error: 'Não encontrado' };
        return {
            username: admin.username,
            businessName: admin.businessName,
            cnpj: admin.cnpj,
            phone: admin.phone,
            description: admin.description,
            photoUrl: admin.photoUrl,
            address: admin.address,
            operatingHours: admin.operatingHours,
        };
    });
    app.put('/profile', async (request) => {
        const user = request.user;
        const { businessName, cnpj, phone, description, photoUrl, address, operatingHours } = request.body;
        const admin = await db_1.prisma.admin.update({
            where: { id: user.id },
            data: {
                ...(businessName !== undefined && { businessName: businessName.trim() }),
                ...(cnpj !== undefined && { cnpj: cnpj.trim() }),
                ...(phone !== undefined && { phone: phone.trim() }),
                ...(description !== undefined && { description: description.trim() }),
                ...(photoUrl !== undefined && { photoUrl: photoUrl.trim() }),
                ...(address !== undefined && { address: address.trim() }),
                ...(operatingHours !== undefined && { operatingHours }),
            },
        });
        return {
            username: admin.username,
            businessName: admin.businessName,
            cnpj: admin.cnpj,
            phone: admin.phone,
            description: admin.description,
            photoUrl: admin.photoUrl,
            address: admin.address,
            operatingHours: admin.operatingHours,
        };
    });
    // ═══════════════════════════════════════════
    //  SCHEDULING LINKS
    // ═══════════════════════════════════════════
    // List all links with stats
    app.get('/links', async (request, reply) => {
        const user = request.user;
        const links = await db_1.prisma.schedulingLink.findMany({
            where: {
                adminId: user.id,
                deletedAt: null // Only non-deleted links
            },
            include: {
                service: true,
                _count: {
                    select: { timeSlots: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        // We need to calculate availability manually since it depends on bookings
        const linksWithStats = await Promise.all(links.map(async (link) => {
            const slots = await db_1.prisma.timeSlot.findMany({
                where: { linkId: link.id },
                include: { booking: true }
            });
            const totalSlots = slots.length;
            const bookedSlots = slots.filter(s => s.booking).length;
            const availableSlots = slots.filter(s => s.isAvailable && !s.booking).length;
            return {
                ...link,
                totalSlots,
                bookedSlots,
                availableSlots
            };
        }));
        return reply.send(linksWithStats);
    });
    // Get deleted links (Recycle Bin)
    app.get('/links/deleted', async (request, reply) => {
        const user = request.user;
        const links = await db_1.prisma.schedulingLink.findMany({
            where: {
                adminId: user.id,
                deletedAt: { not: null }
            },
            include: { service: true },
            orderBy: { deletedAt: 'desc' }
        });
        return reply.send(links);
    });
    // Create new link
    app.post('/links', async (request, reply) => {
        const user = request.user;
        const { title, serviceId } = request.body;
        const link = await db_1.prisma.schedulingLink.create({
            data: {
                token: (0, uuid_1.v4)(),
                title: title?.trim() || 'Agendamento',
                adminId: user.id,
                ...(serviceId && { serviceId }),
            },
        });
        return reply.status(201).send(link);
    });
    // Soft delete link
    app.delete('/links/:id', async (request, reply) => {
        const user = request.user;
        const { id } = request.params;
        try {
            console.log(`[BACKEND] Soft deleting link ${id} for user ${user.id}`);
            const result = await db_1.prisma.schedulingLink.updateMany({
                where: { id: parseInt(id), adminId: user.id },
                data: { deletedAt: new Date() }
            });
            if (result.count === 0) {
                return reply.status(404).send({ error: 'Link não encontrado ou permissão negada' });
            }
            return reply.status(204).send();
        }
        catch (error) {
            return reply.status(500).send({ error: error.message });
        }
    });
    // Restore link
    app.put('/links/:id/restore', async (request, reply) => {
        const user = request.user;
        const { id } = request.params;
        try {
            const result = await db_1.prisma.schedulingLink.updateMany({
                where: { id: parseInt(id), adminId: user.id },
                data: { deletedAt: null }
            });
            if (result.count === 0)
                return reply.status(404).send({ error: 'Link não encontrado' });
            return reply.status(200).send({ success: true });
        }
        catch (error) {
            return reply.status(500).send({ error: error.message });
        }
    });
    // Permanent delete link
    app.delete('/links/:id/permanent', async (request, reply) => {
        const user = request.user;
        const { id } = request.params;
        try {
            const result = await db_1.prisma.schedulingLink.deleteMany({
                where: { id: parseInt(id), adminId: user.id }
            });
            if (result.count === 0)
                return reply.status(404).send({ error: 'Link não encontrado' });
            return reply.status(204).send();
        }
        catch (error) {
            return reply.status(500).send({ error: error.message });
        }
    });
    // Regenerate link token
    app.put('/links/:id/regenerate', async (request, reply) => {
        const user = request.user;
        const { id } = request.params;
        try {
            const link = await db_1.prisma.schedulingLink.update({
                where: { id: parseInt(id), adminId: user.id },
                data: { token: (0, uuid_1.v4)() },
            });
            return link;
        }
        catch {
            return reply.status(404).send({ error: 'Link não encontrado' });
        }
    });
    // ═══════════════════════════════════════════
    //  TIME SLOTS
    // ═══════════════════════════════════════════
    // List slots for a link
    app.get('/slots', async (request, reply) => {
        const user = request.user;
        const { linkId } = request.query;
        if (!linkId) {
            return reply.status(400).send({ error: 'linkId é obrigatório' });
        }
        const slots = await db_1.prisma.timeSlot.findMany({
            where: {
                linkId: parseInt(linkId),
                link: { adminId: user.id }
            },
            include: {
                booking: {
                    select: {
                        id: true,
                        clientName: true,
                        clientPhone: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: [{ date: 'asc' }, { time: 'asc' }],
        });
        return slots;
    });
    // Create multiple slots
    app.post('/slots', async (request, reply) => {
        const user = request.user;
        const { linkId, slots } = request.body;
        if (!linkId || !slots || !slots.length) {
            return reply.status(400).send({ error: 'linkId e slots são obrigatórios' });
        }
        // Verify link exists and belongs to admin
        const link = await db_1.prisma.schedulingLink.findFirst({
            where: { id: linkId, adminId: user.id }
        });
        if (!link) {
            return reply.status(404).send({ error: 'Link não encontrado' });
        }
        // Check for duplicate slots
        const existingSlots = await db_1.prisma.timeSlot.findMany({
            where: { linkId },
            select: { date: true, time: true },
        });
        const existingSet = new Set(existingSlots.map((s) => `${s.date}_${s.time}`));
        const newSlots = slots.filter((s) => !existingSet.has(`${s.date}_${s.time}`));
        if (newSlots.length === 0) {
            return reply.status(400).send({ error: 'Todos os horários já existem' });
        }
        const created = await db_1.prisma.timeSlot.createMany({
            data: newSlots.map((s) => ({
                date: s.date,
                time: s.time,
                linkId,
                isAvailable: true,
            })),
        });
        return reply.status(201).send({
            count: created.count,
            skipped: slots.length - newSlots.length,
        });
    });
    // Delete a slot
    app.delete('/slots/:id', async (request, reply) => {
        const user = request.user;
        const { id } = request.params;
        try {
            // Deleta apenas se pertencer ao admin
            const slot = await db_1.prisma.timeSlot.findFirst({
                where: { id: parseInt(id), link: { adminId: user.id } }
            });
            if (!slot)
                return reply.status(404).send({ error: 'Horário não encontrado' });
            await db_1.prisma.timeSlot.delete({ where: { id: parseInt(id) } });
            return reply.status(204).send();
        }
        catch {
            return reply.status(404).send({ error: 'Horário não encontrado' });
        }
    });
    // ═══════════════════════════════════════════
    //  BOOKINGS
    // ═══════════════════════════════════════════
    // List bookings (optionally filtered by link)
    app.get('/bookings', async (request) => {
        const user = request.user;
        const { linkId } = request.query;
        const where = { timeSlot: { link: { adminId: user.id } } };
        if (linkId)
            where.timeSlot.linkId = parseInt(linkId);
        const bookings = await db_1.prisma.booking.findMany({
            where,
            include: {
                timeSlot: {
                    include: {
                        link: {
                            include: {
                                service: true
                            }
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return bookings;
    });
    // Confirm booking status
    app.put('/bookings/:id/confirm', async (request, reply) => {
        const user = request.user;
        const { id } = request.params;
        const booking = await db_1.prisma.booking.findFirst({
            where: {
                id: parseInt(id),
                timeSlot: { link: { adminId: user.id } }
            }
        });
        if (!booking) {
            return reply.status(404).send({ error: 'Agendamento não encontrado' });
        }
        const updated = await db_1.prisma.booking.update({
            where: { id: parseInt(id) },
            data: { status: 'CONFIRMADO' }
        });
        return updated;
    });
    // Create booking manually by admin
    app.post('/bookings/manual', async (request, reply) => {
        const user = request.user;
        const { linkId, date, time, clientName, clientPhone } = request.body;
        if (!linkId || !date || !time || !clientName?.trim() || !clientPhone?.trim()) {
            return reply.status(400).send({ error: 'Todos os campos são obrigatórios' });
        }
        // Verify link exists and belongs to admin
        const link = await db_1.prisma.schedulingLink.findFirst({
            where: { id: linkId, adminId: user.id }
        });
        if (!link) {
            return reply.status(404).send({ error: 'Link de agendamento não encontrado' });
        }
        // Clean phone number
        const cleanPhone = clientPhone.replace(/\D/g, '');
        if (cleanPhone.length < 10 || cleanPhone.length > 13) {
            return reply.status(400).send({ error: 'Número de telefone inválido' });
        }
        // Check if slot exists or create it
        let slot = await db_1.prisma.timeSlot.findFirst({
            where: {
                linkId,
                date,
                time
            }
        });
        if (slot && !slot.isAvailable) {
            return reply.status(409).send({ error: 'Este horário já está reservado.' });
        }
        // Execute slot creation (if needed) and booking in a transaction
        const booking = await db_1.prisma.$transaction(async (tx) => {
            if (!slot) {
                slot = await tx.timeSlot.create({
                    data: {
                        linkId,
                        date,
                        time,
                        isAvailable: false
                    }
                });
            }
            else {
                // Mark existing slot as unavailable
                await tx.timeSlot.update({
                    where: { id: slot.id },
                    data: { isAvailable: false }
                });
            }
            return tx.booking.create({
                data: {
                    clientName: clientName.trim(),
                    clientPhone: cleanPhone,
                    timeSlotId: slot.id,
                    status: 'CONFIRMADO' // Manual booking is confirmed by default
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
                }
            });
        });
        return reply.status(201).send(booking);
    });
    // Cancel booking (restore slot availability)
    app.delete('/bookings/:id', async (request, reply) => {
        const user = request.user;
        const { id } = request.params;
        const booking = await db_1.prisma.booking.findFirst({
            where: {
                id: parseInt(id),
                timeSlot: { link: { adminId: user.id } }
            },
        });
        if (!booking) {
            return reply.status(404).send({ error: 'Agendamento não encontrado' });
        }
        // Restore slot and delete booking in a transaction
        await db_1.prisma.$transaction(async (tx) => {
            await tx.timeSlot.update({
                where: { id: booking.timeSlotId },
                data: { isAvailable: true },
            });
            await tx.booking.delete({ where: { id: parseInt(id) } });
        });
        return reply.status(204).send();
    });
}

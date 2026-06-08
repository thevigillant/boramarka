"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = serviceRoutes;
const db_1 = require("../db");
const auth_1 = require("../plugins/auth");
async function serviceRoutes(app) {
    app.addHook('onRequest', auth_1.authenticate);
    // GET /api/services — List all services for the admin
    app.get('/', async (request) => {
        const user = request.user;
        return db_1.prisma.service.findMany({
            where: { adminId: user.id },
            orderBy: { name: 'asc' },
        });
    });
    // POST /api/services — Create a new service
    app.post('/', async (request, reply) => {
        const user = request.user;
        const { name, description, price, duration } = request.body;
        if (!name || price === undefined || !duration) {
            return reply.status(400).send({ error: 'Nome, preço e duração são obrigatórios' });
        }
        const service = await db_1.prisma.service.create({
            data: {
                name,
                description,
                price,
                duration,
                adminId: user.id,
            },
        });
        return reply.status(201).send(service);
    });
    // PUT /api/services/:id — Update a service
    app.put('/:id', async (request, reply) => {
        const user = request.user;
        const { id } = request.params;
        const { name, description, price, duration } = request.body;
        try {
            const updated = await db_1.prisma.service.update({
                where: { id: parseInt(id), adminId: user.id },
                data: {
                    ...(name && { name }),
                    ...(description !== undefined && { description }),
                    ...(price !== undefined && { price }),
                    ...(duration !== undefined && { duration }),
                },
            });
            return updated;
        }
        catch {
            return reply.status(404).send({ error: 'Serviço não encontrado' });
        }
    });
    // DELETE /api/services/:id — Delete a service
    app.delete('/:id', async (request, reply) => {
        const user = request.user;
        const { id } = request.params;
        try {
            await db_1.prisma.service.delete({
                where: { id: parseInt(id), adminId: user.id },
            });
            return reply.status(204).send();
        }
        catch {
            return reply.status(404).send({ error: 'Serviço não encontrado' });
        }
    });
}

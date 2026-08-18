import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authenticate } from '../plugins/auth';
import { v4 as uuidv4 } from 'uuid';
import { createAuditLog } from '../utils/auditLogger';
import { checkQuota } from '../services/subscription';

import { cache } from '../utils/cache';
import { createServiceSchema } from '../utils/validators';

export default async function serviceRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  // GET /api/services — List all services for the admin with their upsell recommendations
  app.get('/', async (request) => {
    const user = request.user as { id: number };
    const cacheKey = `services:${user.id}`;

    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const services = await prisma.service.findMany({
      where: { adminId: user.id },
      include: {
        mainUpsells: {
          include: {
            addonService: {
              select: {
                id: true,
                name: true,
                price: true,
                duration: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    cache.set(cacheKey, services, 120); // 2 minutos de cache para lista estática
    return services;
  });

  // POST /api/services — Create a new service and automatically create its scheduling link + upsell relations
  app.post('/', async (request, reply) => {
    const user = request.user as { id: number };
    const parsed = createServiceSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message });
    }
    const { name, description, price, duration, isUpsellable, upsellDiscount, addonServiceIds, photoUrl } = parsed.data;

    const quota = await checkQuota(user.id, 'services');
    if (!quota.allowed) {
      return reply.status(403).send({ error: quota.message });
    }

    const service = await prisma.$transaction(async (tx) => {
      const s = await tx.service.create({
        data: {
          name: name.trim(),
          description: description?.trim(),
          price,
          duration,
          photoUrl: photoUrl || '',
          isUpsellable: isUpsellable !== undefined ? isUpsellable : true,
          upsellDiscount: upsellDiscount || 0.0,
          adminId: user.id,
        },
      });

      // Link creation
      await tx.schedulingLink.create({
        data: {
          token: uuidv4(),
          title: name.trim(),
          serviceId: s.id,
          adminId: user.id,
        },
      });

      // Addon service relations (Upsell)
      if (Array.isArray(addonServiceIds) && addonServiceIds.length > 0) {
        await tx.serviceUpsell.createMany({
          data: addonServiceIds.map((addonId) => ({
            mainServiceId: s.id,
            addonServiceId: addonId,
          })),
        });
      }

      return s;
    });

    await createAuditLog(request, {
      action: 'CREATE_SERVICE',
      entity: 'SERVICE',
      entityId: service.id,
      details: `Cadastrou o serviço "${service.name}" (R$ ${price.toFixed(2)}, ${duration} min)`,
      adminId: user.id,
    });

    cache.invalidate(`services:${user.id}`);
    return reply.status(201).send(service);
  });

  // PUT /api/services/:id — Update a service and its upsell relations
  app.put('/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const { name, description, price, duration, isUpsellable, upsellDiscount, addonServiceIds, photoUrl } = request.body as {
      name?: string;
      description?: string;
      price?: number;
      duration?: number;
      isUpsellable?: boolean;
      upsellDiscount?: number;
      addonServiceIds?: number[];
      photoUrl?: string;
    };

    const serviceId = parseInt(id);

    try {
      const updated = await prisma.$transaction(async (tx) => {
        const s = await tx.service.update({
          where: { id: serviceId, adminId: user.id },
          data: {
            ...(name && { name: name.trim() }),
            ...(description !== undefined && { description: description?.trim() }),
            ...(price !== undefined && { price }),
            ...(duration !== undefined && { duration }),
            ...(isUpsellable !== undefined && { isUpsellable }),
            ...(upsellDiscount !== undefined && { upsellDiscount }),
            ...(photoUrl !== undefined && { photoUrl }),
          },
        });

        // Sync upsell addon relations if provided
        if (Array.isArray(addonServiceIds)) {
          // Delete existing relations
          await tx.serviceUpsell.deleteMany({
            where: { mainServiceId: serviceId },
          });

          // Create new relations
          if (addonServiceIds.length > 0) {
            await tx.serviceUpsell.createMany({
              data: addonServiceIds.map((addonId) => ({
                mainServiceId: serviceId,
                addonServiceId: addonId,
              })),
            });
          }
        }

        return s;
      });

      await createAuditLog(request, {
        action: 'UPDATE_SERVICE',
        entity: 'SERVICE',
        entityId: updated.id,
        details: `Atualizou os dados do serviço "${updated.name}"`,
        adminId: user.id,
      });

      cache.invalidate(`services:${user.id}`);
      return updated;
    } catch {
      return reply.status(404).send({ error: 'Serviço não encontrado' });
    }
  });

  // DELETE /api/services/:id — Delete a service
  app.delete('/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };

    try {
      const serviceToDelete = await prisma.service.findFirst({
        where: { id: parseInt(id), adminId: user.id },
      });

      await prisma.$transaction(async (tx) => {
        await tx.schedulingLink.deleteMany({
          where: { serviceId: parseInt(id), adminId: user.id },
        });

        await tx.service.delete({
          where: { id: parseInt(id), adminId: user.id },
        });
      });

      await createAuditLog(request, {
        action: 'DELETE_SERVICE',
        entity: 'SERVICE',
        entityId: id,
        details: `Excluiu o serviço "${serviceToDelete?.name || id}"`,
        adminId: user.id,
      });

      cache.invalidate(`services:${user.id}`);
      return reply.status(204).send();
    } catch {
      return reply.status(404).send({ error: 'Serviço não encontrado' });
    }
  });
}

import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authenticate } from '../plugins/auth';

export default async function securityRoutes(app: FastifyInstance) {
  // GET /api/security/permissions — List all user permissions for the current business
  app.get('/permissions', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user as { id: number };

    const permissions = await prisma.userPermission.findMany({
      where: { adminId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return permissions;
  });

  // POST /api/security/permissions — Create a new user permission profile/operator
  app.post('/permissions', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user as { id: number };
    const {
      userName,
      email,
      roleTitle,
      canViewBookings,
      canManageBookings,
      canViewFinance,
      canManageFinance,
      canManageServices,
      canViewClients,
      canManageClients,
      canManageLoyalty,
      canManageStaff,
      canManageSettings,
      canViewAuditLogs,
      active,
    } = request.body as any;

    if (!userName || !userName.trim()) {
      return reply.status(400).send({ error: 'O nome do usuário/operador é obrigatório.' });
    }

    const permission = await prisma.userPermission.create({
      data: {
        adminId: user.id,
        userName: userName.trim(),
        email: email?.trim() || '',
        roleTitle: roleTitle?.trim() || 'Operador',
        canViewBookings: canViewBookings ?? true,
        canManageBookings: canManageBookings ?? true,
        canViewFinance: canViewFinance ?? false,
        canManageFinance: canManageFinance ?? false,
        canManageServices: canManageServices ?? false,
        canViewClients: canViewClients ?? true,
        canManageClients: canManageClients ?? false,
        canManageLoyalty: canManageLoyalty ?? false,
        canManageStaff: canManageStaff ?? false,
        canManageSettings: canManageSettings ?? false,
        canViewAuditLogs: canViewAuditLogs ?? false,
        active: active ?? true,
      },
    });

    return permission;
  });

  // PUT /api/security/permissions/:id — Update a user permission profile
  app.put('/permissions/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const permId = parseInt(id, 10);

    const existing = await prisma.userPermission.findFirst({
      where: { id: permId, adminId: user.id },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Perfil de permissão não encontrado.' });
    }

    const {
      userName,
      email,
      roleTitle,
      canViewBookings,
      canManageBookings,
      canViewFinance,
      canManageFinance,
      canManageServices,
      canViewClients,
      canManageClients,
      canManageLoyalty,
      canManageStaff,
      canManageSettings,
      canViewAuditLogs,
      active,
    } = request.body as any;

    const updated = await prisma.userPermission.update({
      where: { id: permId },
      data: {
        userName: userName !== undefined ? userName.trim() : existing.userName,
        email: email !== undefined ? email.trim() : existing.email,
        roleTitle: roleTitle !== undefined ? roleTitle.trim() : existing.roleTitle,
        canViewBookings: canViewBookings ?? existing.canViewBookings,
        canManageBookings: canManageBookings ?? existing.canManageBookings,
        canViewFinance: canViewFinance ?? existing.canViewFinance,
        canManageFinance: canManageFinance ?? existing.canManageFinance,
        canManageServices: canManageServices ?? existing.canManageServices,
        canViewClients: canViewClients ?? existing.canViewClients,
        canManageClients: canManageClients ?? existing.canManageClients,
        canManageLoyalty: canManageLoyalty ?? existing.canManageLoyalty,
        canManageStaff: canManageStaff ?? existing.canManageStaff,
        canManageSettings: canManageSettings ?? existing.canManageSettings,
        canViewAuditLogs: canViewAuditLogs ?? existing.canViewAuditLogs,
        active: active ?? existing.active,
      },
    });

    return updated;
  });

  // DELETE /api/security/permissions/:id — Delete a user permission profile
  app.delete('/permissions/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const permId = parseInt(id, 10);

    const existing = await prisma.userPermission.findFirst({
      where: { id: permId, adminId: user.id },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Perfil de permissão não encontrado.' });
    }

    await prisma.userPermission.delete({
      where: { id: permId },
    });

    return { success: true, message: 'Perfil de permissão removido com sucesso.' };
  });
}

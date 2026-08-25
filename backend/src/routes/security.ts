import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { authenticate, requirePermission } from '../plugins/auth';

export default async function securityRoutes(app: FastifyInstance) {
  // GET /api/security/permissions — List all user permissions for the current business
  app.get('/permissions', { preHandler: [authenticate, requirePermission('canSeguranca')] }, async (request, reply) => {
    const user = request.user as { id: number };

    const permissions = await prisma.userPermission.findMany({
      where: { adminId: user.id },
      select: {
        id: true,
        userName: true,
        email: true,
        roleTitle: true,
        active: true,
        canAgendamentos: true,
        canEstornos: true,
        canClientes: true,
        canHorarios: true,
        canServicos: true,
        canLinks: true,
        canCupons: true,
        canMemberships: true,
        canFinanceiro: true,
        canRh: true,
        canFaturamento: true,
        canSeguranca: true,
        canPersonalizar: true,
        canSocial: true,
        canAudit: true,
        canTrash: true,
        createdAt: true,
        updatedAt: true,
        // 🛡️ Oculta passwordHash por segurança
      },
      orderBy: { createdAt: 'desc' },
    });

    return permissions;
  });

  // POST /api/security/permissions — Create a new user permission profile/operator with password
  app.post('/permissions', { preHandler: [authenticate, requirePermission('canSeguranca')] }, async (request, reply) => {
    const user = request.user as { id: number };
    const body = request.body as any;

    if (!body.userName || !body.userName.trim()) {
      return reply.status(400).send({ error: 'O nome do usuário/operador é obrigatório.' });
    }

    const passwordHash = body.password && body.password.trim() 
      ? await bcrypt.hash(body.password.trim(), 10) 
      : '';

    const permission = await prisma.userPermission.create({
      data: {
        adminId: user.id,
        userName: body.userName.trim(),
        email: body.email?.trim() || '',
        passwordHash,
        roleTitle: body.roleTitle?.trim() || 'Operador',
        
        // 📅 Operacional
        canAgendamentos: body.canAgendamentos ?? true,
        canEstornos: body.canEstornos ?? false,
        canClientes: body.canClientes ?? true,
        canHorarios: body.canHorarios ?? true,
        
        // 💼 Comercial
        canServicos: body.canServicos ?? false,
        canLinks: body.canLinks ?? false,
        canCupons: body.canCupons ?? false,
        canMemberships: body.canMemberships ?? false,
        
        // 💰 Gestão & Finanças
        canFinanceiro: body.canFinanceiro ?? false,
        canRh: body.canRh ?? false,
        canFaturamento: body.canFaturamento ?? false,
        
        // 🎨 Sistema & Ajustes
        canSeguranca: body.canSeguranca ?? false,
        canPersonalizar: body.canPersonalizar ?? false,
        canSocial: body.canSocial ?? false,
        canAudit: body.canAudit ?? false,
        canTrash: body.canTrash ?? false,

        active: body.active ?? true,
      },
    });

    const { passwordHash: _, ...safePermission } = permission;
    return safePermission;
  });

  // PUT /api/security/permissions/:id — Update a user permission profile / password
  app.put('/permissions/:id', { preHandler: [authenticate, requirePermission('canSeguranca')] }, async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const permId = parseInt(id, 10);

    const existing = await prisma.userPermission.findFirst({
      where: { id: permId, adminId: user.id },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Perfil de permissão não encontrado.' });
    }

    const body = request.body as any;

    const passwordHash = body.password && body.password.trim()
      ? await bcrypt.hash(body.password.trim(), 10)
      : existing.passwordHash;

    const updated = await prisma.userPermission.update({
      where: { id: permId },
      data: {
        userName: body.userName !== undefined ? body.userName.trim() : existing.userName,
        email: body.email !== undefined ? body.email.trim() : existing.email,
        passwordHash,
        roleTitle: body.roleTitle !== undefined ? body.roleTitle.trim() : existing.roleTitle,
        
        // 📅 Operacional
        canAgendamentos: body.canAgendamentos ?? existing.canAgendamentos,
        canEstornos: body.canEstornos ?? existing.canEstornos,
        canClientes: body.canClientes ?? existing.canClientes,
        canHorarios: body.canHorarios ?? existing.canHorarios,
        
        // 💼 Comercial
        canServicos: body.canServicos ?? existing.canServicos,
        canLinks: body.canLinks ?? existing.canLinks,
        canCupons: body.canCupons ?? existing.canCupons,
        canMemberships: body.canMemberships ?? existing.canMemberships,
        
        // 💰 Gestão & Finanças
        canFinanceiro: body.canFinanceiro ?? existing.canFinanceiro,
        canRh: body.canRh ?? existing.canRh,
        canFaturamento: body.canFaturamento ?? existing.canFaturamento,
        
        // 🎨 Sistema & Ajustes
        canSeguranca: body.canSeguranca ?? existing.canSeguranca,
        canPersonalizar: body.canPersonalizar ?? existing.canPersonalizar,
        canSocial: body.canSocial ?? existing.canSocial,
        canAudit: body.canAudit ?? existing.canAudit,
        canTrash: body.canTrash ?? existing.canTrash,
        active: body.active ?? existing.active,
      },
    });

    const { passwordHash: _, ...safeUpdated } = updated;
    return safeUpdated;
  });

  // DELETE /api/security/permissions/:id — Delete a user permission profile
  app.delete('/permissions/:id', { preHandler: [authenticate, requirePermission('canSeguranca')] }, async (request, reply) => {
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

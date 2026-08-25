import { FastifyRequest, FastifyReply } from 'fastify';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const user = request.user as { id?: number; role?: string };
    
    // 🛡️ Previne vazamento cross-tenant: Tokens de funcionário do Portal não podem acessar rotas de gestão de lojista
    if (user?.role === 'employee') {
      return reply.status(403).send({
        error: 'Acesso restrito ao painel de gestão. Tokens do Portal do Funcionário não têm autorização para acessar esta área.'
      });
    }
  } catch (err) {
    return reply.status(401).send({ error: 'Não autorizado. Faça login novamente.' });
  }
}

/**
 * 🛡️ Middleware para validação de permissões granulares de Operadores no Backend
 */
export function requirePermission(permissionKey: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as { id: number; role: string; permissions?: Record<string, boolean> };
      
      // Administradores e SuperAdmins possuem acesso total
      if (!user || user.role === 'superadmin' || user.role === 'admin' || user.role === 'user') {
        return;
      }

      // Se for operador, valida a flag de permissão
      if (user.role === 'operator') {
        if (!user.permissions || !user.permissions[permissionKey]) {
          return reply.status(403).send({
            error: `Acesso negado. Seu perfil de operador não possui a permissão "${permissionKey}".`
          });
        }
      }
    } catch (err) {
      return reply.status(401).send({ error: 'Não autorizado.' });
    }
  };
}

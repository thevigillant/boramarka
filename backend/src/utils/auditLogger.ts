import { FastifyRequest } from 'fastify';
import { prisma } from '../db';

interface AuditLogOptions {
  action: string;
  entity: string;
  entityId?: string | number;
  details?: string;
  adminId: number;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
}

function parseUserAgent(uaString: string): string {
  if (!uaString) return 'Dispositivo Desconhecido';

  let os = 'Outro SO';
  if (uaString.includes('Windows')) os = 'Windows';
  else if (uaString.includes('Mac OS') || uaString.includes('Macintosh')) os = 'macOS';
  else if (uaString.includes('Android')) os = 'Android';
  else if (uaString.includes('iPhone') || uaString.includes('iPad')) os = 'iOS';
  else if (uaString.includes('Linux')) os = 'Linux';

  let browser = 'Navegador';
  if (uaString.includes('Edg/')) browser = 'Edge';
  else if (uaString.includes('Chrome/')) browser = 'Chrome';
  else if (uaString.includes('Firefox/')) browser = 'Firefox';
  else if (uaString.includes('Safari/') && !uaString.includes('Chrome/')) browser = 'Safari';
  else if (uaString.includes('OPR/') || uaString.includes('Opera/')) browser = 'Opera';

  return `${os} • ${browser}`;
}

function calculateSeverity(action: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO' {
  if (action.startsWith('DELETE') || action === 'CHANGE_PASSWORD') {
    return 'CRITICAL';
  }
  if (action === 'DISMISS_EMPLOYEE' || action === 'ARCHIVE_EMPLOYEE' || action === 'CREATE_COUPON') {
    return 'HIGH';
  }
  if (action.startsWith('CREATE') || action.startsWith('UPDATE') || action === 'ADD_DOCUMENT' || action === 'RESOLVE_PENDING') {
    return 'MEDIUM';
  }
  return 'INFO';
}

export async function createAuditLog(
  request: FastifyRequest,
  options: AuditLogOptions
) {
  try {
    const user = request.user as { username?: string; role?: string } | undefined;

    // Advanced IP resolution across proxies, cloudflare & custom client header
    const cfIp = request.headers['cf-connecting-ip'] as string;
    const realIp = request.headers['x-real-ip'] as string;
    const clientIpHeader = request.headers['x-client-ip'] as string;
    const xForwardedFor = request.headers['x-forwarded-for'];

    let rawIp = '';
    if (cfIp) {
      rawIp = cfIp;
    } else if (realIp) {
      rawIp = realIp;
    } else if (clientIpHeader) {
      rawIp = clientIpHeader;
    } else if (xForwardedFor) {
      rawIp = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor.split(',')[0].trim();
    } else {
      rawIp = request.ip || '127.0.0.1';
    }

    // Clean up ipv6 prefixes
    let ipAddress = rawIp.replace(/^::ffff:/, '').trim();
    if (ipAddress === '::1' || ipAddress === '127.0.0.1') {
      // If loopback connection, check if client IP header was passed, otherwise label clearly
      ipAddress = clientIpHeader ? clientIpHeader.replace(/^::ffff:/, '').trim() : '127.0.0.1 (Localhost / Loopback)';
    }

    const userAgent = (request.headers['user-agent'] as string) || '';
    const deviceInfo = parseUserAgent(userAgent);
    const severity = options.severity || calculateSeverity(options.action);

    await prisma.auditLog.create({
      data: {
        action: options.action,
        entity: options.entity,
        entityId: options.entityId !== undefined ? String(options.entityId) : '',
        details: options.details || '',
        ipAddress,
        userAgent,
        deviceInfo,
        severity,
        userName: user?.username || 'Usuário do Sistema',
        userRole: user?.role || 'user',
        adminId: options.adminId,
      },
    });
  } catch (error) {
    console.error('Erro ao gravar log de auditoria:', error);
  }
}

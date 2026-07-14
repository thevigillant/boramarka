import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { getGoogleAuthUrl, exchangeCodeForTokens } from '../services/googleCalendar';
import { authenticate } from '../plugins/auth';

export default async function googleCalendarRoutes(app: FastifyInstance) {
  // GET /api/admin/google-calendar/connect — Start Google OAuth flow
  app.get('/connect', async (request, reply) => {
    const { token } = request.query as { token?: string };
    if (!token) {
      return reply.status(401).send({ error: 'Token de autorização é obrigatório' });
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?google=error&message=${encodeURIComponent('Variáveis GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET ausentes no arquivo .env do backend.')}`);
    }

    try {
      const user = app.jwt.verify(token) as { id: number };
      const authUrl = getGoogleAuthUrl(user.id);
      return reply.redirect(authUrl);
    } catch (err) {
      return reply.status(401).send({ error: 'Token inválido ou expirado' });
    }
  });

  // GET /api/admin/google-calendar/callback — Google OAuth callback
  app.get('/callback', async (request, reply) => {
    const { code, state, error } = request.query as { code?: string; state?: string; error?: string };

    if (error) {
      console.error('Google OAuth callback error:', error);
      return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?google=error`);
    }

    if (!code || !state) {
      return reply.status(400).send({ error: 'Código ou Estado ausente' });
    }

    try {
      const adminId = parseInt(state);
      await exchangeCodeForTokens(adminId, code);
      return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?google=success`);
    } catch (err: any) {
      console.error('Failed to complete Google OAuth:', err);
      return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?google=error&message=${encodeURIComponent(err.message)}`);
    }
  });

  // Private routes (require standard authentication hook)
  app.register(async (privateApp) => {
    privateApp.addHook('onRequest', authenticate);

    // POST /api/admin/google-calendar/disconnect — Disconnect Google Calendar
    privateApp.post('/disconnect', async (request, reply) => {
      const user = request.user as { id: number };

      await prisma.admin.update({
        where: { id: user.id },
        data: {
          googleAccessToken: '',
          googleRefreshToken: '',
          googleTokenExpiry: null,
          googleCalendarEmail: '',
        },
      });

      return reply.status(204).send();
    });

    // GET /api/admin/google-calendar/status — Get connection status
    privateApp.get('/status', async (request) => {
      const user = request.user as { id: number };
      const admin = await prisma.admin.findUnique({
        where: { id: user.id },
        select: {
          googleCalendarEmail: true,
        },
      });

      return {
        connected: !!admin?.googleCalendarEmail,
        email: admin?.googleCalendarEmail || '',
      };
    });
  });
}

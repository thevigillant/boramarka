import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/admin/google-calendar/callback';

export function getGoogleAuthUrl(adminId: number): string {
  if (!CLIENT_ID) {
    console.warn('⚠️ GOOGLE_CLIENT_ID não está configurado no arquivo .env!');
  }
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email',
    access_type: 'offline',
    prompt: 'consent',
    state: adminId.toString(),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(adminId: number, code: string): Promise<string> {
  const params = new URLSearchParams({
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao obter tokens do Google: ${errorText}`);
  }

  const data = await response.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  // Get user email
  const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });

  let email = '';
  if (userinfoRes.ok) {
    const info = await userinfoRes.json() as { email?: string };
    email = info.email || '';
  }

  const expiryDate = new Date(Date.now() + data.expires_in * 1000);

  await prisma.admin.update({
    where: { id: adminId },
    data: {
      googleAccessToken: data.access_token,
      googleRefreshToken: data.refresh_token || undefined,
      googleTokenExpiry: expiryDate,
      googleCalendarEmail: email,
    },
  });

  return email;
}

export async function getValidAccessToken(adminId: number): Promise<string | null> {
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: {
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiry: true,
    },
  });

  if (!admin || !admin.googleAccessToken) {
    return null;
  }

  const now = new Date();
  if (admin.googleTokenExpiry && new Date(admin.googleTokenExpiry.getTime() - 60000) > now) {
    return admin.googleAccessToken;
  }

  if (!admin.googleRefreshToken) {
    console.error(`Google refresh token is missing for admin ${adminId}`);
    return null;
  }

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: admin.googleRefreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    console.error(`Failed to refresh Google token for admin ${adminId}:`, await response.text());
    return null;
  }

  const data = await response.json() as {
    access_token: string;
    expires_in: number;
  };

  const expiryDate = new Date(Date.now() + data.expires_in * 1000);

  await prisma.admin.update({
    where: { id: adminId },
    data: {
      googleAccessToken: data.access_token,
      googleTokenExpiry: expiryDate,
    },
  });

  return data.access_token;
}

export interface GoogleCalendarEvent {
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}

export async function getGoogleCalendarEvents(adminId: number, startISO: string, endISO: string): Promise<GoogleCalendarEvent[]> {
  const token = await getValidAccessToken(adminId);
  if (!token) return [];

  const params = new URLSearchParams({
    timeMin: startISO,
    timeMax: endISO,
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    console.error(`Failed to get Google Calendar events for admin ${adminId}:`, await response.text());
    return [];
  }

  const data = await response.json() as { items?: GoogleCalendarEvent[] };
  return data.items || [];
}

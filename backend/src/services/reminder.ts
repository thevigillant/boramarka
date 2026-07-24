/**
 * Enhanced Reminder Service — Multi-Channel, Multi-Layer
 * 
 * Supports:
 * - Multiple reminder windows (e.g., 24h, 2h before) per professional
 * - WhatsApp (Cloud API + wa.me fallback)
 * - Email (SMTP)
 * - Push Notifications (Web Push / VAPID)
 * - Per-professional configuration
 * - Audit logging of every reminder sent
 */

import { prisma } from '../db';
import { sendWhatsAppMessage } from './whatsapp';
import { sendPushToClient } from './pushNotification';
import nodemailer from 'nodemailer';

// ─── Email transporter (reuse SMTP config) ───
function createEmailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

// ─── Build reminder message ───
function buildReminderMessage(
  clientName: string,
  serviceName: string,
  businessName: string,
  date: string,
  time: string,
  address: string,
  hoursLabel: string,
  cancellationCode: string
): string {
  // Format date from YYYY-MM-DD to DD/MM/YYYY
  const [year, month, day] = date.split('-');
  const formattedDate = `${day}/${month}/${year}`;

  const isToday = hoursLabel.includes('h');
  const timeLabel = isToday ? `hoje às *${time}*` : `em *${formattedDate}* às *${time}*`;

  const lines = [
    `Olá, ${clientName}! 🔔`,
    '',
    `Lembrete do seu agendamento ${timeLabel}:`,
    `💼 Serviço: *${serviceName}*`,
    `🕐 Horário: *${time}*`,
    `📅 Data: *${formattedDate}*`,
    `🏢 Local: *${businessName}*`,
  ];

  if (address) {
    lines.push(`📍 Endereço: *${address}*`);
  }

  lines.push('');

  if (cancellationCode) {
    lines.push(`🔑 Código de gerenciamento: *${cancellationCode}*`);
  }

  lines.push(`Aguardamos você! Caso precise cancelar ou remarcar, entre em contato com antecedência. 😊`);

  return lines.filter(Boolean).join('\n');
}

// ─── Build email HTML ───
function buildReminderEmailHTML(
  clientName: string,
  serviceName: string,
  businessName: string,
  date: string,
  time: string,
  address: string,
  hoursLabel: string
): string {
  const [year, month, day] = date.split('-');
  const formattedDate = `${day}/${month}/${year}`;

  return `
  <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0f; border-radius: 16px; overflow: hidden; border: 1px solid rgba(139, 92, 246, 0.3);">
    <div style="background: linear-gradient(135deg, #ec4899, #8b5cf6); padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 22px;">🔔 Lembrete de Agendamento</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">BoraMarka — ${businessName}</p>
    </div>
    <div style="padding: 28px 24px; color: #e4e4e7;">
      <p style="font-size: 16px; margin: 0 0 18px;">Olá, <strong>${clientName}</strong>!</p>
      <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px; color: #a1a1aa;">
        Este é um lembrete do seu agendamento:
      </p>
      <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 12px; padding: 18px;">
        <table style="width: 100%; font-size: 14px; color: #e4e4e7;">
          <tr><td style="padding: 6px 0; color: #a1a1aa;">💼 Serviço</td><td style="text-align: right; font-weight: 600;">${serviceName}</td></tr>
          <tr><td style="padding: 6px 0; color: #a1a1aa;">📅 Data</td><td style="text-align: right; font-weight: 600;">${formattedDate}</td></tr>
          <tr><td style="padding: 6px 0; color: #a1a1aa;">🕐 Horário</td><td style="text-align: right; font-weight: 600;">${time}</td></tr>
          ${address ? `<tr><td style="padding: 6px 0; color: #a1a1aa;">📍 Local</td><td style="text-align: right; font-weight: 600;">${address}</td></tr>` : ''}
        </table>
      </div>
      <p style="font-size: 13px; color: #71717a; margin: 20px 0 0; text-align: center;">
        Caso precise cancelar ou remarcar, entre em contato com antecedência.
      </p>
    </div>
    <div style="padding: 14px 24px; background: rgba(255,255,255,0.03); text-align: center; border-top: 1px solid rgba(255,255,255,0.06);">
      <p style="margin: 0; font-size: 12px; color: #52525b;">BoraMarka — Sua agenda cheia, sem complicação.</p>
    </div>
  </div>`;
}

// ─── Log a reminder to database ───
async function logReminder(
  adminId: number,
  bookingId: number,
  channel: string,
  status: string,
  hoursLabel: string,
  clientName: string,
  clientPhone: string,
  message: string = ''
) {
  try {
    await prisma.reminderLog.create({
      data: {
        adminId,
        bookingId,
        channel,
        status,
        hoursLabel,
        clientName,
        clientPhone,
        message: message.substring(0, 500),
      },
    });
  } catch (err) {
    console.error('Erro ao registar log de lembrete:', err);
  }
}

// ─── Determine which reminder flag to use ───
function getReminderFlag(hours: number): 'reminderSent' | 'reminder24hSent' | 'reminderCustomSent' {
  if (hours <= 3) return 'reminderSent';       // 2h, 1h, 30min window
  if (hours <= 24) return 'reminder24hSent';    // 24h, 12h window
  return 'reminderCustomSent';                   // 48h+ window
}

// ─── Main reminder scanner ───
async function sendUpcomingReminders() {
  const now = new Date();

  // Get all admins with reminders enabled
  const admins = await prisma.admin.findMany({
    where: { reminderEnabled: true },
    select: {
      id: true,
      businessName: true,
      address: true,
      reminderHours: true,
      reminderChannels: true,
      email: true,
    },
  });

  for (const admin of admins) {
    const reminderWindows = admin.reminderHours
      .split(',')
      .map((h: string) => parseFloat(h.trim()))
      .filter((h: number) => !isNaN(h) && h > 0)
      .sort((a: number, b: number) => b - a); // Largest first

    const channels = admin.reminderChannels
      .split(',')
      .map((c: string) => c.trim().toLowerCase())
      .filter(Boolean);

    if (reminderWindows.length === 0 || channels.length === 0) continue;

    // Find bookings for this admin that haven't completed all reminders
    const bookings = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMADO', 'PAGO', 'PENDENTE'] },
        timeSlot: { link: { adminId: admin.id, deletedAt: null } },
        // At least one reminder flag is false
        OR: [
          { reminderSent: false },
          { reminder24hSent: false },
          { reminderCustomSent: false },
        ],
      },
      include: {
        timeSlot: {
          include: {
            link: {
              include: { service: true },
            },
          },
        },
      },
    });

    for (const booking of bookings) {
      try {
        const [year, month, day] = booking.timeSlot.date.split('-').map(Number);
        const [hour, minute] = booking.timeSlot.time.split(':').map(Number);
        const slotDate = new Date(year, month - 1, day, hour, minute, 0);

        const diffInMs = slotDate.getTime() - now.getTime();
        const diffInMinutes = diffInMs / (1000 * 60);
        const diffInHours = diffInMinutes / 60;

        // If slot is in the past, mark all reminders as sent
        if (diffInMinutes < 0) {
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              reminderSent: true,
              reminder24hSent: true,
              reminderCustomSent: true,
            },
          });
          continue;
        }

        // Check each reminder window
        for (const windowHours of reminderWindows) {
          const flag = getReminderFlag(windowHours);

          // Skip if already sent for this window
          if ((booking as any)[flag] === true) continue;

          // Check if we're within the window
          // Send when time remaining is <= windowHours (and > 0)
          if (diffInHours > 0 && diffInHours <= windowHours) {
            const businessName = admin.businessName || 'Profissional';
            const serviceName = booking.timeSlot.link.service?.name || 'Serviço';
            const address = admin.address || '';
            const hoursLabel = windowHours >= 1 ? `${windowHours}h` : `${Math.round(windowHours * 60)}min`;

            const message = buildReminderMessage(
              booking.clientName,
              serviceName,
              businessName,
              booking.timeSlot.date,
              booking.timeSlot.time,
              address,
              hoursLabel,
              booking.cancellationCode
            );

            // ─── Send via WhatsApp ───
            if (channels.includes('whatsapp')) {
              try {
                await sendWhatsAppMessage(booking.clientPhone, message);
                await logReminder(admin.id, booking.id, 'whatsapp', 'sent', hoursLabel, booking.clientName, booking.clientPhone, message);
                console.log(`⏰ WhatsApp (${hoursLabel}) → ${booking.clientName} (${booking.clientPhone})`);
              } catch (err: any) {
                await logReminder(admin.id, booking.id, 'whatsapp', 'failed', hoursLabel, booking.clientName, booking.clientPhone, err.message);
                console.error(`❌ WhatsApp reminder failed for ${booking.clientName}:`, err.message);
              }
            }

            // ─── Send via Email ───
            if (channels.includes('email')) {
              try {
                const transporter = createEmailTransporter();
                if (transporter && admin.email) {
                  // We don't have client email, so we only log it
                  // In production, client email could be collected during booking
                  await logReminder(admin.id, booking.id, 'email', 'skipped', hoursLabel, booking.clientName, booking.clientPhone, 'Email do cliente não disponível');
                  console.log(`📧 Email (${hoursLabel}) → skipped (sem email do cliente)`);
                }
              } catch (err: any) {
                await logReminder(admin.id, booking.id, 'email', 'failed', hoursLabel, booking.clientName, booking.clientPhone, err.message);
              }
            }

            // ─── Send via Push ───
            if (channels.includes('push')) {
              try {
                const pushResult = await sendPushToClient(
                  booking.clientPhone,
                  admin.id,
                  {
                    title: `🔔 Lembrete — ${serviceName}`,
                    body: `${booking.clientName}, seu agendamento é ${hoursLabel === '2h' ? 'em breve' : `em ${hoursLabel}`}! ${booking.timeSlot.date.split('-').reverse().join('/')} às ${booking.timeSlot.time}`,
                    url: '/',
                  }
                );
                const pushStatus = pushResult.sent > 0 ? 'sent' : (pushResult.failed > 0 ? 'failed' : 'skipped');
                await logReminder(admin.id, booking.id, 'push', pushStatus, hoursLabel, booking.clientName, booking.clientPhone, `Sent: ${pushResult.sent}, Failed: ${pushResult.failed}`);
                if (pushResult.sent > 0) {
                  console.log(`🔔 Push (${hoursLabel}) → ${booking.clientName} (${pushResult.sent} dispositivo(s))`);
                }
              } catch (err: any) {
                await logReminder(admin.id, booking.id, 'push', 'failed', hoursLabel, booking.clientName, booking.clientPhone, err.message);
              }
            }

            // Mark the reminder flag as sent
            await prisma.booking.update({
              where: { id: booking.id },
              data: { [flag]: true },
            });
          }
        }
      } catch (error: any) {
        console.error(`❌ Erro ao processar lembrete para booking #${booking.id}:`, error.message);
      }
    }
  }
}

export function startReminderService() {
  console.log('⏰ Servidor de Lembretes Automáticos iniciado.');

  // Check reminders immediately on startup
  sendUpcomingReminders().catch(err => console.error('Erro na varredura inicial de lembretes:', err));

  // Check every 60 seconds
  const intervalTime = 60000;
  setInterval(async () => {
    try {
      await sendUpcomingReminders();
    } catch (error) {
      console.error('❌ Erro no loop de lembretes:', error);
    }
  }, intervalTime);
}

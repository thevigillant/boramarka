import { prisma } from '../db';
import { sendWhatsAppMessage } from './whatsapp';

async function sendUpcomingReminders() {
  const now = new Date();

  // Find bookings that have not sent reminder yet
  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ['CONFIRMADO', 'PAGO'] },
      reminderSent: false,
    },
    include: {
      timeSlot: {
        include: {
          link: {
            include: {
              service: true,
              admin: true,
            },
          },
        },
      },
    },
  });

  for (const booking of bookings) {
    try {
      const [year, month, day] = booking.timeSlot.date.split('-').map(Number);
      const [hour, minute] = booking.timeSlot.time.split(':').map(Number);
      
      // JS Month is 0-indexed
      const slotDate = new Date(year, month - 1, day, hour, minute, 0);
      
      const diffInMs = slotDate.getTime() - now.getTime();
      const diffInMinutes = diffInMs / (1000 * 60);

      // If slot is in the past, just mark as sent to clean up database queries
      if (diffInMinutes < 0) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { reminderSent: true },
        });
        continue;
      }

      // If slot is within the next 2 hours (120 minutes)
      if (diffInMinutes > 0 && diffInMinutes <= 120) {
        const businessName = booking.timeSlot.link.admin.businessName || 'Profissional';
        const serviceName = booking.timeSlot.link.service?.name || 'Serviço';
        const address = booking.timeSlot.link.admin.address;
        const time = booking.timeSlot.time;

        const message = [
          `Olá, ${booking.clientName}! 🔔`,
          '',
          `Lembrete de agendamento hoje:`,
          `💼 Serviço: *${serviceName}*`,
          `🕐 Horário: *${time}* (em breve!)`,
          `🏢 Local: *${businessName}*`,
          address ? `📍 Endereço: *${address}*` : '',
          '',
          `Aguardamos você! Caso precise cancelar ou remarcar, entre em contato com antecedência.`,
        ].filter(Boolean).join('\n');

        // Send via WhatsApp service
        await sendWhatsAppMessage(booking.clientPhone, message);

        // Mark as sent in DB
        await prisma.booking.update({
          where: { id: booking.id },
          data: { reminderSent: true },
        });

        console.log(`⏰ Lembrete de WhatsApp enviado para ${booking.clientName} (${booking.clientPhone})`);
      }
    } catch (error) {
      console.error(`❌ Erro ao enviar lembrete para reserva ID ${booking.id}:`, error);
    }
  }
}

export function startReminderService() {
  console.log('⏰ Servidor de Lembretes Automáticos iniciado.');
  
  // Check reminders immediately on startup
  sendUpcomingReminders().catch(err => console.error('Erro na varredura inicial de lembretes:', err));

  // Check periodically (every 1 minute in dev/test, 5 minutes in prod)
  const intervalTime = 60000;
  setInterval(async () => {
    try {
      await sendUpcomingReminders();
    } catch (error) {
      console.error('❌ Erro no loop de lembretes:', error);
    }
  }, intervalTime);
}

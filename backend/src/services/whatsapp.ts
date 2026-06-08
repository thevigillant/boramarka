/**
 * WhatsApp Integration Service
 *
 * Supports two modes:
 * 1. WhatsApp Cloud API (Meta) — automatic sending when configured
 * 2. wa.me link fallback — generates a pre-filled WhatsApp link
 */

export function isWhatsAppApiConfigured(): boolean {
  return !!(process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_ID);
}

export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<{ success: boolean; method: 'api' | 'link'; link?: string; error?: string }> {
  // Clean phone number — keep only digits
  const cleanPhone = phone.replace(/\D/g, '');

  // Add Brazil country code if not present
  const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

  // Try WhatsApp Cloud API first
  if (isWhatsAppApiConfigured()) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: fullPhone,
            type: 'text',
            text: { body: message },
          }),
        }
      );

      if (response.ok) {
        console.log(`✅ WhatsApp API: Mensagem enviada para ${fullPhone}`);
        return { success: true, method: 'api' };
      }

      const errorData = await response.json().catch(() => ({}));
      console.error('❌ WhatsApp API error:', errorData);
      // Fall through to wa.me link
    } catch (error) {
      console.error('❌ WhatsApp API connection error:', error);
      // Fall through to wa.me link
    }
  }

  // Fallback: generate wa.me link
  const encodedMessage = encodeURIComponent(message);
  const link = `https://wa.me/${fullPhone}?text=${encodedMessage}`;

  console.log(`📱 WhatsApp fallback: link gerado para ${fullPhone}`);
  return { success: true, method: 'link', link };
}

export function generateBookingMessage(
  clientName: string,
  date: string,
  time: string
): string {
  // Format date from YYYY-MM-DD to DD/MM/YYYY
  const [year, month, day] = date.split('-');
  const formattedDate = `${day}/${month}/${year}`;

  return [
    `Olá, ${clientName}! ✅`,
    '',
    `Seu horário foi confirmado:`,
    `📅 Data: *${formattedDate}*`,
    `🕐 Hora: *${time}*`,
    '',
    `Obrigado pela preferência! 😊`,
  ].join('\n');
}

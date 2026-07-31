/**
 * WhatsApp Integration Service
 *
 * Supports three modes:
 * 1. Meta Cloud API (Official) — automatic sending when WHATSAPP_API_TOKEN & WHATSAPP_PHONE_ID are set
 * 2. HTTP Gateway (Z-API / Evolution / UltraMsg / Baileys) — when WHATSAPP_GATEWAY_URL is set
 * 3. wa.me link fallback — generates a pre-filled WhatsApp link
 */

export function formatPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('55') ? digits : `55${digits}`;
}

export function getWhatsAppStatus(): { isConfigured: boolean; provider: 'meta' | 'gateway' | 'none'; details?: string } {
  if (process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_ID) {
    return { isConfigured: true, provider: 'meta', details: 'Meta Cloud API Oficial' };
  }
  if (process.env.WHATSAPP_GATEWAY_URL) {
    return { isConfigured: true, provider: 'gateway', details: 'Gateway HTTP / Z-API' };
  }
  return { isConfigured: false, provider: 'none', details: 'Modo Fallback (wa.me)' };
}

export function isWhatsAppApiConfigured(): boolean {
  return getWhatsAppStatus().isConfigured;
}

export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<{ success: boolean; method: 'api' | 'meta' | 'gateway' | 'link'; link?: string; error?: string }> {
  const fullPhone = formatPhoneForWhatsApp(phone);
  if (!fullPhone) {
    return { success: false, method: 'link', error: 'Número de telefone inválido' };
  }

  const status = getWhatsAppStatus();

  // 1. Meta Cloud API
  if (status.provider === 'meta') {
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
        console.log(`✅ WhatsApp Meta API: Mensagem enviada para ${fullPhone}`);
        return { success: true, method: 'meta' };
      }

      const errorData: any = await response.json().catch(() => ({}));
      console.error('❌ WhatsApp Meta API error:', errorData);
    } catch (error: any) {
      console.error('❌ WhatsApp Meta API connection error:', error);
    }
  }

  // 2. Generic HTTP Gateway (Z-API, Evolution API, etc.)
  if (status.provider === 'gateway') {
    try {
      const gatewayUrl = process.env.WHATSAPP_GATEWAY_URL!;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (process.env.WHATSAPP_GATEWAY_TOKEN) {
        headers['Client-Token'] = process.env.WHATSAPP_GATEWAY_TOKEN;
        headers['Authorization'] = `Bearer ${process.env.WHATSAPP_GATEWAY_TOKEN}`;
      }

      const response = await fetch(gatewayUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          phone: fullPhone,
          number: fullPhone,
          to: fullPhone,
          message,
          text: message,
        }),
      });

      if (response.ok) {
        console.log(`✅ WhatsApp Gateway: Mensagem enviada para ${fullPhone}`);
        return { success: true, method: 'gateway' };
      }

      const errorData: any = await response.json().catch(() => ({}));
      console.error('❌ WhatsApp Gateway error:', errorData);
    } catch (error: any) {
      console.error('❌ WhatsApp Gateway connection error:', error);
    }
  }

  // 3. Fallback: generate wa.me link
  const encodedMessage = encodeURIComponent(message);
  const link = `https://wa.me/${fullPhone}?text=${encodedMessage}`;

  console.log(`📱 WhatsApp fallback: link gerado para ${fullPhone}`);
  return { success: true, method: 'link', link };
}

export function generateBookingMessage(
  clientName: string,
  date: string,
  time: string,
  serviceName?: string,
  cancellationCode?: string,
  cancelUrl?: string
): string {
  // Format date from YYYY-MM-DD to DD/MM/YYYY
  const dateParts = date.split('-');
  const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : date;

  const lines = [
    `Olá, ${clientName}! ✅`,
    '',
    `Seu horário foi agendado com sucesso:`,
    ...(serviceName ? [`💼 Serviço: *${serviceName}*`] : []),
    `📅 Data: *${formattedDate}*`,
    `🕐 Hora: *${time}*`,
  ];

  if (cancellationCode) {
    lines.push('');
    lines.push(`🔑 Código de Gerenciamento: *${cancellationCode}*`);
  }

  if (cancelUrl) {
    lines.push(`🔗 Cancelar ou Remarcar: ${cancelUrl}`);
  }

  lines.push('');
  lines.push(`Obrigado pela preferência! 😊`);

  return lines.join('\n');
}


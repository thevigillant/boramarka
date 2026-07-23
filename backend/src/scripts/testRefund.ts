import { prisma } from '../db';
import { sendWhatsAppMessage } from '../services/whatsapp';

async function testRefundFlow() {
  const targetPhone = process.argv[2] || '5511999999999';
  const clientName = 'Bruno Santana (Teste)';

  console.log(`\n🚀 [TESTE DE ESTORNO & WHATSAPP]`);
  console.log(`📞 Número de teste: ${targetPhone}`);
  console.log(`👤 Cliente: ${clientName}\n`);

  // 1. Find or create an admin for test
  let admin = await prisma.admin.findFirst();
  if (!admin) {
    console.error('❌ Nenhum profissional encontrado no banco de dados.');
    return;
  }

  // 2. Find or create a link & service
  let service = await prisma.service.findFirst({ where: { adminId: admin.id } });
  if (!service) {
    service = await prisma.service.create({
      data: {
        name: 'Corte Degradê Moderno',
        description: 'Serviço de teste',
        price: 50.0,
        duration: 45,
        adminId: admin.id
      }
    });
  }

  let link = await prisma.schedulingLink.findFirst({
    where: { adminId: admin.id },
    include: { service: true }
  });

  if (!link) {
    link = await prisma.schedulingLink.create({
      data: {
        token: `test-link-${Date.now()}`,
        title: 'Agendamento Teste',
        adminId: admin.id,
        serviceId: service.id,
        bookingFeeEnabled: true,
        bookingFeeAmount: 10.0
      },
      include: { service: true }
    });
  }

  // 3. Create a test time slot
  const slot = await prisma.timeSlot.create({
    data: {
      date: '2026-07-30',
      time: '15:00',
      isAvailable: false,
      linkId: link.id
    }
  });

  // 4. Create a test booking with paid deposit (paidAmount: 10)
  const cancellationCode = 'BM-TEST';
  const booking = await prisma.booking.create({
    data: {
      clientName,
      clientPhone: targetPhone,
      timeSlotId: slot.id,
      status: 'PAGO',
      paidAmount: 10.0,
      cancellationCode,
      notes: 'Agendamento de Teste para Estorno'
    }
  });

  console.log(`✅ Agendamento de teste criado com sucesso! (ID: ${booking.id}, Cód: ${booking.cancellationCode}, Pago: R$ 10,00)`);

  // 5. Test Step A: Client Cancels -> Refund Status PENDING
  await prisma.timeSlot.update({
    where: { id: slot.id },
    data: { isAvailable: true }
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: 'CANCELADO',
      refundStatus: 'PENDING',
      refundAmount: 10.0
    }
  });

  console.log(`\n⚠️ STEP 1: Agendamento Cancelado pelo cliente. Status do Estorno -> PENDING`);

  // Send initial notification WhatsApp message to professional & client
  const adminMsg = [
    `⚠️ *Solicitação de Estorno!*`,
    '',
    `👤 Cliente: *${clientName}* (${targetPhone})`,
    `💼 Serviço: *${link.service?.name || 'Serviço de Teste'}*`,
    `📅 Data: *30/07/2026 às 15:00*`,
    `💰 Sinal Pago: *R$ 10.00*`,
    '',
    `Acesse seu painel BoraMarka para autorizar o reembolso!`
  ].join('\n');

  const adminResult = await sendWhatsAppMessage(admin.phone || targetPhone, adminMsg);
  console.log(`📱 Notificação do Profissional WhatsApp: ${adminResult.method === 'api' ? '✅ Enviado via Meta API' : '🔗 Link gerado: ' + adminResult.link}`);

  // 6. Test Step B: Professional Processes Refund -> refundStatus REFUNDED
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: 'ESTORNADO',
      refundStatus: 'REFUNDED',
      refundAmount: 10.0
    }
  });

  // Create financial transaction
  await prisma.transaction.create({
    data: {
      type: 'payable',
      description: `Estorno Agendamento - ${clientName}`,
      amount: 10.0,
      dueDate: new Date().toISOString().split('T')[0],
      paid: true,
      paidAt: new Date().toISOString().split('T')[0],
      clientName,
      category: 'Estorno',
      notes: `Estorno de teste efetuado via BoraMarka (Agendamento #${booking.id})`,
      adminId: admin.id
    }
  });

  console.log(`\n🎉 STEP 2: Estorno processado pelo profissional! Status -> REFUNDED. Transação no Caixa criada.`);

  // Send final WhatsApp message to client confirming refund
  const clientRefundMsg = [
    `🎉 *Estorno Realizado!*`,
    '',
    `Olá ${clientName}! O valor de *R$ 10.00* referente ao seu agendamento de *${link.service?.name || 'Serviço de Teste'}* (30/07/2026 às 15:00) foi estornado com sucesso!`,
    '',
    `Qualquer dúvida, estamos à disposição. 😊`
  ].join('\n');

  const clientResult = await sendWhatsAppMessage(targetPhone, clientRefundMsg);
  console.log(`📱 Notificação do Cliente WhatsApp: ${clientResult.method === 'api' ? '✅ Enviado via Meta API' : '🔗 Link wa.me gerado:'}\n${clientResult.link || 'Mensagem enviada'}\n`);

  console.log(`🏁 [TESTE CONCLUÍDO COM SUCESSO!]`);
}

testRefundFlow().catch(console.error);

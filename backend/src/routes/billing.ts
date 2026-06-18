import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { checkAndUpdateSubscription } from '../services/subscription';
import { authenticate } from '../plugins/auth';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Configura o client do Mercado Pago
// Em produção, isso virá do .env
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});

export default async function billingRoutes(app: FastifyInstance) {
  // Rota para pegar o status atual da assinatura do usuário
  app.get('/status', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user as { id: number };
    const subscription = await checkAndUpdateSubscription(user.id);
    return subscription;
  });

  // Rota para gerar um link de pagamento
  app.post('/checkout', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user as { id: number };
    const { plan } = request.body as { plan: 'mensal' | 'anual' };

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return reply.status(500).send({ error: 'Gateway de pagamento não configurado no servidor.' });
    }

    // Define preços baseados no plano
    const price = plan === 'anual' ? 260.00 : 30.00;
    const title = plan === 'anual' ? 'BoraMarka - Plano Anual' : 'BoraMarka - Plano Mensal';

    try {
      const preference = new Preference(client);
      
      const baseUrl = process.env.CORS_ORIGIN 
        ? process.env.CORS_ORIGIN.split(',')[0] 
        : 'http://localhost:5173';

      const response = await preference.create({
        body: {
          items: [
            {
              id: `plan_${plan}`,
              title: title,
              quantity: 1,
              unit_price: price,
              currency_id: 'BRL',
            }
          ],
          external_reference: user.id.toString(), // ID do Admin para sabermos quem pagou
          back_urls: {
            success: `${baseUrl}/dashboard?payment=success`,
            failure: `${baseUrl}/dashboard?payment=failure`,
            pending: `${baseUrl}/dashboard?payment=pending`
          },
          // auto_return: 'approved',
          // notification_url: 'https://seu-dominio.com.br/api/billing/webhook' // URL QUE O MERCADO PAGO VAI CHAMAR
        }
      });

      // Atualiza o banco para saber qual plano a pessoa tentou comprar
      await prisma.subscription.upsert({
        where: { adminId: user.id },
        update: { plan: plan },
        create: {
          adminId: user.id,
          plan: plan,
          status: 'pending'
        }
      });

      return { init_point: response.init_point };
    } catch (error) {
      console.error('Erro ao gerar checkout:', error);
      return reply.status(500).send({ error: 'Erro ao conectar com gateway de pagamento' });
    }
  });

  // Webhook para receber confirmação de pagamento do Mercado Pago
  app.post('/webhook', async (request, reply) => {
    // Retorna 200 imediatamente para o Mercado Pago não tentar enviar de novo
    reply.status(200).send();

    const query = request.query as any;
    const body = request.body as any;
    const type = query.type || body?.type;
    const dataId = query['data.id'] || body?.data?.id;

    if (type === 'payment' && dataId) {
      try {
        // Busca os dados reais do pagamento
        const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
          headers: {
            Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
          }
        });
        
        const paymentInfo = await paymentResponse.json();

        if (paymentInfo.status === 'approved') {
          const adminId = parseInt(paymentInfo.external_reference);
          
          if (!isNaN(adminId)) {
            const subscription = await prisma.subscription.findUnique({
              where: { adminId }
            });

            if (subscription) {
              // Calcula expiração
              const expiresAt = new Date();
              if (subscription.plan === 'anual') {
                expiresAt.setFullYear(expiresAt.getFullYear() + 1);
              } else {
                expiresAt.setMonth(expiresAt.getMonth() + 1);
              }

              // Atualiza para ativo
              await prisma.subscription.update({
                where: { adminId },
                data: {
                  status: 'active',
                  externalId: dataId.toString(),
                  expiresAt: expiresAt
                }
              });
              
              console.log(`✅ Pagamento aprovado para o Admin ID ${adminId}. Assinatura ativa até ${expiresAt}`);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao processar webhook do Mercado Pago:', error);
      }
    }
  });
}

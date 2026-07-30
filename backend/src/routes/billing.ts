import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { checkAndUpdateSubscription, getUsageStats } from '../services/subscription';
import { authenticate } from '../plugins/auth';
import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function billingRoutes(app: FastifyInstance) {
  // Rota para pegar o status atual da assinatura do usuário
  app.get('/status', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user as { id: number };
    const subscription = await checkAndUpdateSubscription(user.id);
    return subscription;
  });

  // Rota para pegar consumo de cotas e limites da assinatura
  app.get('/usage', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user as { id: number };
    const stats = await getUsageStats(user.id);
    return stats;
  });

  // Rota para gerar checkout (compra avulsa ou assinatura recorrente)
  app.post('/checkout', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user as { id: number };
    const { plan, recurring = true } = request.body as { plan: 'mensal' | 'anual' | 'premium'; recurring?: boolean };

    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpToken || mpToken.trim() === '') {
      return reply.status(400).send({ 
        error: 'Token do Mercado Pago não configurado. Por favor, adicione o MERCADOPAGO_ACCESS_TOKEN no arquivo .env do backend.' 
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: user.id },
      select: { email: true, username: true }
    });

    let price = 29.90;
    let title = 'BoraMarka - Plano Mensal';
    let frequency = 1;
    let frequencyType = 'months';

    if (plan === 'anual') {
      price = 260.00;
      title = 'BoraMarka - Plano Anual';
      frequency = 12;
      frequencyType = 'months';
    } else if (plan === 'premium') {
      price = 79.90;
      title = 'BoraMarka - Plano Premium';
      frequency = 1;
      frequencyType = 'months';
    }

    const baseUrl = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')[0]
      : 'http://localhost:5173';
    const backendUrl = process.env.BACKEND_URL || process.env.RAILWAY_STATIC_URL || 'http://localhost:3001';

    // Valida email do pagador para evitar erros da API
    let payerEmail = admin?.email?.trim();
    if (!payerEmail || !/\S+@\S+\.\S+/.test(payerEmail)) {
      payerEmail = `cliente.${user.id}@boramarka.com.br`;
    }

    // 1. Tenta criar Assinatura Recorrente (Preapproval API)
    if (recurring) {
      try {
        const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mpToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reason: `${title} (Recorrente)`,
            auto_recurring: {
              frequency: frequency,
              frequency_type: frequencyType,
              transaction_amount: price,
              currency_id: 'BRL'
            },
            back_url: `${baseUrl}/dashboard?payment=success`,
            payer_email: payerEmail,
            external_reference: user.id.toString(),
            ...(backendUrl.startsWith('https://') ? { notification_url: `${backendUrl}/api/billing/webhook` } : {})
          })
        });

        const preapprovalData = await mpResponse.json();

        if (mpResponse.ok && (preapprovalData.init_point || preapprovalData.sandbox_init_point)) {
          await prisma.subscription.upsert({
            where: { adminId: user.id },
            update: { plan: plan, externalId: preapprovalData.id },
            create: {
              adminId: user.id,
              plan: plan,
              status: 'pending',
              externalId: preapprovalData.id
            }
          });

          const checkoutUrl = preapprovalData.init_point || preapprovalData.sandbox_init_point;
          console.log(`✅ Link de assinatura gerado para o plano ${plan}: ${checkoutUrl}`);
          return { init_point: checkoutUrl };
        }

        console.warn('⚠️ MP Preapproval API retornou aviso/erro, tentando Checkout Preferência:', preapprovalData);
      } catch (subErr: any) {
        console.error('⚠️ Erro ao tentar criar Preapproval:', subErr.message);
      }
    }

    // 2. Fallback / Checkout Preferência (Checkout Pro)
    try {
      const client = new MercadoPagoConfig({ accessToken: mpToken });
      const preference = new Preference(client);

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
          external_reference: user.id.toString(),
          back_urls: {
            success: `${baseUrl}/dashboard?payment=success`,
            failure: `${baseUrl}/dashboard?payment=failure`,
            pending: `${baseUrl}/dashboard?payment=pending`
          },
          ...(baseUrl.startsWith('https://') ? { auto_return: 'approved' } : {}),
          ...(backendUrl.startsWith('https://') ? { notification_url: `${backendUrl}/api/billing/webhook` } : {})
        }
      });

      await prisma.subscription.upsert({
        where: { adminId: user.id },
        update: { plan: plan },
        create: {
          adminId: user.id,
          plan: plan,
          status: 'pending'
        }
      });

      const checkoutUrl = response.init_point || (response as any).sandbox_init_point;
      console.log(`✅ Link de checkout gerado para o plano ${plan}: ${checkoutUrl}`);
      return { init_point: checkoutUrl };
    } catch (error: any) {
      console.error('❌ Erro detalhado ao conectar com Mercado Pago:', error?.message || error);
      const detail = error?.cause?.[0]?.description || error?.message || 'Token inválido ou expirado do Mercado Pago.';
      return reply.status(500).send({ 
        error: `Falha na conexão com Mercado Pago: ${detail}` 
      });
    }
  });

  // Rota para Cancelar Assinatura Recorrente
  app.post('/cancel-subscription', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user as { id: number };

    const subscription = await prisma.subscription.findUnique({
      where: { adminId: user.id }
    });

    if (!subscription || !subscription.externalId) {
      return reply.status(400).send({ error: 'Nenhuma assinatura recorrente ativa encontrada.' });
    }

    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (mpToken) {
      try {
        await fetch(`https://api.mercadopago.com/preapproval/${subscription.externalId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${mpToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'cancelled' })
        });
      } catch (err: any) {
        console.error('Erro ao cancelar assinatura no Mercado Pago:', err.message);
      }
    }

    await prisma.subscription.update({
      where: { adminId: user.id },
      data: {
        externalId: null
      }
    });

    return { success: true, message: 'Assinatura cancelada. Seu acesso continuará ativo até o fim do período contratado.' };
  });

  // Webhook para receber confirmação de pagamento ou renovação do Mercado Pago
  app.post('/webhook', async (request, reply) => {
    reply.status(200).send();

    const query = request.query as any;
    const body = request.body as any;
    const type = query.type || body?.type || query.topic || body?.topic;
    const dataId = query['data.id'] || body?.data?.id || query.id || body?.id;

    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpToken || !dataId) return;

    try {
      if (type === 'payment' || type === 'authorized_payment') {
        const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
          headers: { Authorization: `Bearer ${mpToken}` }
        });

        if (paymentResponse.ok) {
          const paymentInfo = await paymentResponse.json();

          if (paymentInfo.status === 'approved') {
            const adminId = parseInt(paymentInfo.external_reference);

            if (!isNaN(adminId)) {
              const subscription = await prisma.subscription.findUnique({ where: { adminId } });

              if (subscription) {
                const expiresAt = new Date();
                if (subscription.plan === 'anual') {
                  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
                } else {
                  expiresAt.setMonth(expiresAt.getMonth() + 1);
                }

                await prisma.subscription.update({
                  where: { adminId },
                  data: {
                    status: 'active',
                    externalId: paymentInfo.id ? paymentInfo.id.toString() : subscription.externalId,
                    expiresAt: expiresAt
                  }
                });

                console.log(`✅ Webhook MP: Pagamento aprovado para Admin ID ${adminId}. Ativo até ${expiresAt.toISOString()}`);
              }
            }
          }
        }
      }

      if (type === 'subscription_preapproval' || type === 'preapproval') {
        const preapprovalResponse = await fetch(`https://api.mercadopago.com/preapproval/${dataId}`, {
          headers: { Authorization: `Bearer ${mpToken}` }
        });

        if (preapprovalResponse.ok) {
          const preapprovalInfo = await preapprovalResponse.json();
          const adminId = parseInt(preapprovalInfo.external_reference);

          if (!isNaN(adminId) && preapprovalInfo.status === 'authorized') {
            const subscription = await prisma.subscription.findUnique({ where: { adminId } });
            if (subscription) {
              const expiresAt = new Date();
              if (subscription.plan === 'anual') {
                expiresAt.setFullYear(expiresAt.getFullYear() + 1);
              } else {
                expiresAt.setMonth(expiresAt.getMonth() + 1);
              }

              await prisma.subscription.update({
                where: { adminId },
                data: {
                  status: 'active',
                  externalId: dataId.toString(),
                  expiresAt: expiresAt
                }
              });

              console.log(`✅ Webhook MP: Assinatura recorrente autorizada para Admin ID ${adminId}. Renovação ativa.`);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Erro ao processar webhook do Mercado Pago:', error.message);
    }
  });
}

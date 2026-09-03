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
    const { plan, recurring = true } = request.body as { plan: string; recurring?: boolean };

    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpToken || mpToken.trim() === '') {
      return reply.status(400).send({ 
        error: 'Token do Mercado Pago não configurado. Por favor, adicione o MERCADOPAGO_ACCESS_TOKEN no arquivo .env do backend.' 
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: user.id },
      select: { email: true, username: true, businessType: true }
    });

    const isProducts = admin?.businessType === 'PRODUCTS';
    let price = isProducts ? 39.90 : 39.90;
    let title = isProducts ? 'BoraEnkomenda - Plano Ateliê' : 'BoraMarka - Plano Essencial';
    let frequency = 1;
    let frequencyType = 'months';

    if (plan === 'essencial' || plan === 'mensal') {
      price = 39.90;
      title = 'BoraMarka - Plano Essencial';
    } else if (plan === 'pro') {
      price = 59.90;
      title = 'BoraMarka - Plano Pro';
    } else if (plan === 'vip' || plan === 'premium') {
      price = isProducts ? 99.90 : 89.90;
      title = isProducts ? 'BoraEnkomenda - Plano Gourmet VIP' : 'BoraMarka - Plano Studio VIP';
    } else if (plan === 'atelie') {
      price = 39.90;
      title = 'BoraEnkomenda - Plano Ateliê';
    } else if (plan === 'confeitaria_pro') {
      price = 69.90;
      title = 'BoraEnkomenda - Plano Confeitaria Pro';
    } else if (plan === 'gourmet_vip') {
      price = 99.90;
      title = 'BoraEnkomenda - Plano Gourmet VIP';
    } else if (plan === 'anual') {
      price = 260.00;
      title = isProducts ? 'BoraEnkomenda - Plano Anual Pro' : 'BoraMarka - Plano Anual Pro';
      frequency = 12;
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

    // 🛡️ Sanitizar dataId — aceitar apenas números para prevenir SSRF
    const sanitizedDataId = String(dataId).replace(/[^0-9]/g, '');
    if (!sanitizedDataId) {
      console.warn('⚠️ [WEBHOOK] dataId inválido recebido, ignorando.');
      return;
    }

    // 🛡️ Validar assinatura HMAC do Mercado Pago (x-signature header)
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (webhookSecret) {
      try {
        const xSignature = (request.headers['x-signature'] as string) || '';
        const xRequestId = (request.headers['x-request-id'] as string) || '';

        // Parse ts e hash do header x-signature (formato: "ts=...,v1=...")
        const signatureParts: Record<string, string> = {};
        xSignature.split(',').forEach(part => {
          const [key, ...valueParts] = part.trim().split('=');
          if (key && valueParts.length > 0) {
            signatureParts[key.trim()] = valueParts.join('=').trim();
          }
        });

        const ts = signatureParts['ts'];
        const v1 = signatureParts['v1'];

        if (ts && v1) {
          // Monta o manifest conforme docs do MP
          const manifest = `id:${sanitizedDataId};request-id:${xRequestId};ts:${ts};`;
          
          // Calcula HMAC-SHA256
          const crypto = await import('crypto');
          const computedHmac = crypto
            .createHmac('sha256', webhookSecret)
            .update(manifest)
            .digest('hex');

          if (computedHmac !== v1) {
            console.warn('⚠️ [WEBHOOK] Assinatura HMAC inválida — webhook rejeitado. Possível tentativa de fraude.');
            return;
          }

          console.log('🛡️ [WEBHOOK] Assinatura HMAC verificada com sucesso.');
        } else {
          console.warn('⚠️ [WEBHOOK] Header x-signature presente mas formato inválido — processando com cautela.');
        }
      } catch (signatureError: any) {
        console.error('❌ [WEBHOOK] Erro ao validar assinatura:', signatureError.message);
        return;
      }
    } else {
      console.warn('⚠️ [WEBHOOK] MERCADOPAGO_WEBHOOK_SECRET não configurado — webhook processado sem validação de assinatura. Configure para maior segurança.');
    }

    try {
      if (type === 'payment' || type === 'authorized_payment') {
        const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${sanitizedDataId}`, {
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
        const preapprovalResponse = await fetch(`https://api.mercadopago.com/preapproval/${sanitizedDataId}`, {
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
                  externalId: sanitizedDataId,
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

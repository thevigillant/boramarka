/**
 * Web Push Notification Service
 * 
 * Uses the VAPID protocol for sending push notifications
 * to subscribed clients (browsers/devices).
 */

import { prisma } from '../db';

// ─── VAPID Configuration ───
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contatoboramarka@gmail.com';

/**
 * Check if Web Push is properly configured
 */
export function isPushConfigured(): boolean {
  return !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}

/**
 * Get the public VAPID key for client-side subscription
 */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

/**
 * Send a push notification to a specific subscription
 */
export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; icon?: string; badge?: string; url?: string }
): Promise<{ success: boolean; error?: string }> {
  if (!isPushConfigured()) {
    console.log('⚠️ Web Push não configurado (VAPID keys ausentes). Ignorando push notification.');
    return { success: false, error: 'VAPID not configured' };
  }

  try {
    // Dynamic import web-push only when needed
    const webPush = await import('web-push');

    webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/icon-badge.png',
      data: { url: payload.url || '/' },
    });

    await webPush.sendNotification(pushSubscription, notificationPayload);
    console.log(`🔔 Push notification enviada para ${subscription.endpoint.substring(0, 50)}...`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erro ao enviar push notification:', error.message);

    // If subscription is expired/invalid, remove it from database
    if (error.statusCode === 404 || error.statusCode === 410) {
      try {
        await prisma.pushSubscription.deleteMany({
          where: { endpoint: subscription.endpoint },
        });
        console.log('🗑️ Subscription expirada removida do banco.');
      } catch (deleteError) {
        console.error('Erro ao remover subscription expirada:', deleteError);
      }
    }

    return { success: false, error: error.message };
  }
}

/**
 * Send push notifications to all subscriptions for a given phone + admin
 */
export async function sendPushToClient(
  clientPhone: string,
  adminId: number,
  payload: { title: string; body: string; icon?: string; url?: string }
): Promise<{ sent: number; failed: number }> {
  if (!isPushConfigured()) {
    return { sent: 0, failed: 0 };
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { clientPhone, adminId },
  });

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    const result = await sendPushNotification(
      { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
      payload
    );
    if (result.success) sent++;
    else failed++;
  }

  return { sent, failed };
}

/**
 * BoraMarka Service Worker — Push Notifications
 * Handles incoming push events and displays native notifications.
 */

/* eslint-disable no-restricted-globals */

self.addEventListener('push', function (event) {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'BoraMarka',
      body: event.data.text(),
    };
  }

  const options = {
    body: data.body || 'Você tem uma notificação.',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-badge.png',
    vibrate: [200, 100, 200],
    tag: 'boramarka-reminder',
    renotify: true,
    data: {
      url: data.data?.url || '/',
    },
    actions: [
      { action: 'open', title: '📅 Ver Agendamento' },
      { action: 'dismiss', title: 'Fechar' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '🔔 BoraMarka', options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // If there's already a window open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

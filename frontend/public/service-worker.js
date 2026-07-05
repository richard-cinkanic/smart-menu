self.addEventListener('push', (event) => {
  let payload = { title: 'Aktualizácia objednávky', message: 'Stav tvojej objednávky sa zmenil.' };
  try {
    if (event.data) payload = event.data.json();
  } catch (e) {
    console.warn('push parse failed', e);
  }

  const options = {
    body: payload.message || '',
    data: payload,
    renotify: true,
    icon: '/icon-192.png'
  };

  if (payload.orderId) {
    options.tag = payload.orderId;
  } else {
    // If we renotify, we MUST have a tag. If we don't have a tag, don't renotify.
    options.renotify = false;
  }

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(payload.title || 'Notifikácia', options),
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'PUSH_RECEIVED', payload });
        });
      })
    ])
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const orderId = event.notification?.data?.orderId;
  const url = orderId ? `/order-confirmation/${orderId}` : '/';  // zhodna s App.tsx routou
  event.waitUntil(clients.openWindow(url));
});
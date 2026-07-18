// Service Worker for Offline Payments Interception
const CACHE_NAME = 'smart-school-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Intercept offline manual payment posts
  if (url.pathname.includes('/api/payments/offline') && event.request.method === 'POST') {
    event.respondWith(
      fetch(event.request.clone()).catch(() => {
        // Return dummy queued status when offline/network fails
        return new Response(JSON.stringify({ queued: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
  }
});

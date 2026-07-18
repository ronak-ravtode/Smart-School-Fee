// Service Worker for Offline Payments Interception & Background Sync
const DB_NAME = 'payment-queue';
const STORE_NAME = 'payments';

// IndexedDB Helper Functions inside Service Worker
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'idempotency_key' });
      }
    };
  });
}

async function addPaymentToQueue(payment) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(payment);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

async function getQueuedPayments() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deletePaymentFromQueue(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(key);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Intercept fetch requests for offline support
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // If we offline-intercept the manual payments POST endpoint
  if (url.pathname.includes('/api/payments/offline') && event.request.method === 'POST') {
    event.respondWith(
      fetch(event.request.clone()).catch(async (err) => {
        console.log('⚡ Network failed. Service Worker intercepting offline payment...');
        try {
          const reqClone = event.request.clone();
          const payload = await reqClone.json();
          
          // Capture authorization token from headers to allow background sync authorization
          const authHeader = event.request.headers.get('Authorization') || '';
          payload.token = authHeader.replace('Bearer ', '');

          await addPaymentToQueue(payload);

          // Register a sync event if supported
          if (self.registration.sync) {
            await self.registration.sync.register('sync-payments');
            console.log('✅ Registered background sync tag: sync-payments');
          }

          return new Response(JSON.stringify({ queued: true, offline: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (idbErr) {
          console.error('Failed to cache payment in Service Worker:', idbErr);
          return new Response(JSON.stringify({ error: 'IndexedDB Offline Cache Failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      })
    );
  }
});

// Handle Background Sync
async function syncPayments() {
  console.log('🔄 Background sync starting. Fetching local queued payments...');
  try {
    const payments = await getQueuedPayments();
    if (payments.length === 0) {
      console.log('Queue is empty. Sync skipped.');
      return;
    }

    for (const payment of payments) {
      console.log(`Syncing payment: ${payment.idempotency_key}`);
      const payload = { ...payment };
      const token = payload.token;
      delete payload.token; // Do not leak token inside body

      const res = await fetch('/api/payments/offline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.status === 200 || res.status === 201) {
        await deletePaymentFromQueue(payment.idempotency_key);
        console.log(`✅ Successfully synced payment: ${payment.idempotency_key}`);
      } else {
        console.warn(`⚠️ Failed to sync payment: ${payment.idempotency_key}, Status: ${res.status}`);
      }
    }
  } catch (err) {
    console.error('Background sync failed:', err);
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-payments') {
    event.waitUntil(syncPayments());
  }
});

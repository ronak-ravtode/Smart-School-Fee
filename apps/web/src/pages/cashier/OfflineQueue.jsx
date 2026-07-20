import React, { useState, useEffect } from 'react';
import { getQueuedPayments, deletePaymentFromQueue } from '../../utils/idb';
import { Card, PillButton, Alert, Eyebrow, StatusBadge } from '../../components/ui/Primitives';

export default function OfflineQueue() {
  const [queue, setQueue] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(navigator.onLine);
  const [report, setReport] = useState('');

  const loadQueue = async () => {
    try {
      const items = await getQueuedPayments();
      setQueue(items);
    } catch (err) {
      console.error('Failed to load IndexedDB queue:', err);
    }
  };

  useEffect(() => {
    loadQueue();

    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerSync = async () => {
    if (!navigator.onLine) {
      setReport('Cannot sync while offline. Please connect to the internet first.');
      return;
    }
    if (queue.length === 0) {
      setReport('Queue is empty.');
      return;
    }

    setSyncing(true);
    setReport('');
    let successCount = 0;
    let failCount = 0;

    const token = localStorage.getItem('token');

    for (const payment of queue) {
      try {
        const res = await fetch('/api/payments/offline', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payment)
        });

        if (res.status === 200 || res.status === 201) {
          successCount++;
          // Delete from IndexedDB queue
          await deletePaymentFromQueue(payment.idempotency_key);
        } else {
          failCount++;
        }
      } catch (err) {
        console.error(err);
        failCount++;
      }
    }

    setSyncing(false);
    setReport(`Sync process completed: ${successCount} synced successfully, ${failCount} failed.`);
    // Reload IndexedDB queue
    loadQueue();
  };

  return (
    <div className="flex flex-col gap-section-sm max-w-[880px] mx-auto w-full">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Eyebrow>Offline Queue</Eyebrow>
          <h1 className="font-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-ink-black leading-tight mt-2">
            Collections Sync
          </h1>
        </div>
        <StatusBadge tone={onlineStatus ? 'active' : 'error'}>
          {onlineStatus ? 'ONLINE' : 'OFFLINE'}
        </StatusBadge>
      </header>

      <Card>
        <p className="font-body text-[14px] text-on-surface-variant mb-6">
          Queued payments collected in cash or cheque while the cashier terminal was disconnected.
          They will auto-sync when connection is restored, or you can trigger a manual sync below.
        </p>

        {report && (
          <Alert tone={report.includes('failed') || report.includes('Cannot') ? 'error' : 'success'}>{report}</Alert>
        )}

        {queue.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant text-[14px]">
            ✓ All collections are in sync. Local queue is empty!
          </div>
        ) : (
          <>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-outline-variant/40 text-on-surface-variant font-eyebrow text-eyebrow uppercase tracking-wider">
                    <th className="p-3">Method</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Details</th>
                    <th className="p-3">Time Added</th>
                    <th className="p-3">Key</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map(item => (
                    <tr key={item.idempotency_key} className="border-b border-outline-variant/20">
                      <td className="p-3 font-semibold text-ink-black">{item.method}</td>
                      <td className="p-3 text-ink-black">₹{Number(item.amount).toLocaleString('en-IN')}</td>
                      <td className="p-3 text-on-surface-variant">
                        {item.method === 'CHEQUE'
                          ? `Bank: ${item.bank} (No: ${item.cheque_no})`
                          : 'Cash Collection'}
                      </td>
                      <td className="p-3 text-on-surface-variant">{new Date(item.timestamp).toLocaleTimeString()}</td>
                      <td className="p-3 font-mono text-[12px] text-on-surface-variant">{item.idempotency_key.substring(0, 15)}…</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <PillButton type="button" onClick={triggerSync} disabled={syncing || !onlineStatus}>
              {syncing ? 'Synchronizing Payments…' : 'Sync Queued Payments with Server'}
            </PillButton>
          </>
        )}
      </Card>
    </div>
  );
}

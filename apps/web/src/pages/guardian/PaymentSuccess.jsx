import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Icon } from '../../components/Icon';

export default function PaymentSuccess({ onNavigate }) {
  const [status, setStatus] = useState('pending'); // 'pending', 'success', 'failed', 'error'
  const [transactionId, setTransactionId] = useState(null);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [attempts, setAttempts] = useState(0);

  // Extract order_id from URL query string
  const query = new URLSearchParams(window.location.search);
  const orderId = query.get('order_id');

  useEffect(() => {
    if (!orderId) {
      setStatus('error');
      return;
    }

    let intervalId;

    const pollPaymentStatus = async () => {
      try {
        const res = await axios.get(`/api/payments/verify?order_id=${orderId}`);
        if (res.data.status === 'success') {
          setStatus('success');
          setTransactionId(res.data.transactionId);
          setReceiptNumber(res.data.receiptNumber);
          clearInterval(intervalId);
        } else if (res.data.status === 'failed') {
          setStatus('failed');
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error(err);
      }

      setAttempts(prev => {
        if (prev >= 15) { // 30 seconds limit
          clearInterval(intervalId);
          setStatus('failed');
        }
        return prev + 1;
      });
    };

    // Run first check immediately
    pollPaymentStatus();

    // Set up polling interval every 2 seconds
    intervalId = setInterval(pollPaymentStatus, 2000);

    return () => clearInterval(intervalId);
  }, [orderId]);

  const handleDownloadReceipt = async () => {
    if (!transactionId) return;
    try {
      const res = await axios.get(`/api/payments/receipt?transaction_id=${transactionId}`);
      const link = document.createElement('a');
      link.href = res.data.receiptUrl;
      link.download = `Receipt-${receiptNumber || 'Payment'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('Failed to download PDF receipt.');
    }
  };

  const handleGoBack = () => {
    window.history.replaceState({}, document.title, '/');
    onNavigate('dashboard');
  };

  const panel =
    'w-full max-w-[500px] bg-lifted-cream rounded-frame p-card-padding shadow-deep border border-white/50 text-center';

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className={panel}>
        {status === 'pending' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-[3px] border-outline-variant border-t-signal-orange animate-spin" />
            <span className="font-eyebrow text-eyebrow uppercase tracking-wider text-light-signal-orange">
              Verifying Transaction
            </span>
            <h2 className="font-headline-sm text-headline-sm text-ink-black">Polling Gateway Status</h2>
            <p className="font-body text-[14px] text-on-surface-variant">
              Awaiting double-charge protection checks and Cashfree payment confirmation webhook. Please do not close this window.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-success-container flex items-center justify-center text-success">
              <Icon name="check" className="text-[32px]" />
            </div>
            <h2 className="font-headline-sm text-headline-sm text-ink-black">Transaction Successful!</h2>
            <p className="font-body text-[14px] text-on-surface-variant">
              Your payment has been successfully recorded in the school fee ledger.
            </p>
            {receiptNumber && (
              <div className="bg-surface-container-low px-4 py-3 rounded-[16px] text-[13px] font-mono w-full">
                Receipt No: <strong className="text-success">{receiptNumber}</strong>
              </div>
            )}
            <div className="flex flex-col gap-3 w-full mt-2">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 bg-ink-black text-canvas-cream rounded-full px-6 h-12 font-nav-button text-nav-button text-[14px] hover:bg-inverse-surface transition-colors"
                onClick={handleDownloadReceipt}
              >
                <Icon name="download" className="text-[18px]" /> Download PDF Receipt
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 border border-outline-variant text-ink-black rounded-full px-6 h-12 font-nav-button text-nav-button text-[14px] hover:bg-surface-container-low transition-colors"
                onClick={handleGoBack}
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-error-container flex items-center justify-center text-error">
              <Icon name="close" className="text-[32px]" />
            </div>
            <h2 className="font-headline-sm text-headline-sm text-ink-black">Transaction Declined</h2>
            <p className="font-body text-[14px] text-on-surface-variant">
              The payment gateway rejected the transaction or the session expired. No funds were debited.
            </p>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 bg-ink-black text-canvas-cream rounded-full px-6 h-12 font-nav-button text-nav-button text-[14px] hover:bg-inverse-surface transition-colors w-full mt-2"
              onClick={handleGoBack}
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-warning-container flex items-center justify-center text-warning">
              <Icon name="warning" className="text-[32px]" />
            </div>
            <h2 className="font-headline-sm text-headline-sm text-ink-black">Order ID Missing</h2>
            <p className="font-body text-[14px] text-on-surface-variant">
              No valid Cashfree Order ID reference was detected in the callback query parameters.
            </p>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 bg-ink-black text-canvas-cream rounded-full px-6 h-12 font-nav-button text-nav-button text-[14px] hover:bg-inverse-surface transition-colors w-full mt-2"
              onClick={handleGoBack}
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

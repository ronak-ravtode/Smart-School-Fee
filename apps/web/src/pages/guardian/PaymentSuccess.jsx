import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Icon } from '../../components/Icon';
import GlassCard from '../../components/ui/GlassCard';
import ActionButton from '../../components/ui/ActionButton';

export default function PaymentSuccess({ onNavigate }) {
  const [status, setStatus] = useState('pending');
  const [transactionId, setTransactionId] = useState(null);
  const [receiptNumber, setReceiptNumber] = useState('');

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
    };

    pollPaymentStatus();
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

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4" style={{ backgroundColor: '#f8f6f3' }}>
      <GlassCard className="w-full max-w-[500px] text-center">
        {status === 'pending' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-12 h-12 rounded-full border-[3px] border-gray-200 border-t-module-dashboard animate-spin" />
            <span className="text-xs font-medium text-module-dashboard uppercase tracking-wider">Verifying Transaction</span>
            <h2 className="text-lg font-semibold text-ink-black">Polling Gateway Status</h2>
            <p className="text-sm text-on-surface-variant">
              Awaiting double-charge protection checks and payment confirmation webhook. Please do not close this window.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-14 h-14 rounded-full bg-success-container flex items-center justify-center text-success">
              <Icon name="check" className="text-[32px]" />
            </div>
            <h2 className="text-lg font-semibold text-ink-black">Transaction Successful!</h2>
            <p className="text-sm text-on-surface-variant">
              Your payment has been successfully recorded in the school fee ledger.
            </p>
            {receiptNumber && (
              <div className="bg-gray-50 px-4 py-3 rounded-[12px] text-sm font-mono w-full">
                Receipt No: <strong className="text-success">{receiptNumber}</strong>
              </div>
            )}
            <div className="flex flex-col gap-3 w-full mt-2">
              <ActionButton onClick={handleDownloadReceipt}>
                <Icon name="download" className="text-lg" /> Download PDF Receipt
              </ActionButton>
              <ActionButton variant="secondary" onClick={handleGoBack}>
                Return to Dashboard
              </ActionButton>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-14 h-14 rounded-full bg-error-container flex items-center justify-center text-error">
              <Icon name="close" className="text-[32px]" />
            </div>
            <h2 className="text-lg font-semibold text-ink-black">Transaction Declined</h2>
            <p className="text-sm text-on-surface-variant">
              The payment gateway rejected the transaction or the session expired. No funds were debited.
            </p>
            <ActionButton onClick={handleGoBack} className="w-full mt-2">
              Back to Dashboard
            </ActionButton>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-14 h-14 rounded-full bg-warning-container flex items-center justify-center text-warning">
              <Icon name="warning" className="text-[32px]" />
            </div>
            <h2 className="text-lg font-semibold text-ink-black">Order ID Missing</h2>
            <p className="text-sm text-on-surface-variant">
              No valid Cashfree Order ID reference was detected in the callback query parameters.
            </p>
            <ActionButton onClick={handleGoBack} className="w-full mt-2">
              Back to Dashboard
            </ActionButton>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import axios from 'axios';

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

  return (
    <div className="auth-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel glass-panel-glow" style={{ maxWidth: '500px', width: '100%', padding: '40px', textAlign: 'center' }}>
        
        {status === 'pending' && (
          <div>
            <div className="alert alert-success" style={{ background: 'rgba(6, 182, 212, 0.12)', borderColor: 'rgba(6, 182, 212, 0.3)', color: '#22d3ee', display: 'inline-block', padding: '15px 30px', borderRadius: '15px', marginBottom: '24px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'block', animation: 'pulse 1.5s infinite' }}>
                🔄 VERIFYING TRANSACTION
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '10px' }}>Polling Gateway Status</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '30px' }}>
              Awaiting double-charge protection checks and Cashfree payment confirmation webhook. Please do not close this window.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="form-input" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="alert alert-success" style={{ display: 'inline-block', padding: '15px 30px', borderRadius: '15px', marginBottom: '24px' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'block' }}>
                ✅ PAYMENT CAPTURED
              </span>
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '10px', color: 'white' }}>Transaction Successful!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '15px' }}>
              Your payment has been successfully recorded in the school fee ledger.
            </p>
            
            {receiptNumber && (
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '24px', fontFamily: 'monospace' }}>
                Receipt No: <strong style={{ color: 'var(--success)' }}>{receiptNumber}</strong>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                type="button"
                className="btn" 
                style={{ width: '100%', padding: '12px', fontSize: '0.9rem', fontWeight: 600 }}
                onClick={handleDownloadReceipt}
              >
                Download PDF Receipt
              </button>
              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }}
                onClick={() => onNavigate('dashboard')}
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div>
            <div className="alert alert-error" style={{ display: 'inline-block', padding: '15px 30px', borderRadius: '15px', marginBottom: '24px' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'block' }}>
                ❌ PAYMENT FAILED
              </span>
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '10px', color: 'white' }}>Transaction Declined</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '30px' }}>
              The payment gateway rejected the transaction or the session expired. No funds were debited.
            </p>
            <button 
              type="button"
              className="btn" 
              style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }}
              onClick={() => onNavigate('dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="alert alert-error" style={{ display: 'inline-block', padding: '15px 30px', borderRadius: '15px', marginBottom: '24px' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'block' }}>
                ⚠️ REFERENCE ERROR
              </span>
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '10px', color: 'white' }}>Order ID Missing</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '30px' }}>
              No valid Cashfree Order ID reference was detected in the callback query parameters.
            </p>
            <button 
              type="button"
              className="btn" 
              style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }}
              onClick={() => onNavigate('dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

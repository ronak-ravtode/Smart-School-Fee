import React, { useState } from 'react';
import axios from 'axios';

export default function PaymentButton({ feeAssignmentId, amount, disabled }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      // Generate a unique idempotency key on each initiation click
      const idempotencyKey = `idemp_${feeAssignmentId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      const res = await axios.post('/api/payments/initiate', {
        feeAssignmentId,
        method: 'UPI',
        idempotencyKey
      });

      if (res.data.paymentUrl) {
        // Redirect to Cashfree Hosted Checkout page
        window.location.href = res.data.paymentUrl;
      } else {
        throw new Error('Payment gateway did not return a valid checkout link.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to initiate checkout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'inline-block' }}>
      <button 
        type="button"
        className="btn" 
        style={{ padding: '8px 20px', fontSize: '0.85rem', fontWeight: 600 }} 
        onClick={handlePay} 
        disabled={loading || disabled}
      >
        {loading ? 'Processing...' : `Pay UPI (₹${Number(amount).toLocaleString()})`}
      </button>
      {error && (
        <span style={{ display: 'block', color: 'var(--error)', fontSize: '0.75rem', marginTop: '6px' }}>
          {error}
        </span>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import axios from 'axios';

export default function PaymentButton({ feeAssignmentId, amount, disabled }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [simulating, setSimulating] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      const idempotencyKey = `idemp_${feeAssignmentId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      const res = await axios.post('/api/payments/initiate', {
        feeAssignmentId,
        method: 'UPI',
        idempotencyKey
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.data.success) {
        setOrderId(res.data.orderId);
        setShowModal(true);
      } else {
        throw new Error('Payment gateway failed to initialize order.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to initiate checkout.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateCallback = async () => {
    setSimulating(true);
    try {
      // Trigger API webhook simulation using local testing bypass headers
      await axios.post('/api/payments/webhook', {
        order_id: orderId,
        order_status: 'PAID'
      }, {
        headers: {
          'x-test-bypass': 'true',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Reload window to show generated receipt
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Webhook simulation failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setSimulating(false);
    }
  };

  // Build standard UPI deep link URL format
  const upiUrl = `upi://pay?pa=schoolfees@axisbank&pn=SmartSchoolFinTech&am=${amount}&tr=${orderId}&tn=School_Fees_Id_${feeAssignmentId}`;
  
  // Generate scannable QR Code image from QRServer API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;

  return (
    <div style={{ display: 'inline-block' }}>
      <button 
        type="button"
        className="btn" 
        style={{ padding: '8px 20px', fontSize: '0.85rem', fontWeight: 600 }} 
        onClick={handlePay} 
        disabled={loading || disabled}
      >
        {loading ? 'Processing...' : `Pay UPI (₹${Number(amount).toLocaleString('en-IN')})`}
      </button>

      {error && (
        <span style={{ display: 'block', color: 'var(--error)', fontSize: '0.75rem', marginTop: '6px' }}>
          {error}
        </span>
      )}

      {/* Scannable UPI QR Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          color: '#ffffff'
        }}>
          <div className="glass-panel" style={{
            width: '420px',
            padding: '30px',
            background: 'rgba(15, 23, 42, 0.98)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '15px'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
              Scan QR to Pay
            </h3>
            
            <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: 0 }}>
              SmartSchool FinTech • UPI Merchant Service
            </p>

            {/* Google Charts dynamic QR Code image */}
            <div style={{
              background: '#ffffff',
              padding: '10px',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              marginTop: '10px'
            }}>
              <img 
                src={qrCodeUrl} 
                alt="Scan UPI QR Code" 
                style={{ width: '220px', height: '220px', display: 'block' }}
              />
            </div>

            <div style={{ marginTop: '10px', fontSize: '0.85rem' }}>
              <p style={{ margin: '5px 0', color: '#94a3b8' }}>
                Amount: <strong style={{ color: '#ffffff', fontSize: '1rem' }}>₹{Number(amount).toLocaleString('en-IN')}</strong>
              </p>
              <p style={{ margin: '5px 0', fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                Order ID: {orderId}
              </p>
            </div>

            <p style={{ fontSize: '0.7rem', color: '#22c55e', margin: '5px 0', fontWeight: 600 }}>
              ⚡ zero processing fees applied under NPCI guidelines.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '10px' }}>
              <button
                type="button"
                className="btn"
                style={{ background: '#22c55e', color: '#ffffff', fontSize: '0.8rem', padding: '10px' }}
                onClick={handleSimulateCallback}
                disabled={simulating}
              >
                {simulating ? 'Simulating Webhook Callback...' : 'Simulate Gateway Success Callback'}
              </button>
              
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '10px' }}
                onClick={() => setShowModal(false)}
                disabled={simulating}
              >
                Close Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

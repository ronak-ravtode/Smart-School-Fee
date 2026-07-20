import React, { useState } from 'react';
import axios from 'axios';
import { Icon } from '../../components/Icon';

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
    <div className="inline-block">
      <button
        type="button"
        className="inline-flex items-center gap-2 bg-ink-black text-canvas-cream rounded-full px-5 h-11 font-nav-button text-nav-button text-[14px] hover:bg-inverse-surface transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-orange disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handlePay}
        disabled={loading || disabled}
      >
        <Icon name="account_balance_wallet" className="text-[18px]" />
        {loading ? 'Processing…' : `Pay UPI (₹${Number(amount).toLocaleString('en-IN')})`}
      </button>

      {error && (
        <span className="block text-error text-[12px] mt-1.5">{error}</span>
      )}

      {/* Scannable UPI QR Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] bg-ink-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[420px] bg-lifted-cream rounded-frame p-card-padding shadow-deep border border-white/50 flex flex-col items-center text-center gap-3">
            <div className="flex items-center justify-between w-full">
              <h3 className="font-headline-sm text-headline-sm text-ink-black">Scan QR to Pay</h3>
              <button type="button" onClick={() => setShowModal(false)} aria-label="Close" className="text-on-surface-variant hover:text-ink-black rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-orange">
                <Icon name="close" className="text-[22px]" />
              </button>
            </div>

            <p className="text-[13px] text-on-surface-variant">SmartSchool FinTech • UPI Merchant Service</p>

            <div className="bg-white p-2.5 rounded-[12px] mt-2">
              <img
                src={qrCodeUrl}
                alt="Scan UPI QR Code"
                style={{ width: '220px', height: '220px', display: 'block' }}
              />
            </div>

            <div className="mt-2 text-[14px]">
              <p className="text-on-surface-variant">
                Amount: <strong className="text-ink-black text-[16px]">₹{Number(amount).toLocaleString('en-IN')}</strong>
              </p>
              <p className="text-[12px] text-on-surface-variant font-mono mt-1">Order ID: {orderId}</p>
            </div>

            <p className="text-[12px] text-success font-semibold">⚡ zero processing fees applied under NPCI guidelines.</p>

            <div className="flex flex-col gap-2 w-full mt-2">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 bg-success text-white rounded-full px-6 h-12 font-nav-button text-nav-button text-[14px] hover:bg-success/90 transition-colors disabled:opacity-50"
                onClick={handleSimulateCallback}
                disabled={simulating}
              >
                {simulating ? 'Simulating Webhook Callback…' : 'Simulate Gateway Success Callback'}
              </button>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 border border-outline-variant text-ink-black rounded-full px-6 h-12 font-nav-button text-nav-button text-[14px] hover:bg-surface-container-low transition-colors disabled:opacity-50"
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

import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  CreditCard, Smartphone, Landmark, CheckCircle, Loader,
  FileText, Shield, ArrowRight, X
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: <Smartphone size={20} />, desc: 'Pay via Google Pay, PhonePe, BHIM' },
  { id: 'card', label: 'Credit / Debit Card', icon: <CreditCard size={20} />, desc: 'Visa, Mastercard, RuPay' },
  { id: 'netbanking', label: 'Net Banking', icon: <Landmark size={20} />, desc: 'All major Indian banks' },
];

export default function PaymentCheckoutModal({ order, onClose, onPaymentSuccess }) {
  const [step, setStep] = useState('select'); // select | confirm | processing | success
  const [method, setMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [invoice, setInvoice] = useState(null);

  const gst = order?.total_price ? +(order.total_price * (5 / 105)).toFixed(2) : 0;
  const base = order?.total_price ? +(order.total_price - gst).toFixed(2) : 0;

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePay = async () => {
    setStep('processing');
    try {
      const token = localStorage.getItem('token');

      // Step 1: Create Razorpay order on backend
      const createRes = await axios.post(
        `${API_BASE_URL}/api/payments/create-order`,
        { order_id: order.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const rzpOrderId = createRes.data?.razorpay_order_id;

      // Step 2: Load Razorpay SDK and open checkout popup
      const sdkLoaded = await loadRazorpay();
      if (!sdkLoaded) throw new Error('Razorpay SDK failed to load. Check your internet connection.');

      await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: Math.round(order.total_price * 100), // paise
          currency: 'INR',
          name: 'KisanMitra',
          description: `Order #${order.id} — ${order.product?.name || 'Crop'}`,
          order_id: rzpOrderId,
          prefill: { method: method },
          theme: { color: '#059669' },
          handler: async (response) => {
            try {
              // Step 3: Verify signature on backend
              const verifyRes = await axios.post(
                `${API_BASE_URL}/api/payments/verify`,
                {
                  order_id: order.id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  payment_method: method,
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              setInvoice(verifyRes.data);
              setStep('success');
              toast.success('Payment successful! Funds secured in KisanMitra Escrow.');
              if (onPaymentSuccess) onPaymentSuccess(verifyRes.data);
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => {
              setStep('confirm');
              reject(new Error('Payment cancelled'));
            },
          },
        });
        rzp.open();
      });
    } catch (err) {
      if (err?.message !== 'Payment cancelled') {
        console.error(err);
        toast.error(err.response?.data?.detail || err.message || 'Payment failed. Please try again.');
      }
      if (step !== 'success') setStep('confirm');
    }
  };

  if (!order) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '20px', width: '100%', maxWidth: '520px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.2)', overflow: 'hidden', maxHeight: '90vh',
        overflowY: 'auto', fontFamily: "'Segoe UI', system-ui, sans-serif"
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
          padding: '20px 24px', color: '#fff',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '11px', opacity: 0.7, letterSpacing: '1px', textTransform: 'uppercase' }}>KisanMitra Secure Pay</div>
            <div style={{ fontSize: '20px', fontWeight: '800', marginTop: '2px' }}>
              Complete Payment
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
            width: '36px', height: '36px', cursor: 'pointer', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Order Summary */}
        <div style={{
          margin: '20px 24px', background: '#f0fdf4', borderRadius: '14px',
          padding: '16px', border: '1px solid #bbf7d0'
        }}>
          <div style={{ fontSize: '12px', color: '#059669', fontWeight: '700', marginBottom: '10px', letterSpacing: '0.5px' }}>ORDER SUMMARY</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
            <span style={{ color: '#374151' }}>Product</span>
            <span style={{ fontWeight: '700' }}>{order.product?.name || 'Crop Purchase'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
            <span style={{ color: '#374151' }}>Order #</span>
            <span style={{ fontWeight: '600' }}>KM-{String(order.id).padStart(6, '0')}</span>
          </div>
          <div style={{ borderTop: '1px dashed #bbf7d0', margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', color: '#6b7280' }}>
            <span>Subtotal (excl. GST)</span>
            <span>₹{base.toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', color: '#6b7280' }}>
            <span>GST @ 5% (CGST 2.5% + SGST 2.5%)</span>
            <span>₹{gst.toLocaleString('en-IN')}</span>
          </div>
          <div style={{ borderTop: '1px solid #bbf7d0', margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '800', color: '#064e3b' }}>
            <span>Total Payable</span>
            <span>₹{(+order.total_price).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Step: Select Payment Method */}
        {(step === 'select' || step === 'confirm') && (
          <div style={{ padding: '0 24px 24px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#374151', marginBottom: '12px' }}>
              Select Payment Method
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setMethod(pm.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
                    border: method === pm.id ? '2px solid #059669' : '1.5px solid #e5e7eb',
                    background: method === pm.id ? '#f0fdf4' : '#fff',
                    textAlign: 'left', transition: 'all 0.15s'
                  }}
                >
                  <span style={{ color: method === pm.id ? '#059669' : '#9ca3af' }}>{pm.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#111827' }}>{pm.label}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{pm.desc}</div>
                  </div>
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%',
                    border: method === pm.id ? '5px solid #059669' : '2px solid #d1d5db',
                    background: '#fff', flexShrink: 0
                  }} />
                </button>
              ))}
            </div>

            {method === 'upi' && (
              <div style={{ marginTop: '14px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Enter UPI ID
                </label>
                <input
                  type="text"
                  placeholder="yourname@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', border: '1.5px solid #d1d5db',
                    borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            )}

            {/* Escrow Info */}
            <div style={{
              marginTop: '16px', background: '#fffbeb', border: '1px solid #fde68a',
              borderRadius: '12px', padding: '12px 14px',
              display: 'flex', alignItems: 'flex-start', gap: '10px'
            }}>
              <Shield size={18} style={{ color: '#d97706', marginTop: '1px', flexShrink: 0 }} />
              <div style={{ fontSize: '12px', color: '#92400e', lineHeight: '1.5' }}>
                <strong>Protected by KisanMitra Escrow:</strong> Your funds are held securely and released to the farmer only after delivery is confirmed.
              </div>
            </div>

            <button
              onClick={() => setStep('confirm')}
              style={{
                marginTop: '20px', width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#fff', border: 'none', borderRadius: '12px',
                fontSize: '16px', fontWeight: '800', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 4px 16px rgba(5,150,105,0.35)'
              }}
              disabled={step === 'confirm'}
            >
              {step === 'confirm' ? (
                <>Confirm & Pay ₹{(+order.total_price).toLocaleString('en-IN')} <ArrowRight size={18} /></>
              ) : (
                <>Continue <ArrowRight size={18} /></>
              )}
            </button>

            {step === 'confirm' && (
              <button
                onClick={handlePay}
                style={{
                  marginTop: '10px', width: '100%', padding: '14px',
                  background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
                  color: '#fff', border: 'none', borderRadius: '12px',
                  fontSize: '15px', fontWeight: '800', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                🔒 Pay ₹{(+order.total_price).toLocaleString('en-IN')} via {method.toUpperCase()}
              </button>
            )}
          </div>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              animation: 'pulse 1s ease-in-out infinite alternate'
            }}>
              <Loader size={28} style={{ color: '#059669', animation: 'spin 1s linear infinite' }} />
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#064e3b', marginBottom: '8px' }}>Processing Payment...</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Securing funds in KisanMitra Escrow vault</div>
            <style>{`@keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }`}</style>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #d1fae5, #6ee7b7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(5,150,105,0.25)'
            }}>
              <CheckCircle size={36} style={{ color: '#059669' }} />
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#064e3b', marginBottom: '6px' }}>
              Payment Successful! 🎉
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px', lineHeight: '1.6' }}>
              ₹{(+order.total_price).toLocaleString('en-IN')} is secured in KisanMitra Escrow.<br />
              Funds will be released to farmer upon delivery confirmation.
            </div>

            {invoice && (
              <div style={{
                background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px',
                padding: '16px', textAlign: 'left', marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <FileText size={16} style={{ color: '#059669' }} />
                  <span style={{ fontWeight: '700', fontSize: '13px', color: '#374151' }}>
                    GST Invoice: {invoice.invoice_number}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.8' }}>
                  <div>Taxable Value: ₹{base.toLocaleString('en-IN')}</div>
                  <div>CGST (2.5%): ₹{(gst / 2).toFixed(2)}</div>
                  <div>SGST (2.5%): ₹{(gst / 2).toFixed(2)}</div>
                  <div style={{ fontWeight: '700', color: '#064e3b', marginTop: '4px' }}>
                    Total: ₹{(+order.total_price).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              style={{
                width: '100%', padding: '13px',
                background: 'linear-gradient(135deg, #059669, #047857)',
                color: '#fff', border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: '800', cursor: 'pointer'
              }}
            >
              Continue to Track Delivery
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

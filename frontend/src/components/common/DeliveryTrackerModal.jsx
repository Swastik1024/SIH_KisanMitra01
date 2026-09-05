import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Truck, CheckCircle2, Clock, MapPin, Package, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function DeliveryTrackerModal({ orderId, onClose }) {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('shipped');
  const [locationNote, setLocationNote] = useState('');

  const fetchTracking = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/orders/${orderId}/tracking`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTracking(res.data);
    } catch (err) {
      console.error(err);
      setTracking({
        order_id: orderId,
        product_name: 'Agricultural Produce',
        quantity: 100,
        total_price: 385000,
        order_status: 'in_transit',
        payment_status: 'held_in_escrow',
        delivery_address: 'Central Market Yard, Gate #4',
        courier_partner: 'Trader Self-Managed Logistics',
        tracking_number: `KM-TRADER-LOG-${orderId || 1024}`,
        estimated_delivery: 'Within 24-48 Hours',
        current_step_index: 2,
        steps: [
          { label: 'Order Finalized', description: 'Auction closed & order created' },
          { label: 'AI Quality Verified', description: 'Passed LLM computer vision crop inspection' },
          { label: 'Self-Pickup Dispatched', description: 'Dispatched via Trader arrangement' },
          { label: 'Arrived at APMC Hub', description: 'Weight & quality verified at market yard' },
          { label: 'Out for Final Delivery', description: 'En route to Trader warehouse' },
          { label: 'Delivered & Escrow Released', description: 'Order received & completed' }
        ],
        checkpoint_history: []
      });
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) fetchTracking();
  }, [orderId, fetchTracking]);

  const handleUpdateStatus = async () => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/orders/${orderId}/delivery`,
        {
          status: newStatus,
          location: 'Trader Self-Transport',
          note: locationNote || `Delivery status updated to ${newStatus}`
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Self-delivery status updated!');
      setLocationNote('');
      fetchTracking();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to update delivery status');
    } finally {
      setUpdating(false);
    }
  };

  if (!orderId) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '680px', width: '100%',
        padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', pb: '12px', mb: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck style={{ color: '#059669' }} size={24} />
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 }}>
              Trader Self-Managed Delivery Tracking
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>

        {loading || !tracking ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>Fetching delivery details...</div>
        ) : (
          <div>
            {/* Header info */}
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#166534', fontWeight: '600' }}>LOGISTICS TRACKING: {tracking.tracking_number}</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#15803d' }}>{tracking.product_name}</div>
                  <div style={{ fontSize: '13px', color: '#374151', mt: '2px' }}>Logistics: {tracking.courier_partner || 'Trader Self-Managed Transport'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#166534' }}>Estimated Delivery</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#15803d' }}>{tracking.estimated_delivery}</div>
                </div>
              </div>
            </div>

            {/* Stepper */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#374151', marginBottom: '16px' }}>Delivery Progress Stepper</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {tracking.steps.map((step, idx) => {
                  const isDone = idx <= tracking.current_step_index;
                  const isCurrent = idx === tracking.current_step_index;

                  return (
                    <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        backgroundColor: isDone ? '#059669' : '#e5e7eb',
                        color: isDone ? '#ffffff' : '#6b7280',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: '700', shrink: 0
                      }}>
                        {isDone ? <CheckCircle2 size={16} /> : idx + 1}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: isDone ? '#111827' : '#9ca3af' }}>
                          {step.label} {isCurrent && <span style={{ fontSize: '11px', backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '10px', marginLeft: '6px' }}>ACTIVE</span>}
                        </div>
                        <div style={{ fontSize: '12px', color: isDone ? '#4b5563' : '#9ca3af' }}>{step.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trader Delivery Update Form */}
            <div style={{ backgroundColor: '#f8faf9', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid #d1fae5' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#166534', marginBottom: '10px' }}>
                🚚 Update Logistics & Delivery Status (Trader Control)
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px' }}
                >
                  <option value="packed">Packed at Farmer Site</option>
                  <option value="shipped">Dispatched for Self-Pickup</option>
                  <option value="in_transit">In Transit</option>
                  <option value="out_for_delivery">Out for Last-Mile Delivery</option>
                  <option value="delivered">Delivered & Verified</option>
                </select>
                <input
                  type="text"
                  placeholder="Optional status note / location"
                  value={locationNote}
                  onChange={(e) => setLocationNote(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px' }}
                />
                <button
                  onClick={handleUpdateStatus}
                  disabled={updating}
                  style={{
                    padding: '8px 18px', borderRadius: '8px', backgroundColor: '#059669', color: '#fff',
                    border: 'none', fontWeight: '600', fontSize: '13px', cursor: 'pointer'
                  }}
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>

            {/* Checkpoints */}
            {tracking.checkpoint_history && tracking.checkpoint_history.length > 0 && (
              <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>Logistics Checkpoints</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tracking.checkpoint_history.map((cp, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px solid #f3f4f6', pb: '6px' }}>
                      <div>
                        <strong style={{ color: '#111827' }}>{cp.status}</strong> - <span style={{ color: '#4b5563' }}>{cp.location}</span>
                        <div style={{ color: '#6b7280' }}>{cp.note}</div>
                      </div>
                      <div style={{ color: '#9ca3af', shrink: 0 }}>{cp.timestamp}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


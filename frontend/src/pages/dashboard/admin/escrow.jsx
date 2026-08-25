import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/common/Header';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';
import { Shield, CheckCircle, Loader, ArrowLeft, RefreshCw, IndianRupee } from 'lucide-react';

export default function AdminEscrowPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [releasingId, setReleasingId] = useState(null);
  const { isAuthenticated, user, hydrate } = useAuthStore();

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.role !== 'admin') { router.replace('/dashboard'); return; }
    fetchOrders();
  }, [isAuthenticated, user, router]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/orders/all');
      const held = (Array.isArray(res.data) ? res.data : []).filter(
        (o) => o.payment_status === 'held'
      );
      setOrders(held);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load escrow orders');
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async (orderId) => {
    setReleasingId(orderId);
    try {
      const res = await api.post(`/api/payments/release-escrow/${orderId}`);
      toast.success(res.data.message || 'Escrow released! Payout sent to farmer.');
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to release escrow');
    } finally {
      setReleasingId(null);
    }
  };

  return (
    <div>
      <Header />
      <div style={{
        minHeight: '100vh', background: '#f0f4f1', paddingTop: '100px',
        paddingBottom: '40px', fontFamily: "'Segoe UI', system-ui, sans-serif"
      }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 20px' }}>
          {/* Back */}
          <Link href="/dashboard/admin" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>
            <button style={{
              background: 'white', border: '1px solid #e5e7eb', borderRadius: '50px',
              padding: '10px 18px', cursor: 'pointer', fontSize: '14px',
              fontWeight: '700', color: '#1b4332', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              display: 'inline-flex', alignItems: 'center', gap: '6px'
            }}>
              <ArrowLeft size={16} /> Back to Admin
            </button>
          </Link>

          {/* Page Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#064e3b', margin: 0 }}>
                🔐 Escrow Management
              </h1>
              <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
                Release held funds to farmers once delivery is confirmed
              </p>
            </div>
            <button
              onClick={fetchOrders}
              style={{
                background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '10px',
                padding: '10px 14px', cursor: 'pointer', display: 'inline-flex',
                alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#374151'
              }}
            >
              <RefreshCw size={15} /> Refresh
            </button>
          </div>

          {/* Stats Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
            borderRadius: '16px', padding: '20px 24px', marginBottom: '24px', color: '#fff',
            display: 'flex', gap: '32px', flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Orders in Escrow</div>
              <div style={{ fontSize: '28px', fontWeight: '900', marginTop: '4px' }}>{orders.length}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Total Held Amount</div>
              <div style={{ fontSize: '28px', fontWeight: '900', marginTop: '4px' }}>
                ₹{orders.reduce((acc, o) => acc + (o.total_price || 0), 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Farmer Payout (95%)</div>
              <div style={{ fontSize: '28px', fontWeight: '900', marginTop: '4px' }}>
                ₹{(orders.reduce((acc, o) => acc + (o.total_price || 0), 0) * 0.95).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          {/* Orders List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
              <Loader size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px', display: 'inline-block' }} />
              <div>Loading escrow orders...</div>
              <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
            </div>
          ) : orders.length === 0 ? (
            <div style={{
              background: '#fff', borderRadius: '16px', padding: '48px',
              textAlign: 'center', color: '#6b7280', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <Shield size={48} style={{ color: '#d1d5db', marginBottom: '12px', display: 'inline-block' }} />
              <div style={{ fontSize: '16px', fontWeight: '600' }}>No pending escrow orders</div>
              <div style={{ fontSize: '13px', marginTop: '6px' }}>All funds have been released or no payments made yet.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {orders.map((order) => {
                const farmerPayout = +(order.total_price * 0.95).toFixed(2);
                const agentComm = +(order.total_price * 0.05).toFixed(2);
                return (
                  <div key={order.id} style={{
                    background: '#fff', borderRadius: '16px', padding: '20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    border: '1.5px solid #d1fae5', display: 'flex', flexDirection: 'column', gap: '14px'
                  }}>
                    {/* Top */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#111827' }}>
                          Order #{String(order.id).padStart(6, '0')}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                          {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </div>
                      </div>
                      <div style={{
                        background: '#d1fae5', color: '#065f46', fontWeight: '700',
                        fontSize: '12px', padding: '5px 12px', borderRadius: '50px',
                        display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }}>
                        <Shield size={13} /> 🔒 In Escrow
                      </div>
                    </div>

                    {/* Details */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))',
                      gap: '12px', background: '#f9fafb', borderRadius: '12px', padding: '14px'
                    }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginTop: '2px' }}>{order.product?.name || 'Crop'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trader</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginTop: '2px' }}>{order.trader?.name || '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Held</div>
                        <div style={{ fontSize: '16px', fontWeight: '900', color: '#064e3b', marginTop: '2px' }}>₹{(+order.total_price).toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Delivery Status</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginTop: '2px' }}>{order.status?.toUpperCase()}</div>
                      </div>
                    </div>

                    {/* Payout Breakdown */}
                    <div style={{
                      display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '13px',
                      background: '#fffbeb', borderRadius: '10px', padding: '12px 14px',
                      border: '1px solid #fde68a'
                    }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ color: '#92400e', fontWeight: '600' }}>Farmer Payout (95%): </span>
                        <span style={{ fontWeight: '800', color: '#064e3b' }}>₹{farmerPayout.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span style={{ color: '#92400e', fontWeight: '600' }}>Agent Commission (5%): </span>
                        <span style={{ fontWeight: '800', color: '#374151' }}>₹{agentComm.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Release Button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleRelease(order.id)}
                        disabled={releasingId === order.id}
                        style={{
                          background: releasingId === order.id
                            ? '#d1d5db'
                            : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                          color: '#fff', border: 'none', borderRadius: '10px',
                          padding: '11px 22px', fontSize: '14px', fontWeight: '800',
                          cursor: releasingId === order.id ? 'not-allowed' : 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: '8px',
                          boxShadow: '0 4px 14px rgba(5,150,105,0.25)'
                        }}
                      >
                        {releasingId === order.id
                          ? (<><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</>)
                          : (<><CheckCircle size={16} /> Release Funds to Farmer</>)
                        }
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/common/Header';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineShoppingBag } from 'react-icons/hi';
import { useLanguage } from '../../../context/LanguageContext';
import DeliveryTrackerModal from '../../../components/common/DeliveryTrackerModal';
import PaymentCheckoutModal from '../../../components/common/PaymentCheckoutModal';

export default function TraderOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const { isAuthenticated, user, hydrate } = useAuthStore();
  const { t } = useLanguage();

  useEffect(() => { hydrate(); }, [hydrate]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/orders/my');
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to load orders:', error);
      if (error.response?.status === 401) {
        toast.error(t('common.sessionExpired'));
        useAuthStore.getState().logout();
        router.replace('/login');
      } else {
        toast.error('Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  }, [router, t]);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.role !== 'trader') { router.replace('/dashboard/' + user?.role); return; }
    fetchOrders();
  }, [isAuthenticated, user, router, fetchOrders]);

  const getPaymentColor = (status) => {
    switch (status) {
      case 'pending': return { bg: '#fff3cd', color: '#856404', label: 'Payment Due' };
      case 'held': return { bg: '#d1fae5', color: '#065f46', label: '🔒 In Escrow' };
      case 'released': return { bg: '#dbeafe', color: '#1e40af', label: '✅ Released' };
      default: return { bg: '#f3f4f6', color: '#6b7280', label: status };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return { background: '#fff3cd', color: '#856404' };
      case 'accepted': return { background: '#d1ecf1', color: '#0c5460' };
      case 'shipped': return { background: '#cce5ff', color: '#004085' };
      case 'delivered': return { background: '#d4edda', color: '#155724' };
      case 'cancelled': return { background: '#f8d7da', color: '#721c24' };
      default: return { background: '#e9ecef', color: '#495057' };
    }
  };

  return (
    <div>
      <Header />
      <div style={{
        minHeight: '100vh', background: '#f0f4f1',
        paddingTop: '100px', paddingBottom: '40px',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px' }}>
          <Link href="/dashboard/trader" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>
            <button style={{
              background: 'white', border: '1px solid #e9ecef', borderRadius: '50px',
              padding: '10px 18px', cursor: 'pointer', fontSize: '14px',
              fontWeight: '700', color: '#1b4332', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}>
              <HiOutlineArrowLeft style={{ marginRight: '6px' }} /> Back
            </button>
          </Link>

          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1b4332', marginBottom: '24px' }}>
            My Orders
          </h1>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#636e72' }}>
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div style={{
              background: 'white', borderRadius: '16px', padding: '40px',
              textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', color: '#636e72',
            }}>
              <HiOutlineShoppingBag style={{ fontSize: '48px', marginBottom: '16px', color: '#2d6a4f' }} />
              <p style={{ fontSize: '16px' }}>No orders yet</p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>When you place an order, it will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {orders.map((order) => {
                const statusStyle = getStatusColor(order.status);
                const paymentStyle = getPaymentColor(order.payment_status);
                const canPay = order.payment_status === 'pending';
                return (
                  <div key={order.id} style={{
                    background: 'white', borderRadius: '16px', padding: '20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    display: 'flex', flexDirection: 'column', gap: '12px',
                    border: canPay ? '1.5px solid #fde68a' : '1px solid transparent',
                  }}>
                    {/* Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#2d3436', margin: 0 }}>
                          Order #{String(order.id).padStart(6, '0')}
                        </h3>
                        <p style={{ fontSize: '13px', color: '#636e72', margin: '4px 0 0' }}>
                          {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '5px 12px', borderRadius: '50px', fontSize: '12px', fontWeight: '700',
                          background: paymentStyle.bg, color: paymentStyle.color
                        }}>
                          {paymentStyle.label}
                        </span>
                        <span style={{
                          padding: '5px 12px', borderRadius: '50px', fontSize: '12px', fontWeight: '700',
                          ...statusStyle
                        }}>
                          {order.status?.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Details Row */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap',
                      gap: '12px', paddingTop: '8px', borderTop: '1px solid #e9ecef',
                    }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#636e72' }}>Product</div>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>{order.product?.name || 'Crop'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#636e72' }}>Quantity</div>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>{order.quantity} {order.product?.unit || 'kg'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#636e72' }}>Total Amount</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#064e3b' }}>₹{(+order.total_price).toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#636e72' }}>Farmer</div>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>{order.product?.farmer?.name || '—'}</div>
                      </div>
                    </div>

                    {/* Action Row */}
                    <div style={{
                      display: 'flex', justifyContent: 'flex-end', gap: '10px',
                      paddingTop: '8px', borderTop: '1px dashed #e9ecef', flexWrap: 'wrap',
                    }}>
                      {canPay && (
                        <button
                          onClick={() => setPaymentOrder(order)}
                          style={{
                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                            color: '#fff', border: 'none', borderRadius: '8px',
                            padding: '9px 18px', fontSize: '13px', fontWeight: '800',
                            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
                            boxShadow: '0 4px 12px rgba(5,150,105,0.3)'
                          }}
                        >
                          💳 Pay Now
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedOrderId(order.id)}
                        style={{
                          background: '#fff', border: '1.5px solid #d1d5db',
                          color: '#374151', borderRadius: '8px',
                          padding: '9px 16px', fontSize: '13px', fontWeight: '700',
                          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
                        }}
                      >
                        🚚 Track Delivery
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedOrderId && (
          <DeliveryTrackerModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
        )}

        {paymentOrder && (
          <PaymentCheckoutModal
            order={paymentOrder}
            onClose={() => setPaymentOrder(null)}
            onPaymentSuccess={() => {
              setPaymentOrder(null);
              fetchOrders();
            }}
          />
        )}
      </div>
    </div>
  );
}
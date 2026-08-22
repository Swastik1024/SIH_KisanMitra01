import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../../../components/common/Header';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineX,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineTruck,
  HiOutlineHome,
} from 'react-icons/hi';

export default function MyOrders() {
  const router = useRouter();
  const { isAuthenticated, user, hydrate } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingOrder, setTrackingOrder] = useState(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'farmer') {
      router.replace('/dashboard/' + user?.role);
      return;
    }
    fetchOrders();
  }, [isAuthenticated, user, router]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/farmer/orders/my');
      setOrders(res.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getTrackingSteps = (status) => {
    const steps = [
      { label: 'Order Placed', status: 'completed', icon: <HiOutlineCheckCircle size={20} /> },
      { label: 'Processing', status: status === 'accepted' || status === 'shipped' || status === 'delivered' ? 'completed' : status === 'pending' ? 'current' : 'pending', icon: <HiOutlineClock size={20} /> },
      { label: 'Shipped', status: status === 'shipped' || status === 'delivered' ? 'completed' : 'pending', icon: <HiOutlineTruck size={20} /> },
      { label: 'Delivered', status: status === 'delivered' ? 'completed' : 'pending', icon: <HiOutlineHome size={20} /> },
    ];
    if (status === 'cancelled') {
      return [{ label: 'Order Cancelled', status: 'cancelled', icon: <HiOutlineX size={20} /> }];
    }
    return steps;
  };

  const openTracking = (order) => {
    setTrackingOrder(order);
  };

  const closeTracking = () => {
    setTrackingOrder(null);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main style={styles.page}>
          <div style={styles.loading}>Loading your orders...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main style={styles.page}>
        <div style={styles.container}>
          <button style={styles.backButton} onClick={() => router.back()}>
            <HiOutlineArrowLeft size={18} />
            Back
          </button>

          <h1 style={styles.title}>My Orders</h1>
          <p style={styles.subtitle}>Track and manage your purchases</p>

          {orders.length === 0 ? (
            <div style={styles.empty}>You have no orders yet.</div>
          ) : (
            <div style={styles.orderList}>
              {orders.map((order) => (
                <div key={order.id} style={styles.orderCard}>
                  <div style={styles.orderHeader}>
                    <strong style={styles.orderId}>Order #{order.id}</strong>
                    <span style={styles.orderStatus}>{order.status}</span>
                  </div>

                  <div style={styles.orderBody}>
                    <div style={styles.orderInfo}>
                      <div style={styles.label}>Product</div>
                      <div style={styles.value}>{order.product_name}</div>
                    </div>
                    <div style={styles.orderInfo}>
                      <div style={styles.label}>Quantity</div>
                      <div style={styles.value}>{order.quantity}</div>
                    </div>
                    <div style={styles.orderInfo}>
                      <div style={styles.label}>Total Price</div>
                      <div style={styles.value}>₹{order.total_price}</div>
                    </div>
                    <div style={styles.orderInfo}>
                      <div style={styles.label}>Payment Method</div>
                      <div style={styles.value}>{order.payment_method}</div>
                    </div>
                    <div style={styles.orderInfo}>
                      <div style={styles.label}>Delivery Address</div>
                      <div style={styles.value}>
                        {order.delivery_address}, {order.delivery_city}, {order.delivery_state} - {order.delivery_pincode}
                      </div>
                    </div>
                    <div style={styles.orderInfo}>
                      <div style={styles.label}>Placed On</div>
                      <div style={styles.value}>
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>

                  <div style={styles.orderActions}>
                    <button
                      onClick={() => openTracking(order)}
                      style={styles.trackButton}
                    >
                      Track Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Tracking Modal */}
      {trackingOrder && (
        <div style={styles.modalOverlay} onClick={closeTracking}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Track Order #{trackingOrder.id}</h2>
              <button style={styles.modalClose} onClick={closeTracking}>
                <HiOutlineX size={20} />
              </button>
            </div>

            <div style={styles.trackingTimeline}>
              {getTrackingSteps(trackingOrder.status).map((step, index) => (
                <div key={index} style={styles.timelineStep}>
                  <div style={{
                    ...styles.timelineIcon,
                    background:
                      step.status === 'completed' ? '#2d6a4f' :
                      step.status === 'current' ? '#198754' :
                      step.status === 'cancelled' ? '#c0392b' : '#e9efeb',
                    color:
                      step.status === 'completed' || step.status === 'current' || step.status === 'cancelled'
                        ? '#fff'
                        : '#89948e',
                  }}>
                    {step.icon}
                  </div>
                  <div style={styles.timelineContent}>
                    <div style={styles.timelineLabel}>{step.label}</div>
                    {step.status === 'current' && (
                      <div style={styles.timelineCurrent}>Current Status</div>
                    )}
                  </div>
                  {index < getTrackingSteps(trackingOrder.status).length - 1 && (
                    <div style={styles.timelineLine} />
                  )}
                </div>
              ))}
            </div>

            <div style={styles.orderDetails}>
              <div style={styles.orderDetailRow}>
                <span>Product</span>
                <strong>{trackingOrder.product_name}</strong>
              </div>
              <div style={styles.orderDetailRow}>
                <span>Status</span>
                <strong>{trackingOrder.status}</strong>
              </div>
              <div style={styles.orderDetailRow}>
                <span>Payment Status</span>
                <strong>{trackingOrder.payment_status}</strong>
              </div>
              <div style={styles.orderDetailRow}>
                <span>Delivery Address</span>
                <strong>
                  {trackingOrder.delivery_address}, {trackingOrder.delivery_city}, {trackingOrder.delivery_state} - {trackingOrder.delivery_pincode}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    paddingTop: '100px',
    paddingBottom: '60px',
    background: 'linear-gradient(135deg, #f4f8f5 0%, #edf5ef 50%, #f8faf8 100%)',
    fontFamily: "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '0 24px',
  },
  loading: { textAlign: 'center', padding: '40px', color: '#718078' },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'transparent',
    border: 'none',
    color: '#2d6a4f',
    fontWeight: '700',
    cursor: 'pointer',
    marginBottom: '12px',
    fontSize: '14px',
  },
  title: { margin: '0 0 5px', color: '#163b2a', fontSize: '32px', fontWeight: '850' },
  subtitle: { margin: '0 0 20px', color: '#718078', fontSize: '14px' },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#9aa49e',
    fontSize: '16px',
    background: '#fff',
    borderRadius: '20px',
    border: '1px solid #e1ebe4',
  },
  orderList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  orderCard: {
    background: '#fff',
    borderRadius: '20px',
    padding: '20px',
    boxShadow: '0 8px 25px rgba(30,70,45,0.05)',
    border: '1px solid #e1ebe4',
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  orderId: { color: '#173b2a', fontSize: '16px', fontWeight: '850' },
  orderStatus: {
    padding: '5px 10px',
    borderRadius: '20px',
    background: '#eaf8f0',
    color: '#198754',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  orderBody: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    marginBottom: '15px',
  },
  orderInfo: { display: 'flex', flexDirection: 'column', gap: '3px' },
  label: { color: '#89948e', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  value: { color: '#526058', fontSize: '14px', fontWeight: '600', wordBreak: 'break-word' },
  orderActions: { display: 'flex', justifyContent: 'flex-end' },
  trackButton: {
    background: '#eaf8f0',
    color: '#198754',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '12px',
  },

  // Modal styles
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  },
  modalCard: {
    background: '#fff',
    borderRadius: '20px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '24px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  modalTitle: { margin: 0, color: '#173b2a', fontSize: '20px', fontWeight: '850' },
  modalClose: { background: 'transparent', border: 'none', cursor: 'pointer', color: '#526058' },
  trackingTimeline: { display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' },
  timelineStep: { display: 'flex', alignItems: 'flex-start', gap: '12px', position: 'relative' },
  timelineIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  timelineContent: { flex: 1 },
  timelineLabel: { color: '#173b2a', fontWeight: '700', fontSize: '14px' },
  timelineCurrent: { color: '#198754', fontSize: '11px', fontWeight: '700', marginTop: '2px' },
  timelineLine: {
    position: 'absolute',
    left: '15px',
    top: '32px',
    bottom: '-20px',
    width: '2px',
    background: '#e9efeb',
  },
  orderDetails: {
    background: '#f9fbfa',
    borderRadius: '12px',
    padding: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  orderDetailRow: { display: 'flex', justifyContent: 'space-between', color: '#526058', fontSize: '13px' },
};
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AgentHeader from '../../../components/agent/AgentHeader';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';

export default function AgentDeliveries() {
  const router = useRouter();
  const { isAuthenticated, user, hydrate } = useAuthStore();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'agent') {
      router.replace('/dashboard/' + user?.role);
      return;
    }
    fetchDeliveries();
  }, [isAuthenticated, user, router]);

  const fetchDeliveries = async () => {
    try {
      const res = await api.get('/api/agent/deliveries');
      setDeliveries(res.data);
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.post(`/api/agent/deliveries/${orderId}/status`, {
        status: newStatus,
      });
      toast.success('Delivery status updated');
      fetchDeliveries();
    } catch (error) {
      console.error('Update status error:', error);
      toast.error(error.response?.data?.detail || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <>
        <AgentHeader />
        <main style={styles.page}>
          <div style={styles.loading}>Loading deliveries...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <AgentHeader />
      <main style={styles.page}>
        <div style={styles.container}>
          <h1 style={styles.title}>My Deliveries</h1>
          <p style={styles.subtitle}>Manage deliveries assigned to you</p>

          {deliveries.length === 0 ? (
            <div style={styles.empty}>No deliveries assigned.</div>
          ) : (
            <div style={styles.list}>
              {deliveries.map((order) => (
                <div key={order.id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <strong>Order #{order.id}</strong>
                    <span style={styles.statusBadge}>{order.status}</span>
                  </div>
                  <div style={styles.cardBody}>
                    <div><strong>Product:</strong> {order.product_name}</div>
                    <div><strong>Buyer:</strong> {order.buyer_name}</div>
                    <div><strong>Address:</strong> {order.delivery_address}, {order.delivery_city}, {order.delivery_state} - {order.delivery_pincode}</div>
                    <div><strong>Phone:</strong> {order.delivery_phone}</div>
                  </div>
                  <div style={styles.actions}>
                    {order.status === 'accepted' && (
                      <button onClick={() => updateStatus(order.id, 'shipped')} style={styles.actionButton}>Mark as Shipped</button>
                    )}
                    {order.status === 'shipped' && (
                      <button onClick={() => updateStatus(order.id, 'delivered')} style={styles.actionButton}>Mark as Delivered</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

const styles = {
  page: { minHeight: '100vh', paddingTop: '100px', paddingBottom: '60px', background: 'linear-gradient(135deg, #f4f8f5 0%, #edf5ef 50%, #f8faf8 100%)', fontFamily: "'Segoe UI', system-ui, sans-serif" },
  container: { maxWidth: '900px', margin: '0 auto', padding: '0 24px' },
  loading: { textAlign: 'center', padding: '40px', color: '#718078' },
  title: { margin: '0 0 5px', color: '#163b2a', fontSize: '32px', fontWeight: '850' },
  subtitle: { margin: '0 0 20px', color: '#718078', fontSize: '14px' },
  empty: { textAlign: 'center', padding: '40px', color: '#9aa49e', background: '#fff', borderRadius: '20px', border: '1px solid #e1ebe4' },
  list: { display: 'flex', flexDirection: 'column', gap: '16px' },
  card: { background: '#fff', borderRadius: '20px', padding: '20px', boxShadow: '0 8px 25px rgba(30,70,45,0.05)', border: '1px solid #e1ebe4' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  statusBadge: { padding: '5px 10px', borderRadius: '20px', background: '#eaf8f0', color: '#198754', fontSize: '12px', fontWeight: '700', textTransform: 'capitalize' },
  cardBody: { display: 'flex', flexDirection: 'column', gap: '8px', color: '#526058', fontSize: '13px', marginBottom: '15px' },
  actions: { display: 'flex', gap: '10px' },
  actionButton: { background: '#2d6a4f', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
};
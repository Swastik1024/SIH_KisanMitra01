import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AgentHeader from '../../../components/agent/AgentHeader';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';
import {
  HiOutlineClipboardList,
  HiOutlineTruck,
  HiOutlineArrowRight,
} from 'react-icons/hi';

export default function AgentTasks() {
  const router = useRouter();
  const { isAuthenticated, user, hydrate } = useAuthStore();
  const [tasks, setTasks] = useState({ inspections: [], deliveries: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.role !== 'agent') { router.replace('/dashboard/' + user?.role); return; }
    fetchTasks();
  }, [isAuthenticated, user, router]);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/api/agent/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <><AgentHeader /><main style={styles.page}><div style={styles.loading}>Loading tasks...</div></main></>;
  }

  return (
    <>
      <AgentHeader />
      <main style={styles.page}>
        <div style={styles.container}>
          <h1 style={styles.title}>My Tasks</h1>
          <p style={styles.subtitle}>Pending inspections and deliveries</p>

          {/* Inspections */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}><HiOutlineClipboardList size={20} color="#2d6a4f" /> Inspections</h2>
              <button onClick={() => router.push('/dashboard/agent/inspections')} style={styles.viewAll}>View All</button>
            </div>
            {tasks.inspections.length === 0 ? (
              <p style={styles.empty}>No pending inspections</p>
            ) : (
              tasks.inspections.map((item) => (
                <div key={item.id} style={styles.taskRow}>
                  <div>
                    <strong>{item.product_name}</strong>
                    <div style={styles.muted}>{item.farmer_name}</div>
                  </div>
                  <button onClick={() => router.push(`/dashboard/agent/inspections?product_id=${item.id}`)} style={styles.taskButton}>
                    Generate Report
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Deliveries */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}><HiOutlineTruck size={20} color="#2d6a4f" /> Deliveries</h2>
              <button onClick={() => router.push('/dashboard/agent/deliveries')} style={styles.viewAll}>View All</button>
            </div>
            {tasks.deliveries.length === 0 ? (
              <p style={styles.empty}>No pending deliveries</p>
            ) : (
              tasks.deliveries.map((order) => (
                <div key={order.id} style={styles.taskRow}>
                  <div>
                    <strong>Order #{order.id} - {order.product_name}</strong>
                    <div style={styles.muted}>{order.buyer_name}</div>
                  </div>
                  <button onClick={() => router.push('/dashboard/agent/deliveries')} style={styles.taskButton}>
                    Manage
                  </button>
                </div>
              ))
            )}
          </div>
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
  card: { background: '#fff', borderRadius: '20px', padding: '20px', marginBottom: '20px', boxShadow: '0 8px 25px rgba(30,70,45,0.05)', border: '1px solid #e1ebe4' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  cardTitle: { display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: '#173b2a', fontSize: '18px', fontWeight: '800' },
  viewAll: { background: '#eaf8f0', color: '#198754', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' },
  taskRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f3f1' },
  muted: { color: '#89948e', fontSize: '12px', marginTop: '4px' },
  taskButton: { background: '#2d6a4f', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' },
  empty: { color: '#9aa49e', textAlign: 'center', padding: '20px' },
};
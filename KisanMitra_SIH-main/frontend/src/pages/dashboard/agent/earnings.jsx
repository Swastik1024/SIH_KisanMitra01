import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AgentHeader from '../../../components/agent/AgentHeader';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';
import {
  HiOutlineCurrencyRupee,
  HiOutlineClipboardCheck,
  HiOutlineTruck,
  HiOutlineDocumentReport,
} from 'react-icons/hi';

export default function AgentEarnings() {
  const router = useRouter();
  const { isAuthenticated, user, hydrate } = useAuthStore();
  const [data, setData] = useState(null);
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
    fetchEarnings();
  }, [isAuthenticated, user, router]);

  const fetchEarnings = async () => {
    try {
      const res = await api.get('/api/agent/earnings');
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
      toast.error('Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <AgentHeader />
        <main style={styles.page}>
          <div style={styles.loading}>Loading earnings...</div>
        </main>
      </>
    );
  }

  const summary = data?.summary || {};
  const recentInspections = data?.recent_inspections || [];
  const recentDeliveries = data?.recent_deliveries || [];

  return (
    <>
      <AgentHeader />
      <main style={styles.page}>
        <div style={styles.container}>
          <h1 style={styles.title}>My Earnings</h1>
          <p style={styles.subtitle}>Track your income from inspections and deliveries</p>

          {/* Summary Cards */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <HiOutlineClipboardCheck size={30} color="#2d6a4f" />
              <div>
                <div style={styles.statLabel}>Completed Inspections</div>
                <div style={styles.statValue}>{summary.completed_inspections}</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <HiOutlineCurrencyRupee size={30} color="#2d6a4f" />
              <div>
                <div style={styles.statLabel}>Inspection Earnings</div>
                <div style={styles.statValue}>₹{summary.inspection_earnings}</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <HiOutlineTruck size={30} color="#2d6a4f" />
              <div>
                <div style={styles.statLabel}>Completed Deliveries</div>
                <div style={styles.statValue}>{summary.completed_deliveries}</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <HiOutlineCurrencyRupee size={30} color="#2d6a4f" />
              <div>
                <div style={styles.statLabel}>Delivery Earnings</div>
                <div style={styles.statValue}>₹{summary.delivery_earnings}</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <HiOutlineCurrencyRupee size={30} color="#2d6a4f" />
              <div>
                <div style={styles.statLabel}>Total Earnings</div>
                <div style={styles.statValue}>₹{summary.total_earnings}</div>
              </div>
            </div>
          </div>

          {/* Recent Inspections */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Recent Inspection Earnings</h2>
            {recentInspections.length === 0 ? (
              <p style={styles.empty}>No completed inspections yet.</p>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Product</th>
                      <th style={styles.th}>Farmer</th>
                      <th style={styles.th}>Grade</th>
                      <th style={styles.th}>Earning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInspections.map((item) => (
                      <tr key={item.id}>
                        <td style={styles.td}>{item.product_name}</td>
                        <td style={styles.td}>{item.farmer_name}</td>
                        <td style={styles.td}>{item.quality_grade || '—'}</td>
                        <td style={styles.td}>₹200</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Deliveries */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Recent Delivery Earnings</h2>
            {recentDeliveries.length === 0 ? (
              <p style={styles.empty}>No completed deliveries yet.</p>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Order ID</th>
                      <th style={styles.th}>Product</th>
                      <th style={styles.th}>Buyer</th>
                      <th style={styles.th}>Earning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDeliveries.map((order) => (
                      <tr key={order.id}>
                        <td style={styles.td}>#{order.id}</td>
                        <td style={styles.td}>{order.product_name}</td>
                        <td style={styles.td}>{order.buyer_name}</td>
                        <td style={styles.td}>₹0</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

const styles = {
  page: { minHeight: '100vh', paddingTop: '100px', paddingBottom: '60px', background: 'linear-gradient(135deg, #f4f8f5 0%, #edf5ef 50%, #f8faf8 100%)', fontFamily: "'Segoe UI', system-ui, sans-serif" },
  container: { maxWidth: '1100px', margin: '0 auto', padding: '0 24px' },
  loading: { textAlign: 'center', padding: '40px', color: '#718078' },
  title: { margin: '0 0 5px', color: '#163b2a', fontSize: '32px', fontWeight: '850' },
  subtitle: { margin: '0 0 20px', color: '#718078', fontSize: '14px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '25px' },
  statCard: { background: '#fff', borderRadius: '20px', padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 8px 25px rgba(30,70,45,0.05)', border: '1px solid #e1ebe4' },
  statLabel: { color: '#718078', fontSize: '12px', fontWeight: '600' },
  statValue: { color: '#173b2a', fontSize: '24px', fontWeight: '850' },
  card: { background: '#fff', borderRadius: '20px', padding: '20px', marginBottom: '20px', boxShadow: '0 8px 25px rgba(30,70,45,0.05)', border: '1px solid #e1ebe4' },
  cardTitle: { margin: '0 0 15px', color: '#173b2a', fontSize: '18px', fontWeight: '800' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '500px' },
  th: { padding: '10px 12px', textAlign: 'left', color: '#89948e', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e9efeb' },
  td: { padding: '12px', color: '#526058', fontSize: '13px', borderBottom: '1px solid #f0f3f1' },
  empty: { color: '#9aa49e', textAlign: 'center', padding: '20px' },
};
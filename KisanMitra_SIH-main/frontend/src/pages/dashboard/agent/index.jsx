import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AgentHeader from '../../../components/agent/AgentHeader';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';
import {
  HiOutlineClipboardList,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineClipboardCheck,
  HiOutlineCurrencyRupee,
  HiOutlineDocumentReport,
} from 'react-icons/hi';

export default function AgentDashboard() {
  const router = useRouter();
  const { isAuthenticated, user, hydrate } = useAuthStore();
  const [dashboard, setDashboard] = useState(null);
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
    fetchDashboard();
  }, [isAuthenticated, user, router]);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/api/agent/dashboard');
      setDashboard(res.data);
    } catch (error) {
      console.error('Failed to load agent dashboard:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <AgentHeader />
        <main style={styles.page}>
          <div style={styles.loading}>Loading dashboard...</div>
        </main>
      </>
    );
  }

  const stats = dashboard?.stats || {};
  const recentInspections = dashboard?.recent_inspections || [];
  const recentDeliveries = dashboard?.recent_deliveries || [];

  return (
    <>
      <AgentHeader />
      <main style={styles.page}>
        <div style={styles.container}>
          <h1 style={styles.title}>Agent Dashboard</h1>
          <p style={styles.subtitle}>Manage inspections, deliveries, and earnings</p>

          {/* Stats */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <HiOutlineClipboardList size={30} color="#2d6a4f" />
              <div>
                <div style={styles.statLabel}>Pending Inspections</div>
                <div style={styles.statValue}>{stats.pending_inspections}</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <HiOutlineTruck size={30} color="#2d6a4f" />
              <div>
                <div style={styles.statLabel}>Pending Deliveries</div>
                <div style={styles.statValue}>{stats.pending_deliveries}</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <HiOutlineCheckCircle size={30} color="#2d6a4f" />
              <div>
                <div style={styles.statLabel}>Completed Deliveries</div>
                <div style={styles.statValue}>{stats.completed_deliveries}</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <HiOutlineClipboardCheck size={30} color="#2d6a4f" />
              <div>
                <div style={styles.statLabel}>Completed Inspections</div>
                <div style={styles.statValue}>{stats.completed_inspections}</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <HiOutlineCurrencyRupee size={30} color="#2d6a4f" />
              <div>
                <div style={styles.statLabel}>My Earnings</div>
                <div style={styles.statValue}>₹{stats.total_earnings}</div>
              </div>
            </div>
          </div>

          {/* Inspections Table */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Recent Inspections</h2>
              <button
                onClick={() => router.push('/dashboard/agent/inspections')}
                style={styles.viewAllButton}
              >
                View All
              </button>
            </div>

            {recentInspections.length === 0 ? (
              <p style={styles.empty}>No inspections assigned yet.</p>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Product</th>
                      <th style={styles.th}>Farmer</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInspections.map((item) => (
                      <tr key={item.id}>
                        <td style={styles.td}><strong>{item.product_name}</strong></td>
                        <td style={styles.td}>{item.farmer_name}</td>
                        <td style={styles.td}>{item.status}</td>
                        <td style={styles.td}>
                          <button
                            onClick={() => router.push(`/dashboard/agent/inspections?product_id=${item.id}`)}
                            style={styles.reportButton}
                          >
                            <HiOutlineDocumentReport size={14} />
                            Generate Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Deliveries Table */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Recent Deliveries</h2>
              <button
                onClick={() => router.push('/dashboard/agent/deliveries')}
                style={styles.viewAllButton}
              >
                View All
              </button>
            </div>

            {recentDeliveries.length === 0 ? (
              <p style={styles.empty}>No deliveries assigned yet.</p>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Order ID</th>
                      <th style={styles.th}>Product</th>
                      <th style={styles.th}>Farmer</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDeliveries.map((order) => (
                      <tr key={order.id}>
                        <td style={styles.td}>#{order.id}</td>
                        <td style={styles.td}>{order.product_name}</td>
                        <td style={styles.td}>{order.farmer_name || '—'}</td>
                        <td style={styles.td}>{order.status}</td>
                        <td style={styles.td}>
                          <button
                            onClick={() => router.push('/dashboard/agent/deliveries')}
                            style={styles.reportButton}
                          >
                            Manage
                          </button>
                        </td>
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
  page: {
    minHeight: '100vh',
    paddingTop: '100px',
    paddingBottom: '60px',
    background: 'linear-gradient(135deg, #f4f8f5 0%, #edf5ef 50%, #f8faf8 100%)',
    fontFamily: "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  container: { maxWidth: '1100px', margin: '0 auto', padding: '0 24px' },
  loading: { textAlign: 'center', padding: '40px', color: '#718078' },
  title: { margin: '0 0 5px', color: '#163b2a', fontSize: '32px', fontWeight: '850' },
  subtitle: { margin: '0 0 20px', color: '#718078', fontSize: '14px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '25px' },
  statCard: {
    background: '#fff', borderRadius: '20px', padding: '20px', display: 'flex', alignItems: 'center', gap: '15px',
    boxShadow: '0 8px 25px rgba(30,70,45,0.05)', border: '1px solid #e1ebe4',
  },
  statLabel: { color: '#718078', fontSize: '12px', fontWeight: '600' },
  statValue: { color: '#173b2a', fontSize: '24px', fontWeight: '850' },
  card: { background: '#fff', borderRadius: '20px', padding: '20px', marginBottom: '20px', boxShadow: '0 8px 25px rgba(30,70,45,0.05)', border: '1px solid #e1ebe4' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  cardTitle: { margin: 0, color: '#173b2a', fontSize: '18px', fontWeight: '800' },
  viewAllButton: { background: '#eaf8f0', color: '#198754', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '600px' },
  th: {
    padding: '10px 12px', textAlign: 'left', color: '#89948e', fontSize: '11px', fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e9efeb',
  },
  td: { padding: '12px', color: '#526058', fontSize: '13px', borderBottom: '1px solid #f0f3f1' },
  reportButton: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    background: '#eaf8f0', color: '#198754', border: 'none',
    padding: '6px 10px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '12px',
  },
  empty: { color: '#9aa49e', textAlign: 'center', padding: '20px' },
};
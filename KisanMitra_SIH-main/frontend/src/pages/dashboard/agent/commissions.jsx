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

export default function Commissions() {
  const router = useRouter();
  const { isAuthenticated, user, hydrate } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.role !== 'agent') { router.replace('/dashboard/' + user?.role); return; }
    fetchReport();
  }, [isAuthenticated, user, router]);

  const fetchReport = async () => {
    try {
      const res = await api.get('/api/agent/earnings');
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load commission report');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <><AgentHeader /><main style={styles.page}><div style={styles.loading}>Loading report...</div></main></>;
  }

  const summary = data?.summary || {};
  const transactions = data?.transactions || [];

  return (
    <>
      <AgentHeader />
      <main style={styles.page}>
        <div style={styles.container}>
          <h1 style={styles.title}>Commission Report</h1>
          <p style={styles.subtitle}>Detailed earnings breakdown</p>

          {/* Summary Cards */}
          <div style={styles.summaryGrid}>
            <StatCard icon={<HiOutlineClipboardCheck />} label="Completed Inspections" value={summary.completed_inspections} />
            <StatCard icon={<HiOutlineCurrencyRupee />} label="Inspection Earnings" value={`₹${summary.inspection_earnings}`} />
            <StatCard icon={<HiOutlineTruck />} label="Completed Deliveries" value={summary.completed_deliveries} />
            <StatCard icon={<HiOutlineCurrencyRupee />} label="Total Earnings" value={`₹${summary.total_earnings}`} />
          </div>

          {/* Transactions Table */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}><HiOutlineDocumentReport size={20} color="#2d6a4f" /> Transactions</h2>
            {transactions.length === 0 ? (
              <p style={styles.empty}>No transactions yet.</p>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th}>Description</th>
                      <th style={styles.th}>Amount</th>
                      <th style={styles.th}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td style={styles.td}>{tx.type}</td>
                        <td style={styles.td}>{tx.description}</td>
                        <td style={styles.td}>₹{tx.amount}</td>
                        <td style={styles.td}>{tx.date ? new Date(tx.date).toLocaleDateString('en-IN') : '—'}</td>
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

function StatCard({ icon, label, value }) {
  return (
    <div style={statCardStyles.card}>
      <div style={statCardStyles.icon}>{icon}</div>
      <div>
        <div style={statCardStyles.label}>{label}</div>
        <div style={statCardStyles.value}>{value}</div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', paddingTop: '100px', paddingBottom: '60px', background: 'linear-gradient(135deg, #f4f8f5 0%, #edf5ef 50%, #f8faf8 100%)', fontFamily: "'Segoe UI', system-ui, sans-serif" },
  container: { maxWidth: '900px', margin: '0 auto', padding: '0 24px' },
  loading: { textAlign: 'center', padding: '40px', color: '#718078' },
  title: { margin: '0 0 5px', color: '#163b2a', fontSize: '32px', fontWeight: '850' },
  subtitle: { margin: '0 0 20px', color: '#718078', fontSize: '14px' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '25px' },
  card: { background: '#fff', borderRadius: '20px', padding: '20px', boxShadow: '0 8px 25px rgba(30,70,45,0.05)', border: '1px solid #e1ebe4' },
  cardTitle: { display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 15px', color: '#173b2a', fontSize: '18px', fontWeight: '800' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '500px' },
  th: { padding: '10px 12px', textAlign: 'left', color: '#89948e', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e9efeb' },
  td: { padding: '12px', color: '#526058', fontSize: '13px', borderBottom: '1px solid #f0f3f1' },
  empty: { color: '#9aa49e', textAlign: 'center', padding: '20px' },
};

const statCardStyles = {
  card: { background: '#fff', borderRadius: '20px', padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 8px 25px rgba(30,70,45,0.05)', border: '1px solid #e1ebe4' },
  icon: { width: '40px', height: '40px', borderRadius: '12px', background: '#eaf8f0', color: '#198754', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' },
  label: { color: '#718078', fontSize: '12px', fontWeight: '600' },
  value: { color: '#173b2a', fontSize: '24px', fontWeight: '850' },
};
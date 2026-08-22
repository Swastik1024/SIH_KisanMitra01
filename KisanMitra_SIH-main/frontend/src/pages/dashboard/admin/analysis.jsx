import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminHeader from '../../../components/admin/AdminHeader';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';

export default function AdminAnalysisPage() {
  const router = useRouter();
  const { isAuthenticated, user, hydrate } = useAuthStore();
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (user?.role !== 'admin') {
      router.replace('/login');
      return;
    }
    fetchAnalysis();
  }, [isAuthenticated, user, router, period]);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/analysis', { params: { period } });
      setData(response.data);
    } catch (error) {
      console.error('Failed to load analysis:', error);
      toast.error('Failed to load analysis data');
    } finally {
      setLoading(false);
    }
  };

  const summary = data?.summary || {};
  const userGrowth = data?.user_growth || [];
  const revenueTrend = data?.revenue_trend || [];
  const orderStatus = data?.order_status_distribution || [];
  const topCategories = data?.top_categories || [];
  const topProducts = data?.top_products || [];

  return (
    <>
      <AdminHeader />
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.topBar}>
            <h1 style={styles.title}>Platform Analysis</h1>
            <p style={styles.subtitle}>Insights into platform performance</p>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={styles.periodSelect}
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>

          {loading ? (
            <div style={styles.loading}>Loading analysis...</div>
          ) : (
            <>
              {/* Summary cards */}
              <div style={styles.summaryGrid}>
                <MetricCard label="Total Users" value={summary.total_users} />
                <MetricCard label="Farmers" value={summary.total_farmers} />
                <MetricCard label="Traders" value={summary.total_traders} />
                <MetricCard label="Agents" value={summary.total_agents} />
                <MetricCard label="Active Listings" value={summary.active_listings} />
                <MetricCard label="Active Auctions" value={summary.active_auctions} />
                <MetricCard label="Total Revenue" value={`₹${formatNumber(summary.total_revenue)}`} />
                <MetricCard label="Total Orders" value={summary.total_orders} />
              </div>

              {/* User growth and Revenue trend charts */}
              <div style={styles.chartRow}>
                <ChartCard title="User Growth" data={userGrowth} dataKey="count" />
                <ChartCard title="Revenue Trend" data={revenueTrend} dataKey="value" money />
              </div>

              {/* Order status distribution */}
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Order Status Distribution</h2>
                <div style={styles.statusList}>
                  {orderStatus.map((item) => (
                    <div key={item.status} style={styles.statusItem}>
                      <span style={styles.statusLabel}>{item.status}</span>
                      <span style={styles.statusCount}>{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top categories and products */}
              <div style={styles.chartRow}>
                <TopListCard title="Top Categories" items={topCategories} nameKey="name" valueKey="count" />
                <TopListCard title="Top Products" items={topProducts} nameKey="name" valueKey="orders" />
              </div>
            </>
          )}
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
  container: { width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '0 24px' },
  topBar: { marginBottom: '25px', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '10px', justifyContent: 'space-between' },
  title: { margin: 0, color: '#163b2a', fontSize: '32px', fontWeight: '850' },
  subtitle: { margin: '8px 0 0', color: '#718078', fontSize: '14px' },
  periodSelect: {
    height: '42px', padding: '0 14px', borderRadius: '12px', border: '1px solid #dbe6de',
    background: '#ffffff', color: '#244936', fontWeight: '600', outline: 'none', cursor: 'pointer',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  chartRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  },
  section: {
    background: '#ffffff', border: '1px solid #e1ebe4', borderRadius: '20px', padding: '22px',
    boxShadow: '0 8px 25px rgba(30,70,45,0.05)', marginBottom: '24px',
  },
  sectionTitle: { margin: '0 0 15px', color: '#173b2a', fontSize: '18px', fontWeight: '800' },
  statusList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  statusItem: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f3f1' },
  statusLabel: { color: '#526058', textTransform: 'capitalize' },
  statusCount: { color: '#173b2a', fontWeight: '800' },
  loading: { textAlign: 'center', padding: '40px', color: '#718078', fontSize: '14px' },
};

function MetricCard({ label, value }) {
  return (
    <div style={stylesMetric.card}>
      <div style={stylesMetric.label}>{label}</div>
      <div style={stylesMetric.value}>{value}</div>
    </div>
  );
}
const stylesMetric = {
  card: {
    background: '#ffffff', border: '1px solid #e1ebe4', borderRadius: '16px', padding: '16px',
    boxShadow: '0 4px 15px rgba(30,70,45,0.04)',
  },
  label: { color: '#7a8780', fontSize: '12px', fontWeight: '600', marginBottom: '6px' },
  value: { color: '#173b2a', fontSize: '20px', fontWeight: '850' },
};

function ChartCard({ title, data, dataKey, money }) {
  const max = Math.max(...data.map(d => Number(d[dataKey]) || 0), 1);
  return (
    <div style={stylesChart.card}>
      <h3 style={stylesChart.title}>{title}</h3>
      <div style={stylesChart.chartArea}>
        {data.map((item, idx) => (
          <div key={idx} style={stylesChart.column}>
            <div style={stylesChart.valueLabel}>{money ? `₹${formatCompact(item[dataKey])}` : item[dataKey]}</div>
            <div style={stylesChart.barContainer}>
              <div style={{ ...stylesChart.bar, height: `${Math.max((item[dataKey] / max) * 100, 3)}%` }} />
            </div>
            <div style={stylesChart.label}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
const stylesChart = {
  card: { background: '#ffffff', border: '1px solid #e1ebe4', borderRadius: '20px', padding: '20px', boxShadow: '0 8px 25px rgba(30,70,45,0.05)' },
  title: { margin: '0 0 15px', color: '#173b2a', fontSize: '16px', fontWeight: '800' },
  chartArea: { display: 'flex', alignItems: 'stretch', height: '180px', gap: '8px', borderBottom: '1px solid #edf1ee', paddingTop: '20px' },
  column: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' },
  valueLabel: { fontSize: '9px', color: '#738078', marginBottom: '5px', whiteSpace: 'nowrap' },
  barContainer: { height: '120px', width: '100%', maxWidth: '30px', background: '#f3f7f4', borderRadius: '8px 8px 4px 4px', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' },
  bar: { width: '100%', background: 'linear-gradient(180deg, #52b788, #2d6a4f)', borderRadius: '8px 8px 3px 3px', minHeight: '4px', transition: 'height 0.4s ease' },
  label: { marginTop: '8px', fontSize: '9px', color: '#89948e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' },
};

function TopListCard({ title, items, nameKey, valueKey }) {
  return (
    <div style={stylesTop.card}>
      <h3 style={stylesTop.title}>{title}</h3>
      {items.length === 0 ? (
        <p style={stylesTop.empty}>No data</p>
      ) : (
        items.map((item, idx) => (
          <div key={item.id ?? idx} style={stylesTop.row}>
            <span style={stylesTop.name}>{item[nameKey]}</span>
            <span style={stylesTop.value}>{item[valueKey]}</span>
          </div>
        ))
      )}
    </div>
  );
}
const stylesTop = {
  card: { background: '#ffffff', border: '1px solid #e1ebe4', borderRadius: '20px', padding: '20px', boxShadow: '0 8px 25px rgba(30,70,45,0.05)' },
  title: { margin: '0 0 15px', color: '#173b2a', fontSize: '16px', fontWeight: '800' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f3f1' },
  name: { color: '#526058' },
  value: { color: '#173b2a', fontWeight: '800' },
  empty: { color: '#9aa49e', textAlign: 'center' },
};

// Helpers
function formatNumber(value) {
  if (value === undefined || value === null || value === '') return '0';
  const number = Number(value);
  if (Number.isNaN(number)) return value;
  return number.toLocaleString('en-IN');
}

function formatCompact(value) {
  const number = Number(value) || 0;
  if (number >= 10000000) return `${(number / 10000000).toFixed(1)}Cr`;
  if (number >= 100000) return `${(number / 100000).toFixed(1)}L`;
  if (number >= 1000) return `${(number / 1000).toFixed(1)}K`;
  return number.toLocaleString('en-IN');
}
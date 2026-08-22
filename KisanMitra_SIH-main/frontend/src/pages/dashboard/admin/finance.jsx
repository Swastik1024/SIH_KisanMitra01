import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminHeader from '../../../components/admin/AdminHeader';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';

import {
  HiOutlineCurrencyRupee,
  HiOutlineShoppingCart,
  HiOutlineCheckCircle,
  HiOutlineChartBar,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from 'react-icons/hi';

export default function AdminFinancePage() {
  const router = useRouter();
  const { isAuthenticated, user, hydrate } = useAuthStore();

  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('7d');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
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
    fetchRevenue();
  }, [isAuthenticated, user, router, period, page]);

  const fetchRevenue = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/revenue', {
        params: { period, page, limit },
      });
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch revenue:', error);
      toast.error('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 1;
  const summary = data?.summary || {};
  const chart = data?.chart || [];
  const transactions = data?.transactions || [];

  return (
    <>
      <AdminHeader />
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.topBar}>
            <h1 style={styles.title}>Revenue & Finance</h1>
            <p style={styles.subtitle}>Track platform earnings and transactions</p>
          </div>

          <div style={styles.periodWrapper}>
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                setPage(1);
              }}
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
            <div style={styles.loading}>Loading revenue data...</div>
          ) : (
            <>
              {/* Summary Cards */}
              <div style={styles.summaryGrid}>
                <div style={styles.card}>
                  <div style={styles.cardIcon}><HiOutlineCurrencyRupee /></div>
                  <div style={styles.cardLabel}>Total Revenue</div>
                  <div style={styles.cardValue}>₹{formatNumber(summary.total_revenue)}</div>
                </div>
                <div style={styles.card}>
                  <div style={styles.cardIcon}><HiOutlineShoppingCart /></div>
                  <div style={styles.cardLabel}>Total Orders</div>
                  <div style={styles.cardValue}>{summary.total_orders}</div>
                </div>
                <div style={styles.card}>
                  <div style={styles.cardIcon}><HiOutlineCheckCircle /></div>
                  <div style={styles.cardLabel}>Completed Orders</div>
                  <div style={styles.cardValue}>{summary.completed_orders}</div>
                </div>
                <div style={styles.card}>
                  <div style={styles.cardIcon}><HiOutlineChartBar /></div>
                  <div style={styles.cardLabel}>Average Order Value</div>
                  <div style={styles.cardValue}>₹{formatNumber(summary.average_order_value)}</div>
                </div>
                <div style={styles.card}>
                  <div style={styles.cardIcon}><HiOutlineCurrencyRupee /></div>
                  <div style={styles.cardLabel}>Total Commission</div>
                  <div style={styles.cardValue}>₹{formatNumber(summary.total_commission)}</div>
                </div>
                <div style={styles.card}>
                  <div style={styles.cardIcon}><HiOutlineCurrencyRupee /></div>
                  <div style={styles.cardLabel}>Pending Payouts</div>
                  <div style={styles.cardValue}>₹{formatNumber(summary.pending_payouts)}</div>
                </div>
              </div>

              {/* Revenue Chart */}
              <div style={styles.chartCard}>
                <h2 style={styles.chartTitle}>Revenue Trend</h2>
                <div style={styles.chart}>
                  {chart.map((item, index) => {
                    const max = Math.max(...chart.map(i => i.value), 1);
                    const height = Math.max((item.value / max) * 100, 3);
                    return (
                      <div key={index} style={styles.chartColumn}>
                        <div style={styles.chartValue}>₹{formatCompact(item.value)}</div>
                        <div style={styles.chartBarContainer}>
                          <div style={{ ...styles.chartBar, height: `${height}%` }} />
                        </div>
                        <div style={styles.chartLabel}>{item.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Transactions Table */}
              <div style={styles.tableCard}>
                <h2 style={styles.tableTitle}>Recent Transactions</h2>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Order ID</th>
                      <th style={styles.th}>Farmer</th>
                      <th style={styles.th}>Trader</th>
                      <th style={styles.th}>Amount</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Payment</th>
                      <th style={styles.th}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={styles.empty}>No transactions found</td>
                      </tr>
                    ) : (
                      transactions.map((t) => (
                        <tr key={t.id}>
                          <td style={styles.td}>#{t.order_id}</td>
                          <td style={styles.td}>{t.farmer_name}</td>
                          <td style={styles.td}>{t.trader_name}</td>
                          <td style={styles.td}>₹{formatNumber(t.amount)}</td>
                          <td style={styles.td}>
                            <span style={styles.statusBadge}>{t.status}</span>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.paymentBadge}>{t.payment_status}</span>
                          </td>
                          <td style={styles.td}>
                            {new Date(t.created_at).toLocaleDateString('en-IN')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {totalPages > 1 && (
                  <div style={styles.pagination}>
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      style={styles.pageButton}
                    >
                      <HiOutlineChevronLeft />
                    </button>
                    <span style={styles.pageInfo}>Page {page} of {totalPages}</span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      style={styles.pageButton}
                    >
                      <HiOutlineChevronRight />
                    </button>
                  </div>
                )}
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
  topBar: { marginBottom: '25px' },
  title: { margin: 0, color: '#163b2a', fontSize: '32px', fontWeight: '850' },
  subtitle: { margin: '8px 0 0', color: '#718078', fontSize: '14px' },
  periodWrapper: { marginBottom: '20px' },
  periodSelect: {
    height: '42px', padding: '0 14px', borderRadius: '12px', border: '1px solid #dbe6de',
    background: '#ffffff', color: '#244936', fontWeight: '600', outline: 'none', cursor: 'pointer',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  card: {
    background: '#ffffff', border: '1px solid #e1ebe4', borderRadius: '20px', padding: '20px',
    boxShadow: '0 8px 25px rgba(30,70,45,0.05)',
  },
  cardIcon: {
    width: '40px', height: '40px', borderRadius: '12px', background: '#e9f5ed', color: '#2d6a4f',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px',
  },
  cardLabel: { color: '#7a8780', fontSize: '13px', fontWeight: '600', marginBottom: '4px' },
  cardValue: { color: '#173b2a', fontSize: '24px', fontWeight: '850' },
  chartCard: {
    background: '#ffffff', border: '1px solid #e1ebe4', borderRadius: '20px', padding: '22px',
    boxShadow: '0 8px 25px rgba(30,70,45,0.05)', marginBottom: '20px',
  },
  chartTitle: { margin: 0, color: '#173b2a', fontSize: '18px', fontWeight: '800', marginBottom: '15px' },
  chart: {
    height: '220px', display: 'flex', alignItems: 'stretch', gap: '10px', borderBottom: '1px solid #edf1ee', paddingTop: '20px',
  },
  chartColumn: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' },
  chartValue: { fontSize: '9px', color: '#738078', marginBottom: '5px', whiteSpace: 'nowrap' },
  chartBarContainer: { height: '150px', width: '100%', maxWidth: '35px', display: 'flex', alignItems: 'flex-end', background: '#f3f7f4', borderRadius: '9px 9px 4px 4px', overflow: 'hidden' },
  chartBar: { width: '100%', background: 'linear-gradient(180deg, #52b788, #2d6a4f)', borderRadius: '8px 8px 3px 3px', minHeight: '4px', transition: 'height 0.4s ease' },
  chartLabel: { marginTop: '8px', fontSize: '9px', color: '#89948e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' },
  tableCard: {
    background: '#ffffff', border: '1px solid #e1ebe4', borderRadius: '20px', padding: '22px',
    boxShadow: '0 8px 25px rgba(30,70,45,0.05)', overflowX: 'auto',
  },
  tableTitle: { margin: 0, color: '#173b2a', fontSize: '18px', fontWeight: '800', marginBottom: '15px' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '800px' },
  th: {
    padding: '11px 12px', textAlign: 'left', color: '#89948e', fontSize: '11px', fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e9efeb',
  },
  td: { padding: '15px 12px', color: '#526058', fontSize: '13px', borderBottom: '1px solid #f0f3f1' },
  statusBadge: {
    padding: '5px 9px', borderRadius: '20px', background: '#edf6f0', color: '#2d6a4f',
    fontSize: '10px', fontWeight: '800', textTransform: 'capitalize',
  },
  paymentBadge: {
    padding: '5px 9px', borderRadius: '20px', background: '#fff7df', color: '#9a6700',
    fontSize: '10px', fontWeight: '800', textTransform: 'capitalize',
  },
  empty: { textAlign: 'center', padding: '30px', color: '#9aa49e' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px' },
  pageButton: {
    width: '35px', height: '35px', borderRadius: '8px', border: '1px solid #dbe6de',
    background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: '#526058',
  },
  pageInfo: { color: '#526058', fontSize: '13px', fontWeight: '600' },
  loading: { textAlign: 'center', padding: '40px', color: '#718078', fontSize: '14px' },
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
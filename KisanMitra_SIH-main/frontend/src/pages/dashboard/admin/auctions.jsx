import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminHeader from '../../../components/admin/AdminHeader';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';

import {
  HiOutlineSearch,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineClock,
  HiOutlineTag,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from 'react-icons/hi';

export default function AdminAuctionsPage() {
  const router = useRouter();
  const { isAuthenticated, user, hydrate } = useAuthStore();

  const [auctions, setAuctions] = useState([]);
  const [summary, setSummary] = useState({
    live: 0,
    scheduled: 0,
    ended: 0,
    cancelled: 0,
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('live'); // default to live
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
    fetchAuctions();
  }, [isAuthenticated, user, router, page, search, status]);

  const fetchAuctions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/auctions', {
        params: { search, status, page, limit },
      });
      setAuctions(response.data.auctions);
      setTotal(response.data.total);
      setSummary(response.data.summary);
    } catch (error) {
      console.error('Failed to fetch auctions:', error);
      toast.error('Failed to load auctions');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <AdminHeader />
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.topBar}>
            <h1 style={styles.title}>Auctions Management</h1>
            <p style={styles.subtitle}>Monitor and manage all auctions</p>
          </div>

          {/* Summary Cards */}
          <div style={styles.summaryGrid}>
            <div style={styles.summaryCard}>
              <HiOutlineClock style={styles.summaryIcon} />
              <div>
                <div style={styles.summaryLabel}>Live</div>
                <div style={styles.summaryValue}>{summary.live}</div>
              </div>
            </div>
            <div style={styles.summaryCard}>
              <HiOutlineTag style={styles.summaryIcon} />
              <div>
                <div style={styles.summaryLabel}>Scheduled</div>
                <div style={styles.summaryValue}>{summary.scheduled}</div>
              </div>
            </div>
            <div style={styles.summaryCard}>
              <HiOutlineCheckCircle style={styles.summaryIcon} />
              <div>
                <div style={styles.summaryLabel}>Ended</div>
                <div style={styles.summaryValue}>{summary.ended}</div>
              </div>
            </div>
            <div style={styles.summaryCard}>
              <HiOutlineXCircle style={styles.summaryIcon} />
              <div>
                <div style={styles.summaryLabel}>Cancelled</div>
                <div style={styles.summaryValue}>{summary.cancelled}</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div style={styles.filters}>
            <div style={styles.searchWrapper}>
              <HiOutlineSearch size={18} color="#718078" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by product or farmer"
                style={styles.searchInput}
              />
            </div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              style={styles.roleSelect}
            >
              <option value="">All Status</option>
              <option value="live">Live</option>
              <option value="scheduled">Scheduled</option>
              <option value="ended">Ended</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {loading ? (
            <div style={styles.loading}>Loading auctions...</div>
          ) : (
            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Product</th>
                    <th style={styles.th}>Farmer</th>
                    <th style={styles.th}>Agent</th>
                    <th style={styles.th}>Base Price</th>
                    <th style={styles.th}>Highest Bid</th>
                    <th style={styles.th}>Bidder</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Start Time</th>
                    <th style={styles.th}>End Time</th>
                  </tr>
                </thead>
                <tbody>
                  {auctions.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={styles.empty}>No auctions found</td>
                    </tr>
                  ) : (
                    auctions.map((a) => (
                      <tr key={a.id}>
                        <td style={styles.td}>
                          <strong>{a.product_name}</strong>
                        </td>
                        <td style={styles.td}>{a.farmer_name}</td>
                        <td style={styles.td}>{a.agent_name}</td>
                        <td style={styles.td}>₹{a.base_price}</td>
                        <td style={styles.td}>₹{a.current_highest_bid || '—'}</td>
                        <td style={styles.td}>{a.current_highest_bidder || '—'}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.statusBadge,
                            background: getStatusBackground(a.status),
                            color: getStatusColor(a.status),
                          }}>
                            {a.status}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {a.start_time ? new Date(a.start_time).toLocaleString('en-IN') : '—'}
                        </td>
                        <td style={styles.td}>
                          {a.end_time ? new Date(a.end_time).toLocaleString('en-IN') : '—'}
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
                  <span style={styles.pageInfo}>
                    Page {page} of {totalPages}
                  </span>
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
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  summaryCard: {
    background: '#ffffff', border: '1px solid #e1ebe4', borderRadius: '20px', padding: '20px',
    boxShadow: '0 8px 25px rgba(30,70,45,0.05)', display: 'flex', alignItems: 'center', gap: '12px',
  },
  summaryIcon: { fontSize: '24px', color: '#2d6a4f' },
  summaryLabel: { color: '#7a8780', fontSize: '12px', fontWeight: '600' },
  summaryValue: { color: '#173b2a', fontSize: '22px', fontWeight: '850' },
  filters: { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' },
  searchWrapper: {
    flex: 1, minWidth: '250px', height: '42px', display: 'flex', alignItems: 'center',
    gap: '8px', padding: '0 12px', background: '#ffffff', border: '1px solid #dbe6de', borderRadius: '12px',
  },
  searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: '13px', background: 'transparent', color: '#243b30' },
  roleSelect: {
    height: '42px', padding: '0 12px', borderRadius: '12px', border: '1px solid #dbe6de',
    background: '#ffffff', color: '#244936', fontWeight: '600', outline: 'none', cursor: 'pointer',
  },
  tableCard: {
    background: '#ffffff', border: '1px solid #e1ebe4', borderRadius: '20px', padding: '22px',
    boxShadow: '0 8px 25px rgba(30,70,45,0.05)', overflowX: 'auto',
  },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '1000px' },
  th: {
    padding: '11px 12px', textAlign: 'left', color: '#89948e', fontSize: '11px', fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e9efeb',
  },
  td: { padding: '15px 12px', color: '#526058', fontSize: '13px', borderBottom: '1px solid #f0f3f1' },
  statusBadge: {
    padding: '5px 9px', borderRadius: '20px', fontSize: '10px', fontWeight: '800', textTransform: 'capitalize',
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

function getStatusBackground(status) {
  switch (status) {
    case 'live': return '#e8f5ed';
    case 'scheduled': return '#fff7df';
    case 'ended': return '#edf6f0';
    case 'cancelled': return '#fdecec';
    default: return '#f1f3f5';
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'live': return '#2d6a4f';
    case 'scheduled': return '#9a6700';
    case 'ended': return '#2d6a4f';
    case 'cancelled': return '#c0392b';
    default: return '#495057';
  }
}
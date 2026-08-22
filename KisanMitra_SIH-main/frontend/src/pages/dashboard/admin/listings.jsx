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
} from 'react-icons/hi';

export default function AdminListingsPage() {
  const router = useRouter();
  const { isAuthenticated, user, hydrate } = useAuthStore();

  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
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
    fetchListings();
  }, [isAuthenticated, user, router, page, search, status]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/listings', {
        params: { search, status, page, limit },
      });
      setListings(response.data.listings);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
      toast.error('Failed to load listings');
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
            <h1 style={styles.title}>Listings Management</h1>
            <p style={styles.subtitle}>View and manage all product listings</p>
          </div>

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
                placeholder="Search by product or farmer name"
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
              <option value="active">Active</option>
              <option value="pending_inspection">Pending Inspection</option>
              <option value="sold">Sold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {loading ? (
            <div style={styles.loading}>Loading listings...</div>
          ) : (
            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Product</th>
                    <th style={styles.th}>Farmer</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Quantity</th>
                    <th style={styles.th}>Price</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={styles.empty}>No listings found</td>
                    </tr>
                  ) : (
                    listings.map((l) => (
                      <tr key={l.id}>
                        <td style={styles.td}>
                          <strong>{l.name}</strong>
                        </td>
                        <td style={styles.td}>{l.farmer_name}</td>
                        <td style={styles.td}>{l.category_name || l.category_slug || '—'}</td>
                        <td style={styles.td}>
                          {l.quantity} {l.unit}
                        </td>
                        <td style={styles.td}>₹{l.price}</td>
                        <td style={styles.td}>
                          <span style={styles.statusBadge}>{l.status}</span>
                        </td>
                        <td style={styles.td}>
                          {new Date(l.created_at).toLocaleDateString('en-IN')}
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
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '700px' },
  th: {
    padding: '11px 12px', textAlign: 'left', color: '#89948e', fontSize: '11px', fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e9efeb',
  },
  td: { padding: '15px 12px', color: '#526058', fontSize: '13px', borderBottom: '1px solid #f0f3f1' },
  statusBadge: {
    padding: '5px 9px', borderRadius: '20px', background: '#edf6f0', color: '#2d6a4f',
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
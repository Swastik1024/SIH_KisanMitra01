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
  HiOutlineTrash,
} from 'react-icons/hi';

export default function AdminUsersPage() {
  const router = useRouter();
  const { isAuthenticated, user, hydrate } = useAuthStore();

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (user?.role !== 'admin') {
      router.replace('/login');
      return;
    }
    fetchUsers();
  }, [isAuthenticated, user, router, page, search, role]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/users', {
        params: { search, role, page, limit },
      });
      setUsers(response.data.users);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    setDeletingId(userId);
    try {
      await api.delete(`/api/admin/users/${userId}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Delete user error:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <AdminHeader />
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.topBar}>
            <h1 style={styles.title}>User Management</h1>
            <p style={styles.subtitle}>View and manage all platform users</p>
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
                placeholder="Search by name, email, or phone"
                style={styles.searchInput}
              />
            </div>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setPage(1);
              }}
              style={styles.roleSelect}
            >
              <option value="">All Roles</option>
              <option value="farmer">Farmer</option>
              <option value="trader">Trader</option>
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {loading ? (
            <div style={styles.loading}>Loading users...</div>
          ) : (
            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>User</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Phone</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Verified</th>
                    <th style={styles.th}>Created</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={styles.empty}>No users found</td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id}>
                        <td style={styles.td}>
                          <div style={styles.userCell}>
                            <div style={styles.avatar}>
                              {u.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <strong>{u.name}</strong>
                          </div>
                        </td>
                        <td style={styles.td}>{u.email}</td>
                        <td style={styles.td}>{u.phone}</td>
                        <td style={styles.td}>
                          <span style={styles.roleBadge}>{u.role}</span>
                        </td>
                        <td style={styles.td}>{u.verified ? '✅' : '❌'}</td>
                        <td style={styles.td}>
                          {new Date(u.created_at).toLocaleDateString('en-IN')}
                        </td>
                        <td style={styles.td}>
                          <button
                            onClick={() => handleDelete(u.id)}
                            disabled={deletingId === u.id}
                            style={styles.deleteButton}
                            title="Delete user"
                          >
                            <HiOutlineTrash size={16} />
                            {deletingId === u.id ? 'Deleting...' : ''}
                          </button>
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
  userCell: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: {
    width: '32px', height: '32px', borderRadius: '50%', background: '#dff0e5', color: '#2d6a4f',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px',
  },
  roleBadge: {
    padding: '5px 9px', borderRadius: '20px', background: '#edf6f0', color: '#2d6a4f',
    fontSize: '10px', fontWeight: '800', textTransform: 'capitalize',
  },
  deleteButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    background: '#fdecec',
    color: '#c0392b',
    border: 'none',
    padding: '6px 10px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '12px',
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
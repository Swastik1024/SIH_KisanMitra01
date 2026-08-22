import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminHeader from '../../../components/admin/AdminHeader';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { isAuthenticated, user, hydrate } = useAuthStore();
  const [form, setForm] = useState({
    platform_name: '',
    support_email: '',
    support_phone: '',
    commission_rate: 5.0,
    maintenance_mode: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (user?.role !== 'admin') {
      router.replace('/login');
      return;
    }
    fetchSettings();
  }, [isAuthenticated, user, router]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/settings');
      setForm(response.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/api/admin/settings', form);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Save settings error:', error);
      toast.error(error.response?.data?.detail || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <AdminHeader />
        <main style={styles.page}>
          <div style={styles.container}>
            <p style={styles.loading}>Loading settings...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AdminHeader />
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.topBar}>
            <h1 style={styles.title}>Platform Settings</h1>
            <p style={styles.subtitle}>Manage global platform configuration</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.card}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Platform Name</label>
              <input
                type="text"
                name="platform_name"
                value={form.platform_name}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Support Email</label>
              <input
                type="email"
                name="support_email"
                value={form.support_email}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Support Phone</label>
              <input
                type="text"
                name="support_phone"
                value={form.support_phone}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Commission Rate (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                name="commission_rate"
                value={form.commission_rate}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.checkboxGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="maintenance_mode"
                  checked={form.maintenance_mode}
                  onChange={handleChange}
                  style={styles.checkbox}
                />
                Maintenance Mode (block user access)
              </label>
            </div>

            <div style={styles.actions}>
              <button type="submit" disabled={saving} style={styles.saveButton}>
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
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
  container: { width: '100%', maxWidth: '800px', margin: '0 auto', padding: '0 24px' },
  topBar: { marginBottom: '25px' },
  title: { margin: 0, color: '#163b2a', fontSize: '32px', fontWeight: '850' },
  subtitle: { margin: '8px 0 0', color: '#718078', fontSize: '14px' },
  loading: { textAlign: 'center', padding: '40px', color: '#718078' },
  card: {
    background: '#ffffff', border: '1px solid #e1ebe4', borderRadius: '20px', padding: '24px',
    boxShadow: '0 8px 25px rgba(30,70,45,0.05)',
  },
  formGroup: { marginBottom: '18px' },
  label: { display: 'block', color: '#526058', fontSize: '12px', fontWeight: '700', marginBottom: '6px' },
  input: {
    width: '100%', height: '42px', border: '1px solid #dbe6de', borderRadius: '10px',
    padding: '0 12px', fontSize: '13px', outline: 'none', background: '#f9fbfa', color: '#243b30',
  },
  checkboxGroup: { marginBottom: '18px' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '8px', color: '#526058', fontSize: '13px', fontWeight: '600' },
  checkbox: { width: '16px', height: '16px' },
  actions: { marginTop: '24px' },
  saveButton: {
    background: '#2d6a4f', color: '#fff', border: 'none', padding: '12px 24px',
    borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '14px',
    boxShadow: '0 7px 18px rgba(45,106,79,0.2)',
  },
};
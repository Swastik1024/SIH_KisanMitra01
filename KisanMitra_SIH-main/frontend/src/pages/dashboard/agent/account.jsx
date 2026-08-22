import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AgentHeader from '../../../components/agent/AgentHeader';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';
import { HiOutlineSave, HiOutlineKey } from 'react-icons/hi';

export default function AgentAccount() {
  const router = useRouter();
  const { isAuthenticated, user, hydrate } = useAuthStore();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', service_area: '', qualifications: '',
    bank_name: '', account_holder: '', account_number: '', ifsc_code: ''
  });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '' });
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.role !== 'agent') { router.replace('/dashboard/' + user?.role); return; }
    fetchProfile();
  }, [isAuthenticated, user, router]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/agent/profile');
      setForm(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load profile');
    }
  };

  const handleChange = (e) => { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); };
  const handlePasswordChange = (e) => { setPasswordForm(prev => ({ ...prev, [e.target.name]: e.target.value })); };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/api/agent/profile', form);
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    try {
      await api.put('/api/auth/change-password', passwordForm);
      toast.success('Password changed successfully');
      setPasswordForm({ current_password: '', new_password: '' });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <>
      <AgentHeader />
      <main style={styles.page}>
        <div style={styles.container}>
          <h1 style={styles.title}>My Account</h1>

          {/* Profile Form */}
          <form onSubmit={handleSaveProfile} style={styles.card}>
            <h2 style={styles.cardTitle}><HiOutlineSave size={20} color="#2d6a4f" /> Profile Information</h2>
            <div style={styles.grid}>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Full Name" style={styles.input} />
              <input name="email" value={form.email} onChange={handleChange} placeholder="Email" style={styles.input} />
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" style={styles.input} />
              <input name="service_area" value={form.service_area} onChange={handleChange} placeholder="Service Area" style={styles.input} />
              <textarea name="qualifications" value={form.qualifications} onChange={handleChange} placeholder="Qualifications" style={{ ...styles.input, height: '80px' }} />
              <input name="bank_name" value={form.bank_name} onChange={handleChange} placeholder="Bank Name" style={styles.input} />
              <input name="account_holder" value={form.account_holder} onChange={handleChange} placeholder="Account Holder" style={styles.input} />
              <input name="account_number" value={form.account_number} onChange={handleChange} placeholder="Account Number" style={styles.input} />
              <input name="ifsc_code" value={form.ifsc_code} onChange={handleChange} placeholder="IFSC Code" style={styles.input} />
            </div>
            <button type="submit" disabled={saving} style={styles.button}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>

          {/* Change Password */}
          <form onSubmit={handleChangePassword} style={styles.card}>
            <h2 style={styles.cardTitle}><HiOutlineKey size={20} color="#2d6a4f" /> Change Password</h2>
            <div style={styles.grid}>
              <input type="password" name="current_password" value={passwordForm.current_password} onChange={handlePasswordChange} placeholder="Current Password" style={styles.input} required />
              <input type="password" name="new_password" value={passwordForm.new_password} onChange={handlePasswordChange} placeholder="New Password" style={styles.input} required />
            </div>
            <button type="submit" disabled={changingPassword} style={styles.button}>
              {changingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}

const styles = {
  page: { minHeight: '100vh', paddingTop: '100px', paddingBottom: '60px', background: 'linear-gradient(135deg, #f4f8f5 0%, #edf5ef 50%, #f8faf8 100%)', fontFamily: "'Segoe UI', system-ui, sans-serif" },
  container: { maxWidth: '800px', margin: '0 auto', padding: '0 24px' },
  title: { margin: '0 0 20px', color: '#163b2a', fontSize: '32px', fontWeight: '850' },
  card: { background: '#fff', borderRadius: '20px', padding: '24px', marginBottom: '20px', boxShadow: '0 8px 25px rgba(30,70,45,0.05)', border: '1px solid #e1ebe4' },
  cardTitle: { display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 20px', color: '#173b2a', fontSize: '18px', fontWeight: '800' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '20px' },
  input: { width: '100%', padding: '10px', border: '1px solid #dbe6de', borderRadius: '10px', fontSize: '13px', outline: 'none', background: '#f9fbfa', color: '#243b30' },
  button: { background: '#2d6a4f', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', boxShadow: '0 7px 18px rgba(45,106,79,0.2)' },
};
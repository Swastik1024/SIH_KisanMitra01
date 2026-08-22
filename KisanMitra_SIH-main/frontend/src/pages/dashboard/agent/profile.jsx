import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AgentHeader from '../../../components/agent/AgentHeader';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineAcademicCap,
  HiOutlineOfficeBuilding,
  HiOutlineCreditCard,
} from 'react-icons/hi';

export default function AgentProfile() {
  const router = useRouter();
  const { isAuthenticated, user, hydrate } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.role !== 'agent') { router.replace('/dashboard/' + user?.role); return; }
    fetchProfile();
  }, [isAuthenticated, user, router]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/agent/profile');
      setProfile(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <><AgentHeader /><main style={styles.page}><div style={styles.loading}>Loading profile...</div></main></>;
  }

  return (
    <>
      <AgentHeader />
      <main style={styles.page}>
        <div style={styles.container}>
          <h1 style={styles.title}>My Profile</h1>
          <div style={styles.card}>
            <div style={styles.header}>
              <div style={styles.avatar}>{profile?.name?.charAt(0)?.toUpperCase() || 'A'}</div>
              <div>
                <h2 style={styles.name}>{profile?.name || 'Agent'}</h2>
                <p style={styles.role}>Field Agent</p>
              </div>
            </div>

            <div style={styles.divider} />

            <div style={styles.infoGrid}>
              <InfoItem icon={<HiOutlineMail />} label="Email" value={profile?.email || '—'} />
              <InfoItem icon={<HiOutlinePhone />} label="Phone" value={profile?.phone || '—'} />
              <InfoItem icon={<HiOutlineLocationMarker />} label="Service Area" value={profile?.service_area || '—'} />
              <InfoItem icon={<HiOutlineAcademicCap />} label="Qualifications" value={profile?.qualifications || '—'} />
            </div>

            <h3 style={styles.bankTitle}>Bank Details</h3>
            <div style={styles.infoGrid}>
              <InfoItem icon={<HiOutlineOfficeBuilding />} label="Bank Name" value={profile?.bank_name || '—'} />
              <InfoItem icon={<HiOutlineCreditCard />} label="Account Holder" value={profile?.account_holder || '—'} />
              <InfoItem icon={<HiOutlineCreditCard />} label="Account Number" value={profile?.account_number || '—'} />
              <InfoItem icon={<HiOutlineCreditCard />} label="IFSC Code" value={profile?.ifsc_code || '—'} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div style={styles.infoItem}>
      <div style={styles.infoIcon}>{icon}</div>
      <div>
        <div style={styles.infoLabel}>{label}</div>
        <div style={styles.infoValue}>{value}</div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', paddingTop: '100px', paddingBottom: '60px', background: 'linear-gradient(135deg, #f4f8f5 0%, #edf5ef 50%, #f8faf8 100%)', fontFamily: "'Segoe UI', system-ui, sans-serif" },
  container: { maxWidth: '900px', margin: '0 auto', padding: '0 24px' },
  loading: { textAlign: 'center', padding: '40px', color: '#718078' },
  title: { margin: '0 0 20px', color: '#163b2a', fontSize: '32px', fontWeight: '850' },
  card: { background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 8px 25px rgba(30,70,45,0.05)', border: '1px solid #e1ebe4' },
  header: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' },
  avatar: { width: '70px', height: '70px', borderRadius: '20px', background: '#dff4e7', color: '#198754', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '850' },
  name: { margin: 0, color: '#173b2a', fontSize: '22px', fontWeight: '850' },
  role: { margin: '4px 0 0', color: '#89948e', fontSize: '14px' },
  divider: { height: '1px', background: '#e9efeb', margin: '20px 0' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
  infoItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#f9fbfa', borderRadius: '12px' },
  infoIcon: { width: '36px', height: '36px', background: '#eaf8f0', color: '#198754', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' },
  infoLabel: { color: '#89948e', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  infoValue: { color: '#173b2a', fontSize: '14px', fontWeight: '700', marginTop: '2px' },
  bankTitle: { margin: '20px 0 10px', color: '#173b2a', fontSize: '16px', fontWeight: '800' },
};
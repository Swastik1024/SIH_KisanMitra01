import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Header from '../../../components/common/Header';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';
import {
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineGlobeAlt,
  HiOutlineCalendar,
  HiOutlineIdentification,
  HiOutlineCreditCard,
  HiOutlineOfficeBuilding,
  HiOutlineDocumentText,
  HiOutlinePencil,
  HiOutlineStar,
  HiOutlineCheck,
} from 'react-icons/hi';

export default function FarmerProfile() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [farmerProfile, setFarmerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, hydrate } = useAuthStore();

  const [editPersonal, setEditPersonal] = useState(false);
  const [editBank, setEditBank] = useState(false);
  const [personalForm, setPersonalForm] = useState({ address: '', gender: '', land: '' });
  const [bankForm, setBankForm] = useState({ bank_name: '', account_holder: '', account_last4: '' });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    const fetchData = async () => {
      try {
        const [profileRes, statsRes, productsRes, farmerProfileRes] = await Promise.all([
          api.get('/api/auth/me'),
          api.get('/api/farmer/stats'),
          api.get('/api/products/my'),
          api.get('/api/farmer/profile'),
        ]);
        setUserData(profileRes.data);
        setStats(statsRes.data);
        setProducts(productsRes.data || []);
        const fp = farmerProfileRes.data;
        setFarmerProfile(fp);
        setPersonalForm({
          address: fp.address || profileRes.data.location || '',
          gender: fp.gender || '',
          land: fp.land_size || '',
        });
        setBankForm({
          bank_name: fp.bank_name || '',
          account_holder: fp.account_holder || '',
          account_last4: fp.account_last4 || '',
        });
      } catch (error) {
        console.error('Failed to load farmer data:', error);
        if (error.response?.status === 401) {
          toast.error('Session expired. Please login again.');
          useAuthStore.getState().logout();
          router.replace('/login');
        } else {
          toast.error('Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated, router]);

  const handleSavePersonal = async () => {
    try {
      await api.put('/api/farmer/profile', {
        address: personalForm.address,
        gender: personalForm.gender,
        land_size: personalForm.land,
      });
      setEditPersonal(false);
      toast.success('Personal details updated');
    } catch (error) {
      toast.error('Failed to update personal details');
    }
  };

  const handleSaveBank = async () => {
    try {
      await api.put('/api/farmer/profile', {
        bank_name: bankForm.bank_name,
        account_holder: bankForm.account_holder,
        account_last4: bankForm.account_last4,
      });
      setEditBank(false);
      toast.success('Bank details updated');
    } catch (error) {
      toast.error('Failed to update bank details');
    }
  };

  return (
    <div>
      <Header />
      <div style={{ minHeight: '100vh', background: '#f0f4f1', fontFamily: "'Segoe UI', system-ui, sans-serif", paddingBottom: '40px' }}>
        {/* Cover Image */}
        <div style={{ height: '200px', backgroundImage: 'url(/wheat-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
          <Link href="/" style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 2 }}>
            <button style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontSize: '18px', color: '#1b4332', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>←</button>
          </Link>
          <div style={{ position: 'absolute', bottom: '-40px', left: '50%', transform: 'translateX(-50%)', width: '110px', height: '110px', borderRadius: '50%', border: '4px solid white', background: 'linear-gradient(135deg, #2d6a4f, #1b4332)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '52px', boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }}>
            👨‍🌾
          </div>
        </div>

        {/* Name & Role */}
        <div style={{ textAlign: 'center', marginTop: '50px', padding: '0 20px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1b4332', margin: 0 }}>
            {loading ? 'Loading...' : userData?.name}
          </h1>
          <p style={{ color: '#636e72', fontSize: '14px', marginTop: '4px', textTransform: 'capitalize' }}>
            {loading ? '' : userData?.role}
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ maxWidth: '900px', margin: '30px auto 0', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
          <StatCard value={stats?.total_products_sold ?? 0} label="Products Sold" />
          <StatCard value={`₹${stats?.total_earnings?.toLocaleString('en-IN') ?? '0'}`} label="Total Earnings" />
          <StatCard value={products.length} label="Total Listings" />
        </div>

        {/* Main Grid */}
        <div style={{ maxWidth: '1100px', margin: '20px auto 0', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', alignItems: 'start' }}>
          
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Contact Information */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1b4332', margin: 0, marginBottom: '16px' }}>Contact Information</h3>
              <InfoItem icon={<HiOutlineMail />} label="Email" value={userData?.email || 'Not provided'} />
              <InfoItem icon={<HiOutlinePhone />} label="Mobile" value={userData?.phone || 'Not provided'} />
            </div>

            {/* Personal Details - editable */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1b4332', margin: 0 }}>Personal Details</h3>
                {!editPersonal ? (
                  <button onClick={() => setEditPersonal(true)} style={editBtnStyle}>
                    <HiOutlinePencil /> Update
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleSavePersonal} style={saveBtnStyle}>
                      <HiOutlineCheck /> Save
                    </button>
                    <button onClick={() => setEditPersonal(false)} style={cancelBtnStyle}>Cancel</button>
                  </div>
                )}
              </div>
              {editPersonal ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input style={inputStyle} placeholder="Address" value={personalForm.address} onChange={(e) => setPersonalForm({ ...personalForm, address: e.target.value })} />
                  <input style={inputStyle} placeholder="Gender" value={personalForm.gender} onChange={(e) => setPersonalForm({ ...personalForm, gender: e.target.value })} />
                  <input style={inputStyle} placeholder="Agricultural Land" value={personalForm.land} onChange={(e) => setPersonalForm({ ...personalForm, land: e.target.value })} />
                </div>
              ) : (
                <>
                  <InfoItem icon={<HiOutlineLocationMarker />} label="Address" value={personalForm.address || 'Not provided'} />
                  <InfoItem icon={<HiOutlineIdentification />} label="Gender" value={personalForm.gender || 'Not provided'} />
                  <InfoItem icon={<HiOutlineGlobeAlt />} label="Agricultural Land" value={personalForm.land || 'Not provided'} />
                  <InfoItem icon={<HiOutlineCalendar />} label="Member Since" value={userData ? new Date(userData.created_at).toLocaleDateString('en-IN') : '—'} />
                </>
              )}
            </div>

            {/* KYC */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1b4332', margin: 0 }}>KYC Documents</h3>
                <button onClick={() => toast.success('KYC upload coming soon')} style={editBtnStyle}>
                  <HiOutlinePencil /> Upload
                </button>
              </div>
              <KycItem label="Aadhar Card" />
              <KycItem label="PAN Card" />
              <KycItem label="Farmer ID" />
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Bank Details - editable */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1b4332', margin: 0 }}>Bank Details</h3>
                {!editBank ? (
                  <button onClick={() => setEditBank(true)} style={editBtnStyle}>
                    <HiOutlinePencil /> Update
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleSaveBank} style={saveBtnStyle}>
                      <HiOutlineCheck /> Save
                    </button>
                    <button onClick={() => setEditBank(false)} style={cancelBtnStyle}>Cancel</button>
                  </div>
                )}
              </div>
              {editBank ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input style={inputStyle} placeholder="Bank Name" value={bankForm.bank_name} onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })} />
                  <input style={inputStyle} placeholder="Account Holder" value={bankForm.account_holder} onChange={(e) => setBankForm({ ...bankForm, account_holder: e.target.value })} />
                  <input style={inputStyle} placeholder="Account Number (last 4)" value={bankForm.account_last4} onChange={(e) => setBankForm({ ...bankForm, account_last4: e.target.value })} maxLength={4} />
                </div>
              ) : (
                <>
                  <InfoItem icon={<HiOutlineOfficeBuilding />} label="Bank Name" value={bankForm.bank_name || 'Not provided'} />
                  <InfoItem icon={<HiOutlineCreditCard />} label="Account Holder" value={bankForm.account_holder || 'Not provided'} />
                  <InfoItem icon={<HiOutlineCreditCard />} label="Account Number" value={bankForm.account_last4 ? `•••• ${bankForm.account_last4}` : 'Not provided'} />
                </>
              )}
            </div>

            {/* Website Rating */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1b4332', margin: 0, marginBottom: '16px' }}>Website Rating</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <HiOutlineStar style={{ fontSize: '32px', color: '#f4a261' }} />
                <span style={{ fontSize: '24px', fontWeight: '800', color: '#2d6a4f', marginLeft: '8px' }}>{Number(farmerProfile?.rating ?? 0).toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper components and styles
const StatCard = ({ value, label }) => (
  <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', textAlign: 'center' }}>
    <div style={{ fontSize: '28px', fontWeight: '800', color: '#2d6a4f' }}>{value}</div>
    <div style={{ fontSize: '13px', color: '#636e72', marginTop: '4px' }}>{label}</div>
  </div>
);

const InfoItem = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
    <div style={{ fontSize: '20px', color: '#2d6a4f', minWidth: '24px' }}>{icon}</div>
    <div>
      <div style={{ fontSize: '12px', color: '#636e72' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: '600', color: value === 'Not provided' ? '#adb5bd' : '#2d3436' }}>{value}</div>
    </div>
  </div>
);

const KycItem = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '12px', background: '#f8f9fa', marginBottom: '8px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <HiOutlineDocumentText style={{ fontSize: '20px', color: '#2d6a4f' }} />
      <span style={{ fontSize: '14px', fontWeight: '600', color: '#2d3436' }}>{label}</span>
    </div>
    <span style={{ fontSize: '12px', fontWeight: '700', color: '#856404', background: '#fff3cd', padding: '4px 10px', borderRadius: '20px' }}>Not Uploaded</span>
  </div>
);

const editBtnStyle = {
  background: 'transparent',
  border: '2px solid #2d6a4f',
  color: '#2d6a4f',
  padding: '6px 12px',
  borderRadius: '20px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '600',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
};

const saveBtnStyle = {
  background: '#2d6a4f',
  color: 'white',
  border: 'none',
  padding: '6px 12px',
  borderRadius: '20px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '600',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
};

const cancelBtnStyle = {
  background: 'transparent',
  border: '2px solid #e76f51',
  color: '#e76f51',
  padding: '6px 12px',
  borderRadius: '20px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '600',
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '50px',
  border: '2px solid #e9ecef',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
};
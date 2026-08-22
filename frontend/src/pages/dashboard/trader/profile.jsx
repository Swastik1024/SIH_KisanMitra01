import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../../../components/common/Header';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';

export default function TraderProfile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/api/auth/me');
        setUserData(res.data);
      } catch (error) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '50px',
    border: '2px solid #e9ecef',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    background: '#f8f9fa',
    color: '#2d3436',
  };

  return (
    <div>
      <Header />
      <div style={{
        minHeight: '100vh',
        background: '#f8f9fa',
        padding: '120px 20px 40px',
        fontFamily: "'Segoe UI', system-ui, sans-serif"
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {/* Back Button */}
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '18px' }}>
            <button
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: 'white',
                border: '1px solid #e9ecef',
                borderRadius: '50px',
                color: '#2d6a4f',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)'}
              onMouseLeave={(e) => e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
            >
              ← Back to Home
            </button>
          </Link>

          <div style={{
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            padding: '40px 32px',
            textAlign: 'center'
          }}>
            {/* Avatar */}
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '42px',
              margin: '0 auto 20px',
              boxShadow: '0 8px 20px rgba(45,106,79,0.3)'
            }}>
              👤
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1b4332', margin: 0 }}>
              {loading ? 'Loading...' : userData?.name}
            </h1>
            <p style={{ color: '#636e72', fontSize: '14px', marginTop: '4px', textTransform: 'capitalize' }}>
              {loading ? '' : userData?.role}
            </p>

            {!loading && userData && (
              <div style={{ textAlign: 'left', marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#636e72', display: 'block', marginBottom: '6px' }}>Email</label>
                  <input type="email" value={userData.email} readOnly style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#636e72', display: 'block', marginBottom: '6px' }}>Phone</label>
                  <input type="tel" value={userData.phone} readOnly style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#636e72', display: 'block', marginBottom: '6px' }}>Location</label>
                  <input type="text" value={userData.location || 'Not provided'} readOnly style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#636e72', display: 'block', marginBottom: '6px' }}>Language</label>
                  <input type="text" value={userData.language} readOnly style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#636e72', display: 'block', marginBottom: '6px' }}>Account Created</label>
                  <input type="text" value={new Date(userData.created_at).toLocaleDateString('en-IN')} readOnly style={inputStyle} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
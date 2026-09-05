import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import { useLanguage } from '../context/LanguageContext';

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', form);
      const { access_token, role, user_id, name, pincode } = res.data;
      localStorage.setItem('token', access_token);
      // Store pincode for distance calculations in ProductCard
      if (pincode) localStorage.setItem('user_pincode', pincode);
      setAuth({ id: user_id, name, role, email: form.email, pincode: pincode || null }, access_token);
      toast.success(t('common.loginSuccess') || 'Login successful!');

      // Role-based redirect
      const dashboardMap = {
        farmer: '/dashboard/farmer',
        trader: '/dashboard/trader',
        admin: '/dashboard/admin',
      };

      if (role === 'agent') {
        useAuthStore.getState().logout();
        toast.error('Agent role is no longer supported on this platform.');
        return;
      }

      const target = dashboardMap[role] || '/';
      router.push(target);
    } catch (error) {
      toast.error(error.response?.data?.detail || t('common.loginFailed') || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: 'url(/wheat-bg.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      padding: '20px',
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '420px',
        padding: '40px 32px',
        textAlign: 'center'
      }}>
        {/* Logo */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>🌾</div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '800',
            color: '#1b4332',
            margin: 0
          }}>
            Kheti<span style={{ color: '#f4a261' }}>Kart</span>
          </h1>

          <p style={{
            color: '#636e72',
            fontSize: '14px',
            marginTop: '6px',
            letterSpacing: '0.5px'
          }}>
            {t('auth.loginTitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#2d3436',
              marginBottom: '8px'
            }}>
              {t('auth.email')}
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder=""
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '50px',
                border: '2px solid #e9ecef',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2d6a4f'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#2d3436',
              marginBottom: '8px'
            }}>
              {t('auth.password')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder=""
                maxLength={12}
                style={{
                  width: '100%',
                  padding: '12px 48px 12px 16px',
                  borderRadius: '50px',
                  border: '2px solid #e9ecef',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2d6a4f'}
                onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '20px',
                  color: '#636e72',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <HiEyeOff /> : <HiEye />}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div style={{ textAlign: 'right', marginBottom: '20px' }}>
            <Link href="/forgot-password" style={{
              color: '#2d6a4f',
              fontSize: '13px',
              fontWeight: '600',
              textDecoration: 'none',
            }}>
              {t('auth.forgotPassword') || 'Forgot Password?'}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              boxShadow: '0 8px 20px rgba(45,106,79,0.3)',
              opacity: loading ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 12px 24px rgba(45,106,79,0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 20px rgba(45,106,79,0.3)';
            }}
          >
            {loading ? t('common.loading') || 'Logging in...' : t('common.login')}
          </button>
        </form>

        <p style={{
          marginTop: '20px',
          fontSize: '14px',
          color: '#636e72'
        }}>
          {t('auth.dontHaveAccount')}{' '}
          <Link href="/register" style={{
            color: '#2d6a4f',
            fontWeight: '700',
            textDecoration: 'none'
          }}>
            {t('auth.registerHere')}
          </Link>
        </p>
      </div>
    </div>
  );
}
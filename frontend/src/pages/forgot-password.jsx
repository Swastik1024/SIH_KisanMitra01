import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import { useLanguage } from '../context/LanguageContext';

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const validatePassword = (password) => {
    const minLength = 6;
    const maxLength = 12;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&#]/.test(password);

    if (password.length < minLength) return t('auth.passMinLength', { min: minLength });
    if (password.length > maxLength) return t('auth.passMaxLength', { max: maxLength });
    if (!hasUpperCase) return t('auth.passUpper');
    if (!hasLowerCase) return t('auth.passLower');
    if (!hasNumber) return t('auth.passNumber');
    if (!hasSpecial) return t('auth.passSpecial');
    return null;
  };

  const handleSendOtp = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email });
      setOtpSent(true);
      setStep(2);
      toast.success('OTP sent to email');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', {
        email,
        otp,
        new_password: newPassword,
      });
      toast.success('Password reset successfully');
      router.push('/login');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '50px',
    border: '2px solid #e9ecef',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box'
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
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔑</div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1b4332', margin: 0 }}>
            {t('auth.forgotPasswordTitle') || 'Forgot Password'}
          </h1>
          <p style={{ color: '#636e72', fontSize: '14px', marginTop: '6px' }}>
            {step === 1 ? 'Enter your registered email' : 'Enter OTP and new password'}
          </p>
        </div>

        {step === 1 && (
          <div style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2d3436', marginBottom: '8px' }}>
                {t('auth.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#2d6a4f'}
                onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
              />
            </div>
            <button
              type="button"
              onClick={handleSendOtp}
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
                boxShadow: '0 8px 20px rgba(45,106,79,0.3)',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2d3436', marginBottom: '8px' }}>
                {t('auth.otp') || 'OTP Code'}
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#2d6a4f'}
                onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2d3436', marginBottom: '8px' }}>
                {t('auth.newPassword') || 'New Password'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  maxLength={12}
                  style={{ ...inputStyle, paddingRight: '48px' }}
                  onFocus={(e) => e.target.style.borderColor = '#2d6a4f'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#636e72',
                  display: 'flex', alignItems: 'center'
                }}>
                  {showPassword ? <HiEyeOff /> : <HiEye />}
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#636e72', marginTop: '6px' }}>
                {t('auth.passwordHint') || 'Password must be 6-12 characters with uppercase, lowercase, number, special char.'}
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2d3436', marginBottom: '8px' }}>
                {t('auth.confirmPassword')}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  maxLength={12}
                  style={{ ...inputStyle, paddingRight: '48px' }}
                  onFocus={(e) => e.target.style.borderColor = '#2d6a4f'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{
                  position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#636e72',
                  display: 'flex', alignItems: 'center'
                }}>
                  {showConfirmPassword ? <HiEyeOff /> : <HiEye />}
                </button>
              </div>
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
                boxShadow: '0 8px 20px rgba(45,106,79,0.3)',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <p style={{ marginTop: '20px', fontSize: '14px', color: '#636e72' }}>
          <Link href="/login" style={{ color: '#2d6a4f', fontWeight: '700', textDecoration: 'none' }}>
            ← {t('auth.backToLogin') || 'Back to Login'}
          </Link>
        </p>
      </div>
    </div>
  );
}
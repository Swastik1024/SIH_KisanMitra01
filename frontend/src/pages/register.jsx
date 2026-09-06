import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import { useLanguage } from '../context/LanguageContext';

import { sendOtpEmail } from '../services/emailService';

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('farmer');
  const [otpEmailSent, setOtpEmailSent] = useState(false);
  const [otpPhoneSent, setOtpPhoneSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [documentsUploading, setDocumentsUploading] = useState({
    aadhar: false,
    pan: false,
    farmer_card: false,
    trading_licence: false,
  });
  const [documentPreview, setDocumentPreview] = useState({
    aadhar: '',
    pan: '',
    farmer_card: '',
    trading_licence: '',
  });
  const [reviewingDoc, setReviewingDoc] = useState(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    otp_email: '',
    otp_phone: '',
    licence_number: '',
    licence_expiry: '',
    location: '',
    pincode: '',
    language: 'en',
    aadhar_document: '',
    pan_document: '',
    farmer_card_document: '',
    trading_licence_document: '',
  });

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

  const handleSendOtp = async (type) => {
    try {
      const contact = type === 'email' ? form.email : form.phone;
      if (!contact) {
        toast.error(t('auth.enterContact', { type }));
        return;
      }
      const res = await api.post('/api/auth/otp/send', { contact });
      const otpCode = res.data?.otp;
      if (type === 'email') {
        setOtpEmailSent(true);
        if (otpCode) {
          sendOtpEmail(contact, otpCode).catch((err) => console.log('EmailJS delivery status:', err));
          toast.success(`OTP Sent! Your verification code is: ${otpCode}`, {
            duration: 9000,
            icon: '📩',
          });
        } else {
          toast.success(t('auth.otpSent', { contact }));
        }
      } else {
        setOtpPhoneSent(true);
        if (otpCode) {
          toast.success(`SMS OTP Sent! Your code is: ${otpCode}`, {
            duration: 9000,
            icon: '📱',
          });
        } else {
          toast.success(t('auth.otpSent', { contact }));
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || t('auth.otpSendFailed'));
    }
  };

  const handleNextFromStep1 = async () => {
    if (!form.name || !form.email) {
      toast.error(t('auth.fillNameEmail'));
      return;
    }
    if (!form.otp_email) {
      toast.error(t('auth.enterEmailOtp'));
      return;
    }
    try {
      await api.post('/api/auth/otp/verify', { contact: form.email, otp: form.otp_email });
      toast.success(t('auth.emailVerified'));
      setStep(2);
    } catch (error) {
      toast.error(t('auth.invalidEmailOtp'));
    }
  };

  const handleNextFromStep2 = () => {
    if (!form.phone) {
      toast.error(t('auth.enterPhone'));
      return;
    }
    if (!form.location) {
      toast.error(t('auth.enterLocation'));
      return;
    }
    if (!form.pincode || form.pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }
    if (role === 'trader' && !form.licence_number) {
      toast.error(t('auth.enterLicence'));
      return;
    }

    // Document upload validation
    if (!form.aadhar_document) {
      toast.error('Please upload your Aadhaar Card');
      return;
    }
    if (!form.pan_document) {
      toast.error('Please upload your PAN Card');
      return;
    }
    if (role === 'farmer' && !form.farmer_card_document) {
      toast.error('Please upload your Farmer Card');
      return;
    }
    if (role === 'trader' && !form.trading_licence_document) {
      toast.error('Please upload your Trading Licence document');
      return;
    }

    setStep(3);
  };

  const handleDocumentUpload = async (field, file) => {
    if (!file) return;
    setDocumentsUploading((prev) => ({ ...prev, [field]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/uploads/', formData);
      const url = res.data.url;
      setForm((prev) => ({ ...prev, [field]: url }));
      setDocumentPreview((prev) => ({ ...prev, [field]: URL.createObjectURL(file) }));
      toast.success('Document uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setDocumentsUploading((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const passwordError = validatePassword(form.password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error(t('auth.passwordMismatch'));
      return;
    }

    try {
      const payload = { ...form };
      delete payload.confirmPassword;

      // Step 1: Register user
      if (role === 'farmer') {
        await api.post('/api/auth/register/farmer', payload);
      } else {
        await api.post('/api/auth/register/trader', payload);
      }

      toast.success('Registration successful! Verifying your documents with AI...');

      // Step 2: Auto-login to get token for doc verification
      const loginRes = await api.post('/api/auth/login', {
        email: form.email,
        password: form.password,
      });
      const { access_token } = loginRes.data;
      localStorage.setItem('token', access_token);

      // Step 3: Call AI doc verification
      const verifyPayload = { role };
      if (role === 'farmer') {
        verifyPayload.aadhar_url = form.aadhar_document;
        verifyPayload.pan_url = form.pan_document;
        verifyPayload.farmer_card_url = form.farmer_card_document;
      } else {
        verifyPayload.aadhar_url = form.aadhar_document;
        verifyPayload.pan_url = form.pan_document;
        verifyPayload.trading_licence_url = form.trading_licence_document;
      }

      const verifyRes = await api.post('/api/doc-verify/verify', verifyPayload, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (verifyRes.data.all_verified) {
        toast.success('✅ All documents verified by AI! Profile is now verified.');
      } else {
        toast.error('⚠️ Some documents could not be verified. Admin will review.');
      }

      // Clear token and redirect to login
      localStorage.removeItem('token');
      router.push('/login');
    } catch (error) {
      toast.error(error.response?.data?.detail || t('auth.registrationFailed'));
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

  const otpButtonStyle = {
    padding: '8px 16px',
    borderRadius: '50px',
    border: '2px solid #2d6a4f',
    background: 'transparent',
    color: '#2d6a4f',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    whiteSpace: 'nowrap'
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
        maxWidth: '520px',
        padding: '40px 32px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>🌾</div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1b4332', margin: 0 }}>
            {t('auth.registerTitle')}
          </h1>
          <p style={{ color: '#636e72', fontSize: '14px', marginTop: '6px' }}>
            {t('auth.step', { step })}
          </p>
        </div>

        {/* Progress Indicator */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
          <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: step >= 1 ? '#2d6a4f' : '#e9ecef' }}></div>
          <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: step >= 2 ? '#2d6a4f' : '#e9ecef' }}></div>
          <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: step >= 3 ? '#2d6a4f' : '#e9ecef' }}></div>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2d3436', marginBottom: '8px' }}>{t('auth.role')}</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setRole('farmer')} style={{
                  padding: '10px 20px', borderRadius: '50px',
                  border: role === 'farmer' ? '2px solid #2d6a4f' : '2px solid #e9ecef',
                  background: role === 'farmer' ? '#2d6a4f' : 'white',
                  color: role === 'farmer' ? 'white' : '#2d3436',
                  fontWeight: '600', cursor: 'pointer', fontSize: '14px'
                }}>
                  🌱 {t('auth.farmer')}
                </button>
                <button type="button" onClick={() => setRole('trader')} style={{
                  padding: '10px 20px', borderRadius: '50px',
                  border: role === 'trader' ? '2px solid #2d6a4f' : '2px solid #e9ecef',
                  background: role === 'trader' ? '#2d6a4f' : 'white',
                  color: role === 'trader' ? 'white' : '#2d3436',
                  fontWeight: '600', cursor: 'pointer', fontSize: '14px'
                }}>
                  🛒 {t('auth.trader')}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2d3436', marginBottom: '8px' }}>{t('auth.fullName')}</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t('auth.fullNamePlaceholder')} style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#2d6a4f'}
                onBlur={(e) => e.target.style.borderColor = '#e9ecef'} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2d3436', marginBottom: '8px' }}>{t('auth.email')}</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder={t('auth.emailPlaceholder')} style={{ ...inputStyle, flex: 1 }}
                  onFocus={(e) => e.target.style.borderColor = '#2d6a4f'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'} />
                <button type="button" onClick={() => handleSendOtp('email')} style={otpButtonStyle} disabled={otpEmailSent}>
                  {otpEmailSent ? '✓' : t('auth.sendOtp')}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2d3436', marginBottom: '8px' }}>{t('auth.enterEmailOtp')}</label>
              <input type="text" value={form.otp_email} onChange={(e) => setForm({ ...form, otp_email: e.target.value })}
                placeholder={t('auth.otpPlaceholder')} style={inputStyle} maxLength={6} />
            </div>

            <button type="button" onClick={handleNextFromStep1} style={{
              width: '100%', padding: '14px',
              background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
              color: 'white', border: 'none', borderRadius: '50px',
              fontSize: '16px', fontWeight: '700', cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(45,106,79,0.3)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}>
              {t('auth.next')} →
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2d3436', marginBottom: '8px' }}>{t('auth.phone')}</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210" style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#2d6a4f'}
                onBlur={(e) => e.target.style.borderColor = '#e9ecef'} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2d3436', marginBottom: '8px' }}>{t('auth.location')}</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder={t('auth.locationPlaceholder')} style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#2d6a4f'}
                onBlur={(e) => e.target.style.borderColor = '#e9ecef'} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2d3436', marginBottom: '8px' }}>📍 Pincode <span style={{ color: '#dc2626' }}>*</span></label>
              <input
                type="text"
                value={form.pincode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setForm({ ...form, pincode: val });
                  if (val.length === 6) localStorage.setItem('user_pincode', val);
                }}
                placeholder="e.g. 411001"
                maxLength={6}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#2d6a4f'}
                onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
              />
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', marginBottom: 0 }}>Used to show distance from farm to your location on product cards</p>
            </div>

            {role === 'trader' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2d3436', marginBottom: '8px' }}>{t('auth.licenceNumber')}</label>
                  <input type="text" value={form.licence_number} onChange={(e) => setForm({ ...form, licence_number: e.target.value })}
                    placeholder={t('auth.licencePlaceholder')} style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = '#2d6a4f'}
                    onBlur={(e) => e.target.style.borderColor = '#e9ecef'} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2d3436', marginBottom: '8px' }}>{t('auth.licenceExpiry')}</label>
                  <input type="date" value={form.licence_expiry} onChange={(e) => setForm({ ...form, licence_expiry: e.target.value })} style={inputStyle} />
                </div>
              </>
            )}

            {/* Document Upload Section */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#2d3436', marginBottom: '12px' }}>{t('auth.documents') || 'Document Verification (Dummy)'}</p>

              {role === 'farmer' ? (
                <>
                  <DocumentUploadField
                    label="Aadhaar Card"
                    field="aadhar_document"
                    form={form}
                    uploading={documentsUploading.aadhar}
                    preview={documentPreview.aadhar}
                    handleDocumentUpload={handleDocumentUpload}
                    onReview={(title, url) => setReviewingDoc({ title, url })}
                  />
                  <DocumentUploadField
                    label="PAN Card"
                    field="pan_document"
                    form={form}
                    uploading={documentsUploading.pan}
                    preview={documentPreview.pan}
                    handleDocumentUpload={handleDocumentUpload}
                    onReview={(title, url) => setReviewingDoc({ title, url })}
                  />
                  <DocumentUploadField
                    label="Farmer Card"
                    field="farmer_card_document"
                    form={form}
                    uploading={documentsUploading.farmer_card}
                    preview={documentPreview.farmer_card}
                    handleDocumentUpload={handleDocumentUpload}
                    onReview={(title, url) => setReviewingDoc({ title, url })}
                  />
                </>
              ) : (
                <>
                  <DocumentUploadField
                    label="Aadhaar Card"
                    field="aadhar_document"
                    form={form}
                    uploading={documentsUploading.aadhar}
                    preview={documentPreview.aadhar}
                    handleDocumentUpload={handleDocumentUpload}
                    onReview={(title, url) => setReviewingDoc({ title, url })}
                  />
                  <DocumentUploadField
                    label="PAN Card"
                    field="pan_document"
                    form={form}
                    uploading={documentsUploading.pan}
                    preview={documentPreview.pan}
                    handleDocumentUpload={handleDocumentUpload}
                    onReview={(title, url) => setReviewingDoc({ title, url })}
                  />
                  <DocumentUploadField
                    label="Trading Licence"
                    field="trading_licence_document"
                    form={form}
                    uploading={documentsUploading.trading_licence}
                    preview={documentPreview.trading_licence}
                    handleDocumentUpload={handleDocumentUpload}
                    onReview={(title, url) => setReviewingDoc({ title, url })}
                  />
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => setStep(1)} style={{
                flex: 1, padding: '14px', background: 'transparent', color: '#2d6a4f',
                border: '2px solid #2d6a4f', borderRadius: '50px', fontSize: '16px', fontWeight: '700', cursor: 'pointer'
              }}>
                ← {t('auth.back')}
              </button>
              <button type="button" onClick={handleNextFromStep2} style={{
                flex: 2, padding: '14px', background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
                color: 'white', border: 'none', borderRadius: '50px', fontSize: '16px', fontWeight: '700', cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(45,106,79,0.3)'
              }}>
                {t('auth.next')} →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2d3436', marginBottom: '8px' }}>{t('auth.password')}</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••" maxLength={12} style={{ ...inputStyle, paddingRight: '48px' }}
                  onFocus={(e) => e.target.style.borderColor = '#2d6a4f'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#636e72',
                  display: 'flex', alignItems: 'center'
                }}>
                  {showPassword ? <HiEyeOff /> : <HiEye />}
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#636e72', marginTop: '6px' }}>{t('auth.passwordHint')}</p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2d3436', marginBottom: '8px' }}>{t('auth.confirmPassword')}</label>
              <div style={{ position: 'relative' }}>
                <input type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="••••••••" maxLength={12} style={{ ...inputStyle, paddingRight: '48px' }}
                  onFocus={(e) => e.target.style.borderColor = '#2d6a4f'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{
                  position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#636e72',
                  display: 'flex', alignItems: 'center'
                }}>
                  {showConfirmPassword ? <HiEyeOff /> : <HiEye />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => setStep(2)} style={{
                flex: 1, padding: '14px', background: 'transparent', color: '#2d6a4f',
                border: '2px solid #2d6a4f', borderRadius: '50px', fontSize: '16px', fontWeight: '700', cursor: 'pointer'
              }}>
                ← {t('auth.back')}
              </button>
              <button type="submit" style={{
                flex: 2, padding: '14px', background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
                color: 'white', border: 'none', borderRadius: '50px', fontSize: '16px', fontWeight: '700', cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(45,106,79,0.3)'
              }}>
                {t('auth.register') || t('common.register') || 'Register'}
              </button>
            </div>
          </form>
        )}

        <p style={{ marginTop: '20px', fontSize: '14px', color: '#636e72' }}>
          {t('auth.alreadyHaveAccount')}{' '}
          <Link href="/login" style={{ color: '#2d6a4f', fontWeight: '700', textDecoration: 'none' }}>
            {t('auth.loginHere')}
          </Link>
        </p>
      </div>

      {/* Document Review Modal */}
      {reviewingDoc && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          backdropFilter: 'blur(4px)'
        }} onClick={() => setReviewingDoc(null)}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '520px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1b4332', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📄 Review {reviewingDoc.title}
              </h3>
              <button type="button" onClick={() => setReviewingDoc(null)} style={{
                background: '#f1f3f5',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                color: '#495057',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8f9fa', borderRadius: '12px', padding: '16px', minHeight: '200px' }}>
              {reviewingDoc.url ? (
                <img
                  src={reviewingDoc.url}
                  alt={reviewingDoc.title}
                  style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: '8px' }}
                />
              ) : (
                <p style={{ color: '#6c757d', fontSize: '14px' }}>No document image available to preview.</p>
              )}
            </div>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setReviewingDoc(null)} style={{
                padding: '10px 24px',
                borderRadius: '50px',
                background: '#2d6a4f',
                color: 'white',
                border: 'none',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer'
              }}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Document upload field component
function DocumentUploadField({ label, field, form, uploading, preview, handleDocumentUpload, onReview }) {
  const isUploaded = Boolean(preview || form[field]);
  const docUrl = preview || (form[field] ? (form[field].startsWith('http') ? form[field] : `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}${form[field]}`) : '');

  return (
    <div style={{
      marginBottom: '14px',
      padding: '12px 14px',
      borderRadius: '12px',
      border: isUploaded ? '1.5px solid #2d6a4f' : '1px solid #e9ecef',
      background: isUploaded ? '#f4fbf7' : '#f8f9fa',
      transition: 'all 0.2s ease'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#2d3436' }}>{label}</span>
        {isUploaded && (
          <span style={{
            fontSize: '12px',
            fontWeight: '700',
            color: '#2d6a4f',
            background: '#d8f3dc',
            padding: '3px 10px',
            borderRadius: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            ✓ Uploaded
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) handleDocumentUpload(field, file);
          }}
          style={{ display: 'none' }}
          id={`file-${field}`}
        />

        <label htmlFor={`file-${field}`} style={{
          padding: '8px 16px',
          borderRadius: '50px',
          border: isUploaded ? '1px solid #95d5b2' : '2px solid #2d6a4f',
          background: isUploaded ? 'white' : 'transparent',
          color: '#2d6a4f',
          fontWeight: '600',
          cursor: 'pointer',
          fontSize: '13px',
          whiteSpace: 'nowrap',
          opacity: uploading ? 0.6 : 1,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          {uploading ? 'Uploading...' : isUploaded ? '🔄 Change File' : '📤 Upload'}
        </label>

        {isUploaded && (
          <>
            <button
              type="button"
              onClick={() => onReview && onReview(label, docUrl)}
              style={{
                padding: '8px 16px',
                borderRadius: '50px',
                border: '1px solid #2d6a4f',
                background: '#2d6a4f',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '13px',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(45,106,79,0.2)'
              }}
            >
              👁️ Review
            </button>

            {docUrl && (
              <img
                src={docUrl}
                alt={label}
                onClick={() => onReview && onReview(label, docUrl)}
                title="Click to review document"
                style={{
                  width: '38px',
                  height: '38px',
                  objectFit: 'cover',
                  borderRadius: '6px',
                  border: '1px solid #b7e4c7',
                  cursor: 'pointer',
                  marginLeft: 'auto'
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
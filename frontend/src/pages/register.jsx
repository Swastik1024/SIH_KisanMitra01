import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import { useLanguage } from '../context/LanguageContext';

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
      await api.post('/api/auth/otp/send', { contact });
      if (type === 'email') setOtpEmailSent(true);
      else setOtpPhoneSent(true);
      toast.success(t('auth.otpSent', { contact }));
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

  const handleNextFromStep2 = async () => {
    if (!form.phone) {
      toast.error(t('auth.enterPhone'));
      return;
    }
    if (!form.otp_phone) {
      toast.error(t('auth.enterPhoneOtp'));
      return;
    }
    if (!form.location) {
      toast.error(t('auth.enterLocation'));
      return;
    }
    if (role === 'trader' && !form.licence_number) {
      toast.error(t('auth.enterLicence'));
      return;
    }
    try {
      await api.post('/api/auth/otp/verify', { contact: form.phone, otp: form.otp_phone });
      toast.success(t('auth.phoneVerified'));
      setStep(3);
    } catch (error) {
      toast.error(t('auth.invalidPhoneOtp'));
    }
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

      if (role === 'farmer') {
        await api.post('/api/auth/register/farmer', payload);
      } else {
        await api.post('/api/auth/register/trader', payload);
      }
      toast.success(t('auth.registrationSuccess'));
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
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210" style={{ ...inputStyle, flex: 1 }}
                  onFocus={(e) => e.target.style.borderColor = '#2d6a4f'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'} />
                <button type="button" onClick={() => handleSendOtp('phone')} style={otpButtonStyle} disabled={otpPhoneSent}>
                  {otpPhoneSent ? '✓' : t('auth.sendOtp')}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2d3436', marginBottom: '8px' }}>{t('auth.enterPhoneOtp')}</label>
              <input type="text" value={form.otp_phone} onChange={(e) => setForm({ ...form, otp_phone: e.target.value })}
                placeholder={t('auth.otpPlaceholder')} style={inputStyle} maxLength={6} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2d3436', marginBottom: '8px' }}>{t('auth.location')}</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder={t('auth.locationPlaceholder')} style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#2d6a4f'}
                onBlur={(e) => e.target.style.borderColor = '#e9ecef'} />
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
                    setForm={setForm}
                    uploading={documentsUploading.aadhar}
                    setUploading={(val) => setDocumentsUploading(prev => ({...prev, aadhar: val}))}
                    preview={documentPreview.aadhar}
                    setPreview={(val) => setDocumentPreview(prev => ({...prev, aadhar: val}))}
                    handleDocumentUpload={handleDocumentUpload}
                  />
                  <DocumentUploadField
                    label="PAN Card"
                    field="pan_document"
                    form={form}
                    setForm={setForm}
                    uploading={documentsUploading.pan}
                    setUploading={(val) => setDocumentsUploading(prev => ({...prev, pan: val}))}
                    preview={documentPreview.pan}
                    setPreview={(val) => setDocumentPreview(prev => ({...prev, pan: val}))}
                    handleDocumentUpload={handleDocumentUpload}
                  />
                  <DocumentUploadField
                    label="Farmer Card"
                    field="farmer_card_document"
                    form={form}
                    setForm={setForm}
                    uploading={documentsUploading.farmer_card}
                    setUploading={(val) => setDocumentsUploading(prev => ({...prev, farmer_card: val}))}
                    preview={documentPreview.farmer_card}
                    setPreview={(val) => setDocumentPreview(prev => ({...prev, farmer_card: val}))}
                    handleDocumentUpload={handleDocumentUpload}
                  />
                </>
              ) : (
                <>
                  <DocumentUploadField
                    label="Aadhaar Card"
                    field="aadhar_document"
                    form={form}
                    setForm={setForm}
                    uploading={documentsUploading.aadhar}
                    setUploading={(val) => setDocumentsUploading(prev => ({...prev, aadhar: val}))}
                    preview={documentPreview.aadhar}
                    setPreview={(val) => setDocumentPreview(prev => ({...prev, aadhar: val}))}
                    handleDocumentUpload={handleDocumentUpload}
                  />
                  <DocumentUploadField
                    label="PAN Card"
                    field="pan_document"
                    form={form}
                    setForm={setForm}
                    uploading={documentsUploading.pan}
                    setUploading={(val) => setDocumentsUploading(prev => ({...prev, pan: val}))}
                    preview={documentPreview.pan}
                    setPreview={(val) => setDocumentPreview(prev => ({...prev, pan: val}))}
                    handleDocumentUpload={handleDocumentUpload}
                  />
                  <DocumentUploadField
                    label="Trading Licence"
                    field="trading_licence_document"
                    form={form}
                    setForm={setForm}
                    uploading={documentsUploading.trading_licence}
                    setUploading={(val) => setDocumentsUploading(prev => ({...prev, trading_licence: val}))}
                    preview={documentPreview.trading_licence}
                    setPreview={(val) => setDocumentPreview(prev => ({...prev, trading_licence: val}))}
                    handleDocumentUpload={handleDocumentUpload}
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
                {t('auth.register')}
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
    </div>
  );
}

// Document upload field component
function DocumentUploadField({ label, field, form, setForm, uploading, setUploading, preview, setPreview, handleDocumentUpload }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={{ fontSize: '13px', fontWeight: '600', color: '#2d3436', display: 'block', marginBottom: '5px' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
          border: '2px solid #2d6a4f',
          background: 'transparent',
          color: '#2d6a4f',
          fontWeight: '600',
          cursor: 'pointer',
          fontSize: '13px',
          whiteSpace: 'nowrap',
          opacity: uploading ? 0.6 : 1
        }}>
          {uploading ? 'Uploading...' : preview ? 'Change' : 'Upload'}
        </label>
        {preview && (
          <img src={preview} alt={label} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }} />
        )}
      </div>
    </div>
  );
}
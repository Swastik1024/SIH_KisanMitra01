import emailjs from '@emailjs/browser';

const DEFAULT_SERVICE_ID = 'service_yexryqr';
const DEFAULT_TEMPLATE_ID = 'template_xpk351m';
const DEFAULT_PUBLIC_KEY = 'cineb23-WtAow47rU';

export const sendOtpEmail = async (userEmail, otpCode) => {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || process.env.NEXT_PUBLIC_EMAILJS_SERVICE || DEFAULT_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE || DEFAULT_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || process.env.NEXT_PUBLIC_EMAILJS_API_KEY || process.env.NEXT_PUBLIC_EMAILJS_KEY || process.env.NEXT_PUBLIC_EMAILJS_USER_ID || DEFAULT_PUBLIC_KEY;

  const templateParams = {
    to_email: userEmail,
    user_email: userEmail,
    email: userEmail,
    otp_code: otpCode,
    otp: otpCode,
    passcode: otpCode,
    message: `Your KisanMitra OTP verification code is: ${otpCode}. Valid for 5 minutes.`,
  };

  try {
    const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    console.log('✅ EmailJS OTP Sent Successfully:', response.status, response.text);
    return { success: true, response };
  } catch (error) {
    console.warn('⚠️ EmailJS SDK error, attempting REST fallback:', error);
    try {
      const payload = {
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: templateParams,
      };
      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        console.log('✅ EmailJS REST API Sent Successfully');
        return { success: true };
      } else {
        const text = await res.text();
        console.error('❌ EmailJS REST API error:', text);
        return { success: false, error: text };
      }
    } catch (fallbackErr) {
      console.error('❌ EmailJS Fallback Error:', fallbackErr);
      return { success: false, error: fallbackErr };
    }
  }
};

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Header from '../components/common/Header';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';

const faqDatabase = [
  {
    keywords: ['register', 'sign up', 'create account', 'account'],
    answer: 'To register, click the profile icon and select Register. Choose Farmer or Trader, fill your details, verify your email & phone with OTP, then create a password.'
  },
  {
    keywords: ['auction', 'bid', 'bidding', 'live auction'],
    answer: 'Farmers list produce, agents inspect and set base price, then traders place bids in live auctions. The highest bid wins. You can see live auctions in the Auctions section.'
  },
  {
    keywords: ['payment', 'pay', 'paid', 'money'],
    answer: 'Payments are held in escrow until delivery is confirmed. You can pay via UPI, card, or net banking. After delivery, the amount is released to the farmer/agent.'
  },
  {
    keywords: ['order', 'track', 'delivery', 'shipment'],
    answer: 'Go to My Orders in the profile menu. Click any order to see live delivery updates from the agent, including current status and location.'
  },
  {
    keywords: ['contact', 'support', 'help', 'human'],
    answer: 'You can submit a support ticket below if the bot cannot solve your issue. Our team will respond within 24 hours.'
  },
  {
    keywords: ['licence', 'trader', 'verify'],
    answer: 'Traders must upload a valid business licence during registration. The admin verifies it before you can start trading.'
  },
  {
    keywords: ['otp', 'verification', 'code'],
    answer: 'OTP is sent to your email/phone when you click "Send OTP". Check the backend terminal in development, or your inbox/SMS in production.'
  },
  {
    keywords: ['refund', 'cancel', 'dispute'],
    answer: 'If there is an issue, contact support with your order ID. Refunds are processed after admin review of the delivery proof and dispute resolution.'
  },
];

function getBotResponse(message) {
  const text = message.toLowerCase();
  for (const item of faqDatabase) {
    if (item.keywords.some(keyword => text.includes(keyword))) {
      return item.answer;
    }
  }
  return null;
}

export default function Help() {
  const { t } = useLanguage();
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: t('help.initialMessage')
    }
  ]);
  const [input, setInput] = useState('');
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticket, setTicket] = useState({ subject: '', description: '' });
  const [loadingTicket, setLoadingTicket] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setTimeout(() => {
      const matched = getBotResponse(userMessage);
      const botReply = matched || t('help.fallbackMessage');
      setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
      const isSupportQuery = !matched || userMessage.toLowerCase().includes('support') || userMessage.toLowerCase().includes('ticket') || userMessage.toLowerCase().includes('help') || botReply.includes('support ticket');
      if (isSupportQuery) {
        setShowTicketForm(true);
      }
    }, 500);
  };

  const handleQuickReply = (text) => {
    setMessages(prev => [...prev, { sender: 'user', text }]);
    setTimeout(() => {
      const matched = getBotResponse(text);
      const botReply = matched || t('help.fallbackMessage');
      setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
      const isSupportQuery = !matched || text.toLowerCase().includes('support') || text.toLowerCase().includes('ticket') || text.toLowerCase().includes('help') || botReply.includes('support ticket');
      if (isSupportQuery) {
        setShowTicketForm(true);
      }
    }, 500);
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error(t('help.loginToSubmitToast'));
      return;
    }
    setLoadingTicket(true);
    try {
      await api.post('/api/support/tickets', ticket);
      toast.success(t('help.ticketSuccess'));
      setTicket({ subject: '', description: '' });
      setShowTicketForm(false);
      setMessages(prev => [...prev, { sender: 'bot', text: t('help.ticketCreatedMessage') }]);
    } catch (error) {
      toast.error(error.response?.data?.detail || t('help.ticketFailed'));
    } finally {
      setLoadingTicket(false);
    }
  };

  const quickTopics = [
    t('help.quickRegister'),
    t('help.quickAuctions'),
    t('help.quickPayments'),
    t('help.quickOrderTracking'),
    t('help.quickContactSupport')
  ];

  return (
    <div>
      <Header />
      <div style={{
        minHeight: '100vh',
        background: '#f0f4f1',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        paddingTop: '100px',
        paddingBottom: '40px',
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 20px' }}>
          {/* Chat Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '600px',
            maxHeight: '80vh',
          }}>
            {/* Chat Header */}
            <div style={{
              background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
              color: 'white',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
              }}>
                🤖
              </div>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>{t('help.assistantName')}</h1>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>{t('help.assistantTagline')}</p>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              background: '#f8f9fa',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              {messages.map((msg, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: msg.sender === 'bot' ? 'flex-start' : 'flex-end',
                }}>
                  <div style={{
                    maxWidth: '80%',
                    padding: '12px 16px',
                    borderRadius: msg.sender === 'bot' ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                    background: msg.sender === 'bot' ? 'white' : '#2d6a4f',
                    color: msg.sender === 'bot' ? '#2d3436' : 'white',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                    fontSize: '14px',
                    lineHeight: '1.5',
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            <div style={{
              padding: '12px 16px',
              background: 'white',
              borderTop: '1px solid #e9ecef',
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
            }}>
              {quickTopics.map((text) => (
                <button
                  key={text}
                  onClick={() => handleQuickReply(text)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '50px',
                    border: '1px solid #2d6a4f',
                    background: 'transparent',
                    color: '#2d6a4f',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    transition: 'background 0.2s, color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#2d6a4f';
                    e.target.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#2d6a4f';
                  }}
                >
                  {text}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div style={{
              padding: '16px',
              background: 'white',
              borderTop: '1px solid #e9ecef',
              display: 'flex',
              gap: '10px',
            }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t('help.typeMessage')}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '50px',
                  border: '2px solid #e9ecef',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#2d6a4f'}
                onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
              />
              <button
                onClick={handleSend}
                style={{
                  padding: '12px 24px',
                  background: '#2d6a4f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {t('help.send')}
              </button>
            </div>
          </div>

          {/* Support Ticket Form */}
          {showTicketForm && (
            <div style={{
              background: 'white',
              borderRadius: '20px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              padding: '24px',
              marginTop: '20px',
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#2d6a4f', marginBottom: '16px' }}>
                {t('help.submitTicket')}
              </h2>
              <form onSubmit={handleTicketSubmit}>
                <input
                  type="text"
                  placeholder={t('help.subject')}
                  value={ticket.subject}
                  onChange={(e) => setTicket({ ...ticket, subject: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '50px',
                    border: '2px solid #e9ecef',
                    fontSize: '14px',
                    outline: 'none',
                    marginBottom: '12px',
                    boxSizing: 'border-box',
                  }}
                  required
                />
                <textarea
                  placeholder={t('help.description')}
                  value={ticket.description}
                  onChange={(e) => setTicket({ ...ticket, description: e.target.value })}
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    border: '2px solid #e9ecef',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    marginBottom: '12px',
                    boxSizing: 'border-box',
                  }}
                  required
                />
                <button
                  type="submit"
                  disabled={loadingTicket}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#2d6a4f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  {loadingTicket ? t('common.loading') : t('help.submitTicketButton')}
                </button>
                {!isAuthenticated && (
                  <p style={{ marginTop: '10px', fontSize: '13px', color: '#636e72', textAlign: 'center' }}>
                    {t('help.loginToSubmit')} <Link href="/login" style={{ color: '#2d6a4f', fontWeight: '700' }}>{t('common.login')}</Link>
                  </p>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ProfileFlyout from '../common/ProfileFlyout';
import { useLanguage } from '../../context/LanguageContext';

const agentNavItems = [
  { href: '/dashboard/agent', label: 'Dashboard' },
  { href: '/dashboard/agent/deliveries', label: 'My Deliveries' },
  { href: '/dashboard/agent/inspections', label: 'My Inspections' },
  { href: '/dashboard/agent/earnings', label: 'My Earnings' },
];

export default function AgentHeader() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const { language, changeLanguage, t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`hero-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-inner">
          {/* LOGO */}
          <Link href="/" className="logo">
            <div className="logo-icon">🌾</div>
            <div>
              <div className="logo-text">
                Kheti<span>Kart</span>
              </div>
              <div className="logo-sub">{t('header.logoSub')}</div>
            </div>
          </Link>

          {/* AGENT NAVIGATION */}
          <nav className="agent-nav" style={agentNavStyles}>
            {agentNavItems.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    ...agentLinkStyle,
                    ...(isActive ? agentLinkActiveStyle : {}),
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* LANGUAGE SWITCHER & PROFILE */}
          <div className="header-actions" style={{ position: 'relative' }}>
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="language-select"
              aria-label="Change language"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="mr">मराठी</option>
              <option value="ta">தமிழ்</option>
              <option value="gu">ગુજરાતી</option>
              <option value="te">తెలుగు</option>
              <option value="kn">ಕನ್ನಡ</option>
              <option value="bn">বাংলা</option>
            </select>

            <button
              type="button"
              className="header-btn"
              onClick={() => setProfileOpen(!profileOpen)}
              aria-label="Open profile"
            >
              👤
            </button>

            <ProfileFlyout open={profileOpen} onClose={() => setProfileOpen(false)} />
          </div>
        </div>
      </header>

      <style jsx>{`
        .agent-nav {
          display: flex;
          align-items: center;
          gap: 6px;
          flex: 1;
          justify-content: center;
          flex-wrap: wrap;
        }
        @media (max-width: 900px) {
          .agent-nav {
            display: none;
          }
        }
      `}</style>
    </>
  );
}

const agentLinkStyle = {
  textDecoration: 'none',
  color: '#65766d',
  padding: '8px 16px',
  borderRadius: '12px',
  fontSize: '13px',
  fontWeight: '650',
  transition: 'all 0.2s ease',
  whiteSpace: 'nowrap',
};

const agentLinkActiveStyle = {
  background: '#eaf8f0',
  color: '#198754',
};

const agentNavStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  flex: 1,
  justifyContent: 'center',
  flexWrap: 'wrap',
};
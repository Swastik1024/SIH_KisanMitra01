import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ProfileFlyout from '../common/ProfileFlyout';
import { useLanguage } from '../../context/LanguageContext';

const adminNavItems = [
  { href: '/dashboard/admin', label: 'Dashboard' },
  { href: '/dashboard/admin/users', label: 'Users' },
  { href: '/dashboard/admin/listings', label: 'Listings' },
  { href: '/dashboard/admin/finance', label: 'Finance' },
  { href: '/dashboard/admin/auctions', label: 'Auctions' },
  { href: '/dashboard/admin/analysis', label: 'Analysis' },
  { href: '/dashboard/admin/add-instrument-product', label: 'Add Instrument' },
  { href: '/dashboard/admin/add-medical-product', label: 'Add Medical' },
  { href: '/dashboard/admin/settings', label: 'Settings' },
];

export default function AdminHeader() {
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

          {/* ADMIN NAVIGATION (no search bar) */}
          <nav className="admin-nav" style={adminNavStyles}>
            {adminNavItems.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    ...adminLinkStyle,
                    ...(isActive ? adminLinkActiveStyle : {}),
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* PROFILE and LANGUAGE SWITCHER */}
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

      {/* Inline styles for admin nav */}
      <style jsx>{`
        .admin-nav {
          display: flex;
          align-items: center;
          gap: 6px;
          flex: 1;
          justify-content: center;
          flex-wrap: wrap;
        }
        @media (max-width: 900px) {
          .admin-nav {
            display: none;
          }
        }
      `}</style>
    </>
  );
}

const adminLinkStyle = {
  textDecoration: 'none',
  color: '#65766d',
  padding: '8px 16px',
  borderRadius: '12px',
  fontSize: '13px',
  fontWeight: '650',
  transition: 'all 0.2s ease',
  whiteSpace: 'nowrap',
};

const adminLinkActiveStyle = {
  background: '#eaf8f0',
  color: '#198754',
};

const adminNavStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  flex: 1,
  justifyContent: 'center',
  flexWrap: 'wrap',
};
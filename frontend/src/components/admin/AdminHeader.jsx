import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ProfileFlyout from '../common/ProfileFlyout';
import { useLanguage } from '../../context/LanguageContext';

const adminNavItems = [
  { href: '/dashboard/admin', label: 'Dashboard', icon: '📊' },
  { href: '/dashboard/admin/users', label: 'Users', icon: '👥' },
  { href: '/dashboard/admin/listings', label: 'Listings', icon: '📦' },
  { href: '/dashboard/admin/finance', label: 'Finance', icon: '💰' },
  { href: '/dashboard/admin/auctions', label: 'Auctions', icon: '🔨' },
  { href: '/dashboard/admin/analysis', label: 'Analysis', icon: '📈' },
  { href: '/dashboard/admin/add-instrument-product', label: 'Add Instrument', icon: '🔧' },
  { href: '/dashboard/admin/add-medical-product', label: 'Add Medical', icon: '💊' },
  { href: '/dashboard/admin/settings', label: 'Settings', icon: '⚙️' },
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

          {/* ADMIN NAVIGATION BUTTON TABS */}
          <nav className="admin-nav">
            {adminNavItems.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
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
              <option value="en">🌐 English</option>
              <option value="hi">🇮🇳 हिन्दी</option>
              <option value="mr">🚩 मराठी</option>
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

      {/* Styled JSX for Admin Nav Pills */}
      <style jsx>{`
        .admin-nav {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          justify-content: center;
          flex-wrap: wrap;
          padding: 4px 0;
        }

        :global(.admin-nav-item) {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          background: #f8fafc;
          color: #334155;
          border: 1.5px solid #cbd5e1;
          padding: 8px 14px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        :global(.admin-nav-item:hover) {
          background: #ecfdf5;
          border-color: #6ee7b7;
          color: #047857;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.18);
        }

        :global(.admin-nav-item.active) {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-color: #059669;
          color: #ffffff !important;
          font-weight: 700;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
        }

        :global(.admin-nav-item .nav-icon) {
          font-size: 14px;
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
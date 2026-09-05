import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProfileFlyout from './ProfileFlyout';
import { useLanguage } from '../../context/LanguageContext';

export default function Header({ searchTerm = '', onSearchChange }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
        <div className="header-inner" style={{ flexWrap: 'wrap', gap: '12px' }}>
          {/* LOGO */}
          <Link href="/" className="logo">
            <div className="logo-icon">🌾</div>
            <div>
              <div className="logo-text">
                Kheti<span>Kart</span>
              </div>
              <div className="logo-sub">{t('header.logoSub') || 'Farmer to Trader'}</div>
            </div>
          </Link>


          {/* QUICK NAV LINKS */}
          <nav className="header-nav" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/weather-alerts" style={{ textDecoration: 'none', color: '#1b4332', fontSize: '13px', fontWeight: '700', padding: '6px 12px', borderRadius: '50px', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ⛅ Weather
            </Link>
            <Link href="/price-intelligence" style={{ textDecoration: 'none', color: '#0d3b66', fontSize: '13px', fontWeight: '700', padding: '6px 12px', borderRadius: '50px', background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: '4px' }}>
              📈 Price Predict
            </Link>
            <Link href="/mandi-network" style={{ textDecoration: 'none', color: '#2b2d42', fontSize: '13px', fontWeight: '700', padding: '6px 12px', borderRadius: '50px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🏛️ Mandi
            </Link>
            <Link href="/apmc-benchmark" style={{ textDecoration: 'none', color: '#4a3b32', fontSize: '13px', fontWeight: '700', padding: '6px 12px', borderRadius: '50px', background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '4px' }}>
              📊 Benchmark
            </Link>
          </nav>

          {/* SEARCH */}
          <div className="search-bar" style={{ minWidth: '220px', flex: '1', maxWidth: '320px' }}>
            <input
              type="text"
              placeholder={t('header.searchPlaceholder') || 'Search vegetables, grains, fruits...'}
              value={searchTerm}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            />
            <svg
              className="search-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="10" cy="10" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>

          {/* PROFILE and LANGUAGE SWITCHER */}
          <div className="header-actions" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Language dropdown */}
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="language-select"
              aria-label="Change language"
              style={{
                padding: '8px 12px',
                borderRadius: '50px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                fontWeight: '600',
                background: '#ffffff',
                cursor: 'pointer'
              }}
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
              style={{
                background: '#2d6a4f',
                color: '#ffffff',
                border: 'none',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(45,106,79,0.3)'
              }}
            >
              👤
            </button>

            <ProfileFlyout open={profileOpen} onClose={() => setProfileOpen(false)} />
          </div>
        </div>
      </header>
    </>
  );
}
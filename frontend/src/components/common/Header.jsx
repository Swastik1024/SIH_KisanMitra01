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
        <div className="header-inner">
          {/* LOGO */}
          <Link href="/" className="logo">
            <div className="logo-icon">🌾</div>
            <div>
              <div className="logo-text">
                Kisan<span>Mitra</span>
              </div>
              <div className="logo-sub">{t('header.logoSub')}</div>
            </div>
          </Link>

          {/* SEARCH */}
          <div className="search-bar">
            <input
              type="text"
              placeholder={t('header.searchPlaceholder')}
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
          <div className="header-actions" style={{ position: 'relative' }}>
            {/* Language dropdown */}
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
              {/* Add more languages as you create translation files */}
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
    </>
  );
}
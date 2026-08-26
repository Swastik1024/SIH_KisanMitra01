import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '../../../components/common/Header';
import ProductCard from '../../../components/common/ProductCard';
import AuctionCard from '../../../components/common/AuctionCard';
import { useLanguage } from '../../../context/LanguageContext';
import useAuthStore from '../../../store/authStore';
import api from '../../../services/api';

// ✅ Farm produce categories only
const PRODUCE_CATEGORIES = [
  'vegetables',
  'fruits',
  'grains',
  'pulses',
  'herbs',
];

export default function TraderHome() {
  const router = useRouter();
  const [category, setCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const { t, tFormat } = useLanguage();
  const { isAuthenticated, user, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
    const timer = setTimeout(() => setAuthReady(true), 100);
    return () => clearTimeout(timer);
  }, [hydrate]);

  useEffect(() => {
    if (!authReady) return;

    if (!isAuthenticated || user?.role !== 'trader') {
      router.replace('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [productsRes, auctionsRes] = await Promise.all([
          api.get('/api/products/'),
          api.get('/api/auctions/live'),
        ]);

        // ✅ Filter only farm produce products
        const farmProducts = (productsRes.data || []).filter((p) =>
          PRODUCE_CATEGORIES.includes(p.category_slug)
        );

        setProducts(farmProducts);
        setAuctions(auctionsRes.data || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authReady, isAuthenticated, user, router]);

  if (!authReady || !isAuthenticated || user?.role !== 'trader') {
    return (
      <div>
        <Header />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f1' }}>
          <p style={{ color: '#2d6a4f', fontWeight: '600' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Filter products further based on selected category and search
  const filteredProducts = products.filter((p) => {
    const matchCategory = category === 'all' || p.category_slug === category;
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category_slug && p.category_slug.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const filteredAuctions = auctions;

  // Deduplicate products so each item appears exactly once
  const seenProductIds = new Set();
  const displayItems = [];

  filteredProducts.forEach((p) => {
    if (!seenProductIds.has(p.id)) {
      seenProductIds.add(p.id);
      displayItems.push(p);
    }
  });

  const categories = [
    { key: 'all', label: `🌿 ${t('home.allProducts')}` },
    { key: 'vegetables', label: `🥬 ${t('home.vegetables')}` },
    { key: 'fruits', label: `🍎 ${t('home.fruits')}` },
    { key: 'grains', label: `🌾 ${t('home.grains')}` },
    { key: 'pulses', label: `🫘 ${t('home.pulses')}` },
    { key: 'herbs', label: `🌿 ${t('home.herbs')}` },
  ];

  return (
    <div className="home-page">
      <Header searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-badge">🌱 {t('home.heroBadge')}</div>
            <h1 className="hero-title">{t('home.heroTitle')}</h1>
            <p className="hero-desc">{t('home.heroDesc')}</p>
            <div className="hero-buttons">
              <a href="#products" className="btn-primary">
                🛒 {t('home.shopNow')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* INTELLIGENCE & MARKETPLACE SUITE */}
      <section style={{ maxWidth: '1200px', margin: '30px auto 10px', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {/* Card 5: Golden Sun Yellow */}
          <Link href="/weather-alerts" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <motion.div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                height: '100%',
                minHeight: '160px',
                width: '100%',
                boxSizing: 'border-box',
                background: 'linear-gradient(135deg, #fef08a 0%, #fde047 100%)',
                border: '1.5px solid #eab308',
                color: '#713f12',
                padding: '22px 20px',
                borderRadius: '18px',
                boxShadow: '0 4px 14px rgba(113, 63, 18, 0.12)',
                cursor: 'pointer'
              }}
              whileHover={{ y: -5, scale: 1.02, boxShadow: '0 10px 22px rgba(113, 63, 18, 0.22)' }}
            >
              <div>
                <div style={{ fontSize: '32px', marginBottom: '8px', background: 'rgba(255, 255, 255, 0.65)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>⛅</div>
                <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '700', lineHeight: 1.2, color: '#713f12' }}>Weather &amp; Farm Alerts</h3>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#854d0e', fontWeight: '600', lineHeight: 1.4 }}>Hyperlocal 5-day crop advisory &amp; rain warnings</p>
            </motion.div>
          </Link>

          {/* Card 6: Emerald Teal */}
          <Link href="/price-intelligence" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <motion.div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                height: '100%',
                minHeight: '160px',
                width: '100%',
                boxSizing: 'border-box',
                background: 'linear-gradient(135deg, #99f6e4 0%, #5eead4 100%)',
                border: '1.5px solid #2dd4bf',
                color: '#134e4a',
                padding: '22px 20px',
                borderRadius: '18px',
                boxShadow: '0 4px 14px rgba(19, 78, 74, 0.12)',
                cursor: 'pointer'
              }}
              whileHover={{ y: -5, scale: 1.02, boxShadow: '0 10px 22px rgba(19, 78, 74, 0.22)' }}
            >
              <div>
                <div style={{ fontSize: '32px', marginBottom: '8px', background: 'rgba(255, 255, 255, 0.65)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>📈</div>
                <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '700', lineHeight: 1.2, color: '#134e4a' }}>Predictive Price Intelligence</h3>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#0f766e', fontWeight: '600', lineHeight: 1.4 }}>AI trajectory model for optimal buy/sell timing</p>
            </motion.div>
          </Link>

          {/* Card 7: Soft Rose Pink */}
          <Link href="/mandi-network" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <motion.div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                height: '100%',
                minHeight: '160px',
                width: '100%',
                boxSizing: 'border-box',
                background: 'linear-gradient(135deg, #fecdd3 0%, #fda4af 100%)',
                border: '1.5px solid #fb7185',
                color: '#881337',
                padding: '22px 20px',
                borderRadius: '18px',
                boxShadow: '0 4px 14px rgba(136, 19, 55, 0.12)',
                cursor: 'pointer'
              }}
              whileHover={{ y: -5, scale: 1.02, boxShadow: '0 10px 22px rgba(136, 19, 55, 0.22)' }}
            >
              <div>
                <div style={{ fontSize: '32px', marginBottom: '8px', background: 'rgba(255, 255, 255, 0.65)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>🏛️</div>
                <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '700', lineHeight: 1.2, color: '#881337' }}>e-NAM Mandi Network</h3>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#9f1239', fontWeight: '600', lineHeight: 1.4 }}>Pan-India APMC live arrival &amp; price data</p>
            </motion.div>
          </Link>

          {/* Card 8: Fresh Lime Green */}
          <Link href="/apmc-benchmark" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <motion.div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                height: '100%',
                minHeight: '160px',
                width: '100%',
                boxSizing: 'border-box',
                background: 'linear-gradient(135deg, #d9f99d 0%, #a3e635 100%)',
                border: '1.5px solid #84cc16',
                color: '#365314',
                padding: '22px 20px',
                borderRadius: '18px',
                boxShadow: '0 4px 14px rgba(54, 83, 20, 0.12)',
                cursor: 'pointer'
              }}
              whileHover={{ y: -5, scale: 1.02, boxShadow: '0 10px 22px rgba(54, 83, 20, 0.22)' }}
            >
              <div>
                <div style={{ fontSize: '32px', marginBottom: '8px', background: 'rgba(255, 255, 255, 0.65)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>📊</div>
                <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '700', lineHeight: 1.2, color: '#365314' }}>Live APMC Benchmark Rates</h3>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#3f6212', fontWeight: '600', lineHeight: 1.4 }}>Daily official modal prices &amp; min-max spread</p>
            </motion.div>
          </Link>
        </div>
      </section>

      <div className="categories-wrapper" id="categories">
        <div className="categories">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              className={`category-chip ${category === cat.key ? 'active' : ''}`}
              onClick={() => setCategory(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <main className="main-content" id="products">
        <div className="section-header">
          <div>
            <div className="section-title">
              <span className="title-icon">🛒</span>
              {t('home.shopFreshProduce')}
            </div>
            <div className="section-subtitle">
              {displayItems.length} items available
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#636e72' }}>Loading...</div>
        ) : displayItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#636e72' }}>No products or auctions available.</div>
        ) : (
          <div className="product-grid">
            {displayItems.map((product) => (
              <ProductCard key={`product-${product.id}`} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
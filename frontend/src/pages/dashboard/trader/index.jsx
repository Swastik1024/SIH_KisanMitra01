import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
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
          <div className="hero-visual">
            <div className="hero-produce">🥕<span className="produce-name">Carrots</span></div>
            <div className="hero-produce">🍅<span className="produce-name">Tomatoes</span></div>
            <div className="hero-produce">🌾<span className="produce-name">Wheat</span></div>
            <div className="hero-produce">🥬<span className="produce-name">Lettuce</span></div>
            <div className="hero-produce">🍚<span className="produce-name">Rice</span></div>
            <div className="hero-produce">🥔<span className="produce-name">Potatoes</span></div>
          </div>
        </div>
      </section>

      {/* INTELLIGENCE & MARKETPLACE SUITE */}
      <section style={{ maxWidth: '1200px', margin: '30px auto 10px', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <Link href="/weather-alerts" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', border: '1px solid #bbf7d0', cursor: 'pointer', transition: 'transform 0.2s' }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>⛅</div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#1b4332' }}>Weather &amp; Farm Alerts</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Hyperlocal 5-day crop advisory &amp; rain warnings</p>
            </div>
          </Link>

          <Link href="/price-intelligence" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', border: '1px solid #bfdbfe', cursor: 'pointer', transition: 'transform 0.2s' }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>📈</div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#0d3b66' }}>Predictive Price Intelligence</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>AI trajectory model for optimal buy/sell timing</p>
            </div>
          </Link>

          <Link href="/mandi-network" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'transform 0.2s' }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>🏛️</div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#2b2d42' }}>e-NAM Mandi Network</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Pan-India APMC live arrival &amp; price data</p>
            </div>
          </Link>

          <Link href="/apmc-benchmark" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', border: '1px solid #fde68a', cursor: 'pointer', transition: 'transform 0.2s' }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>📊</div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#4a3b32' }}>Live APMC Benchmark Rates</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Daily official modal prices &amp; min-max spread</p>
            </div>
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
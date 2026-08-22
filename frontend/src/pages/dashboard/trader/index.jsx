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

  // Combine into one list for rendering
  const combinedItems = [
    ...filteredAuctions.map((a) => ({ ...a, itemType: 'auction' })),
    ...filteredProducts.map((p) => ({ ...p, itemType: 'product' })),
  ];

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
              {combinedItems.length} items available
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#636e72' }}>Loading...</div>
        ) : combinedItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#636e72' }}>No products or auctions available.</div>
        ) : (
          <div className="product-grid">
            {combinedItems.map((item) =>
              item.itemType === 'auction' ? (
                <AuctionCard key={`auction-${item.id}`} auction={item} />
              ) : (
                <ProductCard key={`product-${item.id}`} product={item} />
              )
            )}
          </div>
        )}
      </main>
    </div>
  );
}
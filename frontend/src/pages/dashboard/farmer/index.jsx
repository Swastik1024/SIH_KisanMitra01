import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '../../../components/common/Header';
import ProductCard from '../../../components/common/ProductCard';
import { useLanguage } from '../../../context/LanguageContext';
import useAuthStore from '../../../store/authStore';
import api from '../../../services/api';

const produceCategories = [
  'vegetables',
  'fruits',
  'grains',
  'pulses',
  'herbs',
];

export default function FarmerHome() {
  const router = useRouter();
  const [category, setCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, tFormat } = useLanguage();
  const { isAuthenticated, user, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'farmer') {
      router.replace('/dashboard/' + user?.role);
      return;
    }

    const fetchProducts = async () => {
      try {
        const res = await api.get('/api/products/');
        const filteredProducts = res.data.filter((p) =>
          produceCategories.includes(p.category_slug)
        );
        setProducts(filteredProducts);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [isAuthenticated, user, router]);

  const filtered = products.filter((p) => {
    const matchCategory = category === 'all' || p.category_slug === category;
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category_slug && p.category_slug.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCategory && matchSearch;
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

      {/* HERO */}
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-inner">
          <motion.div 
            className="hero-content"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="hero-badge">🌱 {t('home.heroBadge')}</div>
            <h1 className="hero-title">{t('home.heroTitle')}</h1>
            <p className="hero-desc">{t('home.heroDesc')}</p>

            <div className="hero-buttons" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '20px' }}>
              <motion.a 
                href="#products" 
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg, #f4a261 0%, #e76f51 100%)', color: '#ffffff', boxShadow: '0 4px 15px rgba(231,111,81,0.35)' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🛒 {t('home.shopNow')}
              </motion.a>
              <Link href="/dashboard/farmer/listings/createlistings" passHref legacyBehavior>
                <motion.a 
                  className="btn-primary" 
                  style={{ background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)', color: '#ffffff', boxShadow: '0 4px 15px rgba(27,67,50,0.35)' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ➕ Sell Produce / List Crop
                </motion.a>
              </Link>
              <Link href="/dashboard/farmer/purchase-medicine" passHref legacyBehavior>
                <motion.a 
                  className="btn-primary" 
                  style={{ background: 'linear-gradient(135deg, #028090 0%, #00a896 100%)', color: '#ffffff', boxShadow: '0 4px 15px rgba(2,128,144,0.35)' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  💊 Purchase Medicine
                </motion.a>
              </Link>
              <Link href="/dashboard/farmer/purchase-instruments" passHref legacyBehavior>
                <motion.a 
                  className="btn-primary" 
                  style={{ background: 'linear-gradient(135deg, #2a9d8f 0%, #264653 100%)', color: '#ffffff', boxShadow: '0 4px 15px rgba(42,157,143,0.35)' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🔧 Purchase Instruments
                </motion.a>
              </Link>
            </div>
          </motion.div>

          <motion.div 
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="hero-produce">🥕<span className="produce-name">Carrots</span></div>
            <div className="hero-produce">🍅<span className="produce-name">Tomatoes</span></div>
            <div className="hero-produce">🌾<span className="produce-name">Wheat</span></div>
            <div className="hero-produce">🥬<span className="produce-name">Lettuce</span></div>
            <div className="hero-produce">🍚<span className="produce-name">Rice</span></div>
            <div className="hero-produce">🥔<span className="produce-name">Potatoes</span></div>
          </motion.div>
        </div>
      </section>

      {/* QUICK FARMER ACTION CARDS */}
      <section style={{ maxWidth: '1200px', margin: '30px auto 10px', padding: '0 20px' }}>
        <motion.div 
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', alignItems: 'stretch' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/dashboard/farmer/listings/createlistings" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <motion.div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                height: '100%',
                minHeight: '170px',
                width: '100%',
                boxSizing: 'border-box',
                background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
                color: 'white',
                padding: '22px 20px',
                borderRadius: '18px',
                boxShadow: '0 8px 20px rgba(27, 67, 50, 0.15)',
                cursor: 'pointer'
              }}
              whileHover={{ y: -5, scale: 1.02, boxShadow: '0 12px 25px rgba(27, 67, 50, 0.25)' }}
            >
              <div>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌾</div>
                <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '700', lineHeight: 1.2 }}>Create Crop Listing</h3>
              </div>
              <p style={{ margin: 0, fontSize: '13px', opacity: 0.9, lineHeight: 1.4 }}>Post your produce for live trader auctions</p>
            </motion.div>
          </Link>

          <Link href="/dashboard/farmer/listings" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <motion.div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                height: '100%',
                minHeight: '170px',
                width: '100%',
                boxSizing: 'border-box',
                background: 'linear-gradient(135deg, #40916c 0%, #52b788 100%)',
                color: 'white',
                padding: '22px 20px',
                borderRadius: '18px',
                boxShadow: '0 8px 20px rgba(64, 145, 108, 0.15)',
                cursor: 'pointer'
              }}
              whileHover={{ y: -5, scale: 1.02, boxShadow: '0 12px 25px rgba(64, 145, 108, 0.25)' }}
            >
              <div>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '700', lineHeight: 1.2 }}>My Crop Listings</h3>
              </div>
              <p style={{ margin: 0, fontSize: '13px', opacity: 0.9, lineHeight: 1.4 }}>Check status & quality verification</p>
            </motion.div>
          </Link>

          <Link href="/dashboard/farmer/purchase-medicine" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <motion.div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                height: '100%',
                minHeight: '170px',
                width: '100%',
                boxSizing: 'border-box',
                background: 'linear-gradient(135deg, #028090 0%, #00a896 100%)',
                color: 'white',
                padding: '22px 20px',
                borderRadius: '18px',
                boxShadow: '0 8px 20px rgba(2, 128, 144, 0.15)',
                cursor: 'pointer'
              }}
              whileHover={{ y: -5, scale: 1.02, boxShadow: '0 12px 25px rgba(2, 128, 144, 0.25)' }}
            >
              <div>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>💊</div>
                <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '700', lineHeight: 1.2 }}>Farm Medicine & Seeds</h3>
              </div>
              <p style={{ margin: 0, fontSize: '13px', opacity: 0.9, lineHeight: 1.4 }}>Fertilizers, pesticides & crop boosters</p>
            </motion.div>
          </Link>

          <Link href="/dashboard/farmer/purchase-instruments" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <motion.div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                height: '100%',
                minHeight: '170px',
                width: '100%',
                boxSizing: 'border-box',
                background: 'linear-gradient(135deg, #2d6a4f 0%, #52b788 100%)',
                color: 'white',
                padding: '22px 20px',
                borderRadius: '18px',
                boxShadow: '0 8px 20px rgba(45, 106, 79, 0.15)',
                cursor: 'pointer'
              }}
              whileHover={{ y: -5, scale: 1.02, boxShadow: '0 12px 25px rgba(45, 106, 79, 0.25)' }}
            >
              <div>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚜</div>
                <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '700', lineHeight: 1.2 }}>Farm Machinery</h3>
              </div>
              <p style={{ margin: 0, fontSize: '13px', opacity: 0.9, lineHeight: 1.4 }}>Tools, tractors & irrigation kits</p>
            </motion.div>
          </Link>
        </motion.div>
      </section>

      {/* INTELLIGENCE & ADVISORY SUITE */}
      <section style={{ maxWidth: '1200px', margin: '10px auto 30px', padding: '0 20px' }}>
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
              <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>AI trajectory model for optimal selling date</p>
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

      {/* CATEGORIES */}
      <div className="categories-wrapper" id="categories">
        <motion.div 
          className="categories"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          {categories.map((cat) => {
            const isActive = category === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                className={`category-chip ${isActive ? 'active' : ''}`}
                onClick={() => setCategory(cat.key)}
                style={{ position: 'relative', zIndex: 1, border: 'none', background: 'transparent' }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeCategoryPill"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
                      borderRadius: '50px',
                      zIndex: 1,
                      boxShadow: '0 4px 15px rgba(27, 67, 50, 0.3)'
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 2, color: isActive ? '#ffffff' : '#2d6a4f', fontWeight: '600' }}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </motion.div>
      </div>

      {/* PRODUCTS */}
      <main className="main-content" id="products">
        <div className="section-header">
          <div>
            <div className="section-title">
              <span className="title-icon">🛒</span>
              {t('home.shopFreshProduce')}
            </div>
            <div className="section-subtitle">
              {tFormat('home.showingProducts', { count: filtered.length })}
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#636e72' }}>Loading products...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#636e72' }}>No products available.</div>
        ) : (
          <motion.div 
            className="product-grid"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
          >
            {filtered.map((product) => (
              <motion.div
                key={product.id}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  show: { opacity: 1, y: 0 }
                }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
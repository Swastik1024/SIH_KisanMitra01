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
                style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', color: '#7c2d12', border: '1.5px solid #fed7aa', boxShadow: '0 2px 8px rgba(249, 115, 22, 0.12)', fontWeight: '700' }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                🛒 {t('home.shopNow')}
              </motion.a>
              <Link href="/dashboard/farmer/listings/createlistings" passHref legacyBehavior>
                <motion.a 
                  className="btn-primary" 
                  style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', color: '#14532d', border: '1.5px solid #bbf7d0', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.12)', fontWeight: '700' }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  ➕ Sell Produce / List Crop
                </motion.a>
              </Link>
              <Link href="/dashboard/farmer/purchase-medicine" passHref legacyBehavior>
                <motion.a 
                  className="btn-primary" 
                  style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', color: '#0c4a6e', border: '1.5px solid #bae6fd', boxShadow: '0 2px 8px rgba(14, 165, 233, 0.12)', fontWeight: '700' }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  💊 Purchase Medicine
                </motion.a>
              </Link>
              <Link href="/dashboard/farmer/purchase-instruments" passHref legacyBehavior>
                <motion.a 
                  className="btn-primary" 
                  style={{ background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)', color: '#713f12', border: '1.5px solid #fef08a', boxShadow: '0 2px 8px rgba(234, 179, 8, 0.12)', fontWeight: '700' }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  🔧 Purchase Instruments
                </motion.a>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* QUICK FARMER ACTION CARDS - SOFT PASTEL LIGHT USER-FRIENDLY COLOR PALETTE */}
      <section style={{ maxWidth: '1200px', margin: '30px auto 10px', padding: '0 20px' }}>
        <motion.div 
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', alignItems: 'stretch' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Card 1: Soft Mint Green */}
          <Link href="/dashboard/farmer/listings/createlistings" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <motion.div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                minHeight: '170px',
                width: '100%',
                boxSizing: 'border-box',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                border: '1.5px solid #bbf7d0',
                padding: '22px 20px',
                borderRadius: '20px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.08)',
                cursor: 'pointer'
              }}
              whileHover={{ y: -5, scale: 1.02, boxShadow: '0 12px 24px rgba(16, 185, 129, 0.18)' }}
            >
              <div>
                <div style={{ fontSize: '28px', marginBottom: '12px', background: '#ffffff', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)' }}>🌾</div>
                <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '700', lineHeight: 1.2, color: '#14532d' }}>Create Crop Listing</h3>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#166534', fontWeight: '600', lineHeight: 1.4 }}>Post your produce for live trader auctions</p>
            </motion.div>
          </Link>

          {/* Card 2: Soft Peach Amber */}
          <Link href="/dashboard/farmer/listings" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <motion.div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                minHeight: '170px',
                width: '100%',
                boxSizing: 'border-box',
                background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                border: '1.5px solid #fed7aa',
                padding: '22px 20px',
                borderRadius: '20px',
                boxShadow: '0 4px 14px rgba(249, 115, 22, 0.08)',
                cursor: 'pointer'
              }}
              whileHover={{ y: -5, scale: 1.02, boxShadow: '0 12px 24px rgba(249, 115, 22, 0.18)' }}
            >
              <div>
                <div style={{ fontSize: '28px', marginBottom: '12px', background: '#ffffff', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(249, 115, 22, 0.15)' }}>📋</div>
                <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '700', lineHeight: 1.2, color: '#7c2d12' }}>My Crop Listings</h3>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#9a3412', fontWeight: '600', lineHeight: 1.4 }}>Check status & quality verification</p>
            </motion.div>
          </Link>

          {/* Card 3: Soft Sky Blue */}
          <Link href="/dashboard/farmer/purchase-medicine" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <motion.div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                minHeight: '170px',
                width: '100%',
                boxSizing: 'border-box',
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                border: '1.5px solid #bae6fd',
                padding: '22px 20px',
                borderRadius: '20px',
                boxShadow: '0 4px 14px rgba(14, 165, 233, 0.08)',
                cursor: 'pointer'
              }}
              whileHover={{ y: -5, scale: 1.02, boxShadow: '0 12px 24px rgba(14, 165, 233, 0.18)' }}
            >
              <div>
                <div style={{ fontSize: '28px', marginBottom: '12px', background: '#ffffff', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(14, 165, 233, 0.15)' }}>💊</div>
                <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '700', lineHeight: 1.2, color: '#0c4a6e' }}>Farm Medicine & Seeds</h3>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#0369a1', fontWeight: '600', lineHeight: 1.4 }}>Fertilizers, pesticides & crop boosters</p>
            </motion.div>
          </Link>

          {/* Card 4: Soft Lavender Violet */}
          <Link href="/dashboard/farmer/purchase-instruments" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <motion.div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                minHeight: '170px',
                width: '100%',
                boxSizing: 'border-box',
                background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
                border: '1.5px solid #e9d5ff',
                padding: '22px 20px',
                borderRadius: '20px',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.08)',
                cursor: 'pointer'
              }}
              whileHover={{ y: -5, scale: 1.02, boxShadow: '0 12px 24px rgba(139, 92, 246, 0.18)' }}
            >
              <div>
                <div style={{ fontSize: '28px', marginBottom: '12px', background: '#ffffff', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(139, 92, 246, 0.15)' }}>🚜</div>
                <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '700', lineHeight: 1.2, color: '#581c87' }}>Farm Machinery</h3>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#7e22ce', fontWeight: '600', lineHeight: 1.4 }}>Tools, tractors & irrigation kits</p>
            </motion.div>
          </Link>
        </motion.div>
      </section>

      {/* INTELLIGENCE & ADVISORY SUITE */}
      <section style={{ maxWidth: '1200px', margin: '10px auto 30px', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {/* Card 5: Soft Warm Sun Yellow */}
          <Link href="/weather-alerts" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <motion.div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                minHeight: '160px',
                width: '100%',
                boxSizing: 'border-box',
                background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)',
                border: '1.5px solid #fef08a',
                padding: '22px 20px',
                borderRadius: '20px',
                boxShadow: '0 4px 14px rgba(234, 179, 8, 0.08)',
                cursor: 'pointer'
              }}
              whileHover={{ y: -5, scale: 1.02, boxShadow: '0 12px 24px rgba(234, 179, 8, 0.18)' }}
            >
              <div>
                <div style={{ fontSize: '28px', marginBottom: '12px', background: '#ffffff', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(234, 179, 8, 0.15)' }}>⛅</div>
                <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '700', lineHeight: 1.2, color: '#713f12' }}>Weather &amp; Farm Alerts</h3>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#854d0e', fontWeight: '600', lineHeight: 1.4 }}>Hyperlocal 5-day crop advisory &amp; rain warnings</p>
            </motion.div>
          </Link>

          {/* Card 6: Soft Fresh Teal */}
          <Link href="/price-intelligence" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <motion.div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                minHeight: '160px',
                width: '100%',
                boxSizing: 'border-box',
                background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
                border: '1.5px solid #99f6e4',
                padding: '22px 20px',
                borderRadius: '20px',
                boxShadow: '0 4px 14px rgba(20, 184, 166, 0.08)',
                cursor: 'pointer'
              }}
              whileHover={{ y: -5, scale: 1.02, boxShadow: '0 12px 24px rgba(20, 184, 166, 0.18)' }}
            >
              <div>
                <div style={{ fontSize: '28px', marginBottom: '12px', background: '#ffffff', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(20, 184, 166, 0.15)' }}>📈</div>
                <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '700', lineHeight: 1.2, color: '#134e4a' }}>Predictive Price Intelligence</h3>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#0f766e', fontWeight: '600', lineHeight: 1.4 }}>AI trajectory model for optimal selling date</p>
            </motion.div>
          </Link>

          {/* Card 7: Soft Blush Rose */}
          <Link href="/mandi-network" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <motion.div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                minHeight: '160px',
                width: '100%',
                boxSizing: 'border-box',
                background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
                border: '1.5px solid #fecdd3',
                padding: '22px 20px',
                borderRadius: '20px',
                boxShadow: '0 4px 14px rgba(244, 63, 94, 0.08)',
                cursor: 'pointer'
              }}
              whileHover={{ y: -5, scale: 1.02, boxShadow: '0 12px 24px rgba(244, 63, 94, 0.18)' }}
            >
              <div>
                <div style={{ fontSize: '28px', marginBottom: '12px', background: '#ffffff', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(244, 63, 94, 0.15)' }}>🏛️</div>
                <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '700', lineHeight: 1.2, color: '#881337' }}>e-NAM Mandi Network</h3>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#9f1239', fontWeight: '600', lineHeight: 1.4 }}>Pan-India APMC live arrival &amp; price data</p>
            </motion.div>
          </Link>

          {/* Card 8: Soft Lime Green */}
          <Link href="/apmc-benchmark" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <motion.div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                minHeight: '160px',
                width: '100%',
                boxSizing: 'border-box',
                background: 'linear-gradient(135deg, #f7fee7 0%, #ecfccb 100%)',
                border: '1.5px solid #d9f99d',
                padding: '22px 20px',
                borderRadius: '20px',
                boxShadow: '0 4px 14px rgba(132, 204, 22, 0.08)',
                cursor: 'pointer'
              }}
              whileHover={{ y: -5, scale: 1.02, boxShadow: '0 12px 24px rgba(132, 204, 22, 0.18)' }}
            >
              <div>
                <div style={{ fontSize: '28px', marginBottom: '12px', background: '#ffffff', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(132, 204, 22, 0.15)' }}>📊</div>
                <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '700', lineHeight: 1.2, color: '#365314' }}>Live APMC Benchmark Rates</h3>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#4d7c0f', fontWeight: '600', lineHeight: 1.4 }}>Daily official modal prices &amp; min-max spread</p>
            </motion.div>
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
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '../../../components/common/Header';
import { useLanguage } from '../../../context/LanguageContext';
import useAuthStore from '../../../store/authStore';
import api from '../../../services/api';
import toast from 'react-hot-toast';

function getImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  return `${API_URL}${url.startsWith('/') ? url : '/' + url}`;
}

export default function PurchaseInstruments() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const { t } = useLanguage();
  const { isAuthenticated, user, hydrate } = useAuthStore();

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get('/api/products/');
      const instrumentCategories = [
        'tractors_vehicles',
        'tillage_preparation',
        'sowing_planting',
        'irrigation_water',
        'crop_care',
        'harvesting',
        'tools_accessories',
      ];
      const instrumentProducts = res.data.filter((p) =>
        instrumentCategories.includes(p.category_slug)
      );
      setProducts(instrumentProducts);
    } catch (error) {
      console.error('Failed to fetch instrument products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

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
    fetchProducts();
  }, [isAuthenticated, user, router, fetchProducts]);

  const categories = [
    { key: 'all', label: `🚜 ${t('instruments.allInstruments')}` },
    { key: 'tractors_vehicles', label: `🚜 ${t('instruments.tractorsVehicles')}` },
    { key: 'tillage_preparation', label: `🌱 ${t('instruments.tillagePreparation')}` },
    { key: 'sowing_planting', label: `🌾 ${t('instruments.sowingPlanting')}` },
    { key: 'irrigation_water', label: `💧 ${t('instruments.irrigationWater')}` },
    { key: 'crop_care', label: `🛡️ ${t('instruments.cropCare')}` },
    { key: 'harvesting', label: `🌾 ${t('instruments.harvesting')}` },
    { key: 'tools_accessories', label: `🛠️ ${t('instruments.toolsAccessories')}` },
  ];

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter((p) => p.category_slug === activeCategory);

  return (
    <div className="home-page">
      <Header />

      {/* HERO BANNER */}
      <section className="hero" style={{ backgroundImage: `url('/machinery-bg.jpg')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="hero-overlay" style={{ background: 'linear-gradient(90deg, rgba(15,35,25,0.85) 0%, rgba(20,50,35,0.7) 100%)' }} />
        <div className="hero-inner">
          <motion.div 
            className="hero-content"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="hero-badge">{t('instruments.badge')}</div>
            <h1 className="hero-title">{t('instruments.title')}</h1>
            <p className="hero-desc">{t('instruments.description')}</p>
          </motion.div>
          
          <motion.div 
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="hero-produce">🚜<span className="produce-name">Tractor</span></div>
            <div className="hero-produce">🌱<span className="produce-name">Tillage</span></div>
            <div className="hero-produce">💧<span className="produce-name">Irrigation</span></div>
            <div className="hero-produce">🌿<span className="produce-name">Crop Care</span></div>
            <div className="hero-produce">🌾<span className="produce-name">Harvest</span></div>
            <div className="hero-produce">🛠️<span className="produce-name">Tools</span></div>
          </motion.div>
        </div>
      </section>

      {/* CATEGORIES */}
      <div className="categories-wrapper" id="categories" style={{ marginTop: '20px' }}>
        <div className="categories">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                className={`category-chip ${isActive ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.key)}
                style={{ position: 'relative', zIndex: 1, border: 'none', background: 'transparent' }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeCategoryPillInstruments"
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
        </div>
      </div>

      {/* PRODUCTS */}
      <main className="main-content" id="products">
        <div className="section-header">
          <div>
            <div className="section-title">
              <span className="title-icon">🔧</span>
              {t('instruments.shopInstruments')}
            </div>
            <div className="section-subtitle">
              {filteredProducts.length} products available
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#636e72' }}>
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#636e72' }}>
            No products in this category.
          </div>
        ) : (
          <motion.div 
            className="product-grid"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.08 }
              }
            }}
          >
            {filteredProducts.map((product) => (
              <ProductCardWithBuy
                key={product.id}
                product={product}
                onBuySuccess={fetchProducts}
              />
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}

function ProductCardWithBuy({ product, onBuySuccess }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);

  const handleBuy = () => {
    router.push(`/checkout?product_id=${product.id}&quantity=${quantity}`);
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
      whileHover={{ y: -6, boxShadow: '0 12px 25px rgba(0,0,0,0.1)' }}
      onClick={() => router.push(`/product/${product.id}`)}
      style={{ cursor: 'pointer', border: '1px solid #e1ebe4', borderRadius: '16px', overflow: 'hidden', background: '#fff', transition: 'box-shadow 0.3s' }}
    >
      {product.image ? (
        <img
          src={getImageUrl(product.image)}
          alt={product.name}
          style={{ width: '100%', height: '150px', objectFit: 'cover' }}
        />
      ) : (
        <div style={{ width: '100%', height: '150px', background: '#edf6f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
          🔧
        </div>
      )}
      <div style={{ padding: '16px' }}>
        <h3 style={{ margin: '0 0 5px', color: '#173b2a', fontSize: '16px', fontWeight: '800' }}>
          {product.name}
        </h3>
        <p style={{ margin: '0 0 10px', color: '#718078', fontSize: '12px' }}>
          {product.description || 'No description'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <strong style={{ color: '#2d6a4f', fontSize: '18px' }}>₹{product.price}</strong>
          <span style={{ color: '#89948e', fontSize: '12px' }}>
            {product.quantity} {product.unit} available
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="number"
            min="1"
            max={product.quantity}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(product.quantity, Number(e.target.value))))}
            style={{ width: '60px', height: '36px', border: '1px solid #dbe6de', borderRadius: '8px', padding: '0 8px' }}
          />
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => {
              e.stopPropagation();
              handleBuy();
            }}
            style={{
              flex: 1,
              height: '36px',
              background: '#2d6a4f',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            Buy Now
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
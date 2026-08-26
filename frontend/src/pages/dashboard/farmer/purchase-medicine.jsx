import { useEffect, useState } from 'react';
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

export default function PurchaseMedicine() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const { t } = useLanguage();
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
    fetchProducts();
  }, [isAuthenticated, user, router]);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/api/products/');
      const medicineCategories = [
        'pest_control',
        'disease_control',
        'weed_control',
        'plant_nutrition',
        'bio_solutions',
        'growth_yield',
      ];
      const medicineProducts = res.data.filter((p) =>
        medicineCategories.includes(p.category_slug)
      );
      setProducts(medicineProducts);
    } catch (error) {
      console.error('Failed to fetch medicine products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const medicineCategories = [
    { key: 'all', label: 'All', icon: '💊' },
    { key: 'pest_control', label: 'Pest Control', icon: '🐛' },
    { key: 'disease_control', label: 'Disease Control', icon: '🍄' },
    { key: 'weed_control', label: 'Weed Control', icon: '🌿' },
    { key: 'plant_nutrition', label: 'Plant Nutrition', icon: '🌱' },
    { key: 'bio_solutions', label: 'Bio Solutions', icon: '🦠' },
    { key: 'growth_yield', label: 'Growth & Yield', icon: '🌾' },
  ];

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter((p) => p.category_slug === activeCategory);

  return (
    <div className="home-page">
      <Header />

      {/* HERO BANNER */}
      <section className="hero" style={{ backgroundImage: `url('/medicine-bg.jpg')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="hero-overlay" style={{ background: 'linear-gradient(90deg, rgba(2,60,70,0.85) 0%, rgba(0,80,90,0.7) 100%)' }} />
        <div className="hero-inner">
          <motion.div 
            className="hero-content"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="hero-badge">{t('medicine.badge')}</div>
            <h1 className="hero-title">{t('medicine.title')}</h1>
            <p className="hero-desc">{t('medicine.description')}</p>
          </motion.div>
        </div>
      </section>

      {/* CATEGORY FILTERS */}
      <div className="categories-wrapper" id="categories" style={{ marginTop: '20px' }}>
        <div className="categories">
          {medicineCategories.map((cat) => {
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
                    layoutId="activeCategoryPillMedicine"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(135deg, #028090 0%, #00a896 100%)',
                      borderRadius: '50px',
                      zIndex: 1,
                      boxShadow: '0 4px 15px rgba(2, 128, 144, 0.3)'
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 2, color: isActive ? '#ffffff' : '#028090', fontWeight: '600' }}>
                  {cat.icon} {cat.label}
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
              <span className="title-icon">💊</span>
              {t('medicine.shopMedicine')}
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
        <div style={{ width: '100%', height: '150px', background: '#e6f7f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
          💊
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
          <strong style={{ color: '#028090', fontSize: '18px' }}>₹{product.price}</strong>
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
              background: '#028090',
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
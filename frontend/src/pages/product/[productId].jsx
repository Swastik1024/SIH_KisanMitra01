import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../../components/common/Header';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineShoppingCart,
  HiOutlineDocumentReport,
  HiOutlineX,
} from 'react-icons/hi';

const PRODUCE_CATEGORIES = ['vegetables', 'fruits', 'grains', 'pulses', 'herbs'];

function getImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  return `${API_URL}${url.startsWith('/') ? url : '/' + url}`;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const { productId } = router.query;
  const { isAuthenticated, user, hydrate } = useAuthStore();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/api/products/${productId}`);
      const data = res.data;
      setProduct(data);
      // Set default quantity
      if (PRODUCE_CATEGORIES.includes(data.category_slug)) {
        setQuantity(data.quantity);
      } else {
        setQuantity(1);
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Product not found');
      router.push('/dashboard/farmer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (productId) {
      fetchProduct();
    }
  }, [isAuthenticated, productId, router]);

  const handleBuy = () => {
    if (!product || !['verified', 'listed', 'active'].includes(product.status)) {
      toast.error('Product is not available for purchase');
      return;
    }
    router.push(`/checkout?product_id=${product.id}&quantity=${quantity}`);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main style={styles.page}>
          <div style={styles.loading}>Loading product...</div>
        </main>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <main style={styles.page}>
          <div style={styles.loading}>Product not found.</div>
        </main>
      </>
    );
  }

  const imageUrl = product.image || product.media?.find(m => m.media_type === 'image')?.url;
  const inspection = product.inspection_report;

  return (
    <>
      <Header />
      <main style={styles.page}>
        <div style={styles.container}>
          <button onClick={() => router.back()} style={styles.backButton}>
            <HiOutlineArrowLeft size={18} />
            Back
          </button>

          <div style={styles.card}>
            <div style={styles.imageSection}>
              {imageUrl ? (
                <img src={getImageUrl(imageUrl)} alt={product.name} style={styles.image} />
              ) : (
                <div style={styles.imagePlaceholder}>🌿</div>
              )}
            </div>

            <div style={styles.details}>
              <h1 style={styles.title}>{product.name}</h1>
              <p style={styles.category}>{product.category_slug || 'Uncategorized'}</p>
              <p style={styles.description}>{product.description || 'No description available.'}</p>

              <div style={styles.meta}>
                <span><strong>Price:</strong> ₹{product.price}</span>
                <span><strong>Available:</strong> {product.quantity} {product.unit}</span>
              </div>

              {product.farmer_name && (
                <div style={styles.meta}>
                  <span><strong>Farmer:</strong> {product.farmer_name}</span>
                </div>
              )}

              {/* ✅ Buyer info for sold products */}
              {product.status === 'sold' && product.buyer_name && (
                <div style={styles.meta}>
                  <span><strong>Buyer:</strong> {product.buyer_name}</span>
                </div>
              )}

              {product.auction_type === 'auction' && (
                <>
                  <div style={styles.meta}>
                    <span><strong>Current Highest Bid:</strong> ₹{product.current_highest_bid || product.base_price}</span>
                  </div>

                  {/* Bid History */}
                  {product.bids && product.bids.length > 0 ? (
                    <div style={styles.bidsSection}>
                      <h3 style={styles.bidsTitle}>Bid History</h3>
                      {product.bids.map((bid) => (
                        <div key={bid.id} style={styles.bidRow}>
                          <div style={styles.bidLeft}>
                            <strong>{bid.bidder_name}</strong>
                            <span style={styles.bidTime}>
                              {new Date(bid.bid_time).toLocaleString('en-IN', {
                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div style={styles.bidAmount}>₹{bid.bid_amount}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={styles.noBids}>No bids yet.</p>
                  )}
                </>
              )}

              {/* View Report button */}
              {inspection && (
                <button style={styles.reportButton} onClick={() => setShowReport(true)}>
                  <HiOutlineDocumentReport size={18} />
                  View Inspection Report
                </button>
              )}

              {/* Quantity and Buy */}
              {product.auction_type !== 'auction' && ['verified', 'listed', 'active'].includes(product.status) && (
                <div style={styles.buySection}>
                  <div style={styles.quantityGroup}>
                    <label style={styles.quantityLabel}>Quantity</label>
                    <input
                      type="number"
                      min="1"
                      max={product.quantity}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(product.quantity, Number(e.target.value))))}
                      style={styles.quantityInput}
                    />
                  </div>
                  <button onClick={handleBuy} style={styles.buyButton}>
                    <HiOutlineShoppingCart size={18} />
                    Buy Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Inspection Report Modal */}
      {showReport && inspection && (
        <div style={styles.modalOverlay} onClick={() => setShowReport(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Inspection Report</h2>
              <button style={styles.closeBtn} onClick={() => setShowReport(false)}>
                <HiOutlineX size={20} />
              </button>
            </div>
            <div style={styles.reportContent}>
              <p><strong>Quality Grade:</strong> {inspection.quality_grade || '—'}</p>
              <p><strong>Final Base Price:</strong> ₹{inspection.final_base_price}</p>
              <p><strong>Recommendations:</strong> {inspection.recommendations || 'None'}</p>
              <p><strong>Notes:</strong> {inspection.notes || 'None'}</p>
              {inspection.inspection_data && (
                <>
                  <h3 style={styles.paramTitle}>Parameters</h3>
                  {Object.entries(inspection.inspection_data).map(([key, value]) => (
                    <div key={key} style={styles.paramRow}>
                      <span>{key.replace(/_/g, ' ')}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  page: { minHeight: '100vh', paddingTop: '100px', paddingBottom: '60px', background: 'linear-gradient(135deg, #f4f8f5 0%, #edf5ef 50%, #f8faf8 100%)', fontFamily: "'Segoe UI', system-ui, sans-serif" },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '0 24px' },
  loading: { textAlign: 'center', padding: '40px', color: '#718078' },
  backButton: { display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#2d6a4f', fontWeight: '700', cursor: 'pointer', marginBottom: '20px', fontSize: '14px' },
  card: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', background: '#fff', borderRadius: '20px', boxShadow: '0 8px 25px rgba(30,70,45,0.05)', border: '1px solid #e1ebe4', overflow: 'hidden', padding: '20px' },
  imageSection: { background: '#f9fbfa', borderRadius: '16px', overflow: 'hidden', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'contain' },
  imagePlaceholder: { fontSize: '64px' },
  details: { display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px' },
  title: { margin: 0, color: '#173b2a', fontSize: '28px', fontWeight: '850' },
  category: { margin: 0, color: '#198754', fontSize: '14px', fontWeight: '700', textTransform: 'capitalize' },
  description: { margin: 0, color: '#526058', fontSize: '15px', lineHeight: 1.6 },
  meta: { display: 'flex', flexWrap: 'wrap', gap: '16px', color: '#526058', fontSize: '14px' },
  reportButton: { display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#eaf8f0', color: '#198754', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' },
  buySection: { display: 'flex', gap: '16px', alignItems: 'flex-end', marginTop: '20px' },
  quantityGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  quantityLabel: { color: '#526058', fontSize: '12px', fontWeight: '700' },
  quantityInput: { width: '80px', height: '42px', border: '1px solid #dbe6de', borderRadius: '10px', padding: '0 8px', textAlign: 'center', fontSize: '14px', outline: 'none' },
  buyButton: { display: 'flex', alignItems: 'center', gap: '8px', background: '#2d6a4f', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' },
  modalCard: { background: '#fff', borderRadius: '20px', maxWidth: '600px', width: '100%', maxHeight: '80vh', overflowY: 'auto', padding: '24px' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  modalTitle: { margin: 0, color: '#173b2a', fontSize: '20px', fontWeight: '850' },
  closeBtn: { background: 'transparent', border: 'none', cursor: 'pointer', color: '#526058' },
  reportContent: { color: '#526058', fontSize: '14px' },
  paramTitle: { margin: '15px 0 10px', color: '#173b2a', fontSize: '16px', fontWeight: '800' },
  paramRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f3f1' },

  // Bid history styles
  bidsSection: {
    background: '#f9fbfa',
    borderRadius: '12px',
    padding: '15px',
    marginTop: '10px',
  },
  bidsTitle: {
    margin: '0 0 10px',
    color: '#173b2a',
    fontSize: '16px',
    fontWeight: '800',
  },
  bidRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #e9efeb',
  },
  bidLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  bidTime: {
    color: '#89948e',
    fontSize: '11px',
  },
  bidAmount: {
    color: '#2d6a4f',
    fontWeight: '850',
  },
  noBids: {
    color: '#9aa49e',
    fontSize: '13px',
  },

  '@media (max-width: 900px)': { card: { gridTemplateColumns: '1fr' } },
};
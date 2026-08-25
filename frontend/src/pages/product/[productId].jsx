import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../../components/common/Header';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineShoppingCart,
  HiOutlineCheckCircle,
  HiOutlineDocumentReport,
  HiOutlineCurrencyRupee,
  HiOutlineClock
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
  const [bidAmount, setBidAmount] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [isEnded, setIsEnded] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/api/products/${productId}`);
      const data = res.data;
      setProduct(data);
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

  // Auction countdown timer loop
  useEffect(() => {
    if (!product || !product.auction_type || product.auction_type === 'fixed_price' || product.auction_type === 'fixed') return;

    const endTimeStr = product.end_time || product.auction?.end_time;
    let targetTime;
    if (endTimeStr) {
      targetTime = new Date(endTimeStr).getTime();
    } else {
      // Default fallback: 12h auction window
      targetTime = Date.now() + 12 * 60 * 60 * 1000;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = targetTime - now;
      if (diff <= 0) {
        setTimeLeft('Auction Ended');
        setIsEnded(true);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const hStr = String(hours).padStart(2, '0');
        const mStr = String(minutes).padStart(2, '0');
        const sStr = String(seconds).padStart(2, '0');
        setTimeLeft(`${hStr}h ${mStr}m ${sStr}s`);
        setIsEnded(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [product]);

  const handleBuy = () => {
    if (!product || !['verified', 'listed', 'active'].includes(product.status)) {
      toast.error('Product is not available for purchase');
      return;
    }
    router.push(`/checkout?product_id=${product.id}&quantity=${quantity}`);
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    if (isEnded) {
      toast.error('Auction has already ended');
      return;
    }
    const amount = parseFloat(bidAmount);
    const currentHighest = product.current_highest_bid || product.base_price || product.price || 0;

    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid bid amount');
      return;
    }

    if (amount <= currentHighest) {
      toast.error(`Bid must be higher than current highest bid (₹${currentHighest})`);
      return;
    }

    setSubmittingBid(true);
    try {
      if (product.auction_id) {
        await api.post(`/api/auctions/${product.auction_id}/bid`, { bid_amount: amount });
      } else {
        await api.post(`/api/products/${product.id}/bid`, { bid_amount: amount });
      }
      toast.success('🎉 Bid placed successfully!');
      setBidAmount('');
      await fetchProduct();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to place bid');
    } finally {
      setSubmittingBid(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main style={{ minHeight: '100vh', paddingTop: '120px', textAlign: 'center', color: '#059669', fontWeight: '600' }}>
          Loading crop produce details...
        </main>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <main style={{ minHeight: '100vh', paddingTop: '120px', textAlign: 'center', color: '#64748b' }}>
          Product not found.
        </main>
      </>
    );
  }

  const imageUrl = product.image || product.media?.find(m => m.media_type === 'image')?.url;
  const inspection = product.inspection_report;
  const isAuction = product.auction_type && product.auction_type !== 'fixed_price' && product.auction_type !== 'fixed';
  const currentHighest = product.current_highest_bid || product.base_price || product.price || 0;
  const bidsList = product.bids || [];

  return (
    <>
      <Header />
      <main style={{
        minHeight: '100vh',
        paddingTop: '100px',
        paddingBottom: '80px',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"
      }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 24px' }}>
          
          {/* Back button */}
          <button onClick={() => router.back()} style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '50px',
            padding: '8px 18px', cursor: 'pointer', fontSize: '14px', fontWeight: '700',
            color: '#0f172a', marginBottom: '24px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
          }}>
            <HiOutlineArrowLeft /> Back
          </button>

          {/* MAIN PRODUCT GRID */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px',
            background: '#ffffff', borderRadius: '24px', padding: '32px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0'
          }}>

            {/* LEFT COLUMN: IMAGE & QUICK STATS */}
            <div>
              <div style={{
                height: '380px', borderRadius: '20px', overflow: 'hidden',
                background: '#f8fafc', border: '1px solid #e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative'
              }}>
                {imageUrl ? (
                  <img src={getImageUrl(imageUrl)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ fontSize: '72px' }}>🌾</div>
                )}
                {isAuction && (
                  <div style={{
                    position: 'absolute', top: '16px', left: '16px',
                    background: 'rgba(217, 119, 6, 0.95)', color: '#ffffff',
                    padding: '6px 14px', borderRadius: '50px', fontSize: '12px',
                    fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px',
                    boxShadow: '0 4px 12px rgba(217,119,6,0.3)'
                  }}>
                    🔨 Live Bidding Auction
                  </div>
                )}
              </div>

              {/* Quick Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '14px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Available Qty</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{product.quantity} {product.unit}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '14px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Base / Listed Price</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>₹{product.price}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '14px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Current Highest</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#d97706', marginTop: '4px' }}>₹{currentHighest}</div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: DETAILS & ACTIONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '12px', fontWeight: '800', color: '#059669',
                    background: '#dcfce7', padding: '4px 12px', borderRadius: '50px',
                    textTransform: 'uppercase', letterSpacing: '0.5px'
                  }}>
                    {product.category_slug || 'Crop Produce'}
                  </span>

                  {/* ⏳ LIVE COUNTDOWN TIMER BADGE */}
                  {isAuction && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      background: isEnded ? '#fef2f2' : '#fffbe3',
                      border: `1px solid ${isEnded ? '#fca5a5' : '#fde68a'}`,
                      color: isEnded ? '#dc2626' : '#b45309',
                      padding: '5px 14px', borderRadius: '50px',
                      fontSize: '13px', fontWeight: '800'
                    }}>
                      <HiOutlineClock style={{ fontSize: '16px' }} />
                      <span>{isEnded ? 'Auction Ended' : `Ending in: ${timeLeft}`}</span>
                    </div>
                  )}
                </div>

                <h1 style={{ fontSize: '30px', fontWeight: '900', color: '#0f172a', margin: '10px 0 6px 0' }}>
                  {product.name}
                </h1>
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: '1.6' }}>
                  {product.description || 'Quality crop listing direct from verified farm.'}
                </p>
              </div>

              {/* Farmer & Location details */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Farmer</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{product.farmer_name || 'Verified Farmer'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Location</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{product.location || 'APMC Market'}</div>
                </div>
              </div>

              {/* IS AUCTION OR DIRECT PURCHASE */}
              {isAuction ? (
                <div style={{
                  background: 'linear-gradient(135deg, #fffbe3 0%, #fef3c7 100%)',
                  borderRadius: '20px', padding: '24px', border: '1.5px solid #fde68a',
                  boxShadow: '0 4px 16px rgba(217,119,6,0.08)'
                }}>
                  {/* COUNTDOWN BANNER IN BID BOX */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#ffffff', padding: '12px 18px', borderRadius: '14px',
                    border: '1px solid #fde68a', marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: '700', fontSize: '13px' }}>
                      <HiOutlineClock size={18} style={{ color: '#d97706' }} />
                      Auction Time Remaining:
                    </div>
                    <div style={{
                      fontSize: '18px', fontWeight: '900',
                      color: isEnded ? '#dc2626' : '#92400e',
                      fontVariantNumeric: 'tabular-nums'
                    }}>
                      {timeLeft || 'Calculating...'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#b45309', fontWeight: '700', textTransform: 'uppercase' }}>Current Highest Bid</div>
                      <div style={{ fontSize: '32px', fontWeight: '900', color: '#92400e' }}>
                        ₹{currentHighest.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#92400e', background: '#ffffff', padding: '6px 14px', borderRadius: '50px', fontWeight: '700', border: '1px solid #fde68a' }}>
                      Min Bid: ₹{(currentHighest + 1).toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* PLACE BID FORM */}
                  {user?.role === 'trader' ? (
                    <form onSubmit={handlePlaceBid}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: '800', color: '#92400e', fontSize: '16px' }}>₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min={currentHighest + 1}
                            placeholder={`Enter ₹${currentHighest + 1} or higher`}
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            disabled={isEnded}
                            style={{
                              width: '100%',
                              padding: '14px 14px 14px 34px',
                              border: '2px solid #f59e0b',
                              borderRadius: '14px',
                              fontSize: '16px',
                              fontWeight: '700',
                              outline: 'none',
                              background: isEnded ? '#f1f5f9' : '#ffffff',
                              boxSizing: 'border-box'
                            }}
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={submittingBid || isEnded}
                          style={{
                            background: isEnded
                              ? '#94a3b8'
                              : submittingBid
                              ? '#d97706'
                              : 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '14px 24px',
                            borderRadius: '14px',
                            fontWeight: '800',
                            fontSize: '15px',
                            cursor: submittingBid || isEnded ? 'not-allowed' : 'pointer',
                            boxShadow: isEnded ? 'none' : '0 4px 16px rgba(217,119,6,0.3)',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {isEnded ? 'Auction Ended' : submittingBid ? 'Placing...' : '🔨 Confirm & Place Bid'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div style={{ fontSize: '13px', color: '#92400e', fontWeight: '600' }}>
                      Only registered traders can place bids on auction produce listings.
                    </div>
                  )}
                </div>
              ) : (
                /* DIRECT PURCHASE SECTION */
                ['verified', 'listed', 'active'].includes(product.status) && (
                  <div style={{ background: '#f0fdf4', padding: '24px', borderRadius: '20px', border: '1px solid #bbf7d0' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ color: '#166534', fontSize: '12px', fontWeight: '700' }}>Purchase Quantity</label>
                        <input
                          type="number"
                          min="1"
                          max={product.quantity}
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, Math.min(product.quantity, Number(e.target.value))))}
                          style={{ width: '100px', height: '44px', border: '1px solid #86efac', borderRadius: '12px', padding: '0 12px', textAlign: 'center', fontSize: '16px', fontWeight: '700', outline: 'none' }}
                        />
                      </div>
                      <button onClick={handleBuy} style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none',
                        height: '44px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '15px',
                        boxShadow: '0 4px 16px rgba(16,185,129,0.3)'
                      }}>
                        <HiOutlineShoppingCart size={18} /> Direct Buy Now
                      </button>
                    </div>
                  </div>
                )
              )}

            </div>
          </div>

          {/* INSPECTION REPORT CARD SECTION */}
          {inspection ? (
            <div style={{
              marginTop: '32px', background: '#ffffff', borderRadius: '24px', padding: '32px',
              border: '1.5px solid #bbf7d0', boxShadow: '0 8px 30px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <HiOutlineCheckCircle size={28} style={{ color: '#16a34a' }} />
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#166534' }}>
                    Official Quality Inspection Report
                  </h2>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                    Verified by certified APMC Quality Agent
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '16px', border: '1px solid #dcfce7', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#15803d', fontWeight: '700', textTransform: 'uppercase' }}>Quality Grade</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#166534', marginTop: '4px' }}>
                    Grade {inspection.quality_grade || 'A+'}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Inspected Base Price</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
                    ₹{inspection.final_base_price}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Freshness Score</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
                    {inspection.freshness_score ? `${inspection.freshness_score}%` : '95%'}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Defect Rate</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
                    {inspection.defect_rate !== undefined ? `${inspection.defect_rate}%` : '2%'}
                  </div>
                </div>
              </div>

              {(inspection.recommendations || inspection.notes) && (
                <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {inspection.recommendations && (
                    <div>
                      <strong style={{ color: '#166534', fontSize: '13px' }}>Agent Recommendations: </strong>
                      <span style={{ color: '#334155', fontSize: '14px' }}>{inspection.recommendations}</span>
                    </div>
                  )}
                  {inspection.notes && (
                    <div>
                      <strong style={{ color: '#475569', fontSize: '13px' }}>Inspection Notes: </strong>
                      <span style={{ color: '#334155', fontSize: '14px' }}>{inspection.notes}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              marginTop: '32px', background: '#ffffff', borderRadius: '24px', padding: '24px',
              border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b'
            }}>
              📄 Quality inspection report is pending for this listing.
            </div>
          )}

          {/* BIDS HISTORY SECTION */}
          {isAuction && (
            <div style={{
              marginTop: '32px', background: '#ffffff', borderRadius: '24px', padding: '32px',
              border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                    📋 Placed Bids History ({bidsList.length})
                  </h2>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                    Live record of all trader bids for this auction crop produce
                  </div>
                </div>
              </div>

              {bidsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 0', color: '#64748b', background: '#f8fafc', borderRadius: '16px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔨</div>
                  <div style={{ fontWeight: '700' }}>No bids placed yet</div>
                  <div style={{ fontSize: '13px', marginTop: '4px' }}>Enter a bid amount above to be the highest bidder!</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {bidsList.map((bid, idx) => (
                    <div key={idx} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '16px 20px', borderRadius: '16px',
                      background: idx === 0 ? '#f0fdf4' : '#f8fafc',
                      border: idx === 0 ? '1.5px solid #bbf7d0' : '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '50%',
                          background: idx === 0 ? '#dcfce7' : '#e2e8f0',
                          color: idx === 0 ? '#166534' : '#475569',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: '800', fontSize: '16px'
                        }}>
                          {bid.bidder_name ? bid.bidder_name[0].toUpperCase() : 'T'}
                        </div>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {bid.bidder_name || `Trader #${bid.bidder_id}`}
                            {idx === 0 && (
                              <span style={{
                                fontSize: '11px', background: '#16a34a', color: '#ffffff',
                                padding: '3px 10px', borderRadius: '50px', fontWeight: '800'
                              }}>
                                HIGHEST BIDDER
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            {bid.bid_time
                              ? new Date(bid.bid_time).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                              : 'Recently'}
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: '22px', fontWeight: '900', color: idx === 0 ? '#166534' : '#0f172a' }}>
                        ₹{Number(bid.bid_amount).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </>
  );
}
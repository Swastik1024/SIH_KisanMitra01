import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

function getImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  return `${API_URL}${url.startsWith('/') ? url : '/' + url}`;
}

export default function BidModal({ product, onClose, onBidSuccess }) {
  const [bidAmount, setBidAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bidsList, setBidsList] = useState([]);
  const [productDetails, setProductDetails] = useState(product);
  const [activeTab, setActiveTab] = useState('bid'); // 'bid' | 'bids' | 'report'

  const currentHighest = productDetails.current_highest_bid || productDetails.base_price || productDetails.price || 0;
  const imageUrl = productDetails.image || productDetails.media?.find(m => m.media_type === 'image')?.url;
  const inspection = productDetails.inspection_report;

  useEffect(() => {
    if (!product?.id) return;
    api.get(`/api/products/${product.id}`)
      .then(res => {
        setProductDetails(res.data);
        if (res.data.bids) setBidsList(res.data.bids);
      })
      .catch(() => {});
  }, [product?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid bid amount');
      return;
    }
    if (amount <= currentHighest) {
      toast.error(`Bid must be higher than ₹${currentHighest}`);
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/api/auctions/${product.id}/bid`, { bid_amount: amount });
      toast.success('Bid placed successfully!');
      if (onBidSuccess) onBidSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to place bid');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: "'Inter', 'Segoe UI', sans-serif"
    }} onClick={onClose}>

      <div style={{
        background: '#0f1923',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '520px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        border: '1px solid rgba(255,255,255,0.08)'
      }} onClick={e => e.stopPropagation()}>

        {/* TOP IMAGE BANNER */}
        <div style={{
          position: 'relative',
          height: '180px',
          background: imageUrl
            ? `linear-gradient(to bottom, rgba(15,25,35,0) 30%, #0f1923 100%), url(${getImageUrl(imageUrl)}) center/cover`
            : 'linear-gradient(135deg, #1a2e1a 0%, #0f1923 100%)',
          flexShrink: 0
        }}>
          {/* Auction live pill */}
          <div style={{
            position: 'absolute', top: '16px', left: '16px',
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.4)',
            color: '#34d399',
            padding: '5px 12px',
            borderRadius: '50px',
            fontSize: '12px',
            fontWeight: '700',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
            LIVE AUCTION
          </div>

          {/* Close button */}
          <button onClick={onClose} style={{
            position: 'absolute', top: '12px', right: '12px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '50%',
            width: '34px', height: '34px',
            color: '#fff', cursor: 'pointer',
            fontSize: '18px', fontWeight: '300',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>×</button>

          {/* Product name at bottom of banner */}
          <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px' }}>
            <div style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
              {productDetails.category_slug || 'Crop Produce'}
            </div>
            <h2 style={{ margin: 0, color: '#fff', fontSize: '22px', fontWeight: '800' }}>
              {productDetails.name}
            </h2>
          </div>
        </div>

        {/* STATS ROW */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0
        }}>
          {[
            { label: 'Current Bid', value: `₹${currentHighest.toLocaleString('en-IN')}`, color: '#34d399' },
            { label: 'Qty Available', value: `${productDetails.quantity} ${productDetails.unit}`, color: '#fff' },
            { label: 'Total Bids', value: bidsList.length, color: '#fff' },
          ].map((stat, i) => (
            <div key={i} style={{
              padding: '14px 0',
              textAlign: 'center',
              borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none'
            }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', marginTop: '2px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0
        }}>
          {[
            { key: 'bid', label: '🔨 Place Bid' },
            { key: 'bids', label: `📋 Bids (${bidsList.length})` },
            { key: 'report', label: '🛡 Inspection' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #34d399' : '2px solid transparent',
              color: activeTab === tab.key ? '#34d399' : '#6b7280',
              padding: '12px 0',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div style={{ overflowY: 'auto', flex: 1 }}>

          {/* PLACE BID TAB */}
          {activeTab === 'bid' && (
            <div style={{ padding: '24px' }}>
              {/* Product quick details */}
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '14px',
                padding: '14px',
                marginBottom: '20px',
                border: '1px solid rgba(255,255,255,0.07)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#9ca3af', marginBottom: '6px' }}>
                  <span>Location</span>
                  <span style={{ color: '#e5e7eb', fontWeight: '600' }}>{productDetails.location || 'APMC Market'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#9ca3af', marginBottom: '6px' }}>
                  <span>Farmer</span>
                  <span style={{ color: '#e5e7eb', fontWeight: '600' }}>{productDetails.farmer_name || '—'}</span>
                </div>
                {inspection && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#9ca3af' }}>
                    <span>Quality Grade</span>
                    <span style={{ color: '#34d399', fontWeight: '800' }}>Grade {inspection.quality_grade || 'A+'}</span>
                  </div>
                )}
              </div>

              {/* Bid form */}
              <form onSubmit={handleSubmit}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                  Your Bid Amount (₹)
                </label>
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                  <span style={{
                    position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                    color: '#34d399', fontWeight: '800', fontSize: '18px'
                  }}>₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min={currentHighest + 1}
                    placeholder={(currentHighest + 1).toString()}
                    value={bidAmount}
                    onChange={e => setBidAmount(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '16px 16px 16px 38px',
                      background: 'rgba(255,255,255,0.07)',
                      border: '1.5px solid rgba(255,255,255,0.12)',
                      borderRadius: '14px',
                      color: '#fff',
                      fontSize: '18px',
                      fontWeight: '700',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    required
                    autoFocus
                  />
                </div>

                <div style={{
                  fontSize: '12px', color: '#6b7280',
                  marginBottom: '20px', textAlign: 'center'
                }}>
                  Minimum bid: <strong style={{ color: '#34d399' }}>₹{(currentHighest + 1).toLocaleString('en-IN')}</strong>
                </div>

                <button type="submit" disabled={submitting} style={{
                  width: '100%',
                  padding: '16px',
                  background: submitting
                    ? 'rgba(52,211,153,0.3)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: '800',
                  fontSize: '16px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: submitting ? 'none' : '0 8px 24px rgba(16,185,129,0.35)',
                  transition: 'all 0.2s',
                  letterSpacing: '0.3px'
                }}>
                  {submitting ? 'Placing Bid...' : '🔨 Place Bid Now'}
                </button>
              </form>
            </div>
          )}

          {/* BIDS HISTORY TAB */}
          {activeTab === 'bids' && (
            <div style={{ padding: '20px 24px' }}>
              {bidsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#4b5563' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔇</div>
                  <div style={{ fontWeight: '700', color: '#6b7280' }}>No bids placed yet</div>
                  <div style={{ fontSize: '13px', color: '#4b5563', marginTop: '6px' }}>Be the first trader to bid!</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {bidsList.map((bid, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 16px',
                      background: idx === 0
                        ? 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.08) 100%)'
                        : 'rgba(255,255,255,0.04)',
                      borderRadius: '14px',
                      border: idx === 0 ? '1px solid rgba(52,211,153,0.25)' : '1px solid rgba(255,255,255,0.06)'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '14px', fontWeight: '700',
                          color: idx === 0 ? '#34d399' : '#e5e7eb',
                          display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                          {bid.bidder_name || `Trader #${bid.bidder_id}`}
                          {idx === 0 && (
                            <span style={{
                              fontSize: '10px', background: 'rgba(52,211,153,0.2)',
                              color: '#34d399', padding: '2px 8px', borderRadius: '50px',
                              fontWeight: '800', letterSpacing: '0.5px'
                            }}>HIGHEST</span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '3px' }}>
                          {bid.bid_time
                            ? new Date(bid.bid_time).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                            : 'Recently'}
                        </div>
                      </div>
                      <div style={{
                        fontSize: '18px', fontWeight: '900',
                        color: idx === 0 ? '#34d399' : '#9ca3af'
                      }}>
                        ₹{Number(bid.bid_amount).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* INSPECTION REPORT TAB */}
          {activeTab === 'report' && (
            <div style={{ padding: '20px 24px' }}>
              {!inspection ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#4b5563' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>📄</div>
                  <div style={{ fontWeight: '700', color: '#6b7280' }}>No inspection report yet</div>
                  <div style={{ fontSize: '13px', color: '#4b5563', marginTop: '6px' }}>Report will appear after agent inspection</div>
                </div>
              ) : (
                <div>
                  {/* Grade banner */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.1) 100%)',
                    border: '1px solid rgba(52,211,153,0.3)',
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '12px', color: '#6ee7b7', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                      Quality Grade
                    </div>
                    <div style={{ fontSize: '48px', fontWeight: '900', color: '#34d399' }}>
                      {inspection.quality_grade || 'A+'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '6px' }}>
                      Inspected Base Price: <strong style={{ color: '#e5e7eb' }}>₹{inspection.final_base_price}</strong>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    {[
                      { label: 'Freshness Score', value: inspection.freshness_score ? `${inspection.freshness_score}%` : '—' },
                      { label: 'Defect Rate', value: inspection.defect_rate !== undefined ? `${inspection.defect_rate}%` : '—' },
                    ].map((m, i) => (
                      <div key={i} style={{
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: '12px',
                        padding: '14px',
                        border: '1px solid rgba(255,255,255,0.07)',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#e5e7eb' }}>{m.value}</div>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>{m.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Notes & Recommendations */}
                  {(inspection.recommendations || inspection.notes) && (
                    <div style={{
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: '12px',
                      padding: '14px',
                      border: '1px solid rgba(255,255,255,0.07)'
                    }}>
                      {inspection.recommendations && (
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Recommendations</div>
                          <div style={{ fontSize: '13px', color: '#d1d5db', lineHeight: '1.5' }}>{inspection.recommendations}</div>
                        </div>
                      )}
                      {inspection.notes && (
                        <div>
                          <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Notes</div>
                          <div style={{ fontSize: '13px', color: '#d1d5db', lineHeight: '1.5' }}>{inspection.notes}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
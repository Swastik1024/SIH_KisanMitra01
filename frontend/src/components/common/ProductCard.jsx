import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import BidModal from './BidModal';
import { HiOutlineCheckBadge, HiOutlineEye, HiOutlineClock } from 'react-icons/hi2';
import { HiOutlineLocationMarker } from 'react-icons/hi';
import useAuthStore from '../../store/authStore';
import { approxDistanceKm, formatDistance } from '../../utils/pincodeDistance';

function getImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  return `${API_URL}${url.startsWith('/') ? url : '/' + url}`;
}

const PRODUCE_CATEGORIES = ['vegetables', 'fruits', 'grains', 'pulses', 'herbs'];

/** Extract pincode from user object or localStorage */
function getUserPincode(user) {
  if (user?.pincode) return String(user.pincode);
  // Try location string that may embed a 6-digit pincode
  if (user?.location) {
    const match = String(user.location).match(/\b(\d{6})\b/);
    if (match) return match[1];
  }
  // Fallback: read from localStorage (saved by checkout form)
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('user_pincode');
    if (saved) return saved;
  }
  return null;
}

export default function ProductCard({ product, userPincode: userPincodeProp }) {
  const router = useRouter();
  const [bidOpen, setBidOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [isEnded, setIsEnded] = useState(false);
  const { user } = useAuthStore();

  const imageUrl = product.image || product.media?.find(m => m.media_type === 'image')?.url;

  const emojiMap = {
    vegetables: '🥬',
    fruits: '🍎',
    grains: '🌾',
    pulses: '🫘',
    herbs: '🌿',
  };
  const fallbackEmoji = emojiMap[product.category_slug] || '🌾';
  const isAuction = product.auction_type && product.auction_type !== 'fixed_price' && product.auction_type !== 'fixed';
  const isProduce = PRODUCE_CATEGORIES.includes(product.category_slug);

  // ── Distance calculation (pincode-based, fully client-side) ──────────────
  const distanceKm = useMemo(() => {
    const productPin = product.pincode;
    if (!productPin || !isProduce) return null;
    const userPin = userPincodeProp || getUserPincode(user);
    if (!userPin) return null;
    return approxDistanceKm(String(userPin), String(productPin));
  }, [product.pincode, user, userPincodeProp, isProduce]);

  const distanceLabel = useMemo(() => formatDistance(distanceKm), [distanceKm]);

  // Color: green < 50 km, amber < 200 km, red for further
  const distanceStyle = useMemo(() => {
    if (distanceKm === null) return null;
    if (distanceKm < 50)  return { bg: '#f0fdf4', color: '#166534', border: '#86efac' };
    if (distanceKm < 200) return { bg: '#fefce8', color: '#854d0e', border: '#fcd34d' };
    return                       { bg: '#fff1f2', color: '#9f1239', border: '#fda4af' };
  }, [distanceKm]);

  // ── Auction countdown timer ───────────────────────────────────────────────
  useEffect(() => {
    if (!isAuction) return;

    const endTimeStr = product.end_time || product.auction?.end_time;
    let targetTime;
    if (endTimeStr) {
      targetTime = new Date(endTimeStr).getTime();
    } else {
      targetTime = Date.now() + 12 * 60 * 60 * 1000;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = targetTime - now;
      if (diff <= 0) {
        setTimeLeft('Ended');
        setIsEnded(true);
      } else {
        const hours   = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(
          `${String(hours).padStart(2,'0')}h ${String(minutes).padStart(2,'0')}m ${String(seconds).padStart(2,'0')}s`
        );
        setIsEnded(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [product, isAuction]);

  const handleNavigate = () => router.push(`/product/${product.id}`);

  if (isEnded) return null;

  return (
    <>
      <div
        className="product-card"
        onClick={handleNavigate}
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: '1px solid #f1f5f9',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
        }}
      >
        <div>
          {/* ── IMAGE / EMOJI BANNER ────────────────────────────────────── */}
          <div style={{
            height: '180px',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {imageUrl ? (
              <img
                src={getImageUrl(imageUrl)}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: '72px', filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.1))' }}>
                {fallbackEmoji}
              </span>
            )}

            {/* Quality grade badge */}
            {product.grade && (
              <div style={{
                position: 'absolute', top: '12px', left: '12px',
                background: 'rgba(255,255,255,0.92)', color: '#166534',
                fontSize: '11px', fontWeight: '800', padding: '4px 10px',
                borderRadius: '50px', backdropFilter: 'blur(4px)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                <HiOutlineCheckBadge style={{ fontSize: '14px', color: '#16a34a' }} />
                <span>Grade {product.grade}</span>
              </div>
            )}

            {/* Auction / Direct tag */}
            <div style={{
              position: 'absolute', top: '12px', right: '12px',
              background: isAuction ? '#fef3c7' : '#e0f2fe',
              color: isAuction ? '#92400e' : '#075985',
              fontSize: '11px', fontWeight: '800',
              padding: '4px 10px', borderRadius: '50px', letterSpacing: '0.3px',
            }}>
              {isAuction ? '🔨 Bidding Live' : '🛒 Direct Purchase'}
            </div>
          </div>

          {/* ── CARD INFO ───────────────────────────────────────────────── */}
          <div style={{ padding: '20px' }}>
            <div style={{
              fontSize: '11px', fontWeight: '700', color: '#059669',
              textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px',
            }}>
              {product.category_slug || 'Agri Produce'}
            </div>

            <h3 style={{
              margin: '0 0 6px 0', fontSize: '17px', fontWeight: '800',
              color: '#0f172a', lineHeight: '1.3',
            }}>
              {product.name}
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
              <span>Available: <strong style={{ color: '#334155' }}>{product.quantity} {product.unit}</strong></span>
              {product.farmer && (
                <span>• Farmer: <strong style={{ color: '#334155' }}>{product.farmer.name || 'Verified'}</strong></span>
              )}
            </div>

            {/* ⏳ Live auction countdown */}
            {isAuction && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '12px', fontWeight: '800',
                color: isEnded ? '#dc2626' : '#d97706',
                background: isEnded ? '#fef2f2' : '#fffbe3',
                border: `1px solid ${isEnded ? '#fca5a5' : '#fde68a'}`,
                padding: '4px 12px', borderRadius: '50px',
                fontVariantNumeric: 'tabular-nums',
              }}>
                <HiOutlineClock style={{ fontSize: '14px' }} />
                <span>{isEnded ? 'Auction Ended' : `Ending in: ${timeLeft}`}</span>
              </div>
            )}

            {/* 📍 Distance badge — shown for farm produce with pincode data */}
            {isProduce && distanceStyle && distanceLabel && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                marginTop: '8px',
                marginLeft: isAuction ? '8px' : '0',
                fontSize: '12px', fontWeight: '700',
                color: distanceStyle.color,
                background: distanceStyle.bg,
                border: `1px solid ${distanceStyle.border}`,
                padding: '4px 11px', borderRadius: '50px',
              }}>
                <HiOutlineLocationMarker style={{ fontSize: '13px' }} />
                <span>{distanceLabel}</span>
              </div>
            )}

            {/* Fallback: plain location text when no pincode available */}
            {isProduce && !distanceLabel && product.location && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                marginTop: isAuction ? '8px' : '4px',
                fontSize: '12px', fontWeight: '600', color: '#64748b',
              }}>
                <HiOutlineLocationMarker style={{ fontSize: '13px' }} />
                <span>{product.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── PRICE & ACTION BOTTOM BAR ────────────────────────────────── */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #f1f5f9',
          background: '#fafafa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto',
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>Price per {product.unit}</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#059669' }}>₹{product.price}</div>
          </div>

          {isAuction ? (
            <button
              onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
              style={{
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                color: '#ffffff', border: 'none', padding: '9px 18px',
                borderRadius: '12px', fontWeight: '700', fontSize: '13px',
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(217,119,6,0.25)',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              🔨 Place Bid
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff', border: 'none', padding: '9px 18px',
                borderRadius: '12px', fontWeight: '700', fontSize: '13px',
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(5,150,105,0.25)',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              <HiOutlineEye style={{ fontSize: '15px' }} /> View Crop
            </button>
          )}
        </div>

        {bidOpen && (
          <BidModal
            product={product}
            onClose={() => setBidOpen(false)}
            onBidSuccess={() => router.replace(router.asPath)}
          />
        )}
      </div>
    </>
  );
}
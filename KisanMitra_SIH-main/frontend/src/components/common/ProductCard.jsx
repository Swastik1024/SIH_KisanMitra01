import { useState } from 'react';
import { useRouter } from 'next/router';
import BidModal from './BidModal';

function getImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  return `${API_URL}${url.startsWith('/') ? url : '/' + url}`;
}

const PRODUCE_CATEGORIES = ['vegetables', 'fruits', 'grains', 'pulses', 'herbs'];

export default function ProductCard({ product }) {
  const router = useRouter();
  const [bidOpen, setBidOpen] = useState(false);

  const imageUrl = product.image || product.media?.find(m => m.media_type === 'image')?.url;

  const emojiMap = {
    vegetables: '🥬',
    fruits: '🍎',
    grains: '🌾',
    pulses: '🫘',
    herbs: '🌿',
  };
  const fallbackEmoji = emojiMap[product.category_slug] || '🌾';

  const isAuction = product.auction_type === 'auction';
  const isProduce = PRODUCE_CATEGORIES.includes(product.category_slug);

  const handleBuy = () => {
    // Navigate to product detail page
    router.push(`/product/${product.id}`);
  };

  return (
    <>
      <div
        className="product-card"
        onClick={() => router.push(`/product/${product.id}`)}
        style={{ cursor: 'pointer' }}
      >
        <div className="product-image">
          {imageUrl ? (
            <img
              src={getImageUrl(imageUrl)}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span className="product-emoji">{fallbackEmoji}</span>
          )}
        </div>
        <div className="product-info">
          <div className="product-category">{product.category_slug}</div>
          <div className="product-name">{product.name}</div>

          <div style={{ color: '#89948e', fontSize: '12px', marginTop: '4px' }}>
            Available: {product.quantity} {product.unit}
          </div>

          <div className="product-rating">
            <span className="stars">★</span>
            <span>{product.rating || 0}</span>
          </div>

          <div className="product-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="product-price">₹{product.price}</span>
              <span className="unit"> / {product.unit}</span>
            </div>

            {isAuction ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setBidOpen(true);
                }}
                style={bidButtonStyle}
              >
                Place Bid
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleBuy();
                }}
                style={buyButtonStyle}
              >
                View Details
              </button>
            )}
          </div>
        </div>
      </div>

      {bidOpen && (
        <BidModal
          product={product}
          onClose={() => setBidOpen(false)}
          onBidSuccess={() => router.replace(router.asPath)}
        />
      )}
    </>
  );
}

const bidButtonStyle = {
  background: '#eaf8f0',
  color: '#198754',
  border: 'none',
  padding: '6px 12px',
  borderRadius: '8px',
  fontWeight: '700',
  cursor: 'pointer',
  fontSize: '12px',
};

const buyButtonStyle = {
  background: '#2d6a4f',
  color: '#fff',
  border: 'none',
  padding: '6px 12px',
  borderRadius: '8px',
  fontWeight: '700',
  cursor: 'pointer',
  fontSize: '12px',
};
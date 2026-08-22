import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HiOutlineClock } from 'react-icons/hi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function AuctionCard({ auction }) {
  const [timeLeft, setTimeLeft] = useState('');
  const product = auction.product;
  const imageUrl = product?.media?.find(m => m.media_type === 'image')?.url;
  const fullImage = imageUrl ? `${API_BASE_URL}${imageUrl}` : '';

  useEffect(() => {
    const update = () => {
      const remaining = new Date(auction.end_time).getTime() - Date.now();
      if (remaining <= 0) {
        setTimeLeft('Ended');
      } else {
        const seconds = Math.floor(remaining / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        setTimeLeft(`${mins}m ${secs}s`);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [auction.end_time]);

  return (
    <Link href={`/dashboard/trader/auction/${auction.id}`} style={{ textDecoration: 'none' }}>
      <div className="product-card" style={{ borderColor: '#f4a261' }}>
        <div className="product-image" style={{ background: 'linear-gradient(135deg, #fff5e8, #ffe0c2)' }}>
          {fullImage ? (
            <img src={fullImage} alt={product?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span className="product-emoji">⏳</span>
          )}
          <span className="product-badge badge-auction">Live Auction</span>
        </div>
        <div className="product-info">
          <div className="product-category">Auction</div>
          <div className="product-name">{product?.name || 'Unknown Product'}</div>
          <div className="product-bottom">
            <div>
              <span className="product-price">₹{auction.current_highest_bid || auction.base_price}</span>
              <span className="unit"> current</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#e76f51', fontSize: '14px', fontWeight: '700' }}>
              <HiOutlineClock />
              {timeLeft}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
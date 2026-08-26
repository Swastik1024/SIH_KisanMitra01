import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HiOutlineClock, HiOutlineSparkles, HiOutlineTag } from 'react-icons/hi2';

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
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
        transition: 'all 0.3s ease',
        border: '1.5px solid #fde68a',
        display: 'flex',
        flexDirection: 'column',
        justify: 'space-between',
        cursor: 'pointer'
      }}>
        <div>
          {/* HEADER IMAGE */}
          <div style={{
            height: '180px',
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justify: 'center'
          }}>
            {fullImage ? (
              <img src={fullImage} alt={product?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '72px', filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.1))' }}>⏳</span>
            )}

            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: '800',
              padding: '5px 12px',
              borderRadius: '50px',
              boxShadow: '0 4px 10px rgba(217,119,6,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <HiOutlineSparkles /> Live Auction
            </div>
          </div>

          {/* CONTENT */}
          <div style={{ padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
              Auction #{auction.id}
            </div>

            <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
              {product?.name || 'Crop Produce'}
            </h3>

            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
              Quantity: <strong style={{ color: '#334155' }}>{product?.quantity || auction.quantity} {product?.unit || 'kg'}</strong>
            </div>
          </div>
        </div>

        {/* BOTTOM TIMING & BID PRICE */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #fef3c7',
          background: '#fffdf5',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#b45309', fontWeight: '600' }}>Current Top Bid</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#92400e' }}>
              ₹{auction.current_highest_bid || auction.base_price}
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#fef3c7',
            color: '#b45309',
            padding: '8px 14px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '800'
          }}>
            <HiOutlineClock style={{ fontSize: '16px' }} />
            {timeLeft}
          </div>
        </div>
      </div>
    </Link>
  );
}
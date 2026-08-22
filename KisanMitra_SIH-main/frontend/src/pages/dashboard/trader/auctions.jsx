import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/common/Header';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineClock } from 'react-icons/hi';

export default function TraderAuctions() {
  const router = useRouter();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const { isAuthenticated, user, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
    const timer = setTimeout(() => setAuthReady(true), 100);
    return () => clearTimeout(timer);
  }, [hydrate]);

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated || user?.role !== 'trader') {
      router.replace('/login');
      return;
    }
    fetchLiveAuctions();
  }, [authReady, isAuthenticated, user, router]);

  const fetchLiveAuctions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/auctions/live');
      setAuctions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to load auctions:', error);
      if (error.response?.status === 401) {
        useAuthStore.getState().logout();
        router.replace('/login');
      } else {
        toast.error('Failed to load auctions');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!authReady || !isAuthenticated || user?.role !== 'trader') {
    return (
      <div>
        <Header />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f1' }}>
          <p style={{ color: '#2d6a4f', fontWeight: '600' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div style={{ minHeight: '100vh', background: '#f0f4f1', paddingTop: '100px', paddingBottom: '40px', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px' }}>
          <Link href="/dashboard/trader" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>
            <button style={{ background: 'white', border: '1px solid #e9ecef', borderRadius: '50px', padding: '10px 18px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', color: '#1b4332', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <HiOutlineArrowLeft style={{ marginRight: '6px' }} />
              Back
            </button>
          </Link>

          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1b4332', marginBottom: '24px' }}>
            Live Auctions
          </h1>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#636e72' }}>Loading auctions...</div>
          ) : auctions.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', color: '#636e72' }}>
              <HiOutlineClock style={{ fontSize: '48px', marginBottom: '16px', color: '#2d6a4f' }} />
              <p style={{ fontSize: '16px' }}>No live auctions at the moment.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {auctions.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// AuctionCard component with live countdown
function AuctionCard({ auction }) {
  const [timeLeft, setTimeLeft] = useState('');

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

  const product = auction.product || {};
  const imageUrl = product?.media?.find(m => m.media_type === 'image')?.url;
  const fullImage = imageUrl ? `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}${imageUrl}` : '';

  return (
    <Link href={`/dashboard/trader/auction/${auction.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        transition: 'transform 0.2s',
        border: '1px solid #f4a261',
        cursor: 'pointer',
      }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        {/* Image */}
        <div style={{ height: '140px', background: 'linear-gradient(135deg, #fff5e8, #ffe0c2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px', position: 'relative' }}>
          {fullImage ? (
            <img src={fullImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            '⏳'
          )}
          <span style={{ position: 'absolute', top: '10px', left: '10px', background: '#f4a261', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
            LIVE
          </span>
        </div>

        {/* Info */}
        <div style={{ padding: '14px' }}>
          <div style={{ fontSize: '13px', color: '#636e72' }}>{product.name || 'Unknown Product'}</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#1b4332', marginTop: '4px' }}>
            ₹{auction.current_highest_bid || auction.base_price}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#e76f51', fontSize: '13px', fontWeight: '700', marginTop: '6px' }}>
            <HiOutlineClock size={14} />
            {timeLeft}
          </div>
        </div>
      </div>
    </Link>
  );
}
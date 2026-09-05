import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/common/Header';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineTag } from 'react-icons/hi';
import { useLanguage } from '../../../context/LanguageContext';

export default function TraderBids() {
  const router = useRouter();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user, hydrate } = useAuthStore();
  const { t } = useLanguage();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const fetchBids = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/auctions/my-bids');
      setBids(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to load bids:', error);
      if (error.response?.status === 401) {
        toast.error(t('common.sessionExpired'));
        useAuthStore.getState().logout();
        router.replace('/login');
      } else {
        toast.error('Failed to load bids');
      }
    } finally {
      setLoading(false);
    }
  }, [router, t]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'trader') {
      router.replace('/dashboard/' + user?.role);
      return;
    }
    fetchBids();
  }, [isAuthenticated, user, router, fetchBids]);

  return (
    <div>
      <Header />
      <div style={{
        minHeight: '100vh',
        background: '#f0f4f1',
        paddingTop: '100px',
        paddingBottom: '40px',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px' }}>
          <Link href="/dashboard/trader" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>
            <button style={{
              background: 'white',
              border: '1px solid #e9ecef',
              borderRadius: '50px',
              padding: '10px 18px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '700',
              color: '#1b4332',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}>
              <HiOutlineArrowLeft style={{ marginRight: '6px' }} />
              Back
            </button>
          </Link>

          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1b4332', marginBottom: '24px' }}>
            My Bids
          </h1>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#636e72' }}>
              Loading bids...
            </div>
          ) : bids.length === 0 ? (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '40px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              color: '#636e72',
            }}>
              <HiOutlineTag style={{ fontSize: '48px', marginBottom: '16px', color: '#2d6a4f' }} />
              <p style={{ fontSize: '16px' }}>No bids yet</p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>
                Your auction bids will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {bids.map((bid) => (
                <div key={bid.id} style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#2d3436', margin: 0 }}>
                        Auction #{bid.auction_id}
                      </h3>
                      <p style={{ fontSize: '13px', color: '#636e72', margin: '4px 0 0' }}>
                        {new Date(bid.bid_time).toLocaleDateString('en-IN')} at {new Date(bid.bid_time).toLocaleTimeString('en-IN')}
                      </p>
                    </div>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '50px',
                      fontSize: '12px',
                      fontWeight: '700',
                      background: bid.is_winning ? '#d4edda' : '#e9ecef',
                      color: bid.is_winning ? '#155724' : '#495057',
                    }}>
                      {bid.is_winning ? 'Winning' : 'Bid'}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    paddingTop: '8px',
                    borderTop: '1px solid #e9ecef',
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#636e72' }}>Your Bid</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#2d6a4f' }}>₹{bid.bid_amount}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#636e72' }}>Auction Status</div>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>{bid.auction?.status || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#636e72' }}>Current Highest</div>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>₹{bid.auction?.current_highest_bid || '—'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
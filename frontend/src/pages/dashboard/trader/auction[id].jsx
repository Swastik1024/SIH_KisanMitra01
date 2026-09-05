import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/common/Header';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineCheckCircle, HiOutlineClock, HiOutlineDocumentReport } from 'react-icons/hi';

function getImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  return `${API_URL}${url.startsWith('/') ? url : '/' + url}`;
}

export default function AuctionDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidAmount, setBidAmount] = useState('');
  const [timeLeft, setTimeLeft] = useState('');
  const [authReady, setAuthReady] = useState(false);
  const socketRef = useRef(null);
  const { isAuthenticated, user, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
    const timer = setTimeout(() => setAuthReady(true), 100);
    return () => clearTimeout(timer);
  }, [hydrate]);

  const startCountdown = useCallback((endTime) => {
    if (!endTime) return;
    const interval = setInterval(() => {
      const remaining = new Date(endTime).getTime() - Date.now();
      if (remaining <= 0) {
        setTimeLeft('Ended');
        clearInterval(interval);
      } else {
        const seconds = Math.floor(remaining / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        setTimeLeft(`${mins}m ${secs}s`);
      }
    }, 1000);
  }, []);

  useEffect(() => {
    if (!authReady || !id) return;
    if (!isAuthenticated || user?.role !== 'trader') {
      router.replace('/login');
      return;
    }

    const fetchAuction = async () => {
      try {
        const res = await api.get(`/api/auctions/${id}`);
        setAuction(res.data);
        if (res.data.bids) {
          setBids(res.data.bids);
        }
        startCountdown(res.data.end_time);
      } catch (error) {
        console.error('Failed to load auction:', error);
        toast.error('Failed to load auction details');
      }
    };
    fetchAuction();

    // Connect WebSocket
    const token = localStorage.getItem('token');
    const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL || 
      (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/^http/, 'ws') : 'ws://127.0.0.1:8000');
    const ws = new WebSocket(`${wsBaseUrl}/ws/auctions/${id}?token=${token}`);
    socketRef.current = ws;

    ws.onopen = () => console.log('WebSocket connected');
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'auction_state') {
        setAuction(message.data);
        if (message.data.bids) setBids(message.data.bids);
        startCountdown(message.data.end_time);
      } else if (message.type === 'new_bid') {
        setBids((prev) => [message.data, ...prev]);
        setAuction((prev) => ({
          ...prev,
          current_highest_bid: message.data.bid_amount,
          current_highest_bidder_id: message.data.bidder_id,
          end_time: message.data.end_time,
        }));
        startCountdown(message.data.end_time);
        toast.success(`🎉 New bid placed: ₹${message.data.bid_amount}`);
      } else if (message.type === 'error') {
        toast.error(message.message);
      }
    };
    ws.onclose = () => console.log('WebSocket disconnected');

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, [authReady, id, isAuthenticated, user, router, startCountdown]);

  const placeBid = () => {
    const amount = parseFloat(bidAmount);
    const currentHighest = auction?.current_highest_bid || auction?.base_price || 0;

    if (isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid bid amount');
      return;
    }
    if (amount <= currentHighest) {
      toast.error(`Bid must be greater than current bid (₹${currentHighest})`);
      return;
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'place_bid', bid_amount: amount }));
      setBidAmount('');
    } else {
      // Fallback to REST API
      api.post(`/api/auctions/${id}/bid`, { bid_amount: amount })
        .then(() => {
          toast.success('🎉 Bid placed successfully!');
          setBidAmount('');
          // Refresh details
          api.get(`/api/auctions/${id}`).then((res) => {
            setAuction(res.data);
            if (res.data.bids) setBids(res.data.bids);
          });
        })
        .catch((err) => toast.error(err.response?.data?.detail || 'Failed to place bid'));
    }
  };

  if (!authReady || !isAuthenticated || user?.role !== 'trader') {
    return (
      <div>
        <Header />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
          <p style={{ color: '#059669', fontWeight: '600' }}>Loading auction...</p>
        </div>
      </div>
    );
  }

  const product = auction?.product;
  const imageUrl = product?.image || product?.media?.find(m => m.media_type === 'image')?.url;
  const inspection = product?.inspection_report;
  const currentHighest = auction?.current_highest_bid || auction?.base_price || 0;

  return (
    <div>
      <Header />
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', paddingTop: '100px', paddingBottom: '60px', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
        <div style={{ maxWidth: '840px', margin: '0 auto', padding: '0 20px' }}>
          
          <Link href="/dashboard/trader/auctions" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>
            <button style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '50px', padding: '9px 18px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', color: '#0f172a', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <HiOutlineArrowLeft /> Back to Auctions
            </button>
          </Link>

          {auction ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* HEADER PRODUCT SUMMARY CARD */}
              <div style={{ background: '#ffffff', borderRadius: '24px', padding: '28px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#d97706', background: '#fef3c7', padding: '4px 12px', borderRadius: '50px', textTransform: 'uppercase' }}>
                      🔨 Live Auction Bidding
                    </span>
                    <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '8px 0 4px 0' }}>
                      {product?.name || `Auction #${auction.id}`}
                    </h1>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>
                      Quantity: <strong>{product?.quantity || auction.quantity} {product?.unit || 'kg'}</strong> • Location: <strong>{product?.location || 'APMC Market'}</strong>
                    </div>
                  </div>

                  <div style={{ background: '#fef3c7', padding: '12px 20px', borderRadius: '16px', border: '1px solid #fde68a', textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#b45309', fontWeight: '700', textTransform: 'uppercase' }}>Auction Time Remaining</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                      <HiOutlineClock /> {timeLeft || 'Active'}
                    </div>
                  </div>
                </div>

                {imageUrl && (
                  <div style={{ height: '240px', borderRadius: '16px', overflow: 'hidden', marginTop: '20px', background: '#f1f5f9' }}>
                    <img src={getImageUrl(imageUrl)} alt={product?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>

              {/* INSPECTION REPORT CARD */}
              {inspection && (
                <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '24px', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: '800', fontSize: '17px', marginBottom: '12px' }}>
                    <HiOutlineCheckCircle size={22} style={{ color: '#16a34a' }} />
                    Official Quality Inspection Report
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', fontSize: '14px' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Quality Grade: </span>
                      <strong style={{ color: '#166534', background: '#dcfce7', padding: '3px 10px', borderRadius: '50px', fontWeight: '800' }}>
                        Grade {inspection.quality_grade || 'A+'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Inspected Base Price: </span>
                      <strong style={{ color: '#0f172a' }}>₹{inspection.final_base_price}</strong>
                    </div>
                    {inspection.freshness_score && (
                      <div>
                        <span style={{ color: '#64748b' }}>Freshness Score: </span>
                        <strong style={{ color: '#0f172a' }}>{inspection.freshness_score}%</strong>
                      </div>
                    )}
                    {inspection.defect_rate !== undefined && (
                      <div>
                        <span style={{ color: '#64748b' }}>Defect Rate: </span>
                        <strong style={{ color: '#0f172a' }}>{inspection.defect_rate}%</strong>
                      </div>
                    )}
                  </div>

                  {inspection.recommendations && (
                    <div style={{ fontSize: '13px', color: '#15803d', marginTop: '12px', background: '#ffffff', padding: '10px 14px', borderRadius: '12px', border: '1px solid #dcfce7' }}>
                      <strong>Recommendations:</strong> {inspection.recommendations}
                    </div>
                  )}
                </div>
              )}

              {/* BIDDING INPUT & HIGHEST BID */}
              <div style={{ background: '#ffffff', borderRadius: '24px', padding: '28px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)', border: '1.5px solid #dcfce7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Current Highest Bid</div>
                    <div style={{ fontSize: '28px', fontWeight: '900', color: '#059669' }}>
                      ₹{currentHighest}
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', background: '#f8fafc', padding: '8px 14px', borderRadius: '12px' }}>
                    Reserve / Base: <strong>₹{auction.base_price}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <input
                    type="number"
                    step="0.01"
                    min={currentHighest + 1}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`Enter bid amount (> ₹${currentHighest})`}
                    style={{ flex: 1, minWidth: '220px', padding: '14px 20px', borderRadius: '50px', border: '1.5px solid #cbd5e1', fontSize: '15px', fontWeight: '700', outline: 'none' }}
                  />
                  <button
                    onClick={placeBid}
                    style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: 'white', border: 'none', borderRadius: '50px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', boxShadow: '0 6px 20px rgba(5,150,105,0.3)' }}
                  >
                    🔨 Place Bid
                  </button>
                </div>
              </div>

              {/* PLACED BIDS HISTORY */}
              <div style={{ background: '#ffffff', borderRadius: '24px', padding: '28px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0' }}>
                  📋 All Placed Bids History ({bids.length})
                </h3>

                {bids.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No bids placed yet. Be the first trader to bid!</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {bids.map((bid, index) => (
                      <div key={index} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px 18px', borderRadius: '14px',
                        background: index === 0 ? '#f0fdf4' : '#f8fafc',
                        border: index === 0 ? '1.5px solid #bbf7d0' : '1px solid #f1f5f9'
                      }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                            {bid.bidder_name || `Trader #${bid.bidder_id}`}
                            {index === 0 && <span style={{ fontSize: '12px', color: '#16a34a', marginLeft: '8px', fontWeight: '700' }}>(Highest Bidder)</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            {bid.bid_time ? new Date(bid.bid_time).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                          </div>
                        </div>

                        <div style={{ fontSize: '18px', fontWeight: '900', color: index === 0 ? '#059669' : '#334155' }}>
                          ₹{bid.bid_amount}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading auction details...</div>
          )}
        </div>
      </div>
    </div>
  );
}
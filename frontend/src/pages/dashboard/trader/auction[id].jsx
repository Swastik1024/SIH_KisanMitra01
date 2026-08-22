import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/common/Header';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft } from 'react-icons/hi';

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

  useEffect(() => {
    if (!authReady || !id) return;
    if (!isAuthenticated || user?.role !== 'trader') {
      router.replace('/login');
      return;
    }

    // Fetch auction details
    const fetchAuction = async () => {
      try {
        const res = await api.get(`/api/auctions/${id}`);
        setAuction(res.data);
        startCountdown(res.data.end_time);
      } catch (error) {
        console.error('Failed to load auction:', error);
        toast.error('Failed to load auction');
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
        startCountdown(message.data.end_time);
      } else if (message.type === 'new_bid') {
        setBids((prev) => [...prev, message.data]);
        setAuction((prev) => ({
          ...prev,
          current_highest_bid: message.data.bid_amount,
          current_highest_bidder_id: message.data.bidder_id,
          end_time: message.data.end_time,
        }));
        startCountdown(message.data.end_time);
        toast.success(`New bid: ₹${message.data.bid_amount}`);
      } else if (message.type === 'error') {
        toast.error(message.message);
      }
    };
    ws.onclose = () => console.log('WebSocket disconnected');

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, [authReady, id, isAuthenticated, user, router]);

  const startCountdown = (endTime) => {
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
  };

  const placeBid = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      toast.error('WebSocket not connected');
      return;
    }
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid bid');
      return;
    }
    socketRef.current.send(JSON.stringify({ type: 'place_bid', bid_amount: amount }));
    setBidAmount('');
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
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 20px' }}>
          <Link href="/dashboard/trader/auctions" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>
            <button style={{ background: 'white', border: '1px solid #e9ecef', borderRadius: '50px', padding: '10px 18px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', color: '#1b4332', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <HiOutlineArrowLeft style={{ marginRight: '6px' }} />
              Back
            </button>
          </Link>

          {auction ? (
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1b4332', margin: 0 }}>
                Auction #{auction.auction_id || id}
              </h1>
              <p style={{ color: '#636e72', marginTop: '8px' }}>Base Price: ₹{auction.base_price}</p>
              <p style={{ color: '#636e72', marginTop: '4px' }}>Current Bid: ₹{auction.current_highest_bid || 'No bids yet'}</p>
              <p style={{ color: '#636e72', marginTop: '4px' }}>Time Left: {timeLeft || 'Calculating...'}</p>

              {user?.role === 'trader' && (
                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="Enter bid amount"
                    style={{ flex: 1, padding: '12px 16px', borderRadius: '50px', border: '2px solid #e9ecef', fontSize: '15px', outline: 'none' }}
                  />
                  <button onClick={placeBid} style={{ padding: '12px 24px', background: '#2d6a4f', color: 'white', border: 'none', borderRadius: '50px', fontWeight: '700', cursor: 'pointer' }}>
                    Place Bid
                  </button>
                </div>
              )}

              <div style={{ marginTop: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1b4332' }}>Bid History</h2>
                {bids.length === 0 ? (
                  <p style={{ color: '#636e72' }}>No bids yet.</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {bids.map((bid, index) => (
                      <li key={index} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: '14px' }}>
                        Bidder {bid.bidder_id} bid ₹{bid.bid_amount} at {new Date(bid.bid_time).toLocaleTimeString('en-IN')}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <p style={{ textAlign: 'center', padding: '40px', color: '#636e72' }}>Loading auction...</p>
          )}
        </div>
      </div>
    </div>
  );
}
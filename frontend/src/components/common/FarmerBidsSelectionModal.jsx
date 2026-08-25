import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Award, User, RefreshCw, Clock } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function FarmerBidsSelectionModal({ auctionId, onClose, onAccepted }) {
  const [bidsData, setBidsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const fetchBids = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/farmer/auctions/${auctionId}/bids`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBidsData(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load bids for this crop');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auctionId) fetchBids();
  }, [auctionId]);

  const handleAcceptBid = async (bidId) => {
    setActionId(bidId);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE_URL}/api/farmer/bids/${bidId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message || 'Offer accepted! Order created for delivery.');
      if (onAccepted) onAccepted(res.data);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to accept bid offer');
    } finally {
      setActionId(null);
    }
  };

  const handleRejectBid = async (bidId) => {
    setActionId(bidId);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/farmer/bids/${bidId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Bid offer rejected');
      fetchBids();
    } catch (err) {
      console.error(err);
      toast.error('Failed to reject bid offer');
    } finally {
      setActionId(null);
    }
  };

  if (!auctionId) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '640px', width: '100%',
        padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', pb: '12px', mb: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#059669', fontWeight: '700' }}>FARMER OFFER SELECTION</div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', margin: 0 }}>
              {bidsData?.product_name || 'Crop Listing Bids'}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
            <RefreshCw className="animate-spin" size={24} style={{ marginBottom: '8px', display: 'inline-block' }} />
            <div>Fetching trader offers...</div>
          </div>
        ) : !bidsData || bidsData.bids.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
            <Clock size={36} style={{ color: '#9ca3af', marginBottom: '8px', display: 'inline-block' }} />
            <div style={{ fontSize: '15px', fontWeight: '600' }}>No bids placed yet</div>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
              Traders will submit bids on your crop listing during the live auction.
            </div>
          </div>
        ) : (
          <div>
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <div>Base Price: <strong>₹{bidsData.base_price}</strong></div>
              <div>Reserve Price: <strong>₹{bidsData.reserve_price || 'None'}</strong></div>
              <div>Total Bids: <strong>{bidsData.bids.length}</strong></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {bidsData.bids.map((b, idx) => {
                const isAccepted = b.status === 'accepted';
                const isRejected = b.status === 'rejected';

                return (
                  <div key={b.id} style={{
                    backgroundColor: isAccepted ? '#f0fdf4' : '#ffffff',
                    border: `1px solid ${isAccepted ? '#bbf7d0' : '#e5e7eb'}`,
                    borderRadius: '12px', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={16} style={{ color: '#059669' }} />
                        <span style={{ fontWeight: '700', fontSize: '15px', color: '#111827' }}>{b.bidder_name}</span>
                        {idx === 0 && <span style={{ backgroundColor: '#fef3c7', color: '#d97706', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px' }}>Highest Offer</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                        Submitted {b.bid_time}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#059669' }}>₹{b.bid_amount}</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>per unit</div>
                      </div>

                      {isAccepted ? (
                        <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={16} /> Offer Accepted
                        </span>
                      ) : isRejected ? (
                        <span style={{ backgroundColor: '#f3f4f6', color: '#9ca3af', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>
                          Rejected
                        </span>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleRejectBid(b.id)}
                            disabled={actionId === b.id}
                            style={{
                              backgroundColor: '#fff', border: '1px solid #d1d5db', color: '#6b7280',
                              borderRadius: '8px', padding: '8px 12px', fontSize: '13px', cursor: 'pointer'
                            }}
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleAcceptBid(b.id)}
                            disabled={actionId === b.id}
                            style={{
                              backgroundColor: '#059669', border: 'none', color: '#ffffff',
                              borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '700',
                              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'
                            }}
                          >
                            <Award size={16} /> Accept Offer & Sell
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

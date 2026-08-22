import { useState } from 'react';
import { HiOutlineX } from 'react-icons/hi';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function BidModal({ product, onClose, onBidSuccess }) {
  const [bidAmount, setBidAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentHighest = product.current_highest_bid || product.base_price || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      toast.error('Enter a valid bid amount');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/api/auctions/${product.id}/bid`, {
        bid_amount: parseFloat(bidAmount),
      });
      toast.success('Bid placed successfully');
      if (onBidSuccess) onBidSuccess();
      onClose();
    } catch (error) {
      console.error('Bid error:', error);
      toast.error(error.response?.data?.detail || 'Failed to place bid');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>Place Bid</h3>
          <button style={styles.closeBtn} onClick={onClose}>
            <HiOutlineX size={20} />
          </button>
        </div>

        <p style={styles.productName}>{product.name}</p>
        <p style={styles.currentBid}>Current Highest Bid: ₹{currentHighest}</p>

        <form onSubmit={handleSubmit}>
          <input
            type="number"
            step="0.01"
            placeholder="Your bid amount"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            style={styles.input}
            required
          />
          <button type="submit" disabled={submitting} style={styles.button}>
            {submitting ? 'Placing Bid...' : 'Place Bid'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  },
  card: {
    background: '#fff',
    borderRadius: '20px',
    maxWidth: '400px',
    width: '100%',
    padding: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  title: {
    margin: 0,
    color: '#173b2a',
    fontSize: '20px',
    fontWeight: '850',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#526058',
  },
  productName: {
    margin: '0 0 5px',
    color: '#173b2a',
    fontWeight: '800',
    fontSize: '16px',
  },
  currentBid: {
    color: '#718078',
    fontSize: '14px',
    marginBottom: '15px',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #dbe6de',
    borderRadius: '10px',
    fontSize: '14px',
    outline: 'none',
    background: '#f9fbfa',
    color: '#243b30',
    marginBottom: '10px',
  },
  button: {
    width: '100%',
    background: '#2d6a4f',
    color: '#fff',
    border: 'none',
    padding: '12px',
    borderRadius: '10px',
    fontWeight: '700',
    cursor: 'pointer',
  },
};
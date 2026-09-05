import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/common/Header';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineCash,
  HiOutlineCreditCard,
  HiOutlineDeviceMobile,
  HiOutlineCurrencyRupee,
  HiOutlineX,
} from 'react-icons/hi';

function getImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  return `${API_URL}${url.startsWith('/') ? url : '/' + url}`;
}

const PRODUCE_CATEGORIES = ['vegetables', 'fruits', 'grains', 'pulses', 'herbs'];

export default function CheckoutPage() {
  const router = useRouter();
  const { product_id, quantity } = router.query;
  const { isAuthenticated, user, hydrate } = useAuthStore();

  const [product, setProduct] = useState(null);
  const [form, setForm] = useState({
    delivery_address: '',
    delivery_city: '',
    delivery_state: '',
    delivery_pincode: '',
    delivery_phone: '',
    payment_method: 'cod',
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [onlineMethod, setOnlineMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState({
    upi_id: '',
    bank_name: '',
    account_holder: '',
    account_number: '',
    ifsc_code: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [weightKg, setWeightKg] = useState(0);
  const [weightCharge, setWeightCharge] = useState(0);
  const [distanceCharge, setDistanceCharge] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Persist pincode so ProductCard can compute distance from trader to farm
    if (name === 'delivery_pincode' && value.length === 6 && /^\d{6}$/.test(value)) {
      localStorage.setItem('user_pincode', value);
    }
  };

  const handlePaymentDetailsChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const fetchProduct = useCallback(async () => {
    try {
      const res = await api.get(`/api/products/${product_id}`);
      const data = res.data;
      const isAuction = data.auction_type && data.auction_type !== 'fixed_price' && data.auction_type !== 'fixed';
      if (isAuction) {
        toast.error('Auction products cannot be purchased directly. Please place a bid in the live auction.');
        if (data.auction?.id) {
          router.push(`/dashboard/trader/auction/${data.auction.id}`);
        } else {
          router.push('/dashboard/trader');
        }
        return;
      }
      setProduct(data);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Product not found');
      router.push('/dashboard/farmer');
    }
  }, [product_id, router]);

  const fetchDeliveryCharge = useCallback(async () => {
    if (
      !product ||
      !form.delivery_address ||
      !form.delivery_city ||
      !form.delivery_state ||
      !form.delivery_pincode
    ) {
      setDeliveryCharge(0);
      setDistanceKm(0);
      setWeightKg(0);
      setWeightCharge(0);
      setDistanceCharge(0);
      return;
    }

    setIsCalculating(true);
    try {
      const res = await api.post('/api/utils/delivery-charge', {
        product_id: product.id,
        quantity: Number(quantity || 1),
        delivery_address: form.delivery_address,
        delivery_city: form.delivery_city,
        delivery_state: form.delivery_state,
        delivery_pincode: form.delivery_pincode,
      });

      setDeliveryCharge(res.data.delivery_charge);
      setDistanceKm(res.data.distance_km);
      setWeightKg(res.data.weight_kg);
      setWeightCharge(res.data.weight_charge);
      setDistanceCharge(res.data.distance_charge);
    } catch (error) {
      console.error('Failed to calculate delivery charge:', error);
      // fallback to local calculation
      setDeliveryCharge(0);
    } finally {
      setIsCalculating(false);
    }
  }, [product, form.delivery_address, form.delivery_city, form.delivery_state, form.delivery_pincode, quantity]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!['farmer', 'trader'].includes(user?.role)) {
      router.replace('/dashboard/' + user?.role);
      return;
    }
    if (product_id) fetchProduct();
  }, [isAuthenticated, user, product_id, router, fetchProduct]);

  useEffect(() => {
    if (user?.phone) {
      setForm((prev) => prev.delivery_phone ? prev : { ...prev, delivery_phone: user.phone });
    }
  }, [user?.phone]);

  useEffect(() => {
    if (product) {
      fetchDeliveryCharge();
    }
  }, [product, fetchDeliveryCharge]);

  const productTotal = product ? product.price * Number(quantity || 1) : 0;

  const platformFee =
    product && PRODUCE_CATEGORIES.includes(product.category_slug || '')
      ? Math.max(Number(productTotal) * 0.02, 100)
      : 0;

  const totalPayable = productTotal + deliveryCharge + platformFee;

  const validateDelivery = () => {
    if (
      !form.delivery_address ||
      !form.delivery_city ||
      !form.delivery_state ||
      !form.delivery_pincode ||
      !form.delivery_phone
    ) {
      toast.error('Please fill all delivery fields');
      return false;
    }
    return true;
  };

  const placeOrder = async (paymentMethod, transactionId = null) => {
    setSubmitting(true);
    try {
      await api.post('/api/farmer/orders', {
        product_id: Number(product_id),
        quantity: Number(quantity || 1),
        delivery_address: form.delivery_address,
        delivery_city: form.delivery_city,
        delivery_state: form.delivery_state,
        delivery_pincode: form.delivery_pincode,
        delivery_phone: form.delivery_phone,
        payment_method: paymentMethod,
        payment_status: transactionId ? 'held' : 'pending',
        payment_transaction_id: transactionId,
      });
      toast.success('Order placed successfully');
      router.push(`/dashboard/${user?.role || 'farmer'}`);
    } catch (error) {
      console.error('Order error:', error);
      toast.error(error.response?.data?.detail || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCodSubmit = (e) => {
    e.preventDefault();
    if (!validateDelivery()) return;
    setShowConfirmModal(true);
  };

  const handleOnlinePay = () => {
    if (!validateDelivery()) return;

    if (!onlineMethod) {
      toast.error('Please select UPI or Net Banking');
      return;
    }

    if (onlineMethod === 'upi' && !paymentDetails.upi_id.trim()) {
      toast.error('Please enter your UPI ID');
      return;
    }

    if (onlineMethod === 'net_banking') {
      if (
        !paymentDetails.bank_name.trim() ||
        !paymentDetails.account_holder.trim() ||
        !paymentDetails.account_number.trim() ||
        !paymentDetails.ifsc_code.trim()
      ) {
        toast.error('Please fill all Net Banking details');
        return;
      }
    }

    setShowPaymentModal(false);
    setShowConfirmModal(true);
  };

  const handleConfirmOrder = async () => {
    setSubmitting(true);
    try {
      if (form.payment_method === 'cod') {
        await placeOrder('cod');
      } else {
        const paymentRes = await api.post('/api/payments/mock', {
          amount: totalPayable,
          method: onlineMethod,
        });

        if (paymentRes.data.success) {
          await placeOrder(onlineMethod, paymentRes.data.transaction_id);
        } else {
          throw new Error('Payment failed');
        }
      }
    } catch (error) {
      console.error('Order error:', error);
      toast.error(error.response?.data?.detail || 'Failed to place order');
    } finally {
      setSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  const openPaymentModal = () => {
    setOnlineMethod('');
    setPaymentDetails({
      upi_id: '',
      bank_name: '',
      account_holder: '',
      account_number: '',
      ifsc_code: '',
    });
    setShowPaymentModal(true);
  };

  if (!product) {
    return (
      <>
        <Header />
        <main style={styles.page}>
          <div style={styles.loading}>Loading checkout...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main style={styles.page}>
        <div style={styles.container}>
          <button style={styles.backButton} onClick={() => router.back()}>
            <HiOutlineArrowLeft size={18} />
            Back
          </button>

          <h1 style={styles.title}>Checkout</h1>

          <div style={styles.layout}>
            {/* Left: Form */}
            <div style={styles.formCard}>
              <h2 style={styles.sectionTitle}>Delivery Address</h2>

              <div style={styles.formGroup}>
                <label style={styles.label}>Address *</label>
                <textarea
                  name="delivery_address"
                  value={form.delivery_address}
                  onChange={handleChange}
                  placeholder="House / Street / Area"
                  style={{ ...styles.input, height: '80px', padding: '10px' }}
                  required
                />
              </div>

              <div style={styles.row}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>City *</label>
                  <input
                    type="text"
                    name="delivery_city"
                    value={form.delivery_city}
                    onChange={handleChange}
                    placeholder="City"
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>State *</label>
                  <input
                    type="text"
                    name="delivery_state"
                    value={form.delivery_state}
                    onChange={handleChange}
                    placeholder="State"
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.row}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Pincode *</label>
                  <input
                    type="text"
                    name="delivery_pincode"
                    value={form.delivery_pincode}
                    onChange={handleChange}
                    placeholder="400001"
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Phone *</label>
                  <input
                    type="text"
                    name="delivery_phone"
                    value={form.delivery_phone}
                    onChange={handleChange}
                    placeholder="9876543210"
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <h2 style={styles.sectionTitle}>Payment Method</h2>

              <div style={styles.paymentOption}>
                <input
                  type="radio"
                  name="payment_method"
                  value="cod"
                  checked={form.payment_method === 'cod'}
                  onChange={handleChange}
                  style={styles.radio}
                />
                <HiOutlineCash size={22} color="#2d6a4f" />
                <div style={styles.paymentText}>
                  <div style={styles.paymentTitle}>Cash on Delivery</div>
                  <div style={styles.paymentDesc}>Pay when your order arrives</div>
                </div>
              </div>

              <div style={styles.paymentOption}>
                <input
                  type="radio"
                  name="payment_method"
                  value="online"
                  checked={form.payment_method === 'online'}
                  onChange={(e) => {
                    handleChange(e);
                    if (e.target.value === 'online') {
                      openPaymentModal();
                    }
                  }}
                  style={styles.radio}
                />
                <HiOutlineCreditCard size={22} color="#2d6a4f" />
                <div style={styles.paymentText}>
                  <div style={styles.paymentTitle}>Online Payment</div>
                  <div style={styles.paymentDesc}>Pay securely via UPI or Net Banking</div>
                </div>
              </div>

              {form.payment_method === 'cod' && (
                <button
                  onClick={handleCodSubmit}
                  disabled={submitting}
                  style={styles.submitButton}
                >
                  <HiOutlineCheckCircle size={18} />
                  {submitting ? 'Placing Order...' : 'Place Order'}
                </button>
              )}
            </div>

            {/* Right: Order Summary */}
            <div style={styles.summaryCard}>
              <h2 style={styles.sectionTitle}>Order Summary</h2>

              <div style={styles.productRow}>
                {product.image ? (
                  <img
                    src={getImageUrl(product.image)}
                    alt={product.name}
                    style={styles.productImage}
                  />
                ) : (
                  <div style={styles.productImagePlaceholder}>🌿</div>
                )}
                <div style={styles.productDetails}>
                  <div style={styles.productName}>{product.name}</div>
                  <div style={styles.productMeta}>
                    ₹{product.price} × {quantity || 1} {product.unit}
                  </div>
                </div>
              </div>

              <div style={styles.divider} />

              <div style={styles.summaryRow}>
                <span>Subtotal</span>
                <span>₹{productTotal}</span>
              </div>

              <div style={styles.summaryRow}>
                <span>Delivery Charge</span>
                <span>
                  {isCalculating ? 'Calculating...' : deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                </span>
              </div>

              {distanceKm > 0 && (
                <div style={{ ...styles.summaryRow, fontSize: '11px', color: '#89948e' }}>
                  <span>Distance: {distanceKm} km</span>
                  <span>Weight charge: ₹{weightCharge} + Distance: ₹{distanceCharge}</span>
                </div>
              )}

              {platformFee > 0 && (
                <div style={styles.summaryRow}>
                  <span>Platform Fee <span style={{ fontSize: '12px', color: '#636e72', fontWeight: '400' }}>(2% min ₹100)</span></span>
                  <span>₹{platformFee}</span>
                </div>
              )}

              <div style={styles.divider} />
              <div style={{ ...styles.summaryRow, ...styles.totalRow }}>
                <span>Total Payable</span>
                <span>₹{totalPayable}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPaymentModal(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Select Payment Method</h2>
              <button style={styles.modalClose} onClick={() => setShowPaymentModal(false)}>
                <HiOutlineX size={20} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <button
                style={{
                  ...styles.methodCard,
                  border: onlineMethod === 'upi' ? '2px solid #2d6a4f' : '1px solid #dbe6de',
                }}
                onClick={() => setOnlineMethod('upi')}
              >
                <HiOutlineDeviceMobile size={28} color="#2d6a4f" />
                <span style={styles.methodLabel}>UPI</span>
              </button>

              <button
                style={{
                  ...styles.methodCard,
                  border: onlineMethod === 'net_banking' ? '2px solid #2d6a4f' : '1px solid #dbe6de',
                }}
                onClick={() => setOnlineMethod('net_banking')}
              >
                <HiOutlineCurrencyRupee size={28} color="#2d6a4f" />
                <span style={styles.methodLabel}>Net Banking</span>
              </button>

              {onlineMethod === 'upi' && (
                <div style={styles.detailsSection}>
                  <label style={styles.label}>UPI ID *</label>
                  <input
                    type="text"
                    name="upi_id"
                    value={paymentDetails.upi_id}
                    onChange={handlePaymentDetailsChange}
                    placeholder="yourname@upi"
                    style={styles.input}
                  />
                </div>
              )}

              {onlineMethod === 'net_banking' && (
                <div style={styles.detailsSection}>
                  <label style={styles.label}>Bank Name *</label>
                  <input
                    type="text"
                    name="bank_name"
                    value={paymentDetails.bank_name}
                    onChange={handlePaymentDetailsChange}
                    placeholder="State Bank of India"
                    style={styles.input}
                  />
                  <label style={styles.label}>Account Holder Name *</label>
                  <input
                    type="text"
                    name="account_holder"
                    value={paymentDetails.account_holder}
                    onChange={handlePaymentDetailsChange}
                    placeholder="Full Name"
                    style={styles.input}
                  />
                  <label style={styles.label}>Account Number *</label>
                  <input
                    type="text"
                    name="account_number"
                    value={paymentDetails.account_number}
                    onChange={handlePaymentDetailsChange}
                    placeholder="1234567890"
                    style={styles.input}
                  />
                  <label style={styles.label}>IFSC Code *</label>
                  <input
                    type="text"
                    name="ifsc_code"
                    value={paymentDetails.ifsc_code}
                    onChange={handlePaymentDetailsChange}
                    placeholder="SBIN0001234"
                    style={styles.input}
                  />
                </div>
              )}

              <button
                onClick={handleOnlinePay}
                disabled={submitting}
                style={styles.payButton}
              >
                <HiOutlineCheckCircle size={18} />
                {submitting ? 'Processing...' : 'Pay & Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={styles.modalOverlay} onClick={() => setShowConfirmModal(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Confirm Order</h2>
              <button style={styles.modalClose} onClick={() => setShowConfirmModal(false)}>
                <HiOutlineX size={20} />
              </button>
            </div>
            <div style={styles.confirmBody}>
              <p><strong>Product:</strong> {product.name}</p>
              <p><strong>Quantity:</strong> {quantity || 1} {product.unit}</p>
              <p><strong>Subtotal:</strong> ₹{productTotal}</p>
              <p><strong>Delivery Charge:</strong> ₹{deliveryCharge}</p>
              {platformFee > 0 && <p><strong>Platform Fee:</strong> ₹{platformFee}</p>}
              <p><strong>Total Payable:</strong> ₹{totalPayable}</p>
              <p><strong>Payment Method:</strong> {form.payment_method === 'cod' ? 'Cash on Delivery' : onlineMethod === 'upi' ? 'UPI' : 'Net Banking'}</p>
              <p><strong>Delivery Address:</strong> {form.delivery_address}, {form.delivery_city}, {form.delivery_state} - {form.delivery_pincode}</p>
            </div>
            <div style={styles.modalActions}>
              <button onClick={() => setShowConfirmModal(false)} style={styles.cancelButton}>Cancel</button>
              <button onClick={handleConfirmOrder} disabled={submitting} style={styles.submitButton}>
                {submitting ? 'Processing...' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    paddingTop: '100px',
    paddingBottom: '60px',
    background: 'linear-gradient(135deg, #f4f8f5 0%, #edf5ef 50%, #f8faf8 100%)',
    fontFamily: "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  container: { maxWidth: '1000px', margin: '0 auto', padding: '0 24px' },
  loading: { textAlign: 'center', padding: '40px', color: '#718078' },
  backButton: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'transparent',
    border: 'none', color: '#2d6a4f', fontWeight: '700', cursor: 'pointer', marginBottom: '12px', fontSize: '14px',
  },
  title: { margin: '0 0 20px', color: '#163b2a', fontSize: '32px', fontWeight: '850' },
  layout: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', alignItems: 'start' },
  formCard: {
    background: '#ffffff', borderRadius: '20px', padding: '24px',
    boxShadow: '0 8px 25px rgba(30,70,45,0.05)', border: '1px solid #e1ebe4',
  },
  summaryCard: {
    background: '#ffffff', borderRadius: '20px', padding: '24px',
    boxShadow: '0 8px 25px rgba(30,70,45,0.05)', border: '1px solid #e1ebe4', position: 'sticky', top: '100px',
  },
  sectionTitle: { margin: '0 0 15px', color: '#173b2a', fontSize: '18px', fontWeight: '800' },
  formGroup: { marginBottom: '15px' },
  label: { display: 'block', marginBottom: '5px', color: '#526058', fontSize: '12px', fontWeight: '700' },
  input: {
    width: '100%', height: '42px', border: '1px solid #dbe6de', borderRadius: '10px',
    padding: '0 12px', fontSize: '13px', outline: 'none', background: '#f9fbfa', color: '#243b30',
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  paymentOption: {
    display: 'flex', alignItems: 'center', gap: '10px', padding: '14px',
    border: '1px solid #dbe6de', borderRadius: '12px', marginBottom: '10px', cursor: 'pointer',
  },
  radio: { width: '16px', height: '16px', cursor: 'pointer' },
  paymentText: { flex: 1 },
  paymentTitle: { color: '#173b2a', fontWeight: '700', fontSize: '14px' },
  paymentDesc: { color: '#89948e', fontSize: '12px', marginTop: '2px' },
  productRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  productImage: { width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' },
  productImagePlaceholder: { width: '60px', height: '60px', borderRadius: '12px', background: '#edf6f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' },
  productDetails: { flex: 1 },
  productName: { color: '#173b2a', fontWeight: '800', fontSize: '14px' },
  productMeta: { color: '#89948e', fontSize: '12px', marginTop: '4px' },
  divider: { height: '1px', background: '#e9efeb', margin: '15px 0' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', color: '#526058', fontSize: '14px', marginBottom: '8px' },
  totalRow: { fontWeight: '850', color: '#173b2a', fontSize: '16px' },
  submitButton: {
    width: '100%', marginTop: '20px', background: '#2d6a4f', color: '#fff', border: 'none',
    padding: '14px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '15px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 7px 18px rgba(45,106,79,0.2)',
  },
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
  },
  modalCard: { background: '#fff', borderRadius: '20px', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  modalTitle: { margin: 0, color: '#173b2a', fontSize: '20px', fontWeight: '850' },
  modalClose: { background: 'transparent', border: 'none', cursor: 'pointer', color: '#526058' },
  modalBody: { display: 'flex', flexDirection: 'column', gap: '15px' },
  methodCard: {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '12px',
    cursor: 'pointer', background: '#fff', borderWidth: '2px', borderStyle: 'solid', borderColor: '#dbe6de',
    fontWeight: '700', fontSize: '14px', color: '#173b2a',
  },
  methodLabel: { fontSize: '16px', fontWeight: '700' },
  detailsSection: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' },
  payButton: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    background: '#2d6a4f', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px',
    fontWeight: '700', cursor: 'pointer', fontSize: '15px', boxShadow: '0 7px 18px rgba(45,106,79,0.2)',
  },
  confirmBody: {
    display: 'flex', flexDirection: 'column', gap: '8px', color: '#526058', fontSize: '14px', marginBottom: '20px',
  },
  modalActions: {
    display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px',
  },
  cancelButton: {
    background: '#fff', color: '#526058', border: '1px solid #dbe6de', padding: '10px 18px', borderRadius: '10px',
    fontWeight: '700', cursor: 'pointer', fontSize: '14px',
  },
  '@media (max-width: 800px)': {
    layout: { gridTemplateColumns: '1fr' },
    summaryCard: { position: 'static' },
  },
};
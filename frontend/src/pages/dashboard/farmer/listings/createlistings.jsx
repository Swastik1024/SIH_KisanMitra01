import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '../../../../components/common/Header';
import api from '../../../../services/api';
import useAuthStore from '../../../../store/authStore';
import toast from 'react-hot-toast';
import { HiOutlineLocationMarker } from 'react-icons/hi';
import { useLanguage } from '../../../../context/LanguageContext';

export default function CreateListings() {
  const router = useRouter();
  const { t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '',
    category_id: '',
    quantity: '',
    unit: 'kg',
    price: '',
    location: '',
    pincode: '',
    description: '',
    available_date: '',
    auction_type: 'fixed_price',
    auction_start_time: '',
    auction_end_time: '',
  });
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const { isAuthenticated, user, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/api/categories');
      // Only allow farmer to list produce categories
      const allowedSlugs = ['vegetables', 'fruits', 'grains', 'pulses', 'herbs'];
      const filtered = res.data.filter((cat) => allowedSlugs.includes(cat.slug));
      setCategories(filtered);
    } catch (error) {
      console.error('Failed to load categories', error);
      toast.error(t('listings.failedCategories'));
    }
  };

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'farmer') {
      router.push('/login');
      return;
    }
    fetchCategories();
  }, [isAuthenticated, user, router]);

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t('listings.locationFailed'));
      return;
    }
    if (!window.isSecureContext) {
      toast.error(t('listings.locationDenied'));
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setForm({ ...form, location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` });
        setGettingLocation(false);
        toast.success(t('listings.locationCaptured'));
      },
      (error) => {
        setGettingLocation(false);
        switch (error.code) {
          case 1:
            toast.error(t('listings.locationDenied'));
            break;
          case 2:
            toast.error(t('listings.locationUnavailable'));
            break;
          case 3:
            toast.error(t('listings.locationTimeout'));
            break;
          default:
            toast.error(t('listings.locationFailed'));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleFileChange = (e, type) => {
    const files = Array.from(e.target.files);
    if (type === 'image') setImages((prev) => [...prev, ...files]);
    else setVideos((prev) => [...prev, ...files]);
  };

  const uploadFiles = async () => {
    setUploading(true);
    const mediaUrls = [];
    try {
      for (const file of [...images, ...videos]) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/api/uploads/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        mediaUrls.push({
          media_type: file.type.startsWith('video') ? 'video' : 'image',
          url: res.data.url,
        });
      }
      return mediaUrls;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        category_id: Number(form.category_id),
        quantity: Number(form.quantity),
        price: Number(form.price),
      };
      if (form.auction_type === 'farmer_controlled') {
        delete payload.auction_start_time;
        delete payload.auction_end_time;
      }
      const productRes = await api.post('/api/products/', payload);
      const productId = productRes.data.id;
      if (images.length > 0 || videos.length > 0) {
        const mediaUrls = await uploadFiles();
        for (const media of mediaUrls) {
          await api.post(`/api/products/${productId}/media`, media);
        }
      }
      toast.success(t('listings.productCreated'));
      router.push('/dashboard/farmer');
    } catch (error) {
      console.error('Failed to create listing', error);
      const detail = error.response?.data?.detail;
      if (Array.isArray(detail)) {
        const messages = detail.map((d) => d.msg).join(', ');
        toast.error(messages || t('listings.failedCreate'));
      } else {
        toast.error(detail || t('listings.failedCreate'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '50px',
    border: '2px solid #e9ecef',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box',
  };
  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: '8px',
  };

  return (
    <div>
      <Header />
      <div style={{ minHeight: '100vh', background: '#f0f4f1', fontFamily: "'Segoe UI', system-ui, sans-serif", paddingTop: '100px', paddingBottom: '40px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 20px' }}>
          <motion.div 
            style={{ background: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1b4332', margin: 0 }}>🌾 Create New Produce Listing</h1>
              <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                Farmer Portal
              </span>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Product Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} required />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Category</label>
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} style={inputStyle} required>
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.slug.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Quantity</label>
                  <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} style={inputStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>Unit</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} style={inputStyle}>
                    <option value="kg">kg</option>
                    <option value="quintal">quintal</option>
                    <option value="ton">ton</option>
                    <option value="piece">piece</option>
                    <option value="bunch">bunch</option>
                    <option value="dozen">dozen</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Expected Price Per Unit (₹)</label>
                <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={inputStyle} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Location of Product</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} style={{ ...inputStyle, flex: 1 }} required />
                    <button type="button" onClick={getLocation} disabled={gettingLocation} style={{ background: '#2d6a4f', color: 'white', border: 'none', borderRadius: '50px', padding: '0 16px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', boxShadow: '0 4px 12px rgba(45,106,79,0.3)', opacity: gettingLocation ? 0.7 : 1 }}>
                      <HiOutlineLocationMarker />
                      {gettingLocation ? '...' : 'Auto'}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Pincode</label>
                  <input type="text" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} style={inputStyle} maxLength={6} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows="3" style={{ ...inputStyle, borderRadius: '12px', resize: 'vertical' }} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Available Date</label>
                <input type="date" value={form.available_date} onChange={(e) => setForm({ ...form, available_date: e.target.value })} style={inputStyle} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Auction Type</label>
                <select value={form.auction_type} onChange={(e) => setForm({ ...form, auction_type: e.target.value })} style={inputStyle}>
                  <option value="fixed_price">Fixed Price</option>
                  <option value="fast_auction">Fast Auction (5 min to 24 hours)</option>
                  <option value="long_auction">Long Auction (1 day to 15 days)</option>
                  <option value="farmer_controlled">Farmer Time Controlled Auction (until farmer ends)</option>
                </select>
              </div>

              {['fixed_price', 'fast_auction', 'long_auction'].includes(form.auction_type) && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={labelStyle}>Auction Opening Time</label>
                      <input type="datetime-local" value={form.auction_start_time} onChange={(e) => setForm({ ...form, auction_start_time: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Auction Closing Time</label>
                      <input type="datetime-local" value={form.auction_end_time} onChange={(e) => setForm({ ...form, auction_end_time: e.target.value })} style={inputStyle} />
                    </div>
                  </div>
                </>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Images</label>
                <input type="file" accept="image/*" multiple onChange={(e) => handleFileChange(e, 'image')} style={{ marginTop: '8px' }} />
                {images.length > 0 && <p style={{ fontSize: '13px', color: '#636e72', marginTop: '6px' }}>{images.length} image(s) selected</p>}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Videos</label>
                <input type="file" accept="video/*" multiple onChange={(e) => handleFileChange(e, 'video')} style={{ marginTop: '8px' }} />
                {videos.length > 0 && <p style={{ fontSize: '13px', color: '#636e72', marginTop: '6px' }}>{videos.length} video(s) selected</p>}
              </div>

              <button type="submit" disabled={submitting || uploading} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #2d6a4f, #1b4332)', color: 'white', border: 'none', borderRadius: '50px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 8px 20px rgba(45,106,79,0.3)' }}>
                {submitting ? 'Submitting...' : uploading ? 'Uploading media...' : 'Create Listing'}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
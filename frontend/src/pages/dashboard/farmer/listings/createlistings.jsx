import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '../../../../components/common/Header';
import api from '../../../../services/api';
import useAuthStore from '../../../../store/authStore';
import toast from 'react-hot-toast';
import { HiOutlineLocationMarker, HiOutlineArrowLeft, HiOutlineCheckCircle } from 'react-icons/hi';
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
      const allCats = res.data || [];
      const allowedSlugs = ['vegetables', 'fruits', 'grains', 'pulses', 'herbs'];
      const filtered = allCats.filter((cat) => allowedSlugs.includes(cat.slug));
      // Fallback to all categories if filter returns empty
      setCategories(filtered.length > 0 ? filtered : allCats);
    } catch (error) {
      console.error('Failed to load categories', error);
      toast.error('Failed to load categories. Please refresh.');
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'farmer') {
      router.replace('/dashboard/' + (user?.role || ''));
      return;
    }
    fetchCategories();
  }, [isAuthenticated, user, router]);

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setForm((prev) => ({ ...prev, location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` }));
        setGettingLocation(false);
        toast.success('Location captured successfully!');
      },
      (error) => {
        setGettingLocation(false);
        toast.error('Could not auto-fetch location. Please enter manually.');
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
    } catch (err) {
      console.error('Media upload error:', err);
      toast.error('Error uploading media files. Creating listing without attachments.');
      return [];
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category_id) {
      toast.error('Please select a produce category');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        category_id: Number(form.category_id),
        quantity: Number(form.quantity),
        unit: form.unit || 'kg',
        price: Number(form.price),
        location: form.location ? form.location.trim() : null,
        pincode: form.pincode ? form.pincode.trim() : null,
        description: form.description ? form.description.trim() : null,
        auction_type: form.auction_type || 'fixed_price',
      };

      if (form.available_date) {
        payload.available_date = form.available_date;
      }

      if (form.auction_start_time && ['fixed_price', 'fast_auction', 'long_auction'].includes(form.auction_type)) {
        payload.auction_start_time = form.auction_start_time;
      }

      if (form.auction_end_time && ['fixed_price', 'fast_auction', 'long_auction'].includes(form.auction_type)) {
        payload.auction_end_time = form.auction_end_time;
      }

      const productRes = await api.post('/api/products/', payload);
      const productId = productRes.data.id;

      if (images.length > 0 || videos.length > 0) {
        const mediaUrls = await uploadFiles();
        for (const media of mediaUrls) {
          try {
            await api.post(`/api/products/${productId}/media`, media);
          } catch (mErr) {
            console.error('Failed to associate media:', mErr);
          }
        }
      }

      toast.success('Crop listing created successfully!');
      router.push('/dashboard/farmer/listings');
    } catch (error) {
      console.error('Failed to create listing', error);
      const detail = error.response?.data?.detail;
      if (Array.isArray(detail)) {
        const messages = detail.map((d) => `${d.loc ? d.loc.join('.') : ''}: ${d.msg}`).join(', ');
        toast.error(messages || 'Failed to create listing. Please check input fields.');
      } else {
        toast.error(detail || 'Failed to create listing');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 18px',
    borderRadius: '12px',
    border: '1.5px solid #cbd5e1',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box',
    background: '#ffffff'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '8px',
  };

  return (
    <div>
      <Header />
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        paddingTop: '100px',
        paddingBottom: '60px'
      }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 20px' }}>
          
          <Link href="/dashboard/farmer/listings" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>
            <button style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '50px',
              padding: '8px 18px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '700',
              color: '#0f172a',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <HiOutlineArrowLeft /> Back to Listings
            </button>
          </Link>

          <motion.div 
            style={{ background: '#ffffff', borderRadius: '24px', padding: '36px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#059669', margin: 0 }}>
                  🌾 List New Farm Produce
                </h1>
                <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                  Post your harvested crops for live trader bids & direct orders
                </p>
              </div>
              <span style={{ background: '#dcfce7', color: '#166534', padding: '6px 14px', borderRadius: '50px', fontSize: '13px', fontWeight: '700' }}>
                Farmer Verified
              </span>
            </div>

            <form onSubmit={handleSubmit}>
              {/* CROP NAME */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Crop / Produce Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Organic Sharbati Wheat, Fresh Tomato"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>

              {/* CATEGORY & UNIT */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>Produce Category *</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    style={inputStyle}
                    required
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.slug.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Unit of Measurement *</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    style={inputStyle}
                    required
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="quintal">quintal (100 kg)</option>
                    <option value="ton">ton (1000 kg)</option>
                    <option value="piece">piece</option>
                    <option value="bunch">bunch</option>
                    <option value="dozen">dozen</option>
                  </select>
                </div>
              </div>

              {/* QUANTITY & EXPECTED PRICE */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>Available Quantity *</label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    placeholder="e.g. 500"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    style={inputStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>Expected Price Per {form.unit} (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    placeholder="e.g. 2400"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    style={inputStyle}
                    required
                  />
                </div>
              </div>

              {/* LOCATION & PINCODE */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>Farm Location / Mandi Yard</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="e.g. Pune, MH"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={getLocation}
                      disabled={gettingLocation}
                      style={{
                        background: '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '0 16px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        fontWeight: '700',
                        boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
                        opacity: gettingLocation ? 0.7 : 1
                      }}
                    >
                      <HiOutlineLocationMarker />
                      {gettingLocation ? '...' : 'Auto'}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Pincode</label>
                  <input
                    type="text"
                    placeholder="e.g. 411001"
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    style={inputStyle}
                    maxLength={6}
                  />
                </div>
              </div>

              {/* DESCRIPTION & AVAILABLE DATE */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>Description / Organic Cert</label>
                  <textarea
                    placeholder="Provide crop details, harvest condition, moisture grade..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows="3"
                    style={{ ...inputStyle, borderRadius: '12px', resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Ready Date for Pickup / Dispatch</label>
                  <input
                    type="date"
                    value={form.available_date}
                    onChange={(e) => setForm({ ...form, available_date: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* AUCTION TYPE */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Selling / Auction Method</label>
                <select
                  value={form.auction_type}
                  onChange={(e) => setForm({ ...form, auction_type: e.target.value })}
                  style={inputStyle}
                >
                  <option value="fixed_price">Fixed Price Direct Order</option>
                  <option value="fast_auction">Fast Bidding Auction (5 min - 24 Hours)</option>
                  <option value="long_auction">Long Bidding Auction (1 Day - 15 Days)</option>
                  <option value="farmer_controlled">Farmer Controlled Auction (Manual Accept)</option>
                </select>
              </div>

              {['fixed_price', 'fast_auction', 'long_auction'].includes(form.auction_type) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={labelStyle}>Bidding Start Time</label>
                    <input
                      type="datetime-local"
                      value={form.auction_start_time}
                      onChange={(e) => setForm({ ...form, auction_start_time: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Bidding End Time</label>
                    <input
                      type="datetime-local"
                      value={form.auction_end_time}
                      onChange={(e) => setForm({ ...form, auction_end_time: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}

              {/* UPLOAD IMAGES & VIDEOS */}
              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1.5px dashed #94a3b8', marginBottom: '28px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={labelStyle}>Crop Photos</label>
                    <input 
                      type="file" 
                      id="crop-photos-upload" 
                      accept="image/*" 
                      multiple 
                      onChange={(e) => handleFileChange(e, 'image')} 
                      style={{ display: 'none' }} 
                    />
                    <label 
                      htmlFor="crop-photos-upload"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'center',
                        gap: '8px',
                        padding: '12px 18px',
                        background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                        border: '1.5px solid #4ade80',
                        borderRadius: '12px',
                        color: '#14532d',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(74, 222, 128, 0.15)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      📁 {images.length > 0 ? `Change Photos (${images.length} selected)` : 'Browse & Upload Photos'}
                    </label>
                    {images.length > 0 && <p style={{ fontSize: '12px', color: '#059669', fontWeight: '700', marginTop: '8px', marginBottom: 0 }}>✓ {images.length} photo(s) attached successfully</p>}
                  </div>

                  <div>
                    <label style={labelStyle}>Crop Inspection Video</label>
                    <input 
                      type="file" 
                      id="crop-video-upload" 
                      accept="video/*" 
                      multiple 
                      onChange={(e) => handleFileChange(e, 'video')} 
                      style={{ display: 'none' }} 
                    />
                    <label 
                      htmlFor="crop-video-upload"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'center',
                        gap: '8px',
                        padding: '12px 18px',
                        background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                        border: '1.5px solid #38bdf8',
                        borderRadius: '12px',
                        color: '#0c4a6e',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(56, 189, 248, 0.15)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      🎥 {videos.length > 0 ? `Change Videos (${videos.length} selected)` : 'Browse & Upload Video'}
                    </label>
                    {videos.length > 0 && <p style={{ fontSize: '12px', color: '#0284c7', fontWeight: '700', marginTop: '8px', marginBottom: 0 }}>✓ {videos.length} video(s) attached successfully</p>}
                  </div>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={submitting || uploading}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50px',
                  fontSize: '16px',
                  fontWeight: '800',
                  cursor: (submitting || uploading) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 24px rgba(5,150,105,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {submitting ? 'Creating Crop Listing...' : uploading ? 'Uploading Photos & Videos...' : '🚀 Submit Produce Listing'}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
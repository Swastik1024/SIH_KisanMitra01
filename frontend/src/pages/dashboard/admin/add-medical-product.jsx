import { useState } from 'react';
import { useRouter } from 'next/router';
import AdminHeader from '../../../components/admin/AdminHeader';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const medicalCategories = [
  { slug: 'pest_control', label: 'Pest Control' },
  { slug: 'disease_control', label: 'Disease Control' },
  { slug: 'weed_control', label: 'Weed Control' },
  { slug: 'plant_nutrition', label: 'Plant Nutrition' },
  { slug: 'bio_solutions', label: 'Bio Solutions' },
  { slug: 'growth_yield', label: 'Growth & Yield' },
];

export default function AddMedicalProduct() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    description: '',
    quantity: '',
    unit: 'unit',
    price: '',
    location: '',
    pincode: '',
    category_slug: 'pest_control',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/api/uploads/', formData);

      const uploadedUrl = res.data.url || res.data.file_url || res.data.path;
      if (!uploadedUrl) {
        throw new Error('Upload succeeded but no URL returned');
      }

      setImageUrl(uploadedUrl);
      toast.success('Image uploaded successfully');
    } catch (err) {
      console.error('Image upload failed:', err);
      toast.error('Image upload failed');
      setImageFile(null);
      setImagePreview('');
    } finally {
      setUploading(false);
    }
  };

  const validateStep1 = () => {
    if (!form.name || !form.quantity || !form.price) {
      setError('Please fill all required fields in Step 1.');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageUrl) {
      setError('Please upload a product image.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await api.post('/api/admin/products', {
        ...form,
        quantity: parseFloat(form.quantity),
        price: parseFloat(form.price),
        image_url: imageUrl,
      });
      toast.success('Medical product added successfully');
      router.push('/dashboard/admin/listings');
    } catch (error) {
      console.error('Error adding product:', error);
      setError(error.response?.data?.detail || 'Failed to add product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AdminHeader />
      <main style={styles.page}>
        <div style={styles.container}>
          <h1 style={styles.title}>Add Medical Product</h1>
          <p style={styles.subtitle}>Step {step} of 2</p>

          <form onSubmit={handleSubmit} style={styles.card}>
            {/* STEP 1 */}
            {step === 1 && (
              <>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Category *</label>
                  <select
                    name="category_slug"
                    value={form.category_slug}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  >
                    {medicalCategories.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    style={{ ...styles.input, height: '80px', padding: '10px' }}
                  />
                </div>

                <div style={styles.row}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Quantity *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="quantity"
                      value={form.quantity}
                      onChange={handleChange}
                      style={styles.input}
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Unit *</label>
                    <select
                      name="unit"
                      value={form.unit}
                      onChange={handleChange}
                      style={styles.input}
                      required
                    >
                      <option value="unit">Unit</option>
                      <option value="kg">Kg</option>
                      <option value="litre">Litre</option>
                      <option value="box">Box</option>
                      <option value="packet">Packet</option>
                    </select>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.actions}>
                  <button type="button" onClick={handleNext} style={styles.submitButton}>
                    Next
                  </button>
                </div>
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Product Image *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={styles.fileInput}
                    required
                  />
                  {uploading && <p style={styles.uploadingText}>Uploading image...</p>}
                  {imagePreview && !uploading && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={styles.preview}
                    />
                  )}
                  {imageUrl && !uploading && (
                    <p style={styles.uploadSuccess}>✅ Image uploaded</p>
                  )}
                </div>

                <div style={styles.actions}>
                  <button type="button" onClick={handleBack} style={styles.cancelButton}>
                    Back
                  </button>
                  <button type="submit" disabled={saving || uploading} style={styles.submitButton}>
                    {saving ? 'Adding...' : 'Add Product'}
                  </button>
                </div>
              </>
            )}

            {error && <div style={styles.errorBox}>{error}</div>}
          </form>
        </div>
      </main>
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
  container: { maxWidth: '800px', margin: '0 auto', padding: '0 24px' },
  title: { color: '#163b2a', fontSize: '32px', fontWeight: '850' },
  subtitle: { color: '#718078', fontSize: '14px', marginTop: '8px' },
  card: {
    background: '#ffffff',
    border: '1px solid #e1ebe4',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 8px 25px rgba(30,70,45,0.05)',
    marginTop: '24px',
  },
  formGroup: { marginBottom: '18px' },
  label: { display: 'block', marginBottom: '6px', color: '#526058', fontSize: '12px', fontWeight: '700' },
  input: {
    width: '100%',
    height: '42px',
    border: '1px solid #dbe6de',
    borderRadius: '10px',
    padding: '0 12px',
    fontSize: '13px',
    outline: 'none',
    background: '#f9fbfa',
    color: '#243b30',
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  fileInput: {
    display: 'block',
    width: '100%',
    padding: '8px',
    border: '1px dashed #2d6a4f',
    borderRadius: '10px',
    background: '#f9fbfa',
    cursor: 'pointer',
  },
  preview: {
    width: '120px',
    height: '120px',
    objectFit: 'cover',
    borderRadius: '12px',
    marginTop: '10px',
  },
  uploadingText: { color: '#9a6700', fontSize: '12px', marginTop: '8px' },
  uploadSuccess: { color: '#2d6a4f', fontSize: '12px', marginTop: '8px' },
  actions: { display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '10px' },
  cancelButton: {
    background: '#ffffff',
    color: '#526058',
    border: '1px solid #dbe6de',
    padding: '12px 24px',
    borderRadius: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '14px',
  },
  submitButton: {
    background: '#2d6a4f',
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '14px',
    boxShadow: '0 7px 18px rgba(45,106,79,0.2)',
  },
  errorBox: {
    background: '#fdecec',
    color: '#c0392b',
    padding: '10px 12px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '600',
    marginTop: '15px',
  },
};
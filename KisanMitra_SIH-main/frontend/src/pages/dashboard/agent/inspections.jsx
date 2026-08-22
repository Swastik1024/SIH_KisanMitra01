import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AgentHeader from '../../../components/agent/AgentHeader';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';
import {
  HiOutlineDocumentReport,
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineCheck,
  HiOutlineClipboardCheck,
  HiOutlineEye,
} from 'react-icons/hi';

const PARAMETERS_BY_CATEGORY = {
  grains: [
    'Moisture', 'Foreign Matter', 'Broken Grains', 'Damaged Grains',
    'Grain Size', 'Pest Damage', 'Purity', 'Color', 'Odor'
  ],
  pulses: [
    'Moisture', 'Foreign Matter', 'Broken Seeds', 'Insect Damage',
    'Seed Size', 'Purity', 'Color', 'Uniformity'
  ],
  vegetables: [
    'Freshness', 'Size', 'Weight', 'Color', 'Firmness', 'Maturity',
    'Physical Damage', 'Disease / Rot', 'Pest Damage', 'Shape / Uniformity'
  ],
  fruits: [
    'Maturity', 'Size', 'Weight', 'Color', 'Firmness', 'Brix / Sugar Level',
    'Physical Damage', 'Disease / Rot', 'Shape', 'Freshness'
  ],
  herbs: [
    'Moisture', 'Purity', 'Color', 'Aroma', 'Foreign Matter', 'Mold',
    'Insect Damage', 'Essential Oil / Active Content'
  ],
};

const GRADES = ['A+', 'A', 'B', 'C', 'D'];

export default function AgentInspections() {
  const router = useRouter();
  const { product_id } = router.query;
  const { isAuthenticated, user, hydrate } = useAuthStore();

  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending'); // 'pending' or 'history'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [readOnly, setReadOnly] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    quality_grade: 'A',
    final_base_price: '',
    recommendations: '',
    notes: '',
  });
  const [formParameters, setFormParameters] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'agent') {
      router.replace('/dashboard/' + user?.role);
      return;
    }
    fetchInspections();
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (product_id && inspections.length > 0) {
      const product = inspections.find((p) => p.id === Number(product_id));
      if (product) {
        const isReadOnly = product.status === 'verified';
        openSubmitForm(product, isReadOnly);
      }
    }
  }, [product_id, inspections]);

  const fetchInspections = async () => {
    try {
      const res = await api.get('/api/agent/inspections');
      setInspections(res.data);
    } catch (error) {
      console.error('Failed to fetch inspections:', error);
      toast.error('Failed to load inspections');
    } finally {
      setLoading(false);
    }
  };

  const openSubmitForm = (product, isReadOnly = false) => {
    setSelectedProduct(product);
    setReadOnly(isReadOnly);
    setStep(1);
    setForm({
      quality_grade: product.quality_grade || 'A',
      final_base_price: product.inspection_data?.final_base_price || product.final_base_price || '',
      recommendations: product.recommendations || '',
      notes: product.notes || '',
    });
    const params = {};
    const cat = product.category_slug || '';
    const fields = PARAMETERS_BY_CATEGORY[cat] || [];
    fields.forEach((field) => {
      params[field] = product.inspection_data?.[field] || '';
    });
    setFormParameters(params);
  };

  const handleChange = (e) => {
    if (readOnly) return;
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleParameterChange = (e) => {
    if (readOnly) return;
    const { name, value } = e.target;
    setFormParameters((prev) => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!form.final_base_price) {
        toast.error('Final base price is required');
        return;
      }
      if (!form.quality_grade) {
        toast.error('Quality grade is required');
        return;
      }
      setStep(3);
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (readOnly) return;
    setSubmitting(true);
    try {
      await api.post(`/api/agent/inspections/${selectedProduct.id}/submit`, {
        quality_grade: form.quality_grade,
        final_base_price: parseFloat(form.final_base_price),
        recommendations: form.recommendations,
        notes: form.notes,
        parameters: formParameters,
      });
      toast.success('Inspection submitted. Product verified for bidding.');
      setSelectedProduct(null);
      fetchInspections();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <AgentHeader />
        <main style={styles.page}><div style={styles.loading}>Loading inspections...</div></main>
      </>
    );
  }

  const filteredInspections = inspections.filter((item) => {
    if (filterStatus === 'pending') return item.status !== 'verified';
    if (filterStatus === 'history') return item.status === 'verified';
    return true;
  });

  const parameterFields = selectedProduct
    ? PARAMETERS_BY_CATEGORY[selectedProduct.category_slug] || []
    : [];

  return (
    <>
      <AgentHeader />
      <main style={styles.page}>
        <div style={styles.container}>
          <h1 style={styles.title}>My Inspections</h1>
          <p style={styles.subtitle}>Submit inspection reports for assigned products</p>

          {/* Tabs */}
          <div style={styles.tabs}>
            <button
              onClick={() => setFilterStatus('pending')}
              style={{
                ...styles.tab,
                backgroundColor: filterStatus === 'pending' ? '#eaf8f0' : '#fff',
                color: filterStatus === 'pending' ? '#198754' : '#89948e',
                borderColor: filterStatus === 'pending' ? '#198754' : '#dbe6de',
              }}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus('history')}
              style={{
                ...styles.tab,
                backgroundColor: filterStatus === 'history' ? '#eaf8f0' : '#fff',
                color: filterStatus === 'history' ? '#198754' : '#89948e',
                borderColor: filterStatus === 'history' ? '#198754' : '#dbe6de',
              }}
            >
              History
            </button>
          </div>

          {filteredInspections.length === 0 ? (
            <div style={styles.empty}>
              {filterStatus === 'pending' ? 'No pending inspections.' : 'No completed inspections.'}
            </div>
          ) : (
            <div style={styles.list}>
              {filteredInspections.map((item) => (
                <div key={item.id} style={styles.card}>
                  <div>
                    <strong>{item.product_name}</strong>
                    <div style={styles.muted}>{item.farmer_name} • {item.status}</div>
                  </div>
                  <button
                    onClick={() => openSubmitForm(item, item.status === 'verified')}
                    style={styles.actionButton}
                  >
                    {item.status === 'verified' ? <HiOutlineEye size={14} /> : <HiOutlineDocumentReport size={14} />}
                    {item.status === 'verified' ? 'View Report' : 'Generate Report'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedProduct && (
          <div style={styles.modalOverlay} onClick={() => setSelectedProduct(null)}>
            <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>
                  {readOnly ? 'Inspection Report' : 'Inspection Report'}
                </h2>
                <button style={styles.closeBtn} onClick={() => setSelectedProduct(null)}>✕</button>
              </div>

              {/* Read-only banner */}
              {readOnly && (
                <div style={styles.readOnlyBanner}>
                  This report has been submitted and is now read-only.
                </div>
              )}

              {/* Step Indicator */}
              <div style={styles.stepIndicator}>
                {['Parameters', 'Grade & Price', 'Review & Submit'].map((label, index) => (
                  <div
                    key={label}
                    style={{
                      ...styles.step,
                      backgroundColor: step === index + 1 ? '#eaf8f0' : 'transparent',
                      color: step === index + 1 ? '#198754' : '#89948e',
                      borderColor: step === index + 1 ? '#198754' : '#dbe6de',
                    }}
                  >
                    <span style={styles.stepNumber}>{index + 1}</span>
                    <span style={styles.stepLabel}>{label}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} style={styles.form}>
                {step === 1 && (
                  <div style={styles.stepContent}>
                    <div style={styles.productInfo}>
                      <span style={styles.productName}>{selectedProduct.product_name}</span>
                      <span style={styles.farmerName}>{selectedProduct.farmer_name}</span>
                    </div>
                    <div style={styles.paramGrid}>
                      {parameterFields.map((field) => (
                        <div key={field} style={styles.paramGroup}>
                          <label style={styles.label}>{field}</label>
                          <input
                            type="text"
                            name={field}
                            value={formParameters[field] || ''}
                            onChange={handleParameterChange}
                            placeholder={`Enter ${field.toLowerCase()}`}
                            style={styles.input}
                            disabled={readOnly}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div style={styles.stepContent}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Quality Grade *</label>
                      <select
                        name="quality_grade"
                        value={form.quality_grade}
                        onChange={handleChange}
                        style={styles.input}
                        disabled={readOnly}
                      >
                        {GRADES.map((grade) => (
                          <option key={grade} value={grade}>{grade}</option>
                        ))}
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Final Base Price (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        name="final_base_price"
                        value={form.final_base_price}
                        onChange={handleChange}
                        placeholder="e.g., 1200"
                        style={styles.input}
                        disabled={readOnly}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Recommendations</label>
                      <textarea
                        name="recommendations"
                        value={form.recommendations}
                        onChange={handleChange}
                        style={{ ...styles.input, height: '80px' }}
                        disabled={readOnly}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Notes</label>
                      <textarea
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        style={{ ...styles.input, height: '60px' }}
                        disabled={readOnly}
                      />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div style={styles.stepContent}>
                    <div style={styles.summaryBox}>
                      <h3 style={styles.summaryTitle}>Review your report</h3>
                      <div style={styles.summaryRow}>
                        <span>Product</span>
                        <strong>{selectedProduct.product_name}</strong>
                      </div>
                      <div style={styles.summaryRow}>
                        <span>Grade</span>
                        <strong>{form.quality_grade}</strong>
                      </div>
                      <div style={styles.summaryRow}>
                        <span>Final Base Price</span>
                        <strong>₹{form.final_base_price}</strong>
                      </div>
                      {form.recommendations && (
                        <div style={styles.summaryRow}>
                          <span>Recommendations</span>
                          <strong>{form.recommendations}</strong>
                        </div>
                      )}
                      {form.notes && (
                        <div style={styles.summaryRow}>
                          <span>Notes</span>
                          <strong>{form.notes}</strong>
                        </div>
                      )}
                    </div>
                    <div style={styles.paramSummary}>
                      <h4 style={styles.paramSummaryTitle}>Parameters</h4>
                      {parameterFields.map((field) => (
                        <div key={field} style={styles.paramSummaryRow}>
                          <span>{field}</span>
                          <strong>{formParameters[field] || '—'}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={styles.modalActions}>
                  {step > 1 && (
                    <button type="button" onClick={prevStep} style={styles.cancelButton}>
                      <HiOutlineArrowLeft size={16} />
                      Back
                    </button>
                  )}
                  {!readOnly && step < 3 ? (
                    <button type="button" onClick={nextStep} style={styles.submitButton}>
                      Next
                      <HiOutlineArrowRight size={16} />
                    </button>
                  ) : !readOnly && step === 3 ? (
                    <button type="submit" disabled={submitting} style={styles.submitButton}>
                      <HiOutlineCheck size={16} />
                      {submitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                  ) : (
                    <button type="button" onClick={() => setSelectedProduct(null)} style={styles.submitButton}>
                      Close
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

const styles = {
  page: { minHeight: '100vh', paddingTop: '100px', paddingBottom: '60px', background: 'linear-gradient(135deg, #f4f8f5 0%, #edf5ef 50%, #f8faf8 100%)', fontFamily: "'Segoe UI', system-ui, sans-serif" },
  container: { maxWidth: '900px', margin: '0 auto', padding: '0 24px' },
  loading: { textAlign: 'center', padding: '40px', color: '#718078' },
  title: { margin: '0 0 5px', color: '#163b2a', fontSize: '32px', fontWeight: '850' },
  subtitle: { margin: '0 0 20px', color: '#718078', fontSize: '14px' },
  tabs: { display: 'flex', gap: '10px', marginBottom: '20px' },
  tab: { padding: '10px 20px', borderRadius: '12px', border: '1px solid', cursor: 'pointer', fontWeight: '700', fontSize: '14px' },
  empty: { textAlign: 'center', padding: '40px', color: '#9aa49e', background: '#fff', borderRadius: '20px', border: '1px solid #e1ebe4' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  card: { background: '#fff', borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 15px rgba(30,70,45,0.04)', border: '1px solid #e1ebe4' },
  muted: { color: '#89948e', fontSize: '12px', marginTop: '4px' },
  actionButton: { display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eaf8f0', color: '#198754', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' },
  modalCard: { background: '#fff', borderRadius: '20px', maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  modalTitle: { margin: 0, color: '#173b2a', fontSize: '20px', fontWeight: '850' },
  closeBtn: { background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#526058' },
  readOnlyBanner: { background: '#fff7df', color: '#9a6700', padding: '10px 14px', borderRadius: '10px', marginBottom: '15px', fontWeight: '600', fontSize: '13px' },
  stepIndicator: { display: 'flex', gap: '8px', marginBottom: '25px' },
  step: { flex: 1, padding: '10px', borderRadius: '12px', textAlign: 'center', border: '1px solid', fontWeight: '700', fontSize: '13px' },
  stepNumber: { display: 'block', fontSize: '18px', marginBottom: '4px' },
  stepLabel: { display: 'block' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  stepContent: { display: 'flex', flexDirection: 'column', gap: '15px' },
  productInfo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e9efeb' },
  productName: { color: '#173b2a', fontWeight: '800', fontSize: '16px' },
  farmerName: { color: '#89948e', fontSize: '13px' },
  paramGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' },
  paramGroup: { display: 'flex', flexDirection: 'column' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { color: '#526058', fontSize: '12px', fontWeight: '700' },
  input: { width: '100%', padding: '10px', border: '1px solid #dbe6de', borderRadius: '10px', fontSize: '13px', outline: 'none', background: '#f9fbfa', color: '#243b30' },
  summaryBox: { background: '#f9fbfa', borderRadius: '12px', padding: '15px', marginBottom: '15px' },
  summaryTitle: { margin: '0 0 10px', color: '#173b2a', fontSize: '16px', fontWeight: '800' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e9efeb' },
  paramSummary: { background: '#f9fbfa', borderRadius: '12px', padding: '15px' },
  paramSummaryTitle: { margin: '0 0 10px', color: '#173b2a', fontSize: '14px', fontWeight: '800' },
  paramSummaryRow: { display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '13px', color: '#526058' },
  modalActions: { display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '10px' },
  cancelButton: { display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fff', color: '#526058', border: '1px solid #dbe6de', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' },
  submitButton: { display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#2d6a4f', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 7px 18px rgba(45,106,79,0.2)' },
};
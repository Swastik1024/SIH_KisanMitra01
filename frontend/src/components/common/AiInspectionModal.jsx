import { useState } from 'react';
import axios from 'axios';
import { Sparkles, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function AiInspectionModal({ product, onApply, onClose }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const runAnalysis = async () => {
    setLoading(true);
    setResult(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE_URL}/api/inspection/auto-analyze`,
        {
          product_id: product?.id || null,
          product_name: product?.name || 'Agri Crop Produce',
          price: product?.price || 100,
          quantity: product?.quantity || 50,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data);
    } catch (err) {
      console.error(err);
      // Show the REAL error — do NOT fake an A+ result
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        'AI Inspection service is unavailable. Please try again.';
      setResult({ is_valid: false, error: detail });
    } finally {
      setLoading(false);
    }
  };

  const gradeColor = (grade) => {
    if (grade === 'A+') return { bg: '#f0fdf4', border: '#86efac', text: '#15803d' };
    if (grade === 'A')  return { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' };
    if (grade === 'B')  return { bg: '#fefce8', border: '#fde68a', text: '#92400e' };
    return { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' };
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div style={{
        backgroundColor: '#ffffff', borderRadius: '20px', maxWidth: '660px', width: '100%',
        padding: '28px', boxShadow: '0 25px 50px rgba(0,0,0,0.18)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg,#059669,#047857)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', margin: 0 }}>AI Crop Inspection</h3>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Computer Vision Quality Analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#f3f4f6', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >✕</button>
        </div>

        {/* ── IDLE STATE ── */}
        {!result && !loading && (
          <div style={{ textAlign: 'center', padding: '28px 16px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px', boxShadow: '0 4px 14px rgba(5,150,105,0.2)' }}>
              <ShieldCheck size={38} style={{ color: '#059669' }} />
            </div>
            <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
              Analyze: <span style={{ color: '#059669' }}>{product?.name || 'Crop Listing'}</span>
            </h4>
            <p style={{ fontSize: '14px', color: '#6b7280', maxWidth: '400px', margin: '0 auto 24px', lineHeight: '1.6' }}>
              Our AI Computer Vision model scans your uploaded photos to estimate{' '}
              <strong>freshness</strong>, <strong>defect density</strong>,{' '}
              <strong>color saturation</strong>, and suggest an optimal base price.
            </p>
            {!product?.id && (
              <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', color: '#92400e', marginBottom: '20px' }}>
                ⚠️ Save the product first before running AI Inspection for full analysis.
              </div>
            )}
            <button
              onClick={runAnalysis}
              style={{
                background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', border: 'none',
                borderRadius: '50px', padding: '13px 32px', fontSize: '15px', fontWeight: '700',
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px',
                boxShadow: '0 6px 20px rgba(5,150,105,0.3)',
              }}
            >
              <Sparkles size={18} /> Start AI Inspection
            </button>
          </div>
        )}

        {/* ── LOADING STATE ── */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 16px' }}>
            <style>{`@keyframes km-spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ position: 'relative', width: '72px', height: '72px', margin: '0 auto 20px' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid #d1fae5', borderTopColor: '#059669', animation: 'km-spin 1s linear infinite' }} />
              <div style={{ position: 'absolute', inset: '12px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={20} color="#059669" />
              </div>
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937', marginBottom: '6px' }}>Analyzing Crop Images…</h4>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>Running computer vision models on your photos</p>
          </div>
        )}

        {/* ── ERROR STATE ── */}
        {result && result.is_valid === false && (
          <div style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fef2f2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <AlertTriangle size={34} style={{ color: '#ef4444' }} />
            </div>
            <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#991b1b', marginBottom: '8px' }}>Inspection Failed</h4>
            <p style={{ fontSize: '14px', color: '#b91c1c', maxWidth: '420px', margin: '0 auto 24px', lineHeight: '1.6' }}>
              {result.error || 'An error occurred during AI inspection.'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setResult(null)}
                style={{ padding: '10px 20px', borderRadius: '10px', border: '1.5px solid #d1d5db', background: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={15} /> Try Again
              </button>
              {result.is_fake && (
                <button
                  onClick={() => { if (onApply) onApply({ is_fraud: true, quality_grade: 'REJECTED', final_base_price: 0, notes: result.error }); onClose(); }}
                  style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#dc2626', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <AlertTriangle size={15} /> Mark as Fraud
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── SUCCESS STATE ── */}
        {result && result.is_valid !== false && (
          <div>
            {/* Grade / Freshness / Price summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '18px' }}>
              {[
                { label: 'Quality Grade', value: result.quality_grade, sub: `${result.confidence_score}% Confidence`, colors: gradeColor(result.quality_grade) },
                { label: 'Freshness Index', value: `${result.freshness_score}%`, sub: `Defect Rate: ${result.defect_rate}%`, colors: { bg: '#f0f9ff', border: '#bae6fd', text: '#0284c7' } },
                { label: 'Recommended Price', value: `₹${result.final_base_price}`, sub: 'Per Unit (AI Adjusted)', colors: { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c' } },
              ].map(({ label, value, sub, colors }) => (
                <div key={label} style={{ background: colors.bg, border: `1.5px solid ${colors.border}`, borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: colors.text, fontWeight: '700', marginBottom: '4px' }}>{label}</div>
                  <div style={{ fontSize: '26px', fontWeight: '800', color: colors.text }}>{value}</div>
                  <div style={{ fontSize: '11px', color: colors.text, opacity: 0.8 }}>{sub}</div>
                </div>
              ))}
            </div>

            {/* Detailed visual parameters */}
            <div style={{ background: '#f9fafb', borderRadius: '14px', padding: '16px', marginBottom: '14px', border: '1px solid #e5e7eb' }}>
              <h5 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: '800', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visual Parameters</h5>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: '#4b5563' }}>
                <div><strong style={{ color: '#374151' }}>Color &amp; Ripeness:</strong> {result.color_ripeness}</div>
                <div><strong style={{ color: '#374151' }}>Size Uniformity:</strong> {result.size_uniformity}</div>
                <div><strong style={{ color: '#374151' }}>Moisture Level:</strong> {result.moisture}%</div>
                <div><strong style={{ color: '#374151' }}>Foreign Material:</strong> {result.foreign_material}</div>
              </div>
            </div>

            {/* Detected features */}
            {result.detected_features && result.detected_features.length > 0 && (
              <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '12px 16px', marginBottom: '14px', border: '1px solid #bbf7d0' }}>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '800', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detected Features</h5>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#166534', lineHeight: '1.7' }}>
                  {result.detected_features.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}

            {/* AI Recommendation */}
            <div style={{ background: '#eff6ff', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#1e40af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Recommendation</div>
              <div style={{ fontSize: '13px', color: '#1e3a8a', lineHeight: '1.5' }}>{result.recommendations}</div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => { if (onApply) onApply({ is_fraud: true, quality_grade: 'REJECTED', final_base_price: 0, notes: 'Flagged as potential fraud by farmer.' }); onClose(); }}
                style={{ padding: '10px 16px', borderRadius: '10px', border: '1.5px solid #fecaca', background: '#fef2f2', color: '#ef4444', fontWeight: '700', cursor: 'pointer', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <AlertTriangle size={15} /> Flag as Fraud
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setResult(null)}
                  style={{ padding: '10px 16px', borderRadius: '10px', border: '1.5px solid #d1d5db', background: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <RefreshCw size={14} /> Re-scan
                </button>
                <button
                  onClick={() => { if (onApply) onApply(result); onClose(); }}
                  style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}
                >
                  ✓ Apply Report
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Store, RefreshCw, Filter } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function MandiLiveWidget() {
  const [rates, setRates] = useState([]);
  const [updatedAt, setUpdatedAt] = useState('');
  const [selectedState, setSelectedState] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const stateQuery = selectedState !== 'All' ? `?state=${selectedState}` : '';
      const res = await axios.get(`${API_BASE_URL}/api/mandi/rates${stateQuery}`);
      setRates(res.data.rates);
      setUpdatedAt(res.data.updated_at);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedState]);

  useEffect(() => {
    fetchRates();
  }, [selectedState, fetchRates]);

  const states = ['All', 'Maharashtra', 'Punjab', 'Uttar Pradesh', 'Gujarat', 'Karnataka', 'Madhya Pradesh'];

  return (
    <div style={{
      backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '16px',
      padding: '20px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#059669', fontWeight: '600' }}>
            <Store size={16} />
            e-NAM / Agmarknet Mandi Network
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: '2px 0 0 0' }}>
            Live APMC Benchmark Rates
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            style={{
              padding: '6px 12px', borderRadius: '8px', border: '1px solid #d1d5db',
              fontSize: '13px', backgroundColor: '#fff', color: '#374151', cursor: 'pointer'
            }}
          >
            {states.map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All States' : s}</option>
            ))}
          </select>

          <button
            onClick={fetchRates}
            style={{
              padding: '6px 10px', borderRadius: '8px', border: '1px solid #d1d5db',
              backgroundColor: '#f9fafb', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>
              <th style={{ padding: '10px 12px' }}>Commodity</th>
              <th style={{ padding: '10px 12px' }}>State & Mandi</th>
              <th style={{ padding: '10px 12px' }}>Min Price</th>
              <th style={{ padding: '10px 12px' }}>Max Price</th>
              <th style={{ padding: '10px 12px' }}>Modal Price</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((r, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 12px', fontWeight: '600', color: '#111827' }}>{r.commodity}</td>
                <td style={{ padding: '10px 12px', color: '#4b5563' }}>{r.mandi}, {r.state}</td>
                <td style={{ padding: '10px 12px', color: '#6b7280' }}>₹{r.min_price}</td>
                <td style={{ padding: '10px 12px', color: '#6b7280' }}>₹{r.max_price}</td>
                <td style={{ padding: '10px 12px', fontWeight: '700', color: '#059669' }}>₹{r.modal_price} / {r.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '10px', textAlign: 'right' }}>
        Updated live from Agmarknet mandi data stream ({updatedAt || 'Realtime'})
      </div>
    </div>
  );
}

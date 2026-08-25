import { useEffect, useState } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, HelpCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function PredictivePriceCard({ categoryId = 1, cropName = 'Wheat' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrediction() {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/prices/predict?category_id=${categoryId}&crop_name=${cropName}`);
        setData(res.data);
      } catch (err) {
        console.error(err);
        // Fallback demo data
        setData({
          crop_name: cropName,
          current_price: 2250,
          projected_7d_price: 2380,
          projected_14d_price: 2460,
          projected_change_pct: 9.3,
          market_sentiment: 'Bullish',
          recommendation: 'HOLD - PRICE EXPANDING',
          recommendation_color: 'green',
          recommended_reserve_price: 2150,
          target_auction_price: 2500,
          historical_prices: [
            { date: 'Aug 10', price: 2100 },
            { date: 'Aug 15', price: 2180 },
            { date: 'Aug 20', price: 2250 }
          ]
        });
      } finally {
        setLoading(false);
      }
    }
    fetchPrediction();
  }, [categoryId, cropName]);

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '12px' }}>Loading Price Intelligence...</div>;
  }

  if (!data) return null;

  const isPositive = data.projected_change_pct >= 0;

  return (
    <div style={{
      backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '16px',
      padding: '20px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>
            <TrendingUp size={16} style={{ color: '#059669' }} />
            Predictive Price Intelligence
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: '4px 0 0 0' }}>
            {data.crop_name} Price Forecast
          </h3>
        </div>
        <span style={{
          backgroundColor: isPositive ? '#dcfce7' : '#ffe4e6',
          color: isPositive ? '#15803d' : '#be123c',
          padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
          display: 'inline-flex', alignItems: 'center', gap: '4px'
        }}>
          {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          {isPositive ? '+' : ''}{data.projected_change_pct}% Forecast
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '10px', border: '1px solid #f3f4f6' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Current Spot Rate</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>₹{data.current_price}</div>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>per quintal</div>
        </div>

        <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '10px', border: '1px solid #dcfce7' }}>
          <div style={{ fontSize: '12px', color: '#166534' }}>7-Day Projected</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#15803d' }}>₹{data.projected_7d_price}</div>
          <div style={{ fontSize: '11px', color: '#166534' }}>Est. Trend</div>
        </div>

        <div style={{ backgroundColor: '#ecfdf5', padding: '12px', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
          <div style={{ fontSize: '12px', color: '#047857' }}>14-Day Target</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#065f46' }}>₹{data.projected_14d_price}</div>
          <div style={{ fontSize: '11px', color: '#047857' }}>Peak Season</div>
        </div>
      </div>

      <div style={{
        backgroundColor: data.recommendation_color === 'green' ? '#f0fdf4' : '#fff7ed',
        border: `1px solid ${data.recommendation_color === 'green' ? '#bbf7d0' : '#fed7aa'}`,
        borderRadius: '10px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <span style={{ fontSize: '13px', fontWeight: '700', color: data.recommendation_color === 'green' ? '#15803d' : '#c2410c' }}>
          Actionable Advice: {data.recommendation}
        </span>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>
          Rec. Reserve: <strong>₹{data.recommended_reserve_price}</strong>
        </span>
      </div>
    </div>
  );
}

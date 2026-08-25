import { useEffect, useState } from 'react';
import axios from 'axios';
import { CloudSun, CloudRain, Sun, Wind, Droplets, AlertCircle, CheckCircle } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function WeatherAdvisoryCard({ pincode = '411001', location = 'Pune, Maharashtra' }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/weather/advisory?pincode=${pincode}&location=${encodeURIComponent(location)}`);
        setWeather(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchWeather();
  }, [pincode, location]);

  if (loading) {
    return <div style={{ padding: '16px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '12px' }}>Loading Weather Advisory...</div>;
  }

  if (!weather) return null;

  const current = weather.current;

  return (
    <div style={{
      backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '16px',
      padding: '20px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#0284c7', fontWeight: '600' }}>
            <CloudSun size={18} />
            Agronomic Weather & Farm Alerts
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: '2px 0 0 0' }}>
            {weather.location} ({weather.pincode})
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#f0f9ff', padding: '8px 16px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0369a1' }}>{current.temperature_c}°C</div>
          <div style={{ fontSize: '12px', color: '#075985' }}>
            <div>{current.condition}</div>
            <div style={{ display: 'flex', gap: '8px', mt: '2px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}><Droplets size={12} /> {current.humidity_percent}%</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}><Wind size={12} /> {current.wind_speed_kmh}km/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Day Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '16px' }}>
        {weather.forecast.map((f, i) => (
          <div key={i} style={{ backgroundColor: i === 0 ? '#f0fdf4' : '#f9fafb', border: `1px solid ${i === 0 ? '#bbf7d0' : '#f3f4f6'}`, borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151' }}>{f.day}</div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>{f.date}</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: '4px 0' }}>{f.temp_high}°C</div>
            <div style={{ fontSize: '10px', color: '#0284c7' }}>☔ {f.rain_prob}% Rain</div>
          </div>
        ))}
      </div>

      {/* Agronomic Recommendations */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {weather.agronomic_advisories.map((adv, idx) => (
          <div key={idx} style={{
            backgroundColor: adv.type === 'warning' ? '#fff1f2' : (adv.type === 'success' ? '#f0fdf4' : '#f0f9ff'),
            border: `1px solid ${adv.type === 'warning' ? '#fecdd3' : (adv.type === 'success' ? '#bbf7d0' : '#bae6fd')}`,
            borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: '10px'
          }}>
            {adv.type === 'warning' ? (
              <AlertCircle size={18} style={{ color: '#e11d48', marginTop: '2px', shrink: 0 }} />
            ) : (
              <CheckCircle size={18} style={{ color: '#16a34a', marginTop: '2px', shrink: 0 }} />
            )}
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: adv.type === 'warning' ? '#9f1239' : '#14532d' }}>{adv.title}</div>
              <div style={{ fontSize: '12px', color: adv.type === 'warning' ? '#be123c' : '#166534' }}>{adv.message}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

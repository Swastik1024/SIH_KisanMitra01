import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Header from '../components/common/Header';
import { useLanguage } from '../context/LanguageContext';
import WeatherAdvisoryCard from '../components/common/WeatherAdvisoryCard';
import { HiOutlineSun, HiOutlineCloud, HiOutlineShieldCheck, HiOutlineLocationMarker, HiOutlineRefresh } from 'react-icons/hi';
import api from '../services/api';

export default function WeatherAlertsPage() {
  const { t } = useLanguage();
  const [location, setLocation] = useState('Pune, Maharashtra');
  const [pincode, setPincode] = useState('411001');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWeather = useCallback(async (loc = location, pin = pincode) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/weather/advisory?location=${encodeURIComponent(loc)}&pincode=${encodeURIComponent(pin)}`);
      setWeatherData(res.data);
    } catch (err) {
      console.error("Failed to load weather advisory", err);
    } finally {
      setLoading(false);
    }
  }, [location, pincode]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchWeather();
  };

  return (
    <>
      <Head>
        <title>Agronomic Weather & Farm Alerts | KisanMitra</title>
        <meta name="description" content="Hyperlocal agricultural weather forecasts and AI-powered agronomic crop advisories" />
      </Head>

      <Header />

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f4fbf7 0%, #e8f5ed 100%)',
        paddingTop: '100px',
        paddingBottom: '60px',
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
          
          {/* HERO BANNER */}
          <div style={{
            background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
            borderRadius: '24px',
            padding: '40px',
            color: '#ffffff',
            boxShadow: '0 12px 32px rgba(27, 67, 50, 0.15)',
            marginBottom: '32px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '6px 14px',
                borderRadius: '50px',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '16px',
                backdropFilter: 'blur(4px)'
              }}>
                <HiOutlineSun style={{ fontSize: '18px', color: '#ffb703' }} />
                <span>AI-Powered Microclimate Intelligence</span>
              </div>
              <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 12px 0' }}>
                Agronomic Weather & Farm Alerts ⛅
              </h1>
              <p style={{ fontSize: '16px', color: '#d8f3dc', maxWidth: '650px', margin: 0, lineHeight: '1.6' }}>
                Real-time hyperlocal weather insights, disease vulnerability warnings, and tailored farming advisories to safeguard crop yield.
              </p>
            </div>

            {/* LOCATION FORM */}
            <form onSubmit={handleSearch} style={{
              marginTop: '28px',
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              maxWidth: '600px'
            }}>
              <div style={{ flex: '1', minWidth: '200px', position: 'relative' }}>
                <HiOutlineLocationMarker style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#2d6a4f', fontSize: '18px'
                }} />
                <input
                  type="text"
                  placeholder="Location (e.g. Nashik, MH)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                    outline: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
              </div>
              <input
                type="text"
                placeholder="Pincode"
                value={pincode}
                onChange={(e) => {
                  setPincode(e.target.value);
                  if (/^\d{6}$/.test(e.target.value)) {
                    localStorage.setItem('user_pincode', e.target.value);
                  }
                }}
                style={{
                  width: '120px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  outline: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <button
                type="submit"
                style={{
                  background: '#ffb703',
                  color: '#1b4332',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(255,183,3,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <HiOutlineRefresh /> Update Forecast
              </button>
            </form>
          </div>

          {/* MAIN CONTENT CARD */}
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <WeatherAdvisoryCard location={location} pincode={pincode} />
          </div>

          {/* EXTRA AGRONOMIC TIPS GRID */}
          <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '18px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '24px', marginBottom: '12px' }}>💧 Irrigation Scheduling</div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#1b4332' }}>Optimized Moisture Thresholds</h4>
              <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.5', margin: 0 }}>
                Adjust water application based on 5-day evaporation projections. Saves up to 25% groundwater while maintaining soil saturation.
              </p>
            </div>
            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '18px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '24px', marginBottom: '12px' }}>🛡️ Pest Risk Indicator</div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#1b4332' }}>Fungal & Blight Protection</h4>
              <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.5', margin: 0 }}>
                High ambient humidity (&gt;75%) combined with warm nights triggers early blight alerts for solanaceous crops.
              </p>
            </div>
            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '18px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '24px', marginBottom: '12px' }}>🚜 Field Operations Guide</div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#1b4332' }}>Harvest & Spray Windows</h4>
              <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.5', margin: 0 }}>
                Plan crop harvesting during low-wind morning hours to minimize shattering losses and maximize post-harvest shelf life.
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

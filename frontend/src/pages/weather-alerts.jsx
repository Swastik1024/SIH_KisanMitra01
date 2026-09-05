import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Header from '../components/common/Header';
import { useLanguage } from '../context/LanguageContext';
import WeatherAdvisoryCard from '../components/common/WeatherAdvisoryCard';
import { HiOutlineSun, HiOutlineCloud, HiOutlineShieldCheck, HiOutlineLocationMarker, HiOutlineRefresh } from 'react-icons/hi';
import api from '../services/api';

export default function WeatherAlertsPage() {
  const [locationInput, setLocationInput] = useState('Pune, Maharashtra');
  const [pincodeInput, setPincodeInput] = useState('411001');
  const [appliedLocation, setAppliedLocation] = useState('Pune, Maharashtra');
  const [appliedPincode, setAppliedPincode] = useState('411001');


  const handleSearch = (e) => {
    e.preventDefault();
    if (!pincodeInput && !locationInput) return;
    setAppliedLocation(locationInput || 'Pune, Maharashtra');
    setAppliedPincode(pincodeInput || '411001');
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
          
          {/* HERO BANNER WITH WEATHER BACKGROUND IMAGE */}
          <div style={{
            backgroundImage: `url('/weather-bg.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '24px',
            padding: '40px',
            color: '#ffffff',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.18)',
            marginBottom: '32px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, rgba(12, 74, 110, 0.90) 0%, rgba(3, 105, 161, 0.78) 100%)',
              pointerEvents: 'none'
            }} />
            
            <div style={{ position: 'relative', zIndex: 5 }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '6px 14px',
                borderRadius: '50px',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '16px',
                backdropFilter: 'blur(4px)'
              }}>
                <HiOutlineSun style={{ fontSize: '18px', color: '#facc15' }} />
                <span>AI-Powered Microclimate Intelligence</span>
              </div>
              
              <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 12px 0' }}>
                Agronomic Weather & Farm Alerts ⛅
              </h1>
              
              <p style={{ fontSize: '16px', color: '#e0f2fe', maxWidth: '650px', margin: 0, lineHeight: '1.6' }}>
                Real-time hyperlocal weather insights, disease vulnerability warnings, and tailored farming advisories to safeguard crop yield.
              </p>

              {/* LOCATION & PINCODE FORM */}
              <form onSubmit={handleSearch} style={{
                marginTop: '28px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                flexWrap: 'wrap',
                maxWidth: '650px',
                position: 'relative',
                zIndex: 10
              }}>
                {/* Location Input */}
                <div style={{ flex: '1', minWidth: '220px', position: 'relative' }}>
                  <HiOutlineLocationMarker style={{
                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#047857', fontSize: '20px', zIndex: 3
                  }} />
                  <input
                    type="text"
                    placeholder="Location (e.g. Pune, MH)"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 44px',
                      borderRadius: '14px',
                      border: '2px solid #ffffff',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: '15px',
                      fontWeight: '600',
                      outline: 'none',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Pincode Input */}
                <div style={{ width: '150px', position: 'relative' }}>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Pincode"
                    value={pincodeInput}
                    onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '14px',
                      border: '2px solid #ffffff',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: '15px',
                      fontWeight: '700',
                      letterSpacing: '0.5px',
                      outline: 'none',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Update Forecast Button */}
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '14px 26px',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'transform 0.15s ease, boxShadow 0.15s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <HiOutlineRefresh style={{ fontSize: '18px' }} /> Update Forecast
                </button>

              </form>
            </div>
          </div>


          {/* MAIN CONTENT CARD */}
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <WeatherAdvisoryCard location={appliedLocation} pincode={appliedPincode} />
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

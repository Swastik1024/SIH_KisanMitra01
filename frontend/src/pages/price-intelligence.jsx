import { useState } from 'react';
import Head from 'next/head';
import Header from '../components/common/Header';
import { useLanguage } from '../context/LanguageContext';
import PredictivePriceCard from '../components/common/PredictivePriceCard';
import { HiOutlineTrendingUp, HiOutlineChartBar, HiOutlineSparkles, HiOutlineBookOpen } from 'react-icons/hi';

const CROPS = [
  { id: 1, name: 'Wheat (गेहूं)', category: 'Grains' },
  { id: 2, name: 'Paddy / Basmati (धान)', category: 'Grains' },
  { id: 3, name: 'Onion (प्याज)', category: 'Vegetables' },
  { id: 4, name: 'Potato (आलू)', category: 'Vegetables' },
  { id: 5, name: 'Tomato (टमाटर)', category: 'Vegetables' },
  { id: 6, name: 'Cotton (कपास)', category: 'Cash Crop' },
  { id: 7, name: 'Soyabean (सोयाबीन)', category: 'Oilseeds' },
];

export default function PriceIntelligencePage() {
  const { t } = useLanguage();
  const [selectedCrop, setSelectedCrop] = useState(CROPS[0]);

  return (
    <>
      <Head>
        <title>Predictive Price Intelligence | KisanMitra</title>
        <meta name="description" content="AI crop price forecasting, market trend analysis, and optimal harvest sell timing" />
      </Head>

      <Header />

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f7f4 0%, #e3f2eb 100%)',
        paddingTop: '100px',
        paddingBottom: '60px',
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
          
          {/* HERO BANNER */}
          <div style={{
            background: 'linear-gradient(135deg, #0d3b66 0%, #1d4e89 100%)',
            borderRadius: '24px',
            padding: '40px',
            color: '#ffffff',
            boxShadow: '0 12px 32px rgba(13, 59, 102, 0.15)',
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
                <HiOutlineSparkles style={{ fontSize: '18px', color: '#f4d35e' }} />
                <span>AI Price Forecasting Engine</span>
              </div>
              <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 12px 0' }}>
                Predictive Price Intelligence 📈
              </h1>
              <p style={{ fontSize: '16px', color: '#e0e1dd', maxWidth: '680px', margin: 0, lineHeight: '1.6' }}>
                Leverage deep-learning price trajectory models to determine the optimal timing for selling your produce and maximize harvest margins.
              </p>
            </div>

            {/* CROP SELECTOR BUTTONS */}
            <div style={{ marginTop: '28px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {CROPS.map((crop) => (
                <button
                  key={crop.id}
                  onClick={() => setSelectedCrop(crop)}
                  style={{
                    background: selectedCrop.id === crop.id ? '#f4d35e' : 'rgba(255,255,255,0.12)',
                    color: selectedCrop.id === crop.id ? '#0d3b66' : '#ffffff',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '8px 18px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedCrop.id === crop.id ? '0 4px 12px rgba(244,211,94,0.4)' : 'none'
                  }}
                >
                  {crop.name}
                </button>
              ))}
            </div>
          </div>

          {/* PREDICTIVE PRICE CARD COMPONENT */}
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <PredictivePriceCard categoryId={selectedCrop.id} cropName={selectedCrop.name} />
          </div>

          {/* INSIGHT CARDS */}
          <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '18px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '24px', marginBottom: '12px' }}>📊 Demand Momentum</div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#0d3b66' }}>Wholesale APMC Order Flow</h4>
              <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.5', margin: 0 }}>
                High trader bid velocity detected across North Indian Mandis. Expected price increase of +4.2% over the next 10 days.
              </p>
            </div>

            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '18px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '24px', marginBottom: '12px' }}>🏢 Storage Arbitrage Strategy</div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#0d3b66' }}>Cold Chain Hold Recommendation</h4>
              <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.5', margin: 0 }}>
                Holding produce in certified warehouse facilities for 14 days offers an estimated ROI improvement of ₹140/quintal after storage costs.
              </p>
            </div>

            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '18px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '24px', marginBottom: '12px' }}>🌐 Export Opportunity Index</div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#0d3b66' }}>Global Market Parity</h4>
              <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.5', margin: 0 }}>
                International price indices show strong demand in South East Asian markets, creating favorable premium pricing for Grade-A quality.
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

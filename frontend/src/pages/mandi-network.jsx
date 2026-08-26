import { useState } from 'react';
import Head from 'next/head';
import Header from '../components/common/Header';
import MandiLiveWidget from '../components/common/MandiLiveWidget';
import { HiOutlineBuildingStorefront, HiOutlineGlobeAlt, HiOutlineShieldCheck, HiOutlineCheckCircle } from 'react-icons/hi2';

export default function MandiNetworkPage() {
  return (
    <>
      <Head>
        <title>e-NAM & Agmarknet Mandi Network | KisanMitra</title>
        <meta name="description" content="Live e-NAM and Agmarknet APMC Mandi rates, state-wise commodity prices, and benchmark arrivals" />
      </Head>

      <Header />

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f7f9fb 0%, #eef2f6 100%)',
        paddingTop: '100px',
        paddingBottom: '60px',
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
          
          {/* HERO BANNER */}
          <div style={{
            background: 'linear-gradient(135deg, #2b2d42 0%, #3d405b 100%)',
            borderRadius: '24px',
            padding: '40px',
            color: '#ffffff',
            boxShadow: '0 12px 32px rgba(43, 45, 66, 0.15)',
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
                <HiOutlineGlobeAlt style={{ fontSize: '18px', color: '#e07a5f' }} />
                <span>Pan-India Agmarknet & e-NAM Integration</span>
              </div>
              <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 12px 0' }}>
                e-NAM / Agmarknet Mandi Network 🏛️
              </h1>
              <p style={{ fontSize: '16px', color: '#e0e1dd', maxWidth: '680px', margin: 0, lineHeight: '1.6' }}>
                Access real-time commodity prices, arrivals, and minimum/maximum modal rates across 1,000+ regulated APMC Mandis in India.
              </p>
            </div>
          </div>

          {/* MANDI LIVE WIDGET COMPONENT */}
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <MandiLiveWidget />
          </div>

          {/* NETWORK STATS GRID */}
          <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '18px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ background: '#e8f5ed', color: '#1b4332', padding: '12px', borderRadius: '14px', fontSize: '24px' }}>
                🏛️
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#2b2d42' }}>1,360+ Integrated Mandis</h4>
                <p style={{ fontSize: '13px', color: '#666', margin: 0, lineHeight: '1.4' }}>
                  Unified transparent bidding connected directly via Government e-NAM API gateway.
                </p>
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '18px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '12px', borderRadius: '14px', fontSize: '24px' }}>
                ⚡
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#2b2d42' }}>Hourly Arrivals Sync</h4>
                <p style={{ fontSize: '13px', color: '#666', margin: 0, lineHeight: '1.4' }}>
                  Live volume arrival updates allow farmers to avoid market gluts and peak price drops.
                </p>
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '18px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ background: '#fef3c7', color: '#b45309', padding: '12px', borderRadius: '14px', fontSize: '24px' }}>
                📜
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#2b2d42' }}>Grade-Based Indexing</h4>
                <p style={{ fontSize: '13px', color: '#666', margin: 0, lineHeight: '1.4' }}>
                  Transparent modal pricing mapped to moisture and quality grades certified by KisanMitra.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

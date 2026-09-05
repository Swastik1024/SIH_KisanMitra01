import { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '../components/common/Header';
import { HiOutlineChartPie, HiOutlineTrendingUp, HiOutlineTrendingDown, HiOutlineSearch, HiOutlineFilter } from 'react-icons/hi';
import api from '../services/api';

export default function ApmcBenchmarkPage() {
  const [ratesData, setRatesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCommodity, setFilterCommodity] = useState('all');
  const [filterState, setFilterState] = useState('all');

  useEffect(() => {
    const fetchRates = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/mandi/rates');
        setRatesData(res.data.rates || []);
      } catch (err) {
        console.error('Failed to fetch APMC benchmark rates', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
  }, []);

  const filteredRates = ratesData.filter((item) => {
    const matchComm = filterCommodity === 'all' || item.commodity.toLowerCase().includes(filterCommodity.toLowerCase());
    const matchState = filterState === 'all' || item.state.toLowerCase() === filterState.toLowerCase();
    return matchComm && matchState;
  });

  return (
    <>
      <Head>
        <title>Live APMC Benchmark Rates | KisanMitra</title>
        <meta name="description" content="Official APMC daily benchmark rates, modal prices, and minimum-maximum price spreads across India" />
      </Head>

      <Header />

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fdfbf7 0%, #f4eee0 100%)',
        paddingTop: '100px',
        paddingBottom: '60px',
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
          
          {/* HERO BANNER */}
          <div style={{
            background: 'linear-gradient(135deg, #4a3b32 0%, #634832 100%)',
            borderRadius: '24px',
            padding: '40px',
            color: '#ffffff',
            boxShadow: '0 12px 32px rgba(74, 59, 50, 0.15)',
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
                <HiOutlineChartPie style={{ fontSize: '18px', color: '#dda15e' }} />
                <span>Verified Agricultural Produce Market Committee (APMC) Index</span>
              </div>
              <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 12px 0' }}>
                Live APMC Benchmark Rates 📊
              </h1>
              <p style={{ fontSize: '16px', color: '#faedcd', maxWidth: '680px', margin: 0, lineHeight: '1.6' }}>
                Official daily modal benchmark prices recorded across APMC yards to ensure farmers receive fair market value and prevent distress selling.
              </p>
            </div>
          </div>

          {/* FILTER CONTROLS */}
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            marginBottom: '24px',
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#4a3b32', fontSize: '14px' }}>
              <HiOutlineFilter /> Filter Benchmarks:
            </div>
            
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              style={{
                padding: '10px 16px',
                borderRadius: '12px',
                border: '1px solid #e0d6c8',
                fontSize: '14px',
                fontWeight: '600',
                outline: 'none',
                background: '#faf6f0'
              }}
            >
              <option value="all">All States</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Punjab">Punjab</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Gujarat">Gujarat</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
            </select>

            <select
              value={filterCommodity}
              onChange={(e) => setFilterCommodity(e.target.value)}
              style={{
                padding: '10px 16px',
                borderRadius: '12px',
                border: '1px solid #e0d6c8',
                fontSize: '14px',
                fontWeight: '600',
                outline: 'none',
                background: '#faf6f0'
              }}
            >
              <option value="all">All Commodities</option>
              <option value="Onion">Onion (प्याज)</option>
              <option value="Wheat">Wheat (गेहूं)</option>
              <option value="Potato">Potato (आलू)</option>
              <option value="Tomato">Tomato (टमाटर)</option>
              <option value="Cotton">Cotton (कपास)</option>
              <option value="Soyabean">Soyabean (सोयाबीन)</option>
            </select>
          </div>

          {/* BENCHMARK RATES TABLE / CARDS */}
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#4a3b32', marginBottom: '20px' }}>
              Today&apos;s Official APMC Benchmark Index
            </h3>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#777' }}>Loading benchmark rates...</div>
            ) : filteredRates.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#777' }}>No benchmark rates found matching selection.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {filteredRates.map((item, idx) => (
                  <div key={idx} style={{
                    border: '1px solid #f0e6d6',
                    borderRadius: '16px',
                    padding: '20px',
                    background: '#fdfcf9',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#bc6c25', background: '#faedcd', padding: '4px 10px', borderRadius: '50px' }}>
                          {item.state}
                        </span>
                        <span style={{ fontSize: '12px', color: '#888' }}>{item.unit}</span>
                      </div>
                      <h4 style={{ margin: '4px 0', fontSize: '18px', fontWeight: '800', color: '#283618' }}>
                        {item.commodity}
                      </h4>
                      <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#666' }}>
                        📍 {item.mandi} Market Yard
                      </p>
                    </div>

                    <div style={{ borderTop: '1px dashed #e0d6c8', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#888' }}>Min - Max Spread</div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#555' }}>
                          ₹{item.min_price} - ₹{item.max_price}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: '#bc6c25', fontWeight: '700' }}>Modal Benchmark</div>
                        <div style={{ fontSize: '20px', fontWeight: '900', color: '#283618' }}>
                          ₹{item.modal_price}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

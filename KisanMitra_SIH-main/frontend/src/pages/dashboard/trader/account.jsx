import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/common/Header';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineArrowUp,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineCurrencyRupee,
} from 'react-icons/hi';

export default function TraderAccount() {
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const { isAuthenticated, user, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
    const timer = setTimeout(() => setAuthReady(true), 100);
    return () => clearTimeout(timer);
  }, [hydrate]);

  useEffect(() => {
    if (!authReady) return;

    if (!isAuthenticated || user?.role !== 'trader') {
      router.replace('/login');
      return;
    }
    fetchTransactions();
  }, [authReady, isAuthenticated, user, router]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/trader/transactions');
      setTransactions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to load wallet:', error);
      if (error.response?.status === 401) {
        useAuthStore.getState().logout();
        router.replace('/login');
      } else {
        toast.error('Failed to load wallet');
      }
    } finally {
      setLoading(false);
    }
  };

  const completedTransactions = transactions.filter(
    (tx) =>
      tx.status === 'processed' ||
      tx.status === 'captured' ||
      tx.status === 'completed' ||
      tx.status === 'success'
  );
  const pendingTransactions = transactions.filter(
    (tx) => tx.status === 'pending' || tx.status === 'processing'
  );

  const totalSpent = completedTransactions.reduce(
    (sum, tx) => sum + Number(tx.amount || 0),
    0
  );
  const pendingAmount = pendingTransactions.reduce(
    (sum, tx) => sum + Number(tx.amount || 0),
    0
  );

  if (!authReady || !isAuthenticated || user?.role !== 'trader') {
    return (
      <div>
        <Header />
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f0f4f1',
          }}
        >
          <p style={{ color: '#2d6a4f', fontWeight: '600' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div
        style={{
          minHeight: '100vh',
          background:
            'linear-gradient(180deg, #f3fff7 0%, #f7faf8 45%, #ffffff 100%)',
          paddingTop: '105px',
          paddingBottom: '60px',
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
          <Link
            href="/dashboard/trader"
            style={{
              textDecoration: 'none',
              display: 'inline-block',
              marginBottom: '22px',
            }}
          >
            <button
              style={{
                background: '#ffffff',
                border: '1px solid #dcefe3',
                borderRadius: '50px',
                padding: '10px 18px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '700',
                color: '#176b45',
                boxShadow: '0 4px 14px rgba(30,100,65,0.08)',
              }}
            >
              <HiOutlineArrowLeft style={{ marginRight: '6px' }} />
              Back
            </button>
          </Link>

          <div style={{ marginBottom: '25px' }}>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#123b28' }}>
              My Wallet
            </h1>
            <p style={{ margin: '7px 0 0', color: '#6b7f74', fontSize: '14px' }}>
              Manage your payment history
            </p>
          </div>

          {/* Wallet Card */}
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '28px',
              padding: '30px',
              marginBottom: '22px',
              background:
                'linear-gradient(135deg, #0d6b42 0%, #198754 55%, #42b883 100%)',
              color: 'white',
              boxShadow: '0 18px 40px rgba(20,110,70,0.22)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                right: '-55px',
                top: '-70px',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                right: '100px',
                bottom: '-70px',
              }}
            />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '14px', opacity: 0.85, marginBottom: '10px' }}>
                Total Spent
              </div>
              <div style={{ fontSize: '42px', fontWeight: '800', letterSpacing: '-1px' }}>
                ₹{totalSpent.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '25px',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '20px',
                border: '1px solid #e4f1e9',
                boxShadow: '0 7px 22px rgba(30,80,50,0.05)',
              }}
            >
              <div style={{ color: '#809188', fontSize: '12px', fontWeight: '600', marginBottom: '5px' }}>
                Total Paid
              </div>
              <div style={{ color: '#173d2b', fontSize: '22px', fontWeight: '800' }}>
                ₹{totalSpent.toLocaleString('en-IN')}
              </div>
            </div>
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '20px',
                border: '1px solid #e4f1e9',
                boxShadow: '0 7px 22px rgba(30,80,50,0.05)',
              }}
            >
              <div style={{ color: '#809188', fontSize: '12px', fontWeight: '600', marginBottom: '5px' }}>
                Pending
              </div>
              <div style={{ color: '#173d2b', fontSize: '22px', fontWeight: '800' }}>
                ₹{pendingAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '25px',
              border: '1px solid #e4f1e9',
              boxShadow: '0 8px 25px rgba(30,80,50,0.06)',
            }}
          >
            <h2 style={{ margin: '0 0 20px', color: '#173d2b', fontSize: '19px', fontWeight: '800' }}>
              Recent Transactions
            </h2>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: '#789184' }}>
                Loading...
              </div>
            ) : transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '45px 10px', color: '#8a9991' }}>
                No transactions yet
              </div>
            ) : (
              <div>
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '15px',
                      padding: '16px 5px',
                      borderBottom: '1px solid #edf2ef',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '14px',
                          background: '#eef7ff',
                          color: '#3779b5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <HiOutlineArrowUp size={21} />
                      </div>
                      <div>
                        <div style={{ fontWeight: '750', color: '#274535', fontSize: '14px' }}>
                          Payment Made
                        </div>
                        <div style={{ color: '#8a9991', fontSize: '11px' }}>
                          Order #{tx.order_id} • {new Date(tx.created_at).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '800', fontSize: '15px', color: '#d35454' }}>
                        -₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                      </div>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '20px',
                          fontSize: '10px',
                          fontWeight: '700',
                          background:
                            tx.status === 'captured' || tx.status === 'processed'
                              ? '#e7f8ed'
                              : '#fff5d9',
                          color:
                            tx.status === 'captured' || tx.status === 'processed'
                              ? '#198754'
                              : '#a47700',
                        }}
                      >
                        {tx.status === 'captured' || tx.status === 'processed' ? (
                          <HiOutlineCheckCircle size={12} />
                        ) : (
                          <HiOutlineClock size={12} />
                        )}
                        {tx.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
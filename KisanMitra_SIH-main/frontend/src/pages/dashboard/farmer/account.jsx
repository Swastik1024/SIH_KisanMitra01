import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/common/Header';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineCurrencyRupee,
  HiOutlineTrendingUp,
} from 'react-icons/hi';
import { useLanguage } from '../../../context/LanguageContext';

export default function FarmerWallet() {
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const { isAuthenticated, user, hydrate } = useAuthStore();
  const { t } = useLanguage();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'farmer') {
      router.push('/login');
      return;
    }
    fetchWalletData();
  }, [isAuthenticated, user, router]);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/farmer/transactions');
      const data = res.data;
      setTransactions(data.transactions || []);
      setBalance(data.balance || 0);
      setPendingBalance(data.pending_balance || 0);
    } catch (error) {
      console.error('Wallet fetch error:', error);
      toast.error('Could not load wallet data');
      setTransactions([]);
      setBalance(0);
      setPendingBalance(0);
    } finally {
      setLoading(false);
    }
  };

  const completedTransactions = transactions.filter(
    (tx) => tx.status === 'processed' || tx.status === 'captured' || tx.status === 'completed' || tx.status === 'success'
  );
  const pendingTransactions = transactions.filter(
    (tx) => tx.status === 'pending' || tx.status === 'processing'
  );

  const totalReceived = completedTransactions
    .filter((tx) => tx.type !== 'payment')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const totalPaid = completedTransactions
    .filter((tx) => tx.type === 'payment')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const pendingAmount = pendingTransactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const availableBalance = Math.max(totalReceived - totalPaid, 0);

  const handleAddMoney = () => toast.success('Add money feature coming soon');
  const handleWithdraw = () => toast.success('Withdraw feature coming soon');

  return (
    <div>
      <Header />
      <div style={styles.page}>
        <div style={styles.container}>
          <Link href="/dashboard/farmer" style={{ textDecoration: 'none' }}>
            <button style={styles.backButton}>← Back</button>
          </Link>

          <div style={styles.titleSection}>
            <p style={styles.badge}>KISAN MITRA</p>
            <h1 style={styles.title}>My Wallet</h1>
            <p style={styles.subtitle}>Manage your earnings and transaction history</p>
          </div>

          {/* Main Balance Card */}
          <div style={styles.balanceCard}>
            <div style={styles.balanceDecor1} />
            <div style={styles.balanceDecor2} />
            <div style={styles.balanceContent}>
              <div style={styles.balanceLeft}>
                <div style={styles.balanceLabel}>Available Balance</div>
                <div style={styles.balanceAmount}>₹{availableBalance.toLocaleString('en-IN')}</div>
                <div style={styles.balanceHint}>Your available earnings</div>
              </div>
              <div style={styles.balanceIconBox}>
                <HiOutlineCurrencyRupee size={30} />
              </div>
            </div>
            <div style={styles.balanceActions}>
              <button onClick={handleAddMoney} style={styles.addBtn}>
                <HiOutlineArrowDown size={18} /> Add Money
              </button>
              <button onClick={handleWithdraw} style={styles.withdrawBtn}>
                <HiOutlineArrowUp size={18} /> Withdraw
              </button>
            </div>
          </div>

          {/* Stats – now includes Pending Balance */}
          <div style={styles.statsGrid}>
            <StatCard icon={<HiOutlineTrendingUp />} title="Total Earned" value={`₹${totalReceived.toLocaleString('en-IN')}`} subtitle="Completed earnings" />
            <StatCard icon={<HiOutlineClock />} title="Pending" value={`₹${pendingAmount.toLocaleString('en-IN')}`} subtitle="Awaiting payment" />
            <StatCard icon={<HiOutlineCurrencyRupee />} title="Pending Balance" value={`₹${pendingBalance.toLocaleString('en-IN')}`} subtitle="From sold products" />
            <StatCard icon={<HiOutlineArrowUp />} title="Total Paid" value={`₹${totalPaid.toLocaleString('en-IN')}`} subtitle="Completed payments" />
          </div>

          {/* Transactions List */}
          <div style={styles.transactionCard}>
            <div style={styles.transactionHeader}>
              <h2 style={styles.transactionTitle}>Recent Transactions</h2>
              <p style={styles.transactionSub}>Your latest wallet activity</p>
            </div>

            {loading ? (
              <div style={styles.loading}>Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIconBox}>
                  <HiOutlineCurrencyRupee size={28} />
                </div>
                <div style={styles.emptyTitle}>No transactions yet</div>
                <div style={styles.emptyDesc}>Your wallet transactions will appear here.</div>
              </div>
            ) : (
              <div>
                {transactions.map((tx) => (
                  <TransactionItem key={tx.id} tx={tx} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------ Subcomponents ------------------
function StatCard({ icon, title, value, subtitle }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>{icon}</div>
      <div style={styles.statLabel}>{title}</div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statSub}>{subtitle}</div>
    </div>
  );
}

function TransactionItem({ tx }) {
  const isPayout = tx.type === 'payout' || tx.type === 'credit';
  const isSuccess = ['processed', 'captured', 'completed', 'success'].includes(tx.status);
  const isFailed = tx.status === 'failed';

  return (
    <div style={styles.txRow}>
      <div style={styles.txLeft}>
        <div style={styles.txIcon(isPayout)}>
          {isPayout ? <HiOutlineArrowDown size={21} /> : <HiOutlineArrowUp size={21} />}
        </div>
        <div style={styles.txInfo}>
          <div style={styles.txName}>{isPayout ? 'Payment Received' : 'Payment Made'}</div>
          <div style={styles.txMeta}>
            {tx.order_id ? `Order #${tx.order_id} • ` : ''}
            {tx.created_at ? new Date(tx.created_at).toLocaleDateString('en-IN') : ''}
          </div>
          {tx.description && <div style={{ fontSize: '11px', color: '#889b92', marginTop: '3px' }}>{tx.description}</div>}
        </div>
      </div>
      <div style={styles.txRight}>
        <div style={{ ...styles.txAmount, color: isPayout ? '#198754' : '#d35454' }}>
          {isPayout ? '+' : '-'}₹{Number(tx.amount || 0).toLocaleString('en-IN')}
        </div>
        <div style={styles.txStatus(isSuccess, isFailed)}>
          {isSuccess ? <HiOutlineCheckCircle size={12} /> : isFailed ? <HiOutlineXCircle size={12} /> : <HiOutlineClock size={12} />}
          {tx.status}
        </div>
      </div>
    </div>
  );
}

// ------------------ Styles ------------------
const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #f3fff7 0%, #f7faf8 45%, #ffffff 100%)',
    paddingTop: '105px',
    paddingBottom: '60px',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '0 20px',
  },
  backButton: {
    background: '#ffffff',
    border: '1px solid #dcefe3',
    borderRadius: '50px',
    padding: '10px 18px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '700',
    color: '#176b45',
    boxShadow: '0 4px 14px rgba(30, 100, 65, 0.08)',
    marginBottom: '22px',
  },
  titleSection: { marginBottom: '25px' },
  badge: { margin: '0 0 5px', color: '#4b8b68', fontSize: '14px', fontWeight: '700', letterSpacing: '0.5px' },
  title: { margin: 0, fontSize: '32px', fontWeight: '800', color: '#123b28' },
  subtitle: { margin: '7px 0 0', color: '#6b7f74', fontSize: '14px' },

  balanceCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '28px',
    padding: '30px',
    marginBottom: '22px',
    background: 'linear-gradient(135deg, #0d6b42 0%, #198754 55%, #42b883 100%)',
    color: 'white',
    boxShadow: '0 18px 40px rgba(20, 110, 70, 0.22)',
  },
  balanceDecor1: {
    position: 'absolute',
    width: '180px',
    height: '180px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
    right: '-55px',
    top: '-70px',
  },
  balanceDecor2: {
    position: 'absolute',
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.06)',
    right: '100px',
    bottom: '-70px',
  },
  balanceContent: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '20px',
    flexWrap: 'wrap',
  },
  balanceLeft: { flex: 1 },
  balanceLabel: { fontSize: '14px', opacity: 0.85, marginBottom: '10px' },
  balanceAmount: { fontSize: '42px', fontWeight: '800', letterSpacing: '-1px' },
  balanceHint: { marginTop: '7px', fontSize: '13px', opacity: 0.8 },
  balanceIconBox: {
    width: '54px',
    height: '54px',
    borderRadius: '17px',
    background: 'rgba(255,255,255,0.16)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceActions: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    gap: '12px',
    marginTop: '27px',
    flexWrap: 'wrap',
  },
  addBtn: {
    border: 'none',
    background: '#ffffff',
    color: '#12633d',
    padding: '12px 22px',
    borderRadius: '50px',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  withdrawBtn: {
    border: '1px solid rgba(255,255,255,0.35)',
    background: 'rgba(255,255,255,0.12)',
    color: '#ffffff',
    padding: '12px 22px',
    borderRadius: '50px',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '25px',
  },
  statCard: {
    background: '#ffffff',
    borderRadius: '20px',
    padding: '20px',
    border: '1px solid #e4f1e9',
    boxShadow: '0 7px 22px rgba(30, 80, 50, 0.05)',
  },
  statIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '13px',
    background: '#e9f8ef',
    color: '#198754',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14px',
  },
  statLabel: { color: '#809188', fontSize: '12px', fontWeight: '600', marginBottom: '5px' },
  statValue: { color: '#173d2b', fontSize: '22px', fontWeight: '800' },
  statSub: { color: '#9aa79f', fontSize: '11px', marginTop: '4px' },

  transactionCard: {
    background: '#ffffff',
    borderRadius: '24px',
    padding: '25px',
    border: '1px solid #e4f1e9',
    boxShadow: '0 8px 25px rgba(30, 80, 50, 0.06)',
  },
  transactionHeader: { marginBottom: '20px' },
  transactionTitle: { margin: 0, color: '#173d2b', fontSize: '19px', fontWeight: '800' },
  transactionSub: { margin: '5px 0 0', color: '#829188', fontSize: '13px' },

  loading: { textAlign: 'center', padding: '40px 10px', color: '#789184' },
  emptyState: { textAlign: 'center', padding: '45px 10px' },
  emptyIconBox: {
    width: '58px',
    height: '58px',
    borderRadius: '18px',
    background: '#eef9f3',
    color: '#198754',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px',
  },
  emptyTitle: { fontWeight: '800', color: '#365344', marginBottom: '5px' },
  emptyDesc: { color: '#8a9991', fontSize: '13px' },

  txRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '15px',
    padding: '16px 5px',
    borderBottom: '1px solid #edf2ef',
  },
  txLeft: { display: 'flex', alignItems: 'center', gap: '13px', minWidth: 0 },
  txIcon: (isPayout) => ({
    width: '44px',
    height: '44px',
    flexShrink: 0,
    borderRadius: '14px',
    background: isPayout ? '#e9f8ef' : '#eef7ff',
    color: isPayout ? '#198754' : '#3779b5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  txInfo: { minWidth: 0 },
  txName: { fontWeight: '750', color: '#274535', fontSize: '14px', marginBottom: '4px' },
  txMeta: { color: '#8a9991', fontSize: '11px' },
  txRight: { textAlign: 'right', flexShrink: 0 },
  txAmount: { fontWeight: '800', fontSize: '15px', marginBottom: '5px' },
  txStatus: (isSuccess, isFailed) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '20px',
    fontSize: '10px',
    fontWeight: '700',
    background: isSuccess ? '#e7f8ed' : isFailed ? '#fdeaea' : '#fff5d9',
    color: isSuccess ? '#198754' : isFailed ? '#c0392b' : '#a47700',
  }),
};
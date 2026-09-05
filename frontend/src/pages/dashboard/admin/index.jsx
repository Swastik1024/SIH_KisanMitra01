import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import AdminHeader from '../../../components/admin/AdminHeader';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';

import {
  HiOutlineUsers,
  HiOutlineShoppingBag,
  HiOutlineCurrencyRupee,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineRefresh,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiOutlineChartBar,
  HiOutlineClipboardList,
  HiOutlineTruck,
  HiOutlineUserGroup,
  HiOutlineUserAdd,
  HiOutlineEye,
  HiOutlineEyeOff,
} from 'react-icons/hi';

export default function AdminDashboard() {
  const router = useRouter();
  const { isAuthenticated, user, hydrate } = useAuthStore();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  const loadDashboard = useCallback(async () => {
    try {
      setRefreshing(true);

      const response = await api.get('/api/admin/dashboard', {
        params: {
          period: selectedPeriod,
        },
      });

      setDashboard(response.data);
    } catch (error) {
      console.error('Dashboard loading error:', error);

      if (error.response?.status === 401) {
        useAuthStore.getState().logout();
        router.replace('/login');
        return;
      }

      toast.error(
        error.response?.data?.detail ||
        'Unable to load dashboard data'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPeriod, router]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated) return;

    if (user?.role !== 'admin') {
      router.replace('/login');
      return;
    }

    loadDashboard();
  }, [isAuthenticated, user, router, loadDashboard]);


  const handleReject = async (type, id) => {
    if (!window.confirm('Are you sure you want to reject this request?')) {
      return;
    }

    try {
      const base = type === 'inspection' ? 'inspection-requests' : 'delivery-requests';
      await api.post(`/api/admin/${base}/${id}/reject`);
      toast.success('Request rejected');
      loadDashboard();
    } catch (error) {
      console.error('Reject error:', error);
      toast.error(error.response?.data?.detail || 'Failed to reject request');
    }
  };

  if (loading) {
    return (
      <>
        <AdminHeader />

        <div style={styles.page}>
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p>Loading admin dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  const stats = dashboard?.stats || {};
  const recentOrders = dashboard?.recent_orders || [];
  const recentUsers = dashboard?.recent_users || [];
  const recentListings = dashboard?.recent_listings || [];
  const revenueData = dashboard?.revenue || {};
  const auctionData = dashboard?.auctions || {};
  const deliveryData = dashboard?.deliveries || {};
  const pendingInspectionRequests = dashboard?.pending_inspection_requests || [];
  const pendingDeliveryRequests = dashboard?.pending_delivery_requests || [];
  const flaggedListings = dashboard?.flagged_listings || [];

  return (
    <>
      <AdminHeader />

      <main style={styles.page}>
        <div style={styles.container}>
          {/* HEADER */}
          <div style={styles.topHeader}>
            <div>
              <p style={styles.eyebrow}>ADMIN CONTROL CENTER</p>

              <h1 style={styles.title}>Dashboard</h1>

              <p style={styles.subtitle}>
                Monitor your marketplace, farmers, traders and transactions.
              </p>
            </div>

            <div style={styles.headerActions}>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                style={styles.periodSelect}
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>

              <button
                onClick={loadDashboard}
                disabled={refreshing}
                style={styles.refreshButton}
              >
                <HiOutlineRefresh
                  size={18}
                  style={{
                    animation: refreshing
                      ? 'spin 1s linear infinite'
                      : 'none',
                  }}
                />

                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* MAIN STATS */}
          <div style={styles.statsGrid}>
            <StatCard
              title="Total Users"
              value={stats.total_users}
              icon={<HiOutlineUsers />}
              growth={stats.users_growth}
              href="/dashboard/admin/users"
            />

            <StatCard
              title="Active Listings"
              value={stats.active_listings}
              icon={<HiOutlineShoppingBag />}
              growth={stats.listings_growth}
              href="/dashboard/admin/listings"
            />

            <StatCard
              title="Total Revenue"
              value={stats.total_revenue}
              icon={<HiOutlineCurrencyRupee />}
              money
              growth={stats.revenue_growth}
              href="/dashboard/admin/finance"
            />

            <StatCard
              title="Active Auctions"
              value={stats.active_auctions}
              icon={<HiOutlineClock />}
              growth={stats.auctions_growth}
              href="/dashboard/admin/auctions"
            />
          </div>

          {/* SECONDARY STATS */}
          <div style={styles.secondaryGrid}>
            <MiniStat
              title="Farmers"
              value={stats.total_farmers}
              icon={<HiOutlineUserGroup />}
            />

            <MiniStat
              title="Traders"
              value={stats.total_traders}
              icon={<HiOutlineUsers />}
            />

            <MiniStat
              title="Verified Crops"
              value={stats.verified_listings || 0}
              icon={<HiOutlineCheckCircle />}
            />

            <MiniStat
              title="Flagged Crops"
              value={stats.flagged_listings || 0}
              icon={<HiOutlineExclamationCircle />}
            />

            <MiniStat
              title="Pending Deliveries"
              value={stats.pending_deliveries}
              icon={<HiOutlineTruck />}
            />


            <MiniStat
              title="Completed Orders"
              value={stats.completed_orders}
              icon={<HiOutlineCheckCircle />}
            />
          </div>

          {/* REVENUE + AUCTIONS */}
          <div style={styles.twoColumn}>
            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h2 style={styles.cardTitle}>Revenue Overview</h2>
                  <p style={styles.cardSubtitle}>
                    Revenue generated during the selected period
                  </p>
                </div>
                <div style={styles.revenueAmount}>
                  ₹{formatNumber(revenueData.total)}
                </div>
              </div>
              <RevenueChart data={revenueData.chart || []} />
            </section>

            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h2 style={styles.cardTitle}>Auction Overview</h2>
                  <p style={styles.cardSubtitle}>
                    Current marketplace activity
                  </p>
                </div>
                <HiOutlineChartBar size={25} color="#2d6a4f" />
              </div>
              <div style={styles.auctionList}>
                <StatusRow
                  label="Live Auctions"
                  value={auctionData.live}
                  type="success"
                />
                <StatusRow
                  label="Upcoming Auctions"
                  value={auctionData.upcoming}
                  type="warning"
                />
                <StatusRow
                  label="Completed Auctions"
                  value={auctionData.completed}
                  type="neutral"
                />
                <StatusRow
                  label="Cancelled Auctions"
                  value={auctionData.cancelled}
                  type="danger"
                />
              </div>
            </section>
          </div>

          {/* ORDERS + DELIVERY */}
          <div style={styles.twoColumn}>
            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h2 style={styles.cardTitle}>Order Summary</h2>
                  <p style={styles.cardSubtitle}>Current order status</p>
                </div>
              </div>
              <div style={styles.orderGrid}>
                <OrderStatus
                  label="Pending"
                  value={stats.pending_orders}
                  icon={<HiOutlineClock />}
                />
                <OrderStatus
                  label="Processing"
                  value={stats.processing_orders}
                  icon={<HiOutlineRefresh />}
                />
                <OrderStatus
                  label="Completed"
                  value={stats.completed_orders}
                  icon={<HiOutlineCheckCircle />}
                />
                <OrderStatus
                  label="Cancelled"
                  value={stats.cancelled_orders}
                  icon={<HiOutlineExclamationCircle />}
                />
              </div>
            </section>

            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h2 style={styles.cardTitle}>Delivery Status</h2>
                  <p style={styles.cardSubtitle}>Logistics activity</p>
                </div>
                <HiOutlineTruck size={25} color="#2d6a4f" />
              </div>
              <div style={styles.deliveryList}>
                <StatusRow
                  label="Pending"
                  value={deliveryData.pending}
                  type="warning"
                />
                <StatusRow
                  label="Assigned"
                  value={deliveryData.assigned}
                  type="neutral"
                />
                <StatusRow
                  label="In Transit"
                  value={deliveryData.in_transit}
                  type="success"
                />
                <StatusRow
                  label="Delivered"
                  value={deliveryData.delivered}
                  type="success"
                />
              </div>
            </section>
          </div>

          {/* PENDING INSPECTION REQUESTS */}
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <h2 style={styles.cardTitle}>Pending Inspection Requests</h2>
                <p style={styles.cardSubtitle}>Products waiting for quality inspection</p>
              </div>
              <HiOutlineClipboardList size={25} color="#2d6a4f" />
            </div>

            {pendingInspectionRequests.length === 0 ? (
              <EmptyState text="No pending inspection requests" />
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Product</th>
                      <th style={styles.th}>Farmer</th>
                      <th style={styles.th}>Quantity</th>
                      <th style={styles.th}>Location</th>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingInspectionRequests.map((item) => (
                      <tr key={item.id}>
                        <td style={styles.td}><strong>{item.product_name}</strong></td>
                        <td style={styles.td}>{item.farmer_name}</td>
                        <td style={styles.td}>{item.quantity} {item.unit}</td>
                        <td style={styles.td}>{item.location || '—'}</td>
                        <td style={styles.td}>{formatDate(item.created_at)}</td>
                        <td style={styles.td}>
                          <button
                            onClick={() => handleReject('inspection', item.id)}
                            style={styles.rejectButton}
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* PENDING DELIVERY REQUESTS */}
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <h2 style={styles.cardTitle}>Pending Delivery Requests</h2>
                <p style={styles.cardSubtitle}>Orders awaiting delivery confirmation</p>
              </div>
              <HiOutlineTruck size={25} color="#2d6a4f" />
            </div>

            {pendingDeliveryRequests.length === 0 ? (
              <EmptyState text="No pending delivery requests" />
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Order ID</th>
                      <th style={styles.th}>Product</th>
                      <th style={styles.th}>Farmer</th>
                      <th style={styles.th}>Trader</th>
                      <th style={styles.th}>Amount</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingDeliveryRequests.map((order) => (
                      <tr key={order.id}>
                        <td style={styles.td}>#{order.order_id}</td>
                        <td style={styles.td}>{order.product_name}</td>
                        <td style={styles.td}>{order.farmer_name}</td>
                        <td style={styles.td}>{order.trader_name}</td>
                        <td style={styles.td}>₹{formatNumber(order.total_price)}</td>
                        <td style={styles.td}><StatusBadge status={order.status} /></td>
                        <td style={styles.td}>
                          <button
                            onClick={() => handleReject('delivery', order.id)}
                            style={styles.rejectButton}
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* AI FLAGGED LISTINGS */}
          {flaggedListings.length > 0 && (
            <section style={{ ...styles.card, border: '2px solid #fca5a5', background: '#fff5f5' }}>
              <div style={styles.cardHeader}>
                <div>
                  <h2 style={{ ...styles.cardTitle, color: '#b91c1c' }}>
                    🚨 AI-Flagged Listings ({flaggedListings.length})
                  </h2>
                  <p style={{ ...styles.cardSubtitle, color: '#ef4444' }}>
                    Suspicious or AI-generated photos detected — admin review required
                  </p>
                </div>
                <HiOutlineExclamationCircle size={28} color="#dc2626" />
              </div>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Photo</th>
                      <th style={styles.th}>Listing</th>
                      <th style={styles.th}>Farmer</th>
                      <th style={styles.th}>Phone</th>
                      <th style={styles.th}>Qty / Price</th>
                      <th style={styles.th}>Location</th>
                      <th style={styles.th}>Flag Reason</th>
                      <th style={styles.th}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flaggedListings.map((item) => (
                      <tr key={item.id} style={{ background: '#fff1f2' }}>
                        <td style={styles.td}>
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.product_name}
                              style={{
                                width: '52px', height: '52px', objectFit: 'cover',
                                borderRadius: '10px', border: '2px solid #fca5a5'
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '52px', height: '52px', background: '#fee2e2',
                              borderRadius: '10px', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontSize: '22px'
                            }}>🚫</div>
                          )}
                        </td>
                        <td style={styles.td}><strong>{item.product_name}</strong></td>
                        <td style={styles.td}>{item.farmer_name}</td>
                        <td style={styles.td}>{item.farmer_phone}</td>
                        <td style={styles.td}>{item.quantity} &middot; ₹{formatNumber(item.price)}</td>
                        <td style={styles.td}>{item.location}</td>
                        <td style={{ ...styles.td, maxWidth: '200px', fontSize: '12px', color: '#b91c1c' }}>
                          {item.flag_reason}
                        </td>
                        <td style={styles.td}>{formatDate(item.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* RECENT ORDERS */}
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <h2 style={styles.cardTitle}>Recent Orders</h2>
                <p style={styles.cardSubtitle}>
                  Latest marketplace transactions
                </p>
              </div>
              <button
                onClick={() => router.push('/admin/orders')}
                style={styles.viewButton}
              >
                View all
              </button>
            </div>

            {recentOrders.length === 0 ? (
              <EmptyState text="No recent orders found." />
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Order</th>
                      <th style={styles.th}>Farmer</th>
                      <th style={styles.th}>Trader</th>
                      <th style={styles.th}>Amount</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td style={styles.td}>
                          <strong>#{order.id}</strong>
                        </td>
                        <td style={styles.td}>
                          {order.farmer_name || '—'}
                        </td>
                        <td style={styles.td}>
                          {order.trader_name || '—'}
                        </td>
                        <td style={styles.td}>
                          ₹{formatNumber(order.amount)}
                        </td>
                        <td style={styles.td}>
                          <StatusBadge status={order.status} />
                        </td>
                        <td style={styles.td}>
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* RECENT LISTINGS */}
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <h2 style={styles.cardTitle}>Recent Listings</h2>
                <p style={styles.cardSubtitle}>
                  Recently added products
                </p>
              </div>
              <button
                onClick={() => router.push('/admin/listings')}
                style={styles.viewButton}
              >
                View all
              </button>
            </div>

            {recentListings.length === 0 ? (
              <EmptyState text="No recent listings found." />
            ) : (
              <div style={styles.listingGrid}>
                {recentListings.map((listing) => (
                  <div key={listing.id} style={styles.listingCard}>
                    <div style={styles.listingImage}>
                      {listing.image ? (
                        <img
                          src={listing.image}
                          alt={listing.crop_name}
                          style={styles.image}
                        />
                      ) : (
                        <HiOutlineShoppingBag size={30} />
                      )}
                    </div>
                    <div style={styles.listingContent}>
                      <h3 style={styles.listingTitle}>
                        {listing.crop_name || 'Unnamed listing'}
                      </h3>
                      <p style={styles.listingMeta}>
                        {listing.farmer_name || 'Farmer'}
                      </p>
                      <div style={styles.listingBottom}>
                        <strong>₹{formatNumber(listing.base_price)}</strong>
                        <StatusBadge status={listing.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* RECENT USERS */}
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <h2 style={styles.cardTitle}>
                  Recently Registered Users
                </h2>
                <p style={styles.cardSubtitle}>
                  Latest farmers and traders
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard/admin/users')}
                style={styles.viewButton}
              >
                View all
              </button>
            </div>

            {recentUsers.length === 0 ? (
              <EmptyState text="No recent users found." />
            ) : (
              <div style={styles.usersList}>
                {recentUsers.map((item) => (
                  <div key={item.id} style={styles.userRow}>
                    <div style={styles.avatar}>
                      {getInitials(item.name)}
                    </div>
                    <div style={styles.userInfo}>
                      <strong style={styles.userName}>
                        {item.name || 'Unnamed User'}
                      </strong>
                      <span style={styles.userEmail}>
                        {item.email || item.phone || 'No contact'}
                      </span>
                    </div>
                    <div style={styles.userRole}>
                      {item.role || 'user'}
                    </div>
                    <div style={styles.userDate}>
                      {formatDate(item.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
        }

        button,
        select {
          font-family: inherit;
        }

        button {
          transition: all 0.2s ease;
        }

        button:hover {
          transform: translateY(-1px);
        }

        @media (max-width: 900px) {
          .dashboard-responsive {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({ title, value, icon, growth, money, href }) {
  const router = useRouter();

  const isPositive =
    growth !== undefined &&
    growth !== null &&
    Number(growth) >= 0;

  return (
    <button
      onClick={() => href && router.push(href)}
      style={styles.statCard}
    >
      <div style={styles.statTop}>
        <div style={styles.statIcon}>{icon}</div>
        {growth !== undefined && growth !== null && (
          <div
            style={{
              ...styles.growth,
              color: isPositive ? '#2d6a4f' : '#c0392b',
              background: isPositive ? '#e8f5ed' : '#fdecec',
            }}
          >
            {isPositive ? (
              <HiOutlineArrowUp size={13} />
            ) : (
              <HiOutlineArrowDown size={13} />
            )}
            {Math.abs(Number(growth)).toFixed(1)}%
          </div>
        )}
      </div>
      <div style={styles.statValue}>
        {money && '₹'}
        {formatNumber(value)}
      </div>
      <div style={styles.statTitle}>{title}</div>
    </button>
  );
}

/* =========================================================
   MINI STAT
========================================================= */

function MiniStat({ title, value, icon }) {
  return (
    <div style={styles.miniStat}>
      <div style={styles.miniIcon}>{icon}</div>
      <div>
        <div style={styles.miniValue}>{formatNumber(value)}</div>
        <div style={styles.miniTitle}>{title}</div>
      </div>
    </div>
  );
}

/* =========================================================
   REVENUE CHART
========================================================= */

function RevenueChart({ data }) {
  if (!data || data.length === 0) {
    return <div style={styles.noChart}>No revenue data available for this period.</div>;
  }

  const numericValues = data.map((item) => Number(item.value) || 0);
  const maxValue = Math.max(...numericValues, 1);

  return (
    <div style={styles.chart}>
      {data.map((item, index) => {
        const value = Number(item.value) || 0;
        const height = Math.max((value / maxValue) * 100, 3);
        return (
          <div key={`${item.label}-${index}`} style={styles.chartColumn}>
            <div style={styles.chartValue}>₹{formatCompact(value)}</div>
            <div style={styles.chartBarContainer}>
              <div style={{ ...styles.chartBar, height: `${height}%` }} />
            </div>
            <div style={styles.chartLabel}>{item.label}</div>
          </div>
        );
      })}
    </div>
  );
}

/* =========================================================
   STATUS ROW
========================================================= */

function StatusRow({ label, value, type = 'neutral' }) {
  const colors = {
    success: { background: '#e8f5ed', color: '#2d6a4f' },
    warning: { background: '#fff7df', color: '#9a6700' },
    danger: { background: '#fdecec', color: '#c0392b' },
    neutral: { background: '#f1f3f5', color: '#495057' },
  };
  const color = colors[type] || colors.neutral;

  return (
    <div style={styles.statusRow}>
      <div style={styles.statusLeft}>
        <span style={{ ...styles.statusDot, background: color.color }} />
        <span>{label}</span>
      </div>
      <strong style={{ color: color.color }}>{formatNumber(value)}</strong>
    </div>
  );
}

/* =========================================================
   ORDER STATUS
========================================================= */

function OrderStatus({ label, value, icon }) {
  return (
    <div style={styles.orderStatus}>
      <div style={styles.orderIcon}>{icon}</div>
      <div>
        <strong style={styles.orderValue}>{formatNumber(value)}</strong>
        <div style={styles.orderLabel}>{label}</div>
      </div>
    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }) {
  const normalized = String(status || 'unknown').toLowerCase();
  let background = '#f1f3f5';
  let color = '#495057';

  if (
    ['active', 'completed', 'complete', 'delivered', 'processed', 'captured', 'success'].includes(normalized)
  ) {
    background = '#e8f5ed';
    color = '#2d6a4f';
  }
  if (['pending', 'upcoming', 'processing', 'assigned', 'in_transit'].includes(normalized)) {
    background = '#fff7df';
    color = '#9a6700';
  }
  if (['cancelled', 'canceled', 'failed', 'rejected'].includes(normalized)) {
    background = '#fdecec';
    color = '#c0392b';
  }

  return (
    <span style={{ ...styles.badge, background, color }}>
      {formatStatus(status)}
    </span>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({ text }) {
  return (
    <div style={styles.emptyState}>
      <HiOutlineClipboardList size={30} />
      <p>{text}</p>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatNumber(value) {
  if (value === undefined || value === null || value === '') return '0';
  const number = Number(value);
  if (Number.isNaN(number)) return value;
  return number.toLocaleString('en-IN');
}

function formatCompact(value) {
  const number = Number(value) || 0;
  if (number >= 10000000) return `${(number / 10000000).toFixed(1)}Cr`;
  if (number >= 100000) return `${(number / 100000).toFixed(1)}L`;
  if (number >= 1000) return `${(number / 1000).toFixed(1)}K`;
  return number.toLocaleString('en-IN');
}

function formatDate(date) {
  if (!date) return '—';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatStatus(status) {
  if (!status) return 'Unknown';
  return String(status)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getInitials(name) {
  if (!name) return 'U';
  return String(name)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

/* =========================================================
   STYLES
========================================================= */

const styles = {
  page: {
    minHeight: '100vh',
    paddingTop: '100px',
    paddingBottom: '60px',
    background: 'linear-gradient(135deg, #f4f8f5 0%, #edf5ef 50%, #f8faf8 100%)',
    fontFamily: "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },

  container: {
    width: '100%',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 24px',
  },

  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '20px',
    marginBottom: '30px',
    flexWrap: 'wrap',
  },

  eyebrow: {
    margin: '0 0 7px',
    color: '#40916c',
    fontSize: '11px',
    fontWeight: '800',
    letterSpacing: '1.6px',
  },

  title: {
    margin: 0,
    color: '#163b2a',
    fontSize: '34px',
    lineHeight: 1.15,
    fontWeight: '850',
    letterSpacing: '-0.7px',
  },

  subtitle: {
    margin: '9px 0 0',
    color: '#718078',
    fontSize: '14px',
  },

  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },

  periodSelect: {
    height: '42px',
    padding: '0 14px',
    borderRadius: '12px',
    border: '1px solid #dbe6de',
    background: '#ffffff',
    color: '#244936',
    fontWeight: '600',
    outline: 'none',
    cursor: 'pointer',
  },

  createAgentButton: {
    height: '42px',
    padding: '0 17px',
    border: 'none',
    borderRadius: '12px',
    background: '#ffffff',
    color: '#2d6a4f',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '700',
    cursor: 'pointer',
    border: '1px solid #2d6a4f',
  },

  refreshButton: {
    height: '42px',
    padding: '0 17px',
    border: 'none',
    borderRadius: '12px',
    background: '#2d6a4f',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 7px 18px rgba(45,106,79,0.2)',
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    gap: '16px',
    marginBottom: '16px',
  },

  statCard: {
    border: '1px solid #e1ebe4',
    background: '#ffffff',
    borderRadius: '20px',
    padding: '21px',
    textAlign: 'left',
    cursor: 'pointer',
    boxShadow: '0 8px 25px rgba(30,70,45,0.06)',
  },

  statTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '17px',
  },

  statIcon: {
    width: '45px',
    height: '45px',
    borderRadius: '14px',
    background: '#e9f5ed',
    color: '#2d6a4f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '23px',
  },

  growth: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    borderRadius: '20px',
    padding: '5px 8px',
    fontSize: '11px',
    fontWeight: '800',
  },

  statValue: {
    color: '#173b2a',
    fontSize: '27px',
    fontWeight: '850',
    marginBottom: '4px',
  },

  statTitle: {
    color: '#7a8780',
    fontSize: '13px',
    fontWeight: '600',
  },

  secondaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  },

  miniStat: {
    background: '#ffffff',
    border: '1px solid #e5ece7',
    borderRadius: '16px',
    padding: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },

  miniIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '11px',
    background: '#f0f7f2',
    color: '#40916c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '19px',
  },

  miniValue: {
    color: '#1b4332',
    fontSize: '18px',
    fontWeight: '800',
  },

  miniTitle: {
    color: '#7b8780',
    fontSize: '11px',
    marginTop: '2px',
  },

  twoColumn: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
    gap: '18px',
    marginBottom: '18px',
  },

  card: {
    background: '#ffffff',
    border: '1px solid #e1ebe4',
    borderRadius: '20px',
    padding: '22px',
    boxShadow: '0 8px 25px rgba(30,70,45,0.05)',
    marginBottom: '18px',
  },

  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '22px',
  },

  cardTitle: {
    margin: 0,
    color: '#173b2a',
    fontSize: '18px',
    fontWeight: '800',
  },

  cardSubtitle: {
    margin: '5px 0 0',
    color: '#89948e',
    fontSize: '12px',
  },

  revenueAmount: {
    color: '#2d6a4f',
    fontSize: '22px',
    fontWeight: '850',
  },

  chart: {
    height: '220px',
    display: 'flex',
    alignItems: 'stretch',
    gap: '10px',
    borderBottom: '1px solid #edf1ee',
    paddingTop: '20px',
  },

  chartColumn: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  chartValue: {
    fontSize: '9px',
    color: '#738078',
    marginBottom: '5px',
    whiteSpace: 'nowrap',
  },

  chartBarContainer: {
    height: '150px',
    width: '100%',
    maxWidth: '35px',
    display: 'flex',
    alignItems: 'flex-end',
    background: '#f3f7f4',
    borderRadius: '9px 9px 4px 4px',
    overflow: 'hidden',
  },

  chartBar: {
    width: '100%',
    background: 'linear-gradient(180deg, #52b788, #2d6a4f)',
    borderRadius: '8px 8px 3px 3px',
    minHeight: '4px',
    transition: 'height 0.4s ease',
  },

  chartLabel: {
    marginTop: '8px',
    fontSize: '9px',
    color: '#89948e',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
  },

  noChart: {
    height: '220px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9aa49e',
    fontSize: '13px',
  },

  auctionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },

  deliveryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },

  statusRow: {
    minHeight: '50px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #f0f3f1',
    padding: '7px 2px',
    color: '#4d5b53',
    fontSize: '13px',
    fontWeight: '600',
  },

  statusLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
  },

  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },

  orderGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '10px',
  },

  orderStatus: {
    padding: '15px',
    background: '#f7faf8',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '11px',
  },

  orderIcon: {
    width: '37px',
    height: '37px',
    borderRadius: '11px',
    background: '#e8f4ec',
    color: '#2d6a4f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '19px',
  },

  orderValue: {
    color: '#1b4332',
    fontSize: '18px',
  },

  orderLabel: {
    color: '#849089',
    fontSize: '11px',
    marginTop: '2px',
  },

  viewButton: {
    border: 'none',
    background: '#edf6f0',
    color: '#2d6a4f',
    padding: '8px 13px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '800',
    cursor: 'pointer',
  },

  tableWrapper: {
    overflowX: 'auto',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '700px',
  },

  th: {
    padding: '11px 12px',
    textAlign: 'left',
    color: '#89948e',
    fontSize: '11px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid #e9efeb',
  },

  td: {
    padding: '15px 12px',
    color: '#526058',
    fontSize: '13px',
    borderBottom: '1px solid #f0f3f1',
  },

  badge: {
    display: 'inline-flex',
    padding: '5px 9px',
    borderRadius: '20px',
    fontSize: '10px',
    fontWeight: '800',
    textTransform: 'capitalize',
  },

  assignButton: {
    background: '#eaf8f0',
    color: '#198754',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '12px',
  },

  rejectButton: {
    background: '#fdecec',
    color: '#c0392b',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '12px',
  },

  listingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '12px',
  },

  listingCard: {
    border: '1px solid #e7ede9',
    borderRadius: '15px',
    padding: '12px',
    display: 'flex',
    gap: '12px',
  },

  listingImage: {
    width: '65px',
    height: '65px',
    flexShrink: 0,
    borderRadius: '12px',
    background: '#edf6f0',
    color: '#40916c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  listingContent: {
    minWidth: 0,
    flex: 1,
  },

  listingTitle: {
    margin: '2px 0 4px',
    color: '#234634',
    fontSize: '14px',
    fontWeight: '800',
  },

  listingMeta: {
    margin: 0,
    color: '#89948e',
    fontSize: '11px',
  },

  listingBottom: {
    marginTop: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '7px',
    color: '#2d6a4f',
    fontSize: '13px',
  },

  usersList: {
    display: 'flex',
    flexDirection: 'column',
  },

  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '13px',
    padding: '13px 3px',
    borderBottom: '1px solid #f0f3f1',
  },

  avatar: {
    width: '40px',
    height: '40px',
    flexShrink: 0,
    borderRadius: '12px',
    background: '#dff0e5',
    color: '#2d6a4f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '850',
  },

  userInfo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },

  userName: {
    color: '#294536',
    fontSize: '13px',
  },

  userEmail: {
    color: '#89948e',
    fontSize: '11px',
    marginTop: '3px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  userRole: {
    padding: '5px 9px',
    borderRadius: '20px',
    background: '#edf6f0',
    color: '#2d6a4f',
    fontSize: '10px',
    fontWeight: '800',
    textTransform: 'capitalize',
  },

  userDate: {
    color: '#9aa49e',
    fontSize: '11px',
    minWidth: '90px',
    textAlign: 'right',
  },

  emptyState: {
    minHeight: '130px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#a0aaa4',
    gap: '8px',
    fontSize: '13px',
  },

  loadingContainer: {
    minHeight: '70vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#718078',
    gap: '15px',
  },

  spinner: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    border: '4px solid #dcebe1',
    borderTopColor: '#2d6a4f',
    animation: 'spin 0.8s linear infinite',
  },

  // Modal
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,40,25,0.35)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalCard: {
    background: '#ffffff',
    borderRadius: '20px',
    padding: '25px',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
  },

  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },

  modalTitle: {
    color: '#173b2a',
    fontSize: '20px',
    fontWeight: '800',
    margin: 0,
  },

  modalClose: {
    border: 'none',
    background: 'transparent',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#7a8780',
  },

  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },

  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },

  formLabel: {
    color: '#526058',
    fontSize: '12px',
    fontWeight: '700',
  },

  formInput: {
    height: '42px',
    border: '1px solid #dbe6de',
    borderRadius: '10px',
    padding: '0 12px',
    fontSize: '13px',
    outline: 'none',
    background: '#f9fbfa',
    color: '#243b30',
  },

  otpButton: {
    height: '42px',
    padding: '0 15px',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '700',
    fontSize: '12px',
    whiteSpace: 'nowrap',
  },

  formError: {
    background: '#fdecec',
    color: '#c0392b',
    padding: '10px 12px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '600',
  },

  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '5px',
  },

  cancelButton: {
    border: '1px solid #dbe6de',
    background: 'white',
    color: '#526058',
    padding: '10px 18px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '13px',
  },

  submitButton: {
    border: 'none',
    background: '#2d6a4f',
    color: '#fff',
    padding: '10px 18px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '13px',
    boxShadow: '0 7px 18px rgba(45,106,79,0.2)',
  },
};
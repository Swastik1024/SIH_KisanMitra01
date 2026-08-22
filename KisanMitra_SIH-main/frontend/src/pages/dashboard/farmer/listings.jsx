import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Header from '../../../components/common/Header';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';
import { useLanguage } from '../../../context/LanguageContext';
import { HiOutlinePlus, HiOutlineDocumentReport, HiOutlineX } from 'react-icons/hi';

import {
  Search,
  Heart,
  MapPin,
  ShoppingBasket,
  Clock3,
  CheckCircle2,
  ChevronDown,
  Grid2X2,
  List,
  RotateCcw,
  Plus,
  MoreVertical,
  SlidersHorizontal,
  CalendarDays,
  PackageOpen,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function FarmerListings() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [favorites, setFavorites] = useState([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [inspectionProduct, setInspectionProduct] = useState(null);
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
    const fetchProducts = async () => {
      try {
        const res = await api.get('/api/products/my');
        setProducts(res.data || []);
      } catch (error) {
        console.error('Failed to load products:', error);
        if (error.response?.status === 401) {
          toast.error(t('common.sessionExpired'));
          useAuthStore.getState().logout();
          router.replace('/login');
        } else {
          toast.error(t('listings.failedLoad'));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [isAuthenticated, user, router, t]);

  const getImage = (product) => {
    const media = product.media || [];
    const image = media.find((m) => m.media_type === 'image');
    if (!image) return '';

    const url = image.url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${API_BASE_URL}${cleanUrl}`;
  };

  const getCategory = (product) => {
    return String(product.category_slug || '').toLowerCase();
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      verified: 'Verified',
      pending_inspection: 'Pending Inspection',
      rejected: 'Rejected',
      active: 'Active',
      auction: 'In Auction',
      sold: 'Sold',
      completed: 'Completed',
      canceled: 'Canceled',
    };
    return (
      statusMap[status] ||
      t(`listings.status_${status}`) ||
      String(status || 'pending').replaceAll('_', ' ')
    );
  };

  const getStatusClass = (status) => {
    if (status === 'verified' || status === 'active') return 'status-active';
    if (status === 'pending_inspection' || status === 'auction') return 'status-auction';
    if (status === 'sold' || status === 'completed') return 'status-completed';
    if (status === 'canceled') return 'status-canceled';
    return 'status-rejected';
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter((product) => {
        const name = String(product.name || '').toLowerCase();
        const location = String(product.location || '').toLowerCase();
        const variety = String(product.variety || '').toLowerCase();
        return name.includes(query) || location.includes(query) || variety.includes(query);
      });
    }

    if (statusFilter !== 'all') {
      result = result.filter((product) => product.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      result = result.filter((product) => {
        const category = getCategory(product);
        if (categoryFilter === 'vegetables') return category.includes('vegetable') || category.includes('भाजी');
        if (categoryFilter === 'grains') return category.includes('grain') || category.includes('धान्य');
        if (categoryFilter === 'fruits') return category.includes('fruit') || category.includes('फळ');
        if (categoryFilter === 'pulses') return category.includes('pulse') || category.includes('dal') || category.includes('डाळ');
        return true;
      });
    }

    if (sortBy === 'name') result.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    if (sortBy === 'priceLow') result.sort((a, b) => Number(a.price || a.basePrice || 0) - Number(b.price || b.basePrice || 0));
    if (sortBy === 'priceHigh') result.sort((a, b) => Number(b.price || b.basePrice || 0) - Number(a.price || a.basePrice || 0));

    return result;
  }, [products, search, statusFilter, categoryFilter, sortBy]);

  const stats = useMemo(() => {
    const total = products.length;
    const verified = products.filter((p) => p.status === 'verified').length;
    const pending = products.filter((p) => p.status === 'pending_inspection').length;
    const completed = products.filter((p) => p.status === 'completed' || p.status === 'sold').length;
    return { total, verified, pending, completed };
  }, [products]);

  const toggleFavorite = (id) => {
    setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setCategoryFilter('all');
  };

  return (
    <>
      <Header />
      <div className="listings-page">
        <main className="listing-container">
          <section className="page-heading">
            <div className="heading-content">
              <div className="heading-title">
                <span className="heading-leaf">🌿</span>
                <div>
                  <h1>{t('listings.myListings')}</h1>
                  <p>{t('listings.yourListings')}</p>
                </div>
              </div>
            </div>
            <Link
              href="/dashboard/farmer/listings/createlistings"
              style={{ textDecoration: 'none' }}
            >
              <button
                style={{
                  background: 'linear-gradient(135deg, #2d7d4e 0%, #1f633d 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  fontWeight: '800',
                  fontSize: '13px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 7px 18px rgba(45, 125, 78, 0.25)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    'linear-gradient(135deg, #358b59 0%, #1b5735 100%)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow =
                    '0 10px 24px rgba(45, 125, 78, 0.32)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    'linear-gradient(135deg, #2d7d4e 0%, #1f633d 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow =
                    '0 7px 18px rgba(45, 125, 78, 0.25)';
                }}
              >
                <HiOutlinePlus size={18} />
                {t('listings.addNewListing')}
              </button>
            </Link>
          </section>

          <section className="stats-grid">
            <div className="stat-card stat-green">
              <div className="stat-icon"><ShoppingBasket size={23} /></div>
              <div><span>Total Listings</span><strong>{stats.total}</strong></div>
            </div>
            <div className="stat-card stat-orange">
              <div className="stat-icon"><CheckCircle2 size={23} /></div>
              <div><span>Verified</span><strong>{stats.verified}</strong></div>
            </div>
            <div className="stat-card stat-purple">
              <div className="stat-icon"><Clock3 size={23} /></div>
              <div><span>Pending Inspection</span><strong>{stats.pending}</strong></div>
            </div>
            <div className="stat-card stat-blue">
              <div className="stat-icon"><CheckCircle2 size={23} /></div>
              <div><span>Completed</span><strong>{stats.completed}</strong></div>
            </div>
          </section>

          <button className="mobile-filter-button" onClick={() => setMobileFiltersOpen(true)}>
            <SlidersHorizontal size={18} />
            Filter
          </button>

          <section className="main-content">
            <aside className="filter-sidebar">
              <div className="filter-title">
                <h2>Search & Filter</h2>
                <button onClick={clearFilters}><RotateCcw size={15} /></button>
              </div>
              <div className="filter-search">
                <input type="text" placeholder="Search product..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <Search size={17} />
              </div>
              <div className="filter-group">
                <label>Category</label>
                <div className="select-wrapper">
                  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="all">All</option>
                    <option value="vegetables">Vegetables</option>
                    <option value="grains">Grains</option>
                    <option value="fruits">Fruits</option>
                    <option value="pulses">Pulses</option>
                  </select>
                  <ChevronDown size={16} />
                </div>
              </div>
              <div className="filter-group">
                <label>Status</label>
                <div className="checkbox-list">
                  <label className="checkbox-row">
                    <input type="checkbox" checked={statusFilter === 'all'} onChange={() => setStatusFilter('all')} />
                    <span className="custom-check">{statusFilter === 'all' && '✓'}</span>
                    All
                  </label>
                  <label className="checkbox-row">
                    <input type="checkbox" checked={statusFilter === 'verified'} onChange={() => setStatusFilter(statusFilter === 'verified' ? 'all' : 'verified')} />
                    <span className="custom-check">{statusFilter === 'verified' && '✓'}</span>
                    Verified
                  </label>
                  <label className="checkbox-row">
                    <input type="checkbox" checked={statusFilter === 'pending_inspection'} onChange={() => setStatusFilter(statusFilter === 'pending_inspection' ? 'all' : 'pending_inspection')} />
                    <span className="custom-check">{statusFilter === 'pending_inspection' && '✓'}</span>
                    Pending Inspection
                  </label>
                  <label className="checkbox-row">
                    <input type="checkbox" checked={statusFilter === 'rejected'} onChange={() => setStatusFilter(statusFilter === 'rejected' ? 'all' : 'rejected')} />
                    <span className="custom-check">{statusFilter === 'rejected' && '✓'}</span>
                    Rejected
                  </label>
                  <label className="checkbox-row">
                    <input type="checkbox" checked={statusFilter === 'canceled'} onChange={() => setStatusFilter(statusFilter === 'canceled' ? 'all' : 'canceled')} />
                    <span className="custom-check">{statusFilter === 'canceled' && '✓'}</span>
                    Canceled
                  </label>
                  <label className="checkbox-row">
                    <input type="checkbox" checked={statusFilter === 'sold'} onChange={() => setStatusFilter(statusFilter === 'sold' ? 'all' : 'sold')} />
                    <span className="custom-check">{statusFilter === 'sold' && '✓'}</span>
                    Sold
                  </label>
                </div>
              </div>
              <div className="filter-group">
                <label>Date Range</label>
                <div className="date-box">
                  <CalendarDays size={17} />
                  <span>Select date</span>
                </div>
              </div>
              <button className="apply-filter-button" onClick={() => setMobileFiltersOpen(false)}>Apply Filters</button>
              <button className="clear-filter-button" onClick={clearFilters}><RotateCcw size={15} /> Clear All Filters</button>
            </aside>

            <section className="products-section">
              <div className="products-toolbar">
                <div className="result-count"><strong>{filteredProducts.length}</strong> products found</div>
                <div className="toolbar-actions">
                  <div className="sort-box">
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      <option value="newest">Newest First</option>
                      <option value="name">Name</option>
                      <option value="priceLow">Price: Low to High</option>
                      <option value="priceHigh">Price: High to Low</option>
                    </select>
                    <ChevronDown size={15} />
                  </div>
                  <div className="view-toggle">
                    <button className={viewMode === 'grid' ? 'selected' : ''} onClick={() => setViewMode('grid')}><Grid2X2 size={17} /></button>
                    <button className={viewMode === 'list' ? 'selected' : ''} onClick={() => setViewMode('list')}><List size={18} /></button>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>{t('common.loading')}</p>
                </div>
              ) : products.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><PackageOpen size={45} /></div>
                  <h3>{t('listings.noListings')}</h3>
                  <p>{t('listings.noListingsDesc')}</p>
                  <Link href="/dashboard/farmer/listings/createlistings" className="empty-add-button">
                    <Plus size={18} /> Add New Listing
                  </Link>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><Search size={40} /></div>
                  <h3>No products found</h3>
                  <p>Change your filters or search and try again.</p>
                  <button className="empty-add-button" onClick={clearFilters}><RotateCcw size={17} /> Clear Filters</button>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'products-grid' : 'products-list'}>
                  {filteredProducts.map((product) => {
                    const image = getImage(product);
                    const price = product.price ?? product.basePrice ?? product.expectedPrice ?? null;
                    return (
                      <article className="product-card" key={product.id}>
                        <div className="product-image">
                          {image ? (
                            <img src={image} alt={product.name} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }} />
                          ) : null}
                          <div className="image-fallback" style={{ display: image ? 'none' : 'flex' }}>🌾</div>
                          <span className={`status-badge ${getStatusClass(product.status)}`}>{getStatusLabel(product.status)}</span>
                          <button className={`favorite-button ${favorites.includes(product.id) ? 'favorite-active' : ''}`} onClick={() => toggleFavorite(product.id)}>
                            <Heart size={19} fill={favorites.includes(product.id) ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                        <div className="product-info">
                          <div className="product-name-row">
                            <h3>{product.name}</h3>
                            {product.variety && <span className="variety">{product.variety}</span>}
                          </div>
                          <div className="product-location">
                            <MapPin size={15} />
                            <span>{product.location || t('listings.noLocation')}</span>
                          </div>
                          {product.status === 'sold' && product.buyer_name && (
                            <div className="buyer-info">
                              <strong>Buyer:</strong> {product.buyer_name}
                            </div>
                          )}
                          <div className="product-details">
                            <span className="quantity">{t('listings.qty')}: {product.quantity} {product.unit}</span>
                            {price !== null && <strong className="product-price">₹{Number(price).toLocaleString('en-IN')}<small> / {product.unit}</small></strong>}
                          </div>
                          {product.status === 'pending_inspection' && (
                            <div className="inspection-note"><Clock3 size={14} /> Product will become active after inspection</div>
                          )}
                          {product.status === 'verified' && (
                            <div className="verified-note"><CheckCircle2 size={14} /> Product is verified</div>
                          )}
                          {product.status === 'canceled' && (
                            <div className="canceled-note"><XCircle size={14} /> Product canceled</div>
                          )}
                          <div className="product-actions">
                            <button
                              className="details-button"
                              onClick={() => router.push(`/product/${product.id}`)}
                            >
                              Details
                            </button>

                            {product.inspection_report && (
                              <button
                                className="report-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInspectionProduct(product);
                                }}
                                aria-label="View Inspection Report"
                              >
                                <HiOutlineDocumentReport size={16} />
                                <span>Report</span>
                              </button>
                            )}

                            <button className="more-button" aria-label="More options"><MoreVertical size={19} /></button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </section>
        </main>

        {mobileFiltersOpen && (
          <div className="mobile-filter-overlay" onClick={() => setMobileFiltersOpen(false)}>
            <div className="mobile-filter-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-header">
                <h2>Filter</h2>
                <button onClick={() => setMobileFiltersOpen(false)}>×</button>
              </div>
              <div className="drawer-content">
                <div className="filter-group">
                  <label>Category</label>
                  <div className="select-wrapper">
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                      <option value="all">All</option>
                      <option value="vegetables">Vegetables</option>
                      <option value="grains">Grains</option>
                      <option value="fruits">Fruits</option>
                      <option value="pulses">Pulses</option>
                    </select>
                    <ChevronDown size={16} />
                  </div>
                </div>
                <div className="filter-group">
                  <label>Status</label>
                  <div className="mobile-status-grid">
                    <button className={statusFilter === 'all' ? 'filter-option selected' : 'filter-option'} onClick={() => setStatusFilter('all')}>All</button>
                    <button className={statusFilter === 'verified' ? 'filter-option selected' : 'filter-option'} onClick={() => setStatusFilter('verified')}>Verified</button>
                    <button className={statusFilter === 'pending_inspection' ? 'filter-option selected' : 'filter-option'} onClick={() => setStatusFilter('pending_inspection')}>Pending Inspection</button>
                    <button className={statusFilter === 'rejected' ? 'filter-option selected' : 'filter-option'} onClick={() => setStatusFilter('rejected')}>Rejected</button>
                    <button className={statusFilter === 'canceled' ? 'filter-option selected' : 'filter-option'} onClick={() => setStatusFilter('canceled')}>Canceled</button>
                    <button className={statusFilter === 'sold' ? 'filter-option selected' : 'filter-option'} onClick={() => setStatusFilter('sold')}>Sold</button>
                  </div>
                </div>
              </div>
              <div className="drawer-actions">
                <button className="drawer-clear" onClick={clearFilters}>Clear</button>
                <button className="drawer-apply" onClick={() => setMobileFiltersOpen(false)}>Apply Filters</button>
              </div>
            </div>
          </div>
        )}

        {inspectionProduct && inspectionProduct.inspection_report && (
          <div className="report-modal-overlay" onClick={() => setInspectionProduct(null)}>
            <div className="report-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="report-modal-header">
                <h2>Inspection Report</h2>
                <button onClick={() => setInspectionProduct(null)}>
                  <HiOutlineX size={20} />
                </button>
              </div>
              <div className="report-modal-body">
                <p><strong>Product:</strong> {inspectionProduct.name}</p>
                <p><strong>Quality Grade:</strong> {inspectionProduct.inspection_report.quality_grade || '—'}</p>
                <p><strong>Final Base Price:</strong> ₹{inspectionProduct.inspection_report.final_base_price}</p>
                <p><strong>Recommendations:</strong> {inspectionProduct.inspection_report.recommendations || 'None'}</p>
                <p><strong>Notes:</strong> {inspectionProduct.inspection_report.notes || 'None'}</p>

                {inspectionProduct.inspection_report.inspection_data && Object.keys(inspectionProduct.inspection_report.inspection_data).length > 0 && (
                  <div className="report-params">
                    <h3>Parameters</h3>
                    {Object.entries(inspectionProduct.inspection_report.inspection_data).map(([key, value]) => (
                      <div key={key} className="param-row">
                        <span>{key.replace(/_/g, ' ')}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }
        .buyer-info {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #405047;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .listings-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 10% 0%, rgba(244, 166, 67, 0.08), transparent 28%),
            linear-gradient(180deg, #f8faf7 0%, #f2f7f2 100%);
          color: #24352d;
          font-family: "Noto Sans Devanagari", "Segoe UI", system-ui, sans-serif;
          padding-bottom: 70px;
        }

        .listing-container {
          width: min(1480px, calc(100% - 72px));
          margin: 0 auto;
          padding: 112px 0 0;
        }

        .page-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 28px;
        }

        .heading-content {
          min-width: 0;
        }

        .heading-title {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .heading-leaf {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(145deg, #e7f5e8, #f7fbf6);
          border: 1px solid #dcebdd;
          box-shadow: 0 8px 20px rgba(44, 93, 61, 0.08);
          font-size: 28px;
        }

        .heading-title h1 {
          margin: 0;
          color: #193b2a;
          font-size: 31px;
          line-height: 1.2;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .heading-title p {
          margin: 6px 0 0;
          color: #718078;
          font-size: 13px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 30px;
        }

        .stat-card {
          min-height: 96px;
          padding: 18px 20px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          border: 1px solid rgba(210, 225, 214, 0.8);
          box-shadow: 0 8px 25px rgba(37, 73, 49, 0.05);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(37, 73, 49, 0.09);
        }

        .stat-green {
          background: linear-gradient(135deg, #f0f9ed, #e8f5e7);
        }

        .stat-orange {
          background: linear-gradient(135deg, #fff8eb, #fff1d8);
        }

        .stat-purple {
          background: linear-gradient(135deg, #f8f2fc, #f1eafa);
        }

        .stat-blue {
          background: linear-gradient(135deg, #eff9fd, #e7f4fa);
        }

        .stat-icon {
          width: 46px;
          height: 46px;
          min-width: 46px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-green .stat-icon {
          background: #dcefd9;
          color: #247449;
        }

        .stat-orange .stat-icon {
          background: #ffe7be;
          color: #df8b18;
        }

        .stat-purple .stat-icon {
          background: #eadcf5;
          color: #8754b5;
        }

        .stat-blue .stat-icon {
          background: #d9eff9;
          color: #1687b5;
        }

        .stat-card span {
          display: block;
          color: #708078;
          font-size: 11px;
          font-weight: 600;
        }

        .stat-card strong {
          display: block;
          margin-top: 3px;
          color: #20352a;
          font-size: 25px;
          line-height: 1;
          font-weight: 800;
        }

        .main-content {
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
          gap: 24px;
          align-items: start;
        }

        .filter-sidebar {
          position: sticky;
          top: 96px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          border: 1px solid #e0e9e2;
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 12px 35px rgba(32, 72, 46, 0.06);
        }

        .filter-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .filter-title h2 {
          margin: 0;
          color: #244032;
          font-size: 17px;
          font-weight: 800;
        }

        .filter-title button {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 9px;
          background: #eef6ef;
          color: #28774a;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }

        .filter-title button:hover {
          background: #dcefdc;
        }

        .filter-search {
          height: 44px;
          border: 1px solid #dce6df;
          background: #f9fbf9;
          border-radius: 12px;
          display: flex;
          align-items: center;
          padding: 0 12px;
          margin-bottom: 23px;
          transition: 0.2s;
        }

        .filter-search:focus-within {
          border-color: #72a987;
          background: white;
          box-shadow: 0 0 0 3px rgba(66, 130, 83, 0.08);
        }

        .filter-search input {
          flex: 1;
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          font-family: inherit;
          font-size: 13px;
          color: #26382e;
        }

        .filter-search input::placeholder {
          color: #9aa59f;
        }

        .filter-search svg {
          color: #829087;
        }

        .filter-group {
          margin-bottom: 23px;
        }

        .filter-group > label {
          display: block;
          color: #31473a;
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 10px;
        }

        .select-wrapper {
          position: relative;
          height: 44px;
          border: 1px solid #dce6df;
          border-radius: 11px;
          background: #fbfcfb;
          overflow: hidden;
        }

        .select-wrapper select {
          width: 100%;
          height: 100%;
          padding: 0 36px 0 12px;
          appearance: none;
          border: none;
          outline: none;
          background: transparent;
          color: #44534b;
          font-family: inherit;
          font-size: 12px;
          cursor: pointer;
        }

        .select-wrapper svg {
          position: absolute;
          right: 11px;
          top: 13px;
          color: #78867d;
          pointer-events: none;
        }

        .checkbox-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #536159;
          font-size: 12px;
          cursor: pointer;
          transition: color 0.2s;
        }

        .checkbox-row:hover {
          color: #267347;
        }

        .checkbox-row input {
          display: none;
        }

        .custom-check {
          width: 19px;
          height: 19px;
          border-radius: 6px;
          border: 1px solid #cdd9d1;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 11px;
          font-weight: 900;
          transition: 0.2s;
        }

        .checkbox-row input:checked + .custom-check {
          background: #267849;
          border-color: #267849;
          box-shadow: 0 3px 8px rgba(38, 120, 73, 0.2);
        }

        .date-box {
          height: 44px;
          border: 1px solid #dce6df;
          border-radius: 11px;
          background: #fbfcfb;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
          color: #7b8780;
          font-size: 12px;
        }

        .date-box svg {
          color: #6b9278;
        }

        .apply-filter-button {
          width: 100%;
          height: 44px;
          border: none;
          border-radius: 11px;
          background: linear-gradient(135deg, #2d7c4e, #1f633d);
          color: white;
          font-family: inherit;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 6px 15px rgba(42, 117, 70, 0.2);
          transition: 0.2s;
        }

        .apply-filter-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 9px 20px rgba(42, 117, 70, 0.25);
        }

        .clear-filter-button {
          width: 100%;
          margin-top: 12px;
          border: none;
          background: transparent;
          color: #31764c;
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
        }

        .products-toolbar {
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 17px;
        }

        .result-count {
          color: #77837c;
          font-size: 13px;
        }

        .result-count strong {
          color: #244332;
          font-size: 19px;
          font-weight: 800;
        }

        .toolbar-actions {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .sort-box {
          width: 190px;
          height: 42px;
          border: 1px solid #dce6df;
          background: white;
          border-radius: 11px;
          position: relative;
          overflow: hidden;
        }

        .sort-box select {
          width: 100%;
          height: 100%;
          border: none;
          outline: none;
          appearance: none;
          background: transparent;
          padding: 0 34px 0 12px;
          color: #536158;
          font-family: inherit;
          font-size: 12px;
          cursor: pointer;
        }

        .sort-box svg {
          position: absolute;
          right: 10px;
          top: 13px;
          color: #7b8780;
          pointer-events: none;
        }

        .view-toggle {
          height: 42px;
          display: flex;
          border: 1px solid #dce6df;
          border-radius: 11px;
          overflow: hidden;
          background: white;
          padding: 3px;
          gap: 2px;
        }

        .view-toggle button {
          width: 37px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: #8a968f;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }

        .view-toggle button.selected {
          background: #e6f3e6;
          color: #247447;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        .products-list {
          display: grid;
          grid-template-columns: 1fr;
          gap: 17px;
        }

        .product-card {
          position: relative;
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid #e1e9e3;
          border-radius: 19px;
          overflow: hidden;
          box-shadow: 0 8px 25px rgba(35, 72, 48, 0.055);
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }

        .product-card:hover {
          transform: translateY(-4px);
          border-color: #cfe1d3;
          box-shadow: 0 16px 35px rgba(35, 72, 48, 0.11);
        }

        .products-list .product-card {
          display: flex;
        }

        .products-list .product-image {
          width: 280px;
          min-width: 280px;
          height: 220px;
        }

        .product-image {
          height: 205px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #dfeedd, #f8f1dc);
        }

        .product-image::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.02) 45%, rgba(20,42,27,0.13) 100%);
          pointer-events: none;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.5s ease;
        }

        .product-card:hover .product-image img {
          transform: scale(1.055);
        }

        .image-fallback {
          width: 100%;
          height: 100%;
          align-items: center;
          justify-content: center;
          font-size: 58px;
        }

        .status-badge {
          position: absolute;
          z-index: 2;
          top: 12px;
          left: 12px;
          padding: 7px 11px;
          border-radius: 50px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.1px;
          backdrop-filter: blur(8px);
        }

        .status-active {
          color: #1f7040;
          background: rgba(229, 247, 224, 0.94);
        }

        .status-auction {
          color: white;
          background: rgba(231, 147, 26, 0.95);
        }

        .status-completed {
          color: white;
          background: rgba(105, 119, 111, 0.94);
        }

        .status-rejected {
          color: #8c3434;
          background: rgba(253, 228, 228, 0.95);
        }

        .status-canceled {
          color: white;
          background: rgba(103, 113, 108, 0.94);
        }

        .favorite-button {
          position: absolute;
          z-index: 3;
          right: 12px;
          top: 12px;
          width: 40px;
          height: 40px;
          border: 1px solid rgba(255, 255, 255, 0.75);
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.91);
          backdrop-filter: blur(10px);
          color: #405047;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }

        .favorite-button:hover {
          transform: scale(1.06);
          background: white;
        }

        .favorite-active {
          color: #e34f5b;
        }

        .product-info {
          padding: 17px;
        }

        .product-name-row {
          margin-bottom: 8px;
        }

        .product-name-row h3 {
          margin: 0;
          color: #21372a;
          font-size: 18px;
          line-height: 1.25;
          font-weight: 800;
        }

        .variety {
          display: inline-block;
          margin-top: 4px;
          color: #829087;
          font-size: 11px;
        }

        .product-location {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #75827a;
          font-size: 11px;
          margin-bottom: 15px;
        }

        .product-location svg {
          min-width: 15px;
          color: #2b7d4c;
        }

        .product-details {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-top: 12px;
          border-top: 1px solid #edf1ee;
          margin-bottom: 13px;
        }

        .quantity {
          color: #536158;
          font-size: 11px;
          font-weight: 600;
        }

        .product-price {
          color: #df8c20;
          font-size: 17px;
          font-weight: 800;
          white-space: nowrap;
        }

        .product-price small {
          color: #8a958e;
          font-size: 9px;
          font-weight: 500;
        }

        .inspection-note,
        .verified-note,
        .canceled-note {
          display: flex;
          align-items: center;
          gap: 6px;
          border-radius: 9px;
          padding: 8px 9px;
          font-size: 10px;
          line-height: 1.35;
          margin-bottom: 12px;
        }

        .inspection-note {
          color: #89620b;
          background: #fff7df;
          border: 1px solid #f4e6bc;
        }

        .verified-note {
          color: #267244;
          background: #edf8eb;
          border: 1px solid #d9ecd5;
        }

        .canceled-note {
          color: white;
          background: #69746e;
        }

        .product-actions {
          display: flex;
          gap: 8px;
        }

        .details-button {
          flex: 1;
          height: 41px;
          border: 1px solid #d5e1d8;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #26764a;
          background: #f8fbf8;
          text-decoration: none;
          font-size: 12px;
          font-weight: 800;
          transition: 0.2s;
          cursor: pointer;
          font-family: inherit;
        }

        .details-button:hover {
          background: #eaf5eb;
          border-color: #bfd6c4;
        }

        .report-button {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          height: 41px;
          border: 1px solid #d5e1d8;
          border-radius: 10px;
          padding: 0 12px;
          background: #f8fbf8;
          color: #26764a;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s;
        }

        .report-button:hover {
          background: #eaf5eb;
          border-color: #bfd6c4;
        }

        .more-button {
          width: 42px;
          height: 41px;
          border: 1px solid #d5e1d8;
          background: white;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #58665e;
          transition: 0.2s;
        }

        .more-button:hover {
          background: #f1f7f2;
          color: #277649;
        }

        .loading-state {
          min-height: 400px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #e2eae4;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #748078;
          box-shadow: 0 8px 25px rgba(35, 72, 48, 0.04);
        }

        .loading-spinner {
          width: 38px;
          height: 38px;
          border: 3px solid #dce9df;
          border-top-color: #2b7b4b;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 13px;
        }

        .loading-state p {
          margin: 0;
          font-size: 13px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .empty-state {
          min-height: 430px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #e1e9e3;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 35px;
          box-shadow: 0 8px 25px rgba(35, 72, 48, 0.04);
        }

        .empty-icon {
          width: 82px;
          height: 82px;
          border-radius: 25px;
          background: linear-gradient(145deg, #e9f6e8, #f6fbf5);
          border: 1px solid #dcecdc;
          color: #2b7b4b;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
        }

        .empty-state h3 {
          margin: 0 0 7px;
          color: #273b30;
          font-size: 19px;
        }

        .empty-state p {
          max-width: 400px;
          margin: 0 0 20px;
          color: #77837c;
          font-size: 13px;
          line-height: 1.6;
        }

        .empty-add-button {
          display: flex;
          align-items: center;
          gap: 7px;
          background: linear-gradient(135deg, #2d7d4e, #1f633d);
          color: white;
          text-decoration: none;
          border: none;
          border-radius: 50px;
          padding: 11px 18px;
          font-family: inherit;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 6px 15px rgba(42, 117, 70, 0.2);
        }

        .mobile-filter-button {
          display: none;
        }

        .mobile-filter-overlay {
          display: none;
        }

        @media (max-width: 1200px) {
          .listing-container {
            width: min(100% - 48px, 1100px);
          }

          .products-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .main-content {
            grid-template-columns: 255px minmax(0, 1fr);
            gap: 20px;
          }
        }

        @media (max-width: 900px) {
          .listing-container {
            width: calc(100% - 32px);
            padding-top: 100px;
          }

          .main-content {
            grid-template-columns: 1fr;
          }

          .filter-sidebar {
            display: none;
          }

          .mobile-filter-button {
            display: flex;
            width: 100%;
            height: 44px;
            align-items: center;
            justify-content: center;
            gap: 7px;
            border: 1px solid #d7e3da;
            background: white;
            color: #28764a;
            border-radius: 12px;
            font-family: inherit;
            font-size: 12px;
            font-weight: 800;
            margin-bottom: 15px;
            cursor: pointer;
            box-shadow: 0 5px 15px rgba(36, 74, 49, 0.04);
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 650px) {
          .listings-page {
            padding-bottom: 35px;
          }

          .listing-container {
            width: calc(100% - 24px);
            padding: 88px 0 0;
          }

          .page-heading {
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 20px;
          }

          .heading-title {
            gap: 9px;
            align-items: center;
          }

          .heading-leaf {
            width: 42px;
            height: 42px;
            min-width: 42px;
            border-radius: 13px;
            font-size: 22px;
          }

          .heading-title h1 {
            font-size: 22px;
            letter-spacing: -0.3px;
          }

          .heading-title p {
            max-width: 180px;
            margin-top: 4px;
            font-size: 10px;
            line-height: 1.5;
          }

          .mobile-add-button {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            background: linear-gradient(135deg, #f5a447, #ed9130);
            color: white;
            padding: 10px 13px;
            border-radius: 50px;
            text-decoration: none;
            font-size: 10px;
            font-weight: 800;
            white-space: nowrap;
            box-shadow: 0 6px 15px rgba(237, 145, 48, 0.25);
          }

          .stats-grid {
            gap: 9px;
            margin-bottom: 15px;
          }

          .stat-card {
            min-height: 73px;
            padding: 10px;
            border-radius: 13px;
            gap: 8px;
          }

          .stat-icon {
            width: 34px;
            height: 34px;
            min-width: 34px;
            border-radius: 10px;
          }

          .stat-icon svg {
            width: 17px;
          }

          .stat-card span {
            font-size: 8px;
            line-height: 1.25;
          }

          .stat-card strong {
            margin-top: 3px;
            font-size: 19px;
          }

          .mobile-filter-button {
            height: 42px;
            margin-bottom: 13px;
          }

          .products-toolbar {
            flex-wrap: wrap;
            gap: 9px;
            margin-bottom: 13px;
          }

          .result-count {
            font-size: 10px;
          }

          .result-count strong {
            font-size: 16px;
          }

          .toolbar-actions {
            margin-left: auto;
            gap: 6px;
          }

          .sort-box {
            width: 130px;
            height: 37px;
            border-radius: 9px;
          }

          .sort-box select {
            font-size: 10px;
            padding-left: 9px;
          }

          .sort-box svg {
            top: 11px;
            right: 7px;
          }

          .view-toggle {
            height: 37px;
            border-radius: 9px;
            padding: 2px;
          }

          .view-toggle button {
            width: 34px;
          }

          .products-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .products-list {
            gap: 14px;
          }

          .product-card {
            border-radius: 16px;
          }

          .product-card:hover {
            transform: none;
          }

          .product-image {
            height: 205px;
          }

          .products-list .product-card {
            display: block;
          }

          .products-list .product-image {
            width: 100%;
            min-width: 0;
            height: 205px;
          }

          .product-info {
            padding: 14px;
          }

          .product-name-row h3 {
            font-size: 17px;
          }

          .product-location {
            font-size: 10px;
            margin-bottom: 12px;
          }

          .quantity {
            font-size: 10px;
          }

          .product-price {
            font-size: 15px;
          }

          .status-badge {
            top: 9px;
            left: 9px;
            font-size: 9px;
            padding: 6px 9px;
          }

          .favorite-button {
            width: 36px;
            height: 36px;
            right: 9px;
            top: 9px;
          }

          .product-actions {
            gap: 7px;
          }

          .details-button,
          .more-button,
          .report-button {
            height: 39px;
          }

          .empty-state {
            min-height: 350px;
            padding: 25px 18px;
            border-radius: 17px;
          }

          .empty-icon {
            width: 68px;
            height: 68px;
            border-radius: 20px;
          }

          .mobile-filter-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(20, 35, 27, 0.48);
            display: flex;
            align-items: flex-end;
            backdrop-filter: blur(3px);
          }

          .mobile-filter-drawer {
            width: 100%;
            background: #fbfdfb;
            border-radius: 24px 24px 0 0;
            max-height: 84vh;
            display: flex;
            flex-direction: column;
            animation: slideUp 0.25s ease;
            box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.15);
          }

          @keyframes slideUp {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }

          .drawer-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 18px 18px 14px;
            border-bottom: 1px solid #e8eee9;
          }

          .drawer-header h2 {
            margin: 0;
            color: #254132;
            font-size: 18px;
            font-weight: 800;
          }

          .drawer-header button {
            width: 34px;
            height: 34px;
            border: none;
            border-radius: 50%;
            background: #edf3ee;
            color: #526158;
            font-size: 22px;
            cursor: pointer;
          }

          .drawer-content {
            overflow-y: auto;
            padding: 20px 18px;
          }

          .mobile-status-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 9px;
          }

          .filter-option {
            min-height: 43px;
            border: 1px solid #dce5df;
            border-radius: 10px;
            background: white;
            color: #506058;
            font-family: inherit;
            font-size: 11px;
            cursor: pointer;
          }

          .filter-option.selected {
            background: #e8f5e9;
            border-color: #77aa86;
            color: #217447;
            font-weight: 800;
          }

          .drawer-actions {
            display: grid;
            grid-template-columns: 1fr 1.5fr;
            gap: 9px;
            padding: 13px 18px;
            border-top: 1px solid #e8eee9;
            background: white;
          }

          .drawer-clear,
          .drawer-apply {
            height: 44px;
            border-radius: 10px;
            font-family: inherit;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
          }

          .drawer-clear {
            border: 1px solid #d7e3da;
            background: white;
            color: #267649;
          }

          .drawer-apply {
            border: none;
            background: linear-gradient(135deg, #2d7d4e, #1f633d);
            color: white;
          }
        }

        @media (max-width: 380px) {
          .listing-container {
            width: calc(100% - 18px);
          }

          .heading-title h1 {
            font-size: 20px;
          }

          .heading-title p {
            font-size: 9px;
          }

          .mobile-add-button {
            padding: 9px 10px;
            font-size: 9px;
          }

          .stat-card {
            padding: 8px;
          }

          .stat-card strong {
            font-size: 17px;
          }

          .sort-box {
            width: 112px;
          }

          .product-image {
            height: 190px;
          }
        }

        /* REPORT MODAL */
        .report-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          background: rgba(20, 35, 27, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          backdrop-filter: blur(4px);
        }

        .report-modal-card {
          background: #fff;
          border-radius: 20px;
          max-width: 600px;
          width: 100%;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
        }

        .report-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e8eee9;
        }

        .report-modal-header h2 {
          margin: 0;
          color: #173b2a;
          font-size: 20px;
          font-weight: 800;
        }

        .report-modal-header button {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 50%;
          background: #f0f4f1;
          color: #526058;
          cursor: pointer;
        }

        .report-modal-body {
          padding: 20px 24px;
          color: #526058;
          font-size: 14px;
          line-height: 1.6;
        }

        .report-modal-body p {
          margin: 8px 0;
        }

        .report-params {
          margin-top: 16px;
          background: #f9fbfa;
          border-radius: 12px;
          padding: 16px;
        }

        .report-params h3 {
          margin: 0 0 10px;
          color: #173b2a;
          font-size: 16px;
          font-weight: 800;
        }

        .param-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid #e9efeb;
        }

        .param-row span {
          text-transform: capitalize;
        }

        .param-row strong {
          color: #173b2a;
        }
      `}</style>
    </>
  );
}
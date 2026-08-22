import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  HiOutlineUser,
  HiOutlineClipboardList,
  HiOutlineTag,
  HiOutlineCreditCard,
  HiOutlineQuestionMarkCircle,
  HiOutlineLogout,
  HiOutlineLogin,
  HiOutlineUserAdd,
  HiOutlinePlus,
  HiOutlineClock,
} from 'react-icons/hi';
import useAuthStore from '../../store/authStore';

const menuConfig = {
  trader: [
    { label: 'My Profile', icon: HiOutlineUser, href: '/dashboard/trader/profile' },
    { label: 'My Orders', icon: HiOutlineClipboardList, href: '/dashboard/trader/orders' },
    { label: 'My Bids', icon: HiOutlineTag, href: '/dashboard/trader/bids' },
    { label: 'Live Auctions', icon: HiOutlineClock, href: '/dashboard/trader/auctions' },
    { label: 'My Account', icon: HiOutlineCreditCard, href: '/dashboard/trader/account' },
    { label: 'Help & Support', icon: HiOutlineQuestionMarkCircle, href: '/help' },
  ],
  farmer: [
    { label: 'My Profile', icon: HiOutlineUser, href: '/dashboard/farmer/profile' },
    { label: 'My Orders', icon: HiOutlineClipboardList, href: '/dashboard/farmer/orders' },
    { label: 'Create Listing', icon: HiOutlinePlus, href: '/dashboard/farmer/listings/createlistings' },
    { label: 'My Account', icon: HiOutlineCreditCard, href: '/dashboard/farmer/account' },
    { label: 'My Listings', icon: HiOutlineTag, href: '/dashboard/farmer/listings' },
    { label: 'Help & Support', icon: HiOutlineQuestionMarkCircle, href: '/help' },
  ],
  agent: [
    { label: 'My Profile', icon: HiOutlineUser, href: '/dashboard/agent/profile' },
    { label: 'My Tasks', icon: HiOutlineClipboardList, href: '/dashboard/agent/tasks' },
    { label: 'My Account', icon: HiOutlineCreditCard, href: '/dashboard/agent/account' },
    { label: 'Commission Report', icon: HiOutlineTag, href: '/dashboard/agent/commissions' },
    { label: 'Help & Support', icon: HiOutlineQuestionMarkCircle, href: '/help' },
  ],
  admin: [
    { label: 'My Profile', icon: HiOutlineUser, href: '/dashboard/admin/profile' },
    { label: 'User Management', icon: HiOutlineClipboardList, href: '/dashboard/admin/users' },
    { label: 'Platform Analysis', icon: HiOutlineTag, href: '/dashboard/admin/analysis' },
    { label: 'Settings', icon: HiOutlineCreditCard, href: '/dashboard/admin/settings' },
    { label: 'Help & Support', icon: HiOutlineQuestionMarkCircle, href: '/help' },
  ],
};

export default function ProfileFlyout({ open, onClose }) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const role = user?.role || 'trader';
  const menu = menuConfig[role] || [];
  const flyoutRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (flyoutRef.current && !flyoutRef.current.contains(event.target)) {
        onClose();
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  const handleLogout = () => {
    logout();
    onClose();
    router.replace('/login');
  };

  if (!open) return null;

  return (
    <div
      ref={flyoutRef}
      style={{
        position: 'absolute',
        top: '60px',
        right: '0',
        background: 'white',
        borderRadius: '14px',
        boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
        minWidth: '260px',
        padding: '8px 0',
        zIndex: 9999,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      {!isAuthenticated ? (
        <div style={{ padding: '12px 16px' }}>
          <Link href="/login" onClick={onClose}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#2d3436',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.background = '#f8f9fa')}
              onMouseLeave={(e) => (e.target.style.background = 'transparent')}
            >
              <HiOutlineLogin style={{ fontSize: '18px', color: '#2d6a4f' }} />
              <span style={{ fontSize: '14px', fontWeight: '600' }}>Login</span>
            </div>
          </Link>
          <Link href="/register" onClick={onClose}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#2d3436',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.background = '#f8f9fa')}
              onMouseLeave={(e) => (e.target.style.background = 'transparent')}
            >
              <HiOutlineUserAdd style={{ fontSize: '18px', color: '#2d6a4f' }} />
              <span style={{ fontSize: '14px', fontWeight: '600' }}>Register</span>
            </div>
          </Link>
        </div>
      ) : (
        <>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e9ecef' }}>
            <p style={{ fontWeight: '700', color: '#2d3436', margin: 0 }}>{user?.name}</p>
            <p style={{ fontSize: '12px', color: '#636e72', margin: 0 }}>{user?.email}</p>
          </div>
          <div style={{ padding: '4px 0' }}>
            {menu.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={onClose}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 16px',
                      cursor: 'pointer',
                      color: '#2d3436',
                      fontSize: '14px',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.target.style.background = '#f8f9fa')}
                    onMouseLeave={(e) => (e.target.style.background = 'transparent')}
                  >
                    <Icon style={{ fontSize: '18px', color: '#2d6a4f' }} />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
          <div style={{ borderTop: '1px solid #e9ecef', padding: '4px 0' }}>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 16px',
                background: 'none',
                border: 'none',
                color: '#e76f51',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                textAlign: 'left',
              }}
            >
              <HiOutlineLogout style={{ fontSize: '18px' }} />
              <span>Logout</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
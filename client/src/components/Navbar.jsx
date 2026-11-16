"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiLogOut, FiSettings, FiSun, FiMoon } from 'react-icons/fi';
import { useAuth } from '../features/auth/AuthContext';
import useCartStore from '../store/cartStore';
import JPopLogo from './JPopLogo';
import toast from 'react-hot-toast';
import './Navbar.css';

const Navbar = ({ onCartClick }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout, theme, toggleTheme } = useAuth();
  const itemCount = useCartStore((s) => s.getItemCount());
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully. See you soon! 🍿');
    router.push('/');
  };

  const isUserLoggedIn = isAuthenticated || Boolean(user);

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner container">
        {/* Brand with Custom Popcorn Box Logo Component */}
        <Link href="/" className="navbar__brand">
          <JPopLogo width={44} height={44} className="navbar__logo" />
          <div>
            <span className="navbar__brand-text">J-Pop</span>
            <span className="navbar__brand-subtitle"> Corner</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className={`navbar__links ${mobileOpen ? 'navbar__links--open' : ''}`}>
          <Link
            href="/"
            className={`navbar__link ${pathname === '/' ? 'navbar__link--active' : ''}`}
          >
            Home
          </Link>
          <Link
            href="/shop"
            className={`navbar__link ${pathname === '/shop' ? 'navbar__link--active' : ''}`}
          >
            Shop Menu
          </Link>
          {isAdmin && (
            <Link
              href="/admin/dashboard"
              className={`navbar__link ${pathname.startsWith('/admin') ? 'navbar__link--active' : ''}`}
            >
              <FiSettings size={16} /> Admin Portal
            </Link>
          )}

          {/* Mobile Profile & Logout links */}
          {mobileOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '8px' }}>
              {isUserLoggedIn ? (
                <>
                  <Link
                    href="/profile"
                    className={`navbar__link ${pathname === '/profile' ? 'navbar__link--active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <FiUser size={16} /> Profile ({user?.name?.split(' ')[0] || 'My Account'})
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="navbar__link"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--color-danger, #e74c3c)' }}
                  >
                    <FiLogOut size={16} /> Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="navbar__link"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <FiUser size={16} /> Login / Register
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Actions (Dark toggle, Cart, User Profile) */}
        <div className="navbar__actions">
          {/* Theme Toggle */}
          <button
            className="navbar__icon-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>

          {/* Cart Button */}
          {!isAdmin && (
            <button
              className="navbar__icon-btn"
              onClick={onCartClick}
              title="Shopping Cart"
              aria-label="Open Cart"
            >
              <FiShoppingCart size={19} />
              {itemCount > 0 && <span className="navbar__cart-badge">{itemCount}</span>}
            </button>
          )}

          {/* User Auth Menu */}
          {isUserLoggedIn ? (
            <div className="navbar__user-menu" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link
                href="/profile"
                className="navbar__user-btn"
                title="View Profile"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FiUser size={16} />
                <span className="navbar__user-name">
                  {isAdmin ? 'Admin' : (user?.name?.split(' ')[0] || 'Profile')}
                </span>
              </Link>
              <button
                className="navbar__icon-btn"
                onClick={handleLogout}
                title="Logout"
                aria-label="Logout"
                style={{ color: 'var(--text-muted)' }}
              >
                <FiLogOut size={16} />
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm">
              Sign In
            </Link>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            className="navbar__mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle Navigation"
          >
            {mobileOpen ? <FiX size={26} /> : <FiMenu size={26} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

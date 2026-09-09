"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiLogOut, FiSettings, FiSun, FiMoon } from 'react-icons/fi';
import { useAuth } from '../features/auth/AuthContext';
import useCartStore from '../store/cartStore';
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
    router.push('/');
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner container">
        {/* Brand with Custom SVG Logo */}
        <Link href="/" className="navbar__brand">
          <img src="/jpop-logo.svg" alt="J-Pop Popcorn" className="navbar__logo" />
          <div>
            <span className="navbar__brand-text">J-Pop:</span>
            <span className="navbar__brand-subtitle"> Kernel</span>
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
          {isAuthenticated ? (
            <div className="navbar__user-menu">
              <Link
                href={isAdmin ? '/admin/dashboard' : '/profile'}
                className="navbar__user-btn"
              >
                <FiUser size={16} />
                <span className="navbar__user-name">{user?.name?.split(' ')[0]}</span>
              </Link>
              <button
                className="navbar__icon-btn"
                onClick={handleLogout}
                title="Logout"
                aria-label="Logout"
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

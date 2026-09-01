"use client";

import Link from 'next/link';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          {/* Brand Info */}
          <div>
            <div className="footer__brand">
              <img src="/jpop-logo.svg" alt="J-Pop Logo" className="footer__logo" />
              <span className="footer__brand-title">J-Pop Popcorn</span>
            </div>
            <p className="footer__tagline text-muted">
              Gourmet monster-mushroom popcorn crafted daily with genuine artisan seasonings. Pick up or get fast delivery straight to your door!
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="footer__col-title">Quick Links</h4>
            <ul className="footer__links">
              <li><Link href="/" className="footer__link">Home</Link></li>
              <li><Link href="/shop" className="footer__link">Shop Flavors</Link></li>
              <li><Link href="/profile" className="footer__link">My Account & Orders</Link></li>
              <li><Link href="/admin/login" className="footer__link">Admin Access</Link></li>
            </ul>
          </div>

          {/* Bulk & Delivery */}
          <div>
            <h4 className="footer__col-title">Delivery & Promos</h4>
            <ul className="footer__links">
              <li className="footer__link">🍿 10+ Bags = Free Delivery</li>
              <li className="footer__link">📍 Fast Local Dispatch</li>
              <li className="footer__link">⏰ Mon - Sat: 9 AM - 8 PM</li>
              <li className="footer__link">🥡 Scheduled Store Pickups</li>
            </ul>
          </div>

          {/* Payment Badges */}
          <div>
            <h4 className="footer__col-title">Cashless Payments</h4>
            <p className="text-muted" style={{ fontSize: '0.88rem' }}>
              We accept direct instant QR payments with receipt confirmation:
            </p>
            <div className="footer__payment-icons">
              <span className="footer__payment-badge">GCash</span>
              <span className="footer__payment-badge">Maya</span>
              <span className="footer__payment-badge">InstaPay</span>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <span>&copy; {new Date().getFullYear()} J-Pop Popcorn (castrojosephzen.shop). All rights reserved.</span>
          <span>Popped with ❤️ by Joseph Zen</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

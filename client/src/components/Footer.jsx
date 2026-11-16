"use client";

import Link from 'next/link';
import JPopLogo from './JPopLogo';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          {/* Brand Info */}
          <div>
            <div className="footer__brand">
              <JPopLogo width={40} height={40} className="footer__logo" />
              <span className="footer__brand-title">J-Pop Corner</span>
            </div>
            <p className="footer__tagline text-muted">
              Handcrafted gourmet monster-mushroom popcorn with custom flavor mix sliders and freshly glazed mini donuts. Popped & fried fresh daily in Abra!
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="footer__col-title">Quick Links</h4>
            <ul className="footer__links">
              <li><Link href="/" className="footer__link">Home</Link></li>
              <li><Link href="/shop" className="footer__link">Shop Flavors & Donuts</Link></li>
              <li><Link href="/profile" className="footer__link">My Account & Orders</Link></li>
              <li><Link href="/privacy" className="footer__link">Privacy Policy</Link></li>
              <li><Link href="/admin/login" className="footer__link">Admin Access</Link></li>
            </ul>
          </div>

          {/* Bulk & Delivery */}
          <div>
            <h4 className="footer__col-title">Delivery & Promos</h4>
            <ul className="footer__links">
              <li className="footer__link">🍿 5+ 1kg Bags = FREE SHIPPING</li>
              <li className="footer__link">🍿 10+ 500g Bags = FREE SHIPPING</li>
              <li className="footer__link">📍 Servicing all 27 Abra Municipalities</li>
              <li className="footer__link">⏰ Mon - Sat: 9 AM - 8 PM</li>
              <li className="footer__link">🏪 Scheduled Store Pickups (Poblacion, San Juan)</li>
            </ul>
          </div>

          {/* Payment Badges */}
          <div>
            <h4 className="footer__col-title">Philippine Payment Gateways</h4>
            <p className="text-muted" style={{ fontSize: '0.88rem' }}>
              We support Cash, QR Ph (GCash, Maya, InstaPay), and automated PayMongo/HitPay checkouts:
            </p>
            <div className="footer__payment-icons">
              <span className="footer__payment-badge">GCash</span>
              <span className="footer__payment-badge">Maya</span>
              <span className="footer__payment-badge">InstaPay</span>
              <span className="footer__payment-badge">QR Ph</span>
              <span className="footer__payment-badge">Cards / COD</span>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <span>&copy; {new Date().getFullYear()} J-Pop Corner (castrojosephzen.shop). All rights reserved.</span>
          <span>Crafted with ❤️ by Joseph Zen</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

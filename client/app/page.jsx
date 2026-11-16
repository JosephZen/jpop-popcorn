"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiArrowRight, FiTruck, FiShield, FiClock, FiCreditCard } from 'react-icons/fi';
import { productsAPI, settingsAPI } from '../src/services/api';
import ProductCard from '../src/features/products/ProductCard';
import { useAuth } from '../src/features/auth/AuthContext';
import JPopLogo from '../src/components/JPopLogo';
import '../src/pages/HomePage.css';

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [customization, setCustomization] = useState({});
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    productsAPI.getAll()
      .then(({ data }) => {
        setFeatured(data.products.slice(0, 8));
      })
      .catch(() => {});

    settingsAPI.get()
      .then(({ data }) => {
        setCustomization(data.settings?.site_customization || {});
      })
      .catch(() => {});
  }, []);

  return (
    <div className="home-page">
      {/* Top Announcement Bar if configured */}
      {customization.bannerAnnouncement && (
        <div style={{
          background: 'linear-gradient(90deg, #C23616, #E84118)',
          color: '#ffffff',
          textAlign: 'center',
          padding: '8px 16px',
          fontSize: '0.86rem',
          fontWeight: 700,
        }}>
          {customization.bannerAnnouncement}
        </div>
      )}

      {/* Hero Section */}
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__text">
            <div className="hero__badge animate-fade-in-up">
              <span>🍿</span> Freshly Popped & Fried Daily in Abra
            </div>
            <h1 className="hero__title animate-fade-in-up">
              {customization.heroTitle || 'Fresh Gourmet Popcorn & Custom Mini Donuts'}
              <span className="hero__title-accent">J-Pop Corner</span>
            </h1>
            <p className="hero__subtitle animate-fade-in-up">
              {customization.heroSubtitle ||
                'Crafted with monster-mushroom kernels and custom percentage mix sliders, paired with warm glazed mini donuts. Order online for direct Abra doorstep delivery or store pickup!'}
            </p>
            <div className="hero__actions animate-fade-in-up">
              {isAuthenticated ? (
                <Link href="/shop" className="btn btn-primary btn-lg">
                  Explore Menu & Flavors <FiArrowRight />
                </Link>
              ) : (
                <Link href="/login" className="btn btn-primary btn-lg">
                  Login / Create Account <FiArrowRight />
                </Link>
              )}
              <Link href="/shop" className="btn btn-outline btn-lg">
                View Customizer Menu
              </Link>
            </div>
          </div>

          <div className="hero__visual animate-fade-in-up">
            <JPopLogo
              width={280}
              height={280}
              className="hero__logo-img animate-float"
            />
          </div>
        </div>
      </section>

      {/* Feature Strip */}
      <section className="features-strip">
        <div className="container">
          <div className="features-strip__grid">
            <div className="feature-chip">
              <div className="feature-chip__icon"><FiTruck /></div>
              <div>
                <strong>Free Delivery Promo</strong>
                <span>Buy 5+ 1kg or 10+ 500g popcorn for FREE shipping</span>
              </div>
            </div>
            <div className="feature-chip">
              <div className="feature-chip__icon"><FiShield /></div>
              <div>
                <strong>27 Abra Municipalities</strong>
                <span>Doorstep delivery & pickup options</span>
              </div>
            </div>
            <div className="feature-chip">
              <div className="feature-chip__icon"><FiClock /></div>
              <div>
                <strong>Popped & Glazed Fresh</strong>
                <span>Prepared 15–30 mins from order</span>
              </div>
            </div>
            <div className="feature-chip">
              <div className="feature-chip__icon"><FiCreditCard /></div>
              <div>
                <strong>Flexible PH Payments</strong>
                <span>Cash, QR Ph (GCash/Maya) & Gateways</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="section container">
          <div className="section__header">
            <div>
              <h2 className="section__title">Customer Favorites 🍿🍩</h2>
              <p className="section__subtitle text-muted">
                Our signature gourmet popcorn and freshly glazed mini donuts
              </p>
            </div>
            <Link href="/shop" className="btn btn-outline">
              View All Menu <FiArrowRight />
            </Link>
          </div>

          <div className="grid grid-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="cta-section container">
        <h2 className="cta-section__title">Ready for Fresh Artisan Snacks?</h2>
        <p className="cta-section__text">
          Mix Spicy BBQ, Sour Cream & Onion, Cheese and BBQ popcorn, or pick up to 8 glazed mini donut syrups. Order online for delivery across Abra or store pickup!
        </p>
        <Link href="/shop" className="btn btn-primary btn-lg">
          Open Snack Customizer <FiArrowRight />
        </Link>
      </section>
    </div>
  );
}

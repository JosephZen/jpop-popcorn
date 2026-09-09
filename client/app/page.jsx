"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiArrowRight, FiTruck, FiShield, FiClock, FiCreditCard } from 'react-icons/fi';
import { productsAPI, settingsAPI } from '../src/services/api';
import ProductCard from '../src/features/products/ProductCard';
import '../src/pages/HomePage.css';

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [customization, setCustomization] = useState({});

  useEffect(() => {
    productsAPI.getAll()
      .then(({ data }) => {
        setFeatured(data.products.slice(0, 6));
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
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__text">
            <div className="hero__badge animate-fade-in-up">
              <span>🍿</span> Freshly Popped Daily in Small Batches
            </div>
            <h1 className="hero__title animate-fade-in-up">
              {customization.heroTitle || 'Freshly Popped, Perfectly Flavored'}
              <span className="hero__title-accent">J-Pop Popcorn</span>
            </h1>
            <p className="hero__subtitle animate-fade-in-up">
              {customization.heroSubtitle ||
                'Crafted with premium monster mushroom kernels, pure artisanal butter, and decadent toppings. Order online for instant local delivery or store pickup!'}
            </p>
            <div className="hero__actions animate-fade-in-up">
              <Link href="/shop" className="btn btn-primary btn-lg">
                Explore Flavors <FiArrowRight />
              </Link>
              <Link href="/shop" className="btn btn-outline btn-lg">
                View Menu
              </Link>
            </div>
          </div>

          <div className="hero__visual animate-fade-in-up">
            <img
              src="/jpop-logo.svg"
              alt="J-Pop Popcorn Logo"
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
                <strong>Order & Pickup</strong>
                <span>Fresh pickup or free delivery to select areas</span>
              </div>
            </div>
            <div className="feature-chip">
              <div className="feature-chip__icon"><FiShield /></div>
              <div>
                <strong>100% Fresh Daily</strong>
                <span>Monster mushroom crunch</span>
              </div>
            </div>
            <div className="feature-chip">
              <div className="feature-chip__icon"><FiClock /></div>
              <div>
                <strong>Flexible Scheduling</strong>
                <span>Pickup or delivery time</span>
              </div>
            </div>
            <div className="feature-chip">
              <div className="feature-chip__icon"><FiCreditCard /></div>
              <div>
                <strong>Easy QR Payments</strong>
                <span>GCash, Maya & InstaPay</span>
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
              <h2 className="section__title">Customer Favorites 🍿</h2>
              <p className="section__subtitle text-muted">
                Our best-selling artisanal gourmet popcorn flavors
              </p>
            </div>
            <Link href="/shop" className="btn btn-outline">
              View All Flavors <FiArrowRight />
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
        <h2 className="cta-section__title">Craving Crunchy Gourmet Popcorn?</h2>
        <p className="cta-section__text">
          Pick your favorite butter, cheddar, salted caramel, or spicy flavors, order online for pickup, and checkout with quick QR code payment.
        </p>
        <Link href="/shop" className="btn btn-primary btn-lg">
          Browse Shop Now <FiArrowRight />
        </Link>
      </section>
    </div>
  );
}

"use client";

import { useState, useEffect } from 'react';
import { FiSearch, FiTruck } from 'react-icons/fi';
import { productsAPI, categoriesAPI } from '../../src/services/api';
import ProductCard from '../../src/features/products/ProductCard';
import '../../src/pages/ShopPage.css';

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([
      productsAPI.getAll(),
      categoriesAPI.getAll().catch(() => ({ data: { categories: [] } })),
    ])
      .then(([prodRes, catRes]) => {
        setProducts(prodRes.data.products || []);
        setCategories(catRes.data?.categories || []);
      })
      .catch((err) => {
        console.error('Failed to load shop items:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const categoryPills = [
    { slug: 'all', name: 'All Snacks' },
    ...categories.map(c => ({ slug: c.slug, name: c.name })),
  ];

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCat === 'all' ||
      p.category?.toLowerCase() === selectedCat.toLowerCase() ||
      (selectedCat === 'popcorn' && (!p.category || p.category.includes('popcorn') || p.category === 'classic' || p.category === 'savory' || p.category === 'sweet' || p.category === 'premium')) ||
      (selectedCat === 'mini-donut' && p.category?.includes('donut'));

    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="page shop-page container">
      {/* Header */}
      <div className="shop-header">
        <h1 className="shop-header__title">J-Pop Corner Snack Menu 🍿🍩</h1>
        <p className="text-muted">
          Artisanal gourmet monster-mushroom popcorn with custom flavor mix sliders and freshly glazed mini donuts!
        </p>
      </div>

      {/* Free Shipping Promo Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary), #E84118)',
        color: '#ffffff',
        padding: '14px 20px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(194, 54, 22, 0.25)',
      }}>
        <FiTruck size={24} style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ display: 'block', fontSize: '0.98rem' }}>
            🎉 AUTOMATIC FREE DELIVERY PROMO UNLOCKED ON BULK ORDERS!
          </strong>
          <span style={{ fontSize: '0.85rem', opacity: 0.95 }}>
            Buy at least <strong>5 units of 1kg Popcorn (₱60)</strong> OR <strong>10 units of 500g Popcorn (₱35)</strong> to waive all shipping fees!
          </span>
        </div>
      </div>

      {/* Toolbar: Search + Category Filter */}
      <div className="shop-toolbar">
        <div className="shop-search-box">
          <FiSearch className="text-muted" size={18} />
          <input
            type="text"
            className="shop-search-input"
            placeholder="Search popcorn, donuts, syrups, flavors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="shop-categories">
          {categoryPills.map((cat) => (
            <button
              key={cat.slug}
              className={`category-pill ${selectedCat === cat.slug ? 'category-pill--active' : ''}`}
              onClick={() => setSelectedCat(cat.slug)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Catalog Grid */}
      {loading ? (
        <div className="shop-empty">
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🍿</div>
          <p>Loading fresh snacks...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="shop-empty">
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔍</div>
          <h3>No snacks match your search</h3>
          <p>Try clearing your search query or selecting a different category.</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

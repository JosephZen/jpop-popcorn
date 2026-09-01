"use client";

import { useState, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';
import { productsAPI } from '../../src/services/api';
import ProductCard from '../../src/features/products/ProductCard';
import '../../src/pages/ShopPage.css';

const CATEGORIES = ['all', 'classic', 'savory', 'sweet', 'premium'];

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    productsAPI.getAll()
      .then(({ data }) => {
        setProducts(data.products || []);
      })
      .catch((err) => {
        console.error('Failed to load shop products:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesCategory = category === 'all' || p.category?.toLowerCase() === category.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="page shop-page container">
      {/* Header */}
      <div className="shop-header">
        <h1 className="shop-header__title">Gourmet Popcorn Menu 🍿</h1>
        <p className="text-muted">
          Handcrafted in small batches with monster-mushroom kernels and mouth-watering flavors.
        </p>
      </div>

      {/* Toolbar: Search + Category Filter */}
      <div className="shop-toolbar">
        <div className="shop-search-box">
          <FiSearch className="text-muted" size={18} />
          <input
            type="text"
            className="shop-search-input"
            placeholder="Search popcorn flavors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="shop-categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`category-pill ${category === cat ? 'category-pill--active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Product Catalog Grid */}
      {loading ? (
        <div className="shop-empty">
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🍿</div>
          <p>Loading freshly popped menu...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="shop-empty">
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔍</div>
          <h3>No flavors match your search</h3>
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

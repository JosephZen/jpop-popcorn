"use client";

import { useState } from 'react';
import { FiPlus, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import useCartStore from '../../store/cartStore';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const flavors = Array.isArray(product.flavors) ? product.flavors : [];
  const [selectedFlavor, setSelectedFlavor] = useState(flavors[0] || '');
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = () => {
    addItem(product, selectedFlavor || null, 1);
    setAdded(true);
    toast.success(`Added ${product.name} ${selectedFlavor ? `(${selectedFlavor})` : ''} to cart! 🍿`);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="product-card">
      <div className="product-card__image-wrap">
        <img
          src={product.imageUrl || '/jpop-logo.svg'}
          alt={product.name}
          className="product-card__image"
          loading="lazy"
        />
        <span className="product-card__badge">{product.category || 'Gourmet'}</span>
      </div>

      <div className="product-card__body">
        <h3 className="product-card__title">{product.name}</h3>
        <p className="product-card__desc">{product.description}</p>

        {flavors.length > 0 && (
          <div className="product-card__flavors">
            <label className="product-card__flavors-label">Select Flavor Option:</label>
            <select
              className="product-card__flavor-select"
              value={selectedFlavor}
              onChange={(e) => setSelectedFlavor(e.target.value)}
            >
              {flavors.map((f, i) => (
                <option key={i} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="product-card__footer">
          <div className="product-card__price">₱{parseFloat(product.price).toFixed(2)}</div>
          <button
            className={`btn ${added ? 'btn-primary' : 'btn-accent'} product-card__btn`}
            onClick={handleAddToCart}
          >
            {added ? <><FiCheck /> Added</> : <><FiPlus /> Add</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

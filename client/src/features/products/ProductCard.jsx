"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiCheck, FiSliders, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import useCartStore from '../../store/cartStore';
import { useAuth } from '../auth/AuthContext';
import { formatImageUrl } from '../../services/api';
import AuthModal from '../../components/AuthModal';
import './ProductCard.css';

const DEFAULT_POPCORN_FLAVORS = ['Spicy BBQ', 'Sour Cream & Onion', 'Cheese', 'BBQ'];
const DONUT_SYRUPS = ['Chocolate', 'Ube', 'Caramel', 'Matcha', 'Strawberry', 'Blueberry'];
const DONUT_DIPS = ['Chocolate', 'White Chocolate'];
const DONUT_TOPPINGS = ['Rainbow Mini Marshmallows', 'White Chocolate Chips', 'Chocolate Chips', 'Sprinkles'];

const ProductCard = ({ product }) => {
  const isDonut = product.category === 'mini-donut' || product.categoryId === 2 || product.name.toLowerCase().includes('donut');

  // Popcorn Flavor options
  const rawFlavors = Array.isArray(product.flavors) && product.flavors.length > 0
    ? product.flavors
    : DEFAULT_POPCORN_FLAVORS;

  // Sizes options
  const defaultSizes = product.sizeLabel
    ? [product.sizeLabel]
    : Array.isArray(product.sizes) && product.sizes.length > 0
    ? product.sizes
    : [product.name.includes('1kg') ? '1kg' : '500g'];

  const [selectedSize, setSelectedSize] = useState(defaultSizes[0] || '500g');
  const [selectedFlavor, setSelectedFlavor] = useState(rawFlavors[0] || 'Cheese');
  const [isMixMode, setIsMixMode] = useState(false);
  const [mixPercentages, setMixPercentages] = useState({
    [rawFlavors[0] || 'Spicy BBQ']: 75,
    [rawFlavors[1] || 'Sour Cream & Onion']: 25,
  });

  // Mini donut selections
  const [selectedSyrups, setSelectedSyrups] = useState(['Chocolate', 'Caramel']);
  const [selectedDip, setSelectedDip] = useState('Chocolate');
  const [selectedToppings, setSelectedToppings] = useState(['Rainbow Mini Marshmallows']);

  const [showCustomizer, setShowCustomizer] = useState(false);
  const [added, setAdded] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Price calculations based on size if product has variants
  let displayPrice = parseFloat(product.basePrice || product.price || 35.00);
  if (selectedSize.toLowerCase().includes('1kg')) {
    displayPrice = 60.00;
  } else if (selectedSize.toLowerCase().includes('500g')) {
    displayPrice = 35.00;
  } else if (selectedSize.toLowerCase().includes('16') || product.name.toLowerCase().includes('16')) {
    displayPrice = 180.00;
  } else if (selectedSize.toLowerCase().includes('8') || product.name.toLowerCase().includes('8')) {
    displayPrice = 99.00;
  }

  // Calculate total percentage for popcorn mix
  const totalMixPercentage = Object.values(mixPercentages).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  const isMixValid = !isMixMode || totalMixPercentage === 100;

  const handleSliderChange = (flavor, val) => {
    setMixPercentages(prev => ({
      ...prev,
      [flavor]: parseInt(val),
    }));
  };

  const toggleSyrup = (syrup) => {
    if (selectedSyrups.includes(syrup)) {
      setSelectedSyrups(prev => prev.filter(s => s !== syrup));
    } else {
      if (selectedSyrups.length >= 8) {
        toast.error('Maximum 8 unique flavor syrups allowed.');
        return;
      }
      setSelectedSyrups(prev => [...prev, syrup]);
    }
  };

  const toggleTopping = (topping) => {
    if (selectedToppings.includes(topping)) {
      setSelectedToppings(prev => prev.filter(t => t !== topping));
    } else {
      setSelectedToppings(prev => [...prev, topping]);
    }
  };

  const handleAddToCart = () => {
    // Guest Cart Interception
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (!isMixValid) {
      toast.error(`Total flavor mix must strictly equal 100%! Currently: ${totalMixPercentage}%`);
      return;
    }

    let customizationPayload = {};
    let itemFlavorLabel = selectedFlavor;

    if (isDonut) {
      customizationPayload = {
        syrups: selectedSyrups,
        dips: [selectedDip],
        toppings: selectedToppings,
      };
      itemFlavorLabel = `Syrups: ${selectedSyrups.join(', ')} | Dip: ${selectedDip}`;
    } else if (isMixMode) {
      const activeMix = {};
      Object.entries(mixPercentages).forEach(([f, pct]) => {
        if (pct > 0) activeMix[f] = pct;
      });
      customizationPayload = {
        mixMode: true,
        mix: activeMix,
      };
      itemFlavorLabel = Object.entries(activeMix).map(([f, pct]) => `${pct}% ${f}`).join(' + ');
    }

    const cartProduct = {
      ...product,
      price: displayPrice,
    };

    addItem(cartProduct, itemFlavorLabel, selectedSize, 1, customizationPayload);
    setAdded(true);
    toast.success(`Added ${product.name} (${selectedSize}) to cart! 🍿`);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <>
      <div className="product-card">
        <div className="product-card__image-wrap">
          <img
            src={formatImageUrl(product.imageUrl)}
            alt={product.name}
            className="product-card__image"
            loading="lazy"
          />
          <span className="product-card__badge">
            {isDonut ? 'Mini Donut' : 'Gourmet Popcorn'}
          </span>
        </div>

        <div className="product-card__body">
          <h3 className="product-card__title">{product.name}</h3>
          <p className="product-card__desc">{product.description}</p>

          {/* Size Variant Selector */}
          <div className="product-card__flavors">
            <label className="product-card__flavors-label">Package Size:</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {defaultSizes.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedSize(s)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: selectedSize === s ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                    background: selectedSize === s ? 'var(--color-primary)' : 'var(--bg-subtle)',
                    color: selectedSize === s ? '#ffffff' : 'var(--text-primary)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Popcorn Customizer */}
          {!isDonut ? (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="product-card__flavors-label" style={{ marginBottom: 0 }}>Flavor Choice:</span>
                <button
                  type="button"
                  onClick={() => setIsMixMode(!isMixMode)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <FiSliders size={14} />
                  {isMixMode ? 'Single Flavor' : 'Customize Flavor Mix'}
                </button>
              </div>

              {!isMixMode ? (
                <select
                  className="product-card__flavor-select"
                  value={selectedFlavor}
                  onChange={(e) => setSelectedFlavor(e.target.value)}
                >
                  {rawFlavors.map((f, i) => (
                    <option key={i} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              ) : (
                /* Dynamic Interactive Percentage Sliders in 25% increments */
                <div style={{
                  background: 'var(--bg-subtle)',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    marginBottom: '10px',
                    color: totalMixPercentage === 100 ? '#27ae60' : '#e67e22',
                  }}>
                    <span>Flavor Mix Ratio:</span>
                    <span>Total: {totalMixPercentage}% {totalMixPercentage === 100 ? '✅' : '⚠️ Must = 100%'}</span>
                  </div>

                  {rawFlavors.map((flv, idx) => {
                    const currentPct = mixPercentages[flv] || 0;
                    return (
                      <div key={idx} style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '2px' }}>
                          <span>{flv}</span>
                          <strong>{currentPct}%</strong>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="25"
                          value={currentPct}
                          onChange={(e) => handleSliderChange(flv, e.target.value)}
                          style={{
                            width: '100%',
                            accentColor: 'var(--color-primary)',
                            cursor: 'pointer',
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Mini Donut Customizer */
            <div style={{ marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => setShowCustomizer(!showCustomizer)}
                className="btn btn-outline btn-sm btn-full"
                style={{ fontSize: '0.82rem', marginBottom: '8px' }}
              >
                <FiSliders /> {showCustomizer ? 'Close Customizer' : 'Customize Syrups, Dips & Toppings'}
              </button>

              {showCustomizer && (
                <div style={{
                  background: 'var(--bg-subtle)',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.8rem',
                }}>
                  {/* Syrups */}
                  <div style={{ marginBottom: '10px' }}>
                    <strong style={{ display: 'block', marginBottom: '4px' }}>Syrups (Pick up to 8):</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {DONUT_SYRUPS.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleSyrup(s)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            border: selectedSyrups.includes(s) ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                            background: selectedSyrups.includes(s) ? 'var(--color-primary)' : '#fff',
                            color: selectedSyrups.includes(s) ? '#fff' : '#333',
                            cursor: 'pointer',
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Choco Dip */}
                  <div style={{ marginBottom: '10px' }}>
                    <strong style={{ display: 'block', marginBottom: '4px' }}>Choco Dip:</strong>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {DONUT_DIPS.map((d, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedDip(d)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            border: selectedDip === d ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                            background: selectedDip === d ? 'var(--color-primary)' : '#fff',
                            color: selectedDip === d ? '#fff' : '#333',
                            cursor: 'pointer',
                          }}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toppings */}
                  <div>
                    <strong style={{ display: 'block', marginBottom: '4px' }}>Toppings:</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {DONUT_TOPPINGS.map((t, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleTopping(t)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            border: selectedToppings.includes(t) ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                            background: selectedToppings.includes(t) ? 'var(--color-primary)' : '#fff',
                            color: selectedToppings.includes(t) ? '#fff' : '#333',
                            cursor: 'pointer',
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="product-card__footer">
            <div className="product-card__price">₱{displayPrice.toFixed(2)}</div>
            <button
              className={`btn ${added ? 'btn-primary' : 'btn-accent'} product-card__btn`}
              onClick={handleAddToCart}
              disabled={isMixMode && totalMixPercentage !== 100}
            >
              {added ? <><FiCheck /> Added</> : <><FiPlus /> Add to Bag</>}
            </button>
          </div>
        </div>
      </div>

      {/* Guest Cart Interception Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        pendingItem={product}
      />
    </>
  );
};

export default ProductCard;

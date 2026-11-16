"use client";

import { useRouter } from 'next/navigation';
import { FiX, FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiArrowRight, FiTruck } from 'react-icons/fi';
import useCartStore from '../store/cartStore';
import { formatImageUrl } from '../services/api';
import './CartDrawer.css';

const CartDrawer = ({ isOpen, onClose }) => {
  const { items, removeItem, updateQuantity, getSubtotal, getItemCount, getFreeShippingStatus } = useCartStore();
  const router = useRouter();

  const totalCount = getItemCount();
  const subtotal = getSubtotal();
  const promo = getFreeShippingStatus();

  const handleCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  const renderCustomizationDetails = (item) => {
    const payload = item.customizationPayload;
    if (!payload) return null;

    if (payload.mix && typeof payload.mix === 'object') {
      const mixEntries = Object.entries(payload.mix).filter(([_, pct]) => pct > 0);
      if (mixEntries.length > 0) {
        return (
          <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600, marginTop: '2px' }}>
            Mix: {mixEntries.map(([flv, pct]) => `${pct}% ${flv}`).join(' + ')}
          </div>
        );
      }
    }

    const tags = [];
    if (payload.syrups && payload.syrups.length > 0) tags.push(`Syrup: ${payload.syrups.join(', ')}`);
    if (payload.dips && payload.dips.length > 0) tags.push(`Dip: ${payload.dips.join(', ')}`);
    if (payload.toppings && payload.toppings.length > 0) tags.push(`Toppings: ${payload.toppings.join(', ')}`);

    if (tags.length > 0) {
      return (
        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.3 }}>
          {tags.join(' • ')}
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <div
        className={`cart-drawer-overlay ${isOpen ? 'cart-drawer-overlay--open' : ''}`}
        onClick={onClose}
      />
      <div className={`cart-drawer ${isOpen ? 'cart-drawer--open' : ''}`}>
        {/* Header */}
        <div className="cart-drawer__header">
          <h3 className="cart-drawer__title">
            <FiShoppingBag /> Your Cart ({totalCount})
          </h3>
          <button className="cart-drawer__close" onClick={onClose} aria-label="Close Cart">
            <FiX />
          </button>
        </div>

        {/* Free Shipping Promo Bar */}
        <div style={{
          background: promo.isFree ? '#27ae60' : 'var(--color-primary)',
          color: '#ffffff',
          padding: '8px 14px',
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600,
        }}>
          <FiTruck size={16} />
          <span>
            {promo.isFree
              ? '🎉 100% FREE SHIPPING UNLOCKED!'
              : 'Add 5+ 1kg or 10+ 500g popcorn for FREE SHIPPING!'}
          </span>
        </div>

        {/* Body */}
        <div className="cart-drawer__body">
          {items.length === 0 ? (
            <div className="cart-drawer__empty">
              <div className="cart-drawer__empty-icon">🍿</div>
              <h4>Your bag is empty!</h4>
              <p>Explore our gourmet popcorn & mini donuts and customize your treat.</p>
              <button
                className="btn btn-accent btn-sm mt-md"
                onClick={() => {
                  onClose();
                  router.push('/shop');
                }}
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <div className="cart-drawer__items">
              {items.map((item, idx) => (
                <div key={`${item.productId}-${idx}`} className="cart-item">
                  <img
                    src={formatImageUrl(item.imageUrl)}
                    alt={item.name}
                    className="cart-item__img"
                  />
                  <div className="cart-item__info">
                    <div className="cart-item__name">{item.name}</div>
                    {item.size && <span className="cart-item__flavor">Size: {item.size}</span>}
                    {item.flavor && <span className="cart-item__flavor" style={{ marginLeft: '4px' }}>Flavor: {item.flavor}</span>}
                    {renderCustomizationDetails(item)}
                    <div className="cart-item__price">₱{(item.price * item.quantity).toFixed(2)}</div>
                    <div className="cart-item__controls">
                      <button
                        className="cart-item__qty-btn"
                        onClick={() => updateQuantity(idx, item.quantity - 1)}
                      >
                        <FiMinus size={12} />
                      </button>
                      <span className="cart-item__qty" style={{ fontSize: '0.85rem' }}>Qty: {item.quantity}</span>
                      <button
                        className="cart-item__qty-btn"
                        onClick={() => updateQuantity(idx, item.quantity + 1)}
                      >
                        <FiPlus size={12} />
                      </button>
                      <button
                        className="cart-item__remove"
                        onClick={() => removeItem(idx)}
                        title="Remove item"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="cart-drawer__footer">
            <div className="cart-drawer__summary">
              <div className="cart-drawer__row">
                <span>Subtotal</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="cart-drawer__row">
                <span>Shipping Promo</span>
                <span style={{ color: promo.isFree ? '#27ae60' : 'inherit', fontWeight: promo.isFree ? 700 : 400 }}>
                  {promo.isFree ? 'FREE PROMO' : 'Calculated at checkout'}
                </span>
              </div>
              <div className="cart-drawer__row cart-drawer__row--total">
                <span>Total</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
            </div>
            <button className="btn btn-accent btn-full btn-lg" onClick={handleCheckout}>
              Proceed to Checkout <FiArrowRight />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;

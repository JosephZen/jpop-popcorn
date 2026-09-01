"use client";

import { useRouter } from 'next/navigation';
import { FiX, FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiArrowRight } from 'react-icons/fi';
import useCartStore from '../store/cartStore';
import './CartDrawer.css';

const CartDrawer = ({ isOpen, onClose }) => {
  const { items, removeItem, updateQuantity, getSubtotal, getItemCount } = useCartStore();
  const router = useRouter();

  const totalCount = getItemCount();
  const subtotal = getSubtotal();

  const freeDeliveryThreshold = 10;
  const itemsToFree = Math.max(0, freeDeliveryThreshold - totalCount);
  const progressPercent = Math.min(100, (totalCount / freeDeliveryThreshold) * 100);

  const handleCheckout = () => {
    onClose();
    router.push('/checkout');
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

        {/* Bulk Promo Progress */}
        <div className="cart-drawer__bulk-promo">
          <div className="cart-drawer__bulk-text">
            {itemsToFree === 0 ? (
              <span>🎉 You unlocked <strong>FREE DELIVERY!</strong></span>
            ) : (
              <span>
                🍿 Add <strong>{itemsToFree} more bag{itemsToFree > 1 ? 's' : ''}</strong> for <strong>FREE DELIVERY!</strong>
              </span>
            )}
          </div>
          <div className="cart-drawer__bulk-bar">
            <div className="cart-drawer__bulk-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Body */}
        <div className="cart-drawer__body">
          {items.length === 0 ? (
            <div className="cart-drawer__empty">
              <div className="cart-drawer__empty-icon">🍿</div>
              <h4>Your bag is empty!</h4>
              <p>Explore our gourmet popcorn flavors and fill up your cart.</p>
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
                <div key={`${item.productId}-${item.flavor}-${idx}`} className="cart-item">
                  <img
                    src={item.imageUrl || '/jpop-logo.svg'}
                    alt={item.name}
                    className="cart-item__img"
                  />
                  <div className="cart-item__info">
                    <div className="cart-item__name">{item.name}</div>
                    {item.flavor && <span className="cart-item__flavor">{item.flavor}</span>}
                    <div className="cart-item__price">₱{item.price.toFixed(2)}</div>
                    <div className="cart-item__controls">
                      <button
                        className="cart-item__qty-btn"
                        onClick={() => updateQuantity(item.productId, item.flavor, item.quantity - 1)}
                      >
                        <FiMinus size={12} />
                      </button>
                      <span className="cart-item__qty">{item.quantity}</span>
                      <button
                        className="cart-item__qty-btn"
                        onClick={() => updateQuantity(item.productId, item.flavor, item.quantity + 1)}
                      >
                        <FiPlus size={12} />
                      </button>
                      <button
                        className="cart-item__remove"
                        onClick={() => removeItem(item.productId, item.flavor)}
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
                <span>Estimated Shipping</span>
                <span>{totalCount >= 10 ? 'FREE' : 'Calculated at Checkout'}</span>
              </div>
              <div className="cart-drawer__row cart-drawer__row--total">
                <span>Total Items</span>
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

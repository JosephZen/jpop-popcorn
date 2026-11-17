"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiPackage, FiExternalLink, FiClock, FiCheck, FiRefreshCw, FiX, FiArrowRight, FiUser, FiTruck } from 'react-icons/fi';
import { useAuth } from '../../src/features/auth/AuthContext';
import { ordersAPI, formatImageUrl } from '../../src/services/api';
import toast from 'react-hot-toast';
import '../../src/pages/ProfilePage.css';

const STATUS_STAGES = [
  { key: 'pending', label: 'Placed', icon: '🕒' },
  { key: 'confirmed', label: 'Confirmed', icon: '📋' },
  { key: 'preparing', label: 'Preparing', icon: '🍿' },
  { key: 'ready', label: 'Ready / On Way', icon: '🛵' },
];

const getStatusDetails = (status, deliveryMethod) => {
  const isPickup = deliveryMethod === 'pickup';
  switch ((status || '').toLowerCase()) {
    case 'pending':
      return {
        stageIndex: 0,
        title: '🕒 Order Received & Awaiting Seller Confirmation',
        desc: 'We received your order! The J-Pop kitchen will review and confirm your snack prep shortly.',
        badgeClass: 'badge-pending',
        boxClass: '',
      };
    case 'confirmed':
      return {
        stageIndex: 1,
        title: '📋 Order Confirmed by Store',
        desc: 'Payment & order verified! Queued up for fresh artisan popping & frying.',
        badgeClass: 'badge-confirmed',
        boxClass: '',
      };
    case 'preparing':
      return {
        stageIndex: 2,
        title: '🍿 Fresh Popping & Preparation in Progress!',
        desc: 'Our chefs are actively popping and glazing your snacks fresh right now in Abra.',
        badgeClass: 'badge-preparing',
        boxClass: 'order-live-status-box--preparing',
      };
    case 'ready':
      return {
        stageIndex: 3,
        title: isPickup ? '🛍️ Snacks Ready for Pickup!' : '🛵 Out for Delivery — On the Way!',
        desc: isPickup
          ? 'Your order is freshly packaged and ready for pickup at Poblacion, San Juan, Abra!'
          : 'Your freshly packed snacks are out with our rider and heading to your delivery address!',
        badgeClass: 'badge-ready',
        boxClass: 'order-live-status-box--ready',
      };
    case 'delivered':
      return {
        stageIndex: 4,
        title: isPickup ? '✅ Order Picked Up & Completed' : '🎉 Delivered to Your Doorstep!',
        desc: 'Enjoy your delicious monster-mushroom popcorn and artisan donuts! Thank you!',
        badgeClass: 'badge-delivered',
        boxClass: 'order-live-status-box--delivered',
      };
    case 'cancelled':
      return {
        stageIndex: -1,
        title: '❌ Order Cancelled',
        desc: 'This order was cancelled. Please message our Live Chat if you need assistance.',
        badgeClass: 'badge-cancelled',
        boxClass: '',
      };
    default:
      return {
        stageIndex: 0,
        title: '🕒 Order Received',
        desc: 'Processing your order...',
        badgeClass: 'badge-pending',
        boxClass: '',
      };
  }
};

export default function TrackOrderPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState(null);

  const loadUserOrders = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      if (!user) return;
      const currentUserEmail = (user.email || '').toLowerCase().trim();

      let serverOrders = [];
      try {
        const { data } = await ordersAPI.getMyOrders();
        // Ensure server orders strictly belong to current user
        serverOrders = (data.orders || []).filter(so => {
          const soEmail = (so.customerEmail || '').toLowerCase().trim();
          if (currentUserEmail && soEmail) return soEmail === currentUserEmail;
          return user.id && String(so.userId) === String(user.id);
        });
      } catch {}

      let localOrders = [];
      try {
        const allStored = JSON.parse(localStorage.getItem('jpop_persisted_orders') || '[]');
        // STRICTLY isolate local orders by the signed-in user's email or user ID
        localOrders = allStored.filter(lo => {
          const loEmail = (lo.customerEmail || '').toLowerCase().trim();
          if (currentUserEmail && loEmail) return loEmail === currentUserEmail;
          return user.id && String(lo.userId) === String(user.id);
        });
      } catch {}

      const combined = [...serverOrders];
      for (const lo of localOrders) {
        const matchIndex = combined.findIndex(o => String(o.id) === String(lo.id));
        if (matchIndex === -1) {
          combined.push(lo);
        } else {
          // Keep newest status and merged info
          const serverOrder = combined[matchIndex];
          const serverTime = new Date(serverOrder.updatedAt || serverOrder.createdAt || 0).getTime();
          const localTime = new Date(lo.updatedAt || lo.createdAt || 0).getTime();
          combined[matchIndex] = localTime >= serverTime ? { ...serverOrder, ...lo } : { ...lo, ...serverOrder };
        }
      }
      combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(combined);
    } catch (err) {
      console.error('Failed to load user orders:', err);
    } finally {
      setLoadingOrders(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/track-order');
      return;
    }

    if (user) {
      loadUserOrders();
      const interval = setInterval(() => loadUserOrders(true), 5000);
      const handleStorageUpdate = () => loadUserOrders(true);
      window.addEventListener('storage', handleStorageUpdate);
      window.addEventListener('jpop_order_updated', handleStorageUpdate);

      return () => {
        clearInterval(interval);
        window.removeEventListener('storage', handleStorageUpdate);
        window.removeEventListener('jpop_order_updated', handleStorageUpdate);
      };
    }
  }, [user, isAuthenticated, loading, router, loadUserOrders]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <p>Loading your active orders...</p>
      </div>
    );
  }

  const activeOrders = orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes((o.status || '').toLowerCase()));
  const completedOrders = orders.filter(o => !['pending', 'confirmed', 'preparing', 'ready'].includes((o.status || '').toLowerCase()));

  return (
    <div className="page profile-page container" style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiPackage /> Live Order Tracking
          </h1>
          <p className="text-muted" style={{ margin: '6px 0 0', fontSize: '0.92rem' }}>
            Real-time fulfillment & kitchen updates for your fresh snack orders.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => loadUserOrders()}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem' }}
          >
            <FiRefreshCw className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'Refreshing...' : 'Refresh Status'}
          </button>
          <Link
            href="/profile"
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem' }}
          >
            <FiUser /> Account Profile
          </Link>
        </div>
      </div>

      {loadingOrders ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <p className="text-muted">Loading live orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '16px' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '14px' }}>🍿</div>
          <h3 style={{ marginBottom: '8px' }}>No orders in progress!</h3>
          <p className="text-muted" style={{ margin: '0 auto 24px', maxWidth: '440px', lineHeight: 1.5 }}>
            You don&apos;t have any active orders right now. Check out our fresh monster-mushroom popcorn and artisan glazed mini donuts!
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => router.push('/shop')}>
            Explore Snacks &amp; Order <FiArrowRight style={{ marginLeft: '6px' }} />
          </button>
        </div>
      ) : (
        <div className="profile-orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {orders.map((order) => {
            const details = getStatusDetails(order.status, order.deliveryMethod);
            return (
              <div key={order.id} className="order-card" style={{ border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', background: 'var(--bg-surface)' }}>
                {/* Header */}
                <div className="order-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <div>
                    <strong style={{ fontSize: '1.15rem', color: '#FFD32A' }}>Order #{order.id}</strong>
                    <span className="text-muted" style={{ fontSize: '0.84rem', marginLeft: '12px' }}>
                      {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className={`badge ${details.badgeClass}`} style={{ fontSize: '0.86rem', padding: '6px 12px', fontWeight: 800 }}>
                    {order.status?.toUpperCase()}
                  </span>
                </div>

                {/* Visual 4-Step Stepper */}
                {details.stageIndex >= 0 && (
                  <div className="order-stepper" style={{ margin: '20px 0' }}>
                    <div
                      className="order-stepper-progress"
                      style={{
                        width: `${Math.min(100, (Math.min(details.stageIndex, 3) / 3) * 100)}%`
                      }}
                    />
                    {STATUS_STAGES.map((st, sIdx) => {
                      const isCompleted = details.stageIndex > sIdx;
                      const isActive = details.stageIndex === sIdx;
                      return (
                        <div
                          key={st.key}
                          className={`stepper-step ${isActive ? 'stepper-step--active' : ''} ${isCompleted ? 'stepper-step--completed' : ''}`}
                        >
                          <div className="stepper-circle">
                            {isCompleted ? <FiCheck size={16} /> : st.icon}
                          </div>
                          <span className="stepper-label">{st.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Live Condition Callout */}
                <div className={`order-live-status-box ${details.boxClass}`} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', borderRadius: '12px', marginBottom: '18px' }}>
                  <div style={{ fontSize: '2rem', flexShrink: 0 }}>
                    {details.stageIndex === 3 ? '🛵' : details.stageIndex === 2 ? '🍿' : details.stageIndex === 1 ? '📋' : details.stageIndex >= 4 ? '🎉' : '🕒'}
                  </div>
                  <div>
                    <h5 style={{ margin: 0, color: '#FFD32A', fontSize: '1.02rem', fontWeight: 800 }}>
                      {details.title}
                    </h5>
                    <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {details.desc}
                    </p>
                  </div>
                </div>

                {/* Delivery & Payment Info */}
                <div style={{ fontSize: '0.9rem', marginBottom: '16px', lineHeight: 1.65, background: 'var(--bg-subtle)', padding: '14px 16px', borderRadius: '10px' }}>
                  <div>
                    <strong>Fulfillment:</strong>{' '}
                    <span style={{ color: '#FFD32A', fontWeight: 700 }}>
                      {order.deliveryMethod === 'pickup' ? '🛍️ Store Pickup (Poblacion, San Juan, Abra)' : '🚚 Doorstep Delivery'}
                    </span>
                  </div>
                  {order.deliveryAddress && (
                    <div><strong>Address / Landmark:</strong> {order.deliveryAddress}</div>
                  )}
                  {order.scheduledTime && (
                    <div><strong>Scheduled Time:</strong> {new Date(order.scheduledTime).toLocaleString()}</div>
                  )}
                  <div>
                    <strong>Payment Method:</strong> {order.paymentMethod?.toUpperCase()} &bull;{' '}
                    <span style={{ color: order.paymentConfirmed ? '#2ED573' : '#FFA502', fontWeight: 700 }}>
                      {order.paymentConfirmed ? '✅ Payment Verified' : '⏳ Verifying Transfer'}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="order-card__items" style={{ marginBottom: '16px' }}>
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="order-item-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--border-color)', fontSize: '0.9rem' }}>
                      <span>
                        <strong>{item.productName || `Product #${item.productId}`}</strong> {item.flavor ? `(${item.flavor})` : ''} &times; {item.quantity}
                      </span>
                      <strong>₱{parseFloat((item.priceAtTime || item.price || 0) * (item.quantity || 1)).toFixed(2)}</strong>
                    </div>
                  ))}
                </div>

                {/* Footer Total */}
                <div className="order-card__footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px' }}>
                  <span style={{ fontSize: '0.94rem', color: 'var(--text-muted)' }}>Total Amount</span>
                  <span style={{ fontSize: '1.35rem', color: '#FFD32A', fontWeight: 900 }}>
                    ₱{parseFloat(order.total || 0).toFixed(2)}
                  </span>
                </div>

                {order.paymentReceiptUrl && (
                  <div style={{ marginTop: '14px', textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setPreviewReceipt(formatImageUrl(order.paymentReceiptUrl))}
                      style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <FiExternalLink /> View Payment Receipt
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: View Receipt */}
      {previewReceipt && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.88)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#1A1514',
            border: '2px solid #FFD32A',
            color: '#F7F1E9',
            borderRadius: '18px',
            padding: '24px',
            maxWidth: '520px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.95)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#FFD32A' }}>Uploaded Payment Receipt</h4>
              <button onClick={() => setPreviewReceipt(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <FiX size={22} />
              </button>
            </div>
            {previewReceipt.startsWith('data:') || previewReceipt.startsWith('http') || previewReceipt.startsWith('/') ? (
              <img
                src={previewReceipt}
                alt="Receipt"
                style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: '8px', objectFit: 'contain' }}
              />
            ) : (
              <p>{previewReceipt}</p>
            )}
            <div style={{ marginTop: '16px' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setPreviewReceipt(null)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

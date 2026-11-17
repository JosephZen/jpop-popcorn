"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiPackage, FiSave, FiMapPin, FiPhone, FiMail, FiExternalLink, FiClock, FiLogOut, FiCheck, FiRefreshCw, FiX } from 'react-icons/fi';
import { useAuth } from '../../src/features/auth/AuthContext';
import { ordersAPI, authAPI, formatImageUrl } from '../../src/services/api';
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

export default function ProfilePage() {
  const { user, isAuthenticated, loading, refreshProfile, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    router.push('/');
  };

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    address: '',
  });

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
      router.push('/login?redirect=/profile');
      return;
    }

    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
      });

      loadUserOrders();
      const interval = setInterval(() => loadUserOrders(true), 6000);
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

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await authAPI.updateProfile(profileForm);
      await refreshProfile();
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="page profile-page container">
      <h1 className="page-title" style={{ marginBottom: '32px' }}>
        My Account 🍿
      </h1>

      <div className="profile-layout">
        {/* Left Column: Editable Profile Settings */}
        <div className="card profile-card">
          <div className="card-body">
            <h3 style={{ marginBottom: '18px', display: 'flex', alignItem: 'center', gap: '8px' }}>
              <FiUser /> Profile Details
            </h3>

            <form onSubmit={handleProfileSave}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Read-only)</label>
                <input
                  type="email"
                  className="form-input"
                  value={user?.email || ''}
                  disabled
                  style={{ opacity: 0.7 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="0912-345-6789"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Default Delivery Address</label>
                <textarea
                  className="form-textarea"
                  placeholder="Set your home / office address for fast checkout..."
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={savingProfile}
              >
                <FiSave /> {savingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>

              <button
                type="button"
                className="btn btn-outline btn-full"
                onClick={handleLogout}
                style={{ marginTop: '12px', color: 'var(--color-danger, #e74c3c)', borderColor: 'var(--color-danger, #e74c3c)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <FiLogOut /> Log Out
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Order History & Tracking */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiPackage /> Live Order Tracking ({orders.length})
            </h3>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => loadUserOrders()}
              disabled={refreshing}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
            >
              <FiRefreshCw className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'Refreshing...' : 'Refresh Status'}
            </button>
          </div>

          {loadingOrders ? (
            <p className="text-muted">Loading live orders...</p>
          ) : orders.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🍿</div>
              <h4>No orders yet!</h4>
              <p className="text-muted" style={{ margin: '8px 0 20px' }}>
                You haven&apos;t placed any snack orders yet. Choose your favorite popcorn and donuts fresh in Abra!
              </p>
              <button className="btn btn-accent" onClick={() => router.push('/shop')}>
                Explore Flavors
              </button>
            </div>
          ) : (
            <div className="profile-orders-list">
              {orders.map((order) => {
                const details = getStatusDetails(order.status, order.deliveryMethod);
                return (
                  <div key={order.id} className="order-card">
                    {/* Header */}
                    <div className="order-card__header">
                      <div>
                        <strong style={{ fontSize: '1.05rem', color: '#FFD32A' }}>Order #{order.id}</strong>
                        <span className="text-muted" style={{ fontSize: '0.82rem', marginLeft: '12px' }}>
                          {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className={`badge ${details.badgeClass}`}>
                        {order.status?.toUpperCase()}
                      </span>
                    </div>

                    {/* Visual 4-Step Stepper */}
                    {details.stageIndex >= 0 && (
                      <div className="order-stepper">
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
                    <div className={`order-live-status-box ${details.boxClass}`}>
                      <div style={{ fontSize: '1.8rem', flexShrink: 0 }}>
                        {details.stageIndex === 3 ? '🛵' : details.stageIndex === 2 ? '🍿' : details.stageIndex === 1 ? '📋' : details.stageIndex >= 4 ? '🎉' : '🕒'}
                      </div>
                      <div>
                        <h5 style={{ margin: 0, color: '#FFD32A', fontSize: '0.98rem', fontWeight: 800 }}>
                          {details.title}
                        </h5>
                        <p style={{ margin: '3px 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                          {details.desc}
                        </p>
                      </div>
                    </div>

                    {/* Delivery & Payment Info */}
                    <div style={{ fontSize: '0.88rem', marginBottom: '14px', lineHeight: 1.6 }}>
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
                        <strong>Payment:</strong> {order.paymentMethod?.toUpperCase()} &bull;{' '}
                        <span style={{ color: order.paymentConfirmed ? '#2ED573' : '#FFA502', fontWeight: 700 }}>
                          {order.paymentConfirmed ? '✅ Payment Verified' : '⏳ Verifying Transfer'}
                        </span>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="order-card__items">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="order-item-row">
                          <span>
                            {item.productName || `Product #${item.productId}`} {item.flavor ? `(${item.flavor})` : ''} &times; {item.quantity}
                          </span>
                          <strong>₱{parseFloat(item.priceAtTime * item.quantity).toFixed(2)}</strong>
                        </div>
                      ))}
                    </div>

                    {/* Footer Total */}
                    <div className="order-card__footer">
                      <span>Total Amount</span>
                      <span style={{ fontSize: '1.25rem', color: '#FFD32A', fontWeight: 900 }}>
                        ₱{parseFloat(order.total).toFixed(2)}
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
        </div>
      </div>

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

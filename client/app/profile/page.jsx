"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiPackage, FiSave, FiMapPin, FiPhone, FiMail, FiExternalLink, FiClock } from 'react-icons/fi';
import { useAuth } from '../../src/features/auth/AuthContext';
import { ordersAPI, authAPI } from '../../src/services/api';
import toast from 'react-hot-toast';
import '../../src/pages/ProfilePage.css';

export default function ProfilePage() {
  const { user, isAuthenticated, loading, refreshProfile } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    address: '',
  });

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

      ordersAPI.getMyOrders()
        .then(({ data }) => {
          setOrders(data.orders || []);
        })
        .catch((err) => {
          console.error('Failed to load user orders:', err);
        })
        .finally(() => {
          setLoadingOrders(false);
        });
    }
  }, [user, isAuthenticated, loading, router]);

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
            </form>
          </div>
        </div>

        {/* Right Column: Order History & Tracking */}
        <div>
          <h3 style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiPackage /> Order History & Tracking
          </h3>

          {loadingOrders ? (
            <p className="text-muted">Loading orders...</p>
          ) : orders.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🍿</div>
              <h4>No orders yet!</h4>
              <p className="text-muted" style={{ margin: '8px 0 20px' }}>
                You haven't placed any popcorn orders yet. Browse our menu to satisfy your cravings!
              </p>
              <button className="btn btn-accent" onClick={() => router.push('/shop')}>
                Explore Flavors
              </button>
            </div>
          ) : (
            <div className="profile-orders-list">
              {orders.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-card__header">
                    <div>
                      <strong>Order #{order.id}</strong>
                      <span className="text-muted" style={{ fontSize: '0.82rem', marginLeft: '12px' }}>
                        {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className={`badge badge-${order.status}`}>
                      {order.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.88rem', marginBottom: '12px' }}>
                    <div>
                      <strong>Method:</strong> {order.deliveryMethod === 'pickup' ? 'Store Pickup' : 'Doorstep Delivery'}
                    </div>
                    {order.deliveryAddress && (
                      <div><strong>Address:</strong> {order.deliveryAddress}</div>
                    )}
                    {order.scheduledTime && (
                      <div><strong>Scheduled For:</strong> {new Date(order.scheduledTime).toLocaleString()}</div>
                    )}
                    <div>
                      <strong>Payment:</strong> {order.paymentMethod?.toUpperCase()} - {order.paymentConfirmed ? '✅ Confirmed' : '⏳ Verifying Receipt'}
                    </div>
                  </div>

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

                  <div className="order-card__footer">
                    <span>Total Paid</span>
                    <span style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>
                      ₱{parseFloat(order.total).toFixed(2)}
                    </span>
                  </div>

                  {order.paymentReceiptUrl && (
                    <div style={{ marginTop: '12px', textAlign: 'right' }}>
                      <a
                        href={order.paymentReceiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.8rem' }}
                      >
                        <FiExternalLink /> View Uploaded Receipt
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

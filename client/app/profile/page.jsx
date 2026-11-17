"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiUser, FiSave, FiMapPin, FiPhone, FiMail, FiLogOut, FiPackage, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../../src/features/auth/AuthContext';
import { authAPI } from '../../src/services/api';
import toast from 'react-hot-toast';
import '../../src/pages/ProfilePage.css';

export default function ProfilePage() {
  const { user, isAuthenticated, loading, refreshProfile, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    router.push('/');
  };

  const [savingProfile, setSavingProfile] = useState(false);
  const [activeOrderCount, setActiveOrderCount] = useState(0);
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

      // Check active orders count to provide a helpful indicator
      try {
        const userEmail = (user.email || '').toLowerCase().trim();
        const stored = JSON.parse(localStorage.getItem('jpop_persisted_orders') || '[]');
        const userOrders = stored.filter(o => {
          const oEmail = (o.customerEmail || '').toLowerCase().trim();
          if (userEmail && oEmail) return oEmail === userEmail;
          return user.id && String(o.userId) === String(user.id);
        });
        const active = userOrders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes((o.status || '').toLowerCase()));
        setActiveOrderCount(active.length);
      } catch {}
    }
  }, [user, isAuthenticated, loading, router]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await authAPI.updateProfile(profileForm);
      await refreshProfile();
      toast.success('Profile updated successfully! ✨');
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
    <div className="page profile-page container" style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          width: '74px',
          height: '74px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-primary), #FFD32A)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px',
          fontSize: '2rem',
          color: '#1A1514',
          fontWeight: 900,
          boxShadow: '0 8px 24px rgba(230, 46, 4, 0.3)'
        }}>
          {user?.name ? user.name[0].toUpperCase() : '👤'}
        </div>
        <h1 className="page-title" style={{ margin: 0 }}>
          {user?.name || 'My Account'}
        </h1>
        <p className="text-muted" style={{ margin: '6px 0 0', fontSize: '0.94rem' }}>
          Manage your personal account credentials and default delivery address.
        </p>
      </div>

      {/* Quick Jump to Dedicated Order Tracking */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 211, 42, 0.12), rgba(230, 46, 4, 0.12))',
        border: '1px solid rgba(255, 211, 42, 0.35)',
        borderRadius: '14px',
        padding: '16px 20px',
        marginBottom: '26px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FiPackage size={26} color="#FFD32A" />
          <div>
            <strong style={{ color: '#FFD32A', fontSize: '1rem', display: 'block' }}>
              Looking for your orders?
            </strong>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              {activeOrderCount > 0
                ? `You have ${activeOrderCount} snack order(s) actively being prepared!`
                : 'Track prep status, pickup ready, and delivery routes.'}
            </span>
          </div>
        </div>
        <Link href="/track-order" className="btn btn-accent btn-sm" style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          Track Orders <FiArrowRight />
        </Link>
      </div>

      {/* Account Settings Card */}
      <div className="card profile-card" style={{ padding: '28px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem' }}>
          <FiUser /> Account Details
        </h3>

        <form onSubmit={handleProfileSave}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiUser size={14} /> Full Name
            </label>
            <input
              type="text"
              className="form-input"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              required
              placeholder="e.g. Juan Dela Cruz"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiMail size={14} /> Email Address (Read-only)
            </label>
            <input
              type="email"
              className="form-input"
              value={user?.email || ''}
              disabled
              style={{ opacity: 0.65, cursor: 'not-allowed' }}
            />
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              Email address is your primary account identity.
            </span>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiPhone size={14} /> Contact Phone Number
            </label>
            <input
              type="tel"
              className="form-input"
              placeholder="0912-345-6789"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '22px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiMapPin size={14} /> Default Delivery Address / Landmark
            </label>
            <textarea
              className="form-textarea"
              placeholder="Set your home / office address or landmark in Abra for fast one-click checkout..."
              value={profileForm.address}
              onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
              rows={3}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={savingProfile}
              style={{ fontWeight: 700 }}
            >
              <FiSave /> {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>

            <button
              type="button"
              className="btn btn-outline btn-full"
              onClick={handleLogout}
              style={{ color: 'var(--color-danger, #e74c3c)', borderColor: 'var(--color-danger, #e74c3c)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <FiLogOut /> Log Out of Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

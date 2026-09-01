"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiLock, FiKey, FiShield, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../../../src/features/auth/AuthContext';
import toast from 'react-hot-toast';
import '../../../src/pages/AuthPages.css';

export default function AdminLoginPage() {
  const [key, setKey] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { adminLogin } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!key || !username) {
      toast.error('Encryption Key and Master Username are required.');
      return;
    }

    setLoading(true);
    try {
      await adminLogin(key, username);
      toast.success('Admin authorization verified! 👑');
      router.push('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Authorization failed. Invalid encryption credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ borderColor: 'var(--color-primary)' }}>
        <div className="auth-header">
          <div className="admin-lock-icon">
            <FiShield />
          </div>
          <h2 className="auth-title">Admin Access Portal</h2>
          <p className="auth-subtitle">J-Pop Popcorn Owner & Inventory Management</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiKey /> Master Encryption Key
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter master encryption key..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiLock /> Hidden Master Username
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter hidden administrator username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg mt-md"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : <>Authorize Access <FiArrowRight /></>}
          </button>
        </form>

        <div className="auth-footer">
          <Link href="/">← Back to Store</Link>
        </div>
      </div>
    </div>
  );
}

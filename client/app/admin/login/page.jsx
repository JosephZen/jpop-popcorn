"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiLock, FiKey, FiShield, FiArrowRight, FiUser } from 'react-icons/fi';
import { useAuth } from '../../../src/features/auth/AuthContext';
import JPopLogo from '../../../src/components/JPopLogo';
import toast from 'react-hot-toast';
import '../../../src/pages/AuthPages.css';

export default function AdminLoginPage() {
  const [key, setKey] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { adminLogin, login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!key || !username) {
      toast.error('Credentials are required.');
      return;
    }

    setLoading(true);
    try {
      // If user entered email format, attempt email/password login
      if (username.includes('@')) {
        const res = await login(username, key);
        if ((res?.user?.role || '').toLowerCase() === 'admin') {
          toast.success('Admin authorization verified! 👑');
          router.push('/admin/dashboard');
          return;
        } else {
          toast.error('Access denied. Account is not an administrator.');
          return;
        }
      }

      await adminLogin(key, username);
      toast.success('Admin authorization verified! 👑');
      router.push('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Authorization failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ borderColor: 'var(--color-primary)' }}>
        <div className="auth-header">
          <div style={{ marginBottom: '12px' }}>
            <JPopLogo width={64} height={64} />
          </div>
          <h2 className="auth-title">Admin Access Portal</h2>
          <p className="auth-subtitle">J-Pop Corner Administration & Inventory Desk</p>
        </div>

        <div style={{
          background: 'var(--bg-subtle)',
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '18px',
          fontSize: '0.82rem',
          border: '1px solid var(--border-color)',
          textAlign: 'center',
        }}>
          <span>Default Admin: <strong>Admin@gmail.com</strong></span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiUser /> Admin Email or Master Username
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Admin@gmail.com or admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiKey /> Password or Master Encryption Key
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter password..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
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
          <Link href="/">← Back to Storefront</Link>
        </div>
      </div>
    </div>
  );
}

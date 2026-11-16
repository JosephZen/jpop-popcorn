"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiLock, FiKey, FiArrowRight, FiUser, FiCheckCircle } from 'react-icons/fi';
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

  const handleFillDefault = () => {
    setUsername('Admin@gmail.com');
    setKey('AdminPopcorn2026');
    toast.success('Default Admin credentials filled!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!key || !username) {
      toast.error('Email and password/key are required.');
      return;
    }

    setLoading(true);
    try {
      // 1. Try standard login first (handles Admin@gmail.com / AdminPopcorn2026)
      const res = await login(username, key);
      if ((res?.user?.role || '').toLowerCase() === 'admin') {
        toast.success('Admin authorization verified! 👑');
        router.push('/admin/dashboard');
        return;
      }

      // If user isn't admin via standard login, try master adminLogin
      await adminLogin(key, username);
      toast.success('Admin authorization verified! 👑');
      router.push('/admin/dashboard');
    } catch {
      // 2. Fallback attempt via adminLogin
      try {
        await adminLogin(key, username);
        toast.success('Admin authorization verified! 👑');
        router.push('/admin/dashboard');
      } catch (adminErr) {
        toast.error(adminErr.response?.data?.error || 'Authorization failed. Please check credentials.');
      }
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
          background: 'var(--bg-subtle, #f8f9fa)',
          padding: '12px 14px',
          borderRadius: '10px',
          marginBottom: '18px',
          fontSize: '0.84rem',
          border: '1px solid var(--border-color, #e9ecef)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          alignItems: 'center',
          textAlign: 'center',
        }}>
          <div>
            Default Admin: <strong>Admin@gmail.com</strong>
          </div>
          <button
            type="button"
            onClick={handleFillDefault}
            style={{
              background: 'none',
              border: '1px solid var(--color-primary, #8B1A1A)',
              color: 'var(--color-primary, #8B1A1A)',
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: 600,
            }}
          >
            Auto-fill Default Admin
          </button>
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
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiKey /> Password or Master Key
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter password..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg mt-md"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : <>Access Admin Dashboard <FiArrowRight /></>}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: '20px' }}>
          Return to Customer Store?{' '}
          <Link href="/login">
            Customer Login
          </Link>
        </div>
      </div>
    </div>
  );
}

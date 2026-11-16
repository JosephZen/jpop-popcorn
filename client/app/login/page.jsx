"use client";

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiArrowRight, FiLock, FiMail } from 'react-icons/fi';
import { useAuth } from '../../src/features/auth/AuthContext';
import JPopLogo from '../../src/components/JPopLogo';
import toast from 'react-hot-toast';
import '../../src/pages/AuthPages.css';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      toast.success('Welcome back to J-Pop Corner! 🍿');
      if ((res?.user?.role || '').toLowerCase() === 'admin' && redirectPath === '/') {
        router.push('/admin/dashboard');
      } else {
        router.push(redirectPath);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <div style={{ marginBottom: '12px' }}>
          <JPopLogo width={64} height={64} />
        </div>
        <h2 className="auth-title">Welcome to J-Pop Corner</h2>
        <p className="auth-subtitle">Sign in to customize snacks and access exclusive Abra shipping promos</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiMail /> Email Address
          </label>
          <input
            type="email"
            className="form-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiLock /> Password
          </label>
          <input
            type="password"
            className="form-input"
            placeholder="Enter your password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-full btn-lg mt-md"
          disabled={loading}
        >
          {loading ? 'Signing in...' : <>Sign In <FiArrowRight /></>}
        </button>
      </form>

      <div className="auth-footer" style={{ marginTop: '20px' }}>
        Don&apos;t have an account?{' '}
        <Link href={`/register${redirectPath !== '/' ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}>
          Create Account
        </Link>
      </div>

      <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.82rem' }}>
        <Link href="/admin/login" style={{ color: 'var(--text-muted, #7f8c8d)', textDecoration: 'none' }}>
          🔒 Administrator Access
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="auth-page">
      <Suspense fallback={<div className="auth-card">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

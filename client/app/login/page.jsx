"use client";

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../../src/features/auth/AuthContext';
import toast from 'react-hot-toast';
import '../../src/pages/AuthPages.css';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      loginWithToken(token).then(() => {
        toast.success('Successfully logged in with social account! dY?');
        router.push(redirectPath);
      }).catch(() => {
        toast.error('Failed to log in with social account.');
      });
    }
  }, [token, loginWithToken, router, redirectPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back to J-Pop! dY?');
      router.push(redirectPath);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  const handleFacebookLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/facebook';
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <img src="/jpop-logo.svg" alt="J-Pop Logo" className="auth-logo" />
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in to order your favorite gourmet popcorn</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        <button type="button" className="btn btn-outline btn-full" onClick={handleGoogleLogin}>
          Continue with Google
        </button>
        <button type="button" className="btn btn-primary btn-full" onClick={handleFacebookLogin} style={{ background: '#1877F2', borderColor: '#1877F2' }}>
          Continue with Facebook (Recommended)
        </button>
        <p style={{ fontSize: '0.75rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          We ask for your name and email to sync your orders and chat history.
        </p>
      </div>
      
      <div style={{ textAlign: 'center', margin: '15px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>OR</div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            className="form-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
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

      <div className="auth-footer">
        Don't have an account? <Link href="/register">Create Account</Link>
        <div style={{ marginTop: '12px' }}>
          <Link href="/admin/login" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            🔒 Admin Access Portal
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="auth-page">
      <Suspense fallback={<div className="auth-card"><p className="text-center">Loading...</p></div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

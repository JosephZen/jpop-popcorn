"use client";

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiArrowRight, FiUser, FiMail, FiLock, FiPhone, FiMapPin } from 'react-icons/fi';
import { useAuth } from '../../src/features/auth/AuthContext';
import JPopLogo from '../../src/components/JPopLogo';
import SocialAuthButtons from '../../src/components/SocialAuthButtons';
import toast from 'react-hot-toast';
import '../../src/pages/AuthPages.css';

function RegisterForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  const updateField = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill in your name, email, and password.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        address: form.address,
      });
      toast.success('Account created successfully! Welcome to J-Pop Corner 🍿');
      router.push(redirectPath);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed. Please try again.');
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
        <h2 className="auth-title">Join J-Pop Corner</h2>
        <p className="auth-subtitle">Create an account to save custom snacks & order fresh across Abra</p>
      </div>

      {/* Google & Facebook Fast Sign-Up */}
      <SocialAuthButtons redirectPath={redirectPath} />

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiUser /> Full Name
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Juan Dela Cruz"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            required
            autoComplete="name"
          />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiMail /> Email Address
          </label>
          <input
            type="email"
            className="form-input"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiLock /> Password
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="Min. 6 chars"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiLock /> Confirm
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="Confirm password"
              value={form.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiPhone /> Mobile Number (Optional)
          </label>
          <input
            type="tel"
            className="form-input"
            placeholder="0912-345-6789"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            autoComplete="tel"
          />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiMapPin /> Delivery Address (Abra)
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Barangay, Municipality, Abra"
            value={form.address}
            onChange={(e) => updateField('address', e.target.value)}
            autoComplete="street-address"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-full btn-lg mt-md"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : <>Register Account <FiArrowRight /></>}
        </button>
      </form>

      <div className="auth-footer" style={{ marginTop: '20px' }}>
        Already have an account?{' '}
        <Link href={`/login${redirectPath !== '/' ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}>
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="auth-page">
      <Suspense fallback={<div className="auth-card">Loading...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}

"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../../src/features/auth/AuthContext';
import toast from 'react-hot-toast';
import '../../src/pages/AuthPages.css';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Name, email, and password are required.');
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      toast.success('Account created successfully! Welcome to J-Pop! 🍿');
      router.push('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/jpop-logo.svg" alt="J-Pop Logo" className="auth-logo" />
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join J-Pop Popcorn for quick order checkout</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="e.g. Maria Santos"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number (Optional)</label>
            <input
              type="tel"
              name="phone"
              className="form-input"
              placeholder="0912-345-6789"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Default Delivery Address (Optional)</label>
            <textarea
              name="address"
              className="form-textarea"
              placeholder="House/Unit, Street, Barangay, City..."
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg mt-md"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : <>Register <FiArrowRight /></>}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link href="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}

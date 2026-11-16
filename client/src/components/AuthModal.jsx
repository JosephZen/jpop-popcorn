"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiX, FiLock, FiUserPlus, FiLogIn } from 'react-icons/fi';
import { FaGoogle, FaFacebookF } from 'react-icons/fa';
import JPopLogo from './JPopLogo';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const AuthModal = ({ isOpen, onClose, pendingItem = null }) => {
  const router = useRouter();
  if (!isOpen) return null;

  const handleOAuth = (provider) => {
    window.location.href = `${API_BASE}/auth/${provider}`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px',
    }}>
      <div style={{
        background: 'var(--bg-card, #ffffff)',
        color: 'var(--text-main, #2d3436)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '440px',
        padding: '32px 24px',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        textAlign: 'center',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted, #636e72)',
            padding: '4px',
          }}
          aria-label="Close Modal"
        >
          <FiX size={22} />
        </button>

        {/* Brand Icon */}
        <div style={{ marginBottom: '16px' }}>
          <JPopLogo width={72} height={72} />
        </div>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
          Sign In to Add to Cart
        </h3>

        <p style={{ fontSize: '0.92rem', color: 'var(--text-muted, #636e72)', marginBottom: '24px', lineHeight: 1.5 }}>
          {pendingItem ? (
            <>
              You are about to customize and add <strong>{pendingItem.name}</strong> to your bag. Sign in or create an account to save your cart and access exclusive Abra delivery promos!
            </>
          ) : (
            <>
              Log in or register to persist your custom snack cart across all devices, receive order updates, and enjoy fast checkout!
            </>
          )}
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <Link
            href="/login?redirect=/shop"
            className="btn btn-primary btn-full"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
            onClick={onClose}
          >
            <FiLogIn size={18} /> Log In with Email
          </Link>

          <Link
            href="/register?redirect=/shop"
            className="btn btn-outline btn-full"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
            onClick={onClose}
          >
            <FiUserPlus size={18} /> Create a New Account
          </Link>
        </div>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '20px 0',
          color: 'var(--text-muted, #b2bec3)',
          fontSize: '0.82rem',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color, #dfe6e9)' }} />
          <span>OR QUICK SOCIAL LOGIN</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color, #dfe6e9)' }} />
        </div>

        {/* Social Logins */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              background: '#ffffff',
              color: '#333333',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <FaGoogle color="#EA4335" /> Google
          </button>

          <button
            type="button"
            onClick={() => handleOAuth('facebook')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: '#1877F2',
              color: '#ffffff',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <FaFacebookF /> Facebook
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;

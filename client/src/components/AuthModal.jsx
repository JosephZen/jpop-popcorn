"use client";

import React from 'react';
import Link from 'next/link';
import { FiX, FiUserPlus, FiLogIn } from 'react-icons/fi';
import JPopLogo from './JPopLogo';

const AuthModal = ({ isOpen, onClose, pendingItem = null }) => {
  if (!isOpen) return null;

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
              You are customizing <strong>{pendingItem.name}</strong>. Please log in or create an account to save your snack bag and access Abra delivery promos!
            </>
          ) : (
            <>
              Log in or register to persist your custom snack cart across all devices, receive order updates, and enjoy fast checkout!
            </>
          )}
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link
            href="/login?redirect=/shop"
            className="btn btn-primary btn-full"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', fontSize: '1rem', fontWeight: 600 }}
            onClick={onClose}
          >
            <FiLogIn size={18} /> Sign In with Email
          </Link>

          <Link
            href="/register?redirect=/shop"
            className="btn btn-outline btn-full"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', fontSize: '1rem', fontWeight: 600 }}
            onClick={onClose}
          >
            <FiUserPlus size={18} /> Create a New Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;

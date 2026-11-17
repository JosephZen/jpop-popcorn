"use client";

import React from 'react';
import Link from 'next/link';
import { FiX, FiUserPlus, FiLogIn } from 'react-icons/fi';
import JPopLogo from './JPopLogo';
import SocialAuthButtons from './SocialAuthButtons';

const AuthModal = ({ isOpen, onClose, pendingItem = null }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: '#1A1514',
        border: '2px solid #FFD32A',
        color: '#F7F1E9',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '460px',
        padding: '36px 28px',
        position: 'relative',
        boxShadow: '0 25px 70px rgba(0, 0, 0, 0.95)',
        textAlign: 'center',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            color: '#F7F1E9',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s ease',
          }}
          aria-label="Close Modal"
        >
          <FiX size={20} />
        </button>

        {/* Brand Icon */}
        <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'center' }}>
          <JPopLogo width={68} height={68} />
        </div>

        {/* High-Contrast Bold Title */}
        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: 900,
          color: '#FFD32A',
          marginBottom: '8px',
          letterSpacing: '-0.3px',
        }}>
          Sign In to Add to Cart
        </h3>

        {/* High-Contrast Subtitle */}
        <p style={{
          fontSize: '0.94rem',
          color: '#E0D5C7',
          marginBottom: '20px',
          lineHeight: 1.55,
        }}>
          {pendingItem ? (
            <>
              You are ordering <strong style={{ color: '#FFD32A' }}>{pendingItem.name}</strong>. Please sign in or create an account to save your snacks &amp; unlock Abra free shipping promos!
            </>
          ) : (
            <>
              Log in to customize snacks, save your cart across devices, and unlock automated Abra shipping discounts!
            </>
          )}
        </p>

        {/* Fast Social Sign-In */}
        <SocialAuthButtons redirectPath="/shop" />

        {/* High-Contrast Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
          <Link
            href="/login?redirect=/shop"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '13px 18px',
              fontSize: '0.96rem',
              fontWeight: 800,
              backgroundColor: '#8B1A1A',
              color: '#FFFFFF',
              borderRadius: '12px',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(139, 26, 26, 0.45)',
              border: 'none',
              transition: 'all 0.2s ease',
            }}
            onClick={onClose}
          >
            <FiLogIn size={18} /> Sign In with Email
          </Link>

          <Link
            href="/register?redirect=/shop"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 18px',
              fontSize: '0.96rem',
              fontWeight: 800,
              backgroundColor: '#2A2220',
              border: '2px solid #FFD32A',
              color: '#FFD32A',
              borderRadius: '12px',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
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

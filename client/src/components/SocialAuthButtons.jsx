"use client";

import { useState } from 'react';

export const GoogleIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

export const FacebookIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export default function SocialAuthButtons({ redirectPath = '/' }) {
  const [loadingProvider, setLoadingProvider] = useState(null);

  const handleSocialClick = (provider) => {
    setLoadingProvider(provider);
    // Directly launch real Google / Facebook OAuth flow
    window.location.href = `/api/auth/${provider}?redirect=${encodeURIComponent(redirectPath)}`;
  };

  return (
    <div className="social-auth-container" style={{ margin: '16px 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          type="button"
          onClick={() => handleSocialClick('google')}
          disabled={loadingProvider !== null}
          className="btn-social btn-social--google"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '100%',
            padding: '11px 16px',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid #DADCE0',
            backgroundColor: '#FFFFFF',
            color: '#3C4043',
            fontSize: '0.92rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          <GoogleIcon size={18} />
          <span>{loadingProvider === 'google' ? 'Redirecting to Google...' : 'Continue with Google'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSocialClick('facebook')}
          disabled={loadingProvider !== null}
          className="btn-social btn-social--facebook"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '100%',
            padding: '11px 16px',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid #1877F2',
            backgroundColor: '#1877F2',
            color: '#FFFFFF',
            fontSize: '0.92rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(24, 119, 242, 0.25)',
            transition: 'all 0.2s ease',
          }}
        >
          <FacebookIcon size={18} />
          <span>{loadingProvider === 'facebook' ? 'Redirecting to Facebook...' : 'Continue with Facebook'}</span>
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          textAlign: 'center',
          margin: '20px 0 16px',
          color: 'var(--text-muted, #7f8c8d)',
          fontSize: '0.78rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        <span style={{ flex: 1, borderBottom: '1px solid var(--border-color, #e2e8f0)' }}></span>
        <span style={{ padding: '0 12px' }}>or continue with email</span>
        <span style={{ flex: 1, borderBottom: '1px solid var(--border-color, #e2e8f0)' }}></span>
      </div>
    </div>
  );
}

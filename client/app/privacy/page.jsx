"use client";

import Link from 'next/link';
import JPopLogo from '../../src/components/JPopLogo';

export default function PrivacyPolicyPage() {
  return (
    <div className="container" style={{ maxWidth: '800px', padding: '60px 20px', lineHeight: 1.7 }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <JPopLogo width={64} height={64} />
        <h1 style={{ fontSize: '2rem', marginTop: '16px', fontWeight: 800 }}>Privacy Policy</h1>
        <p className="text-muted" style={{ fontSize: '0.9rem' }}>Last updated: November 2026</p>
      </div>

      <div className="card" style={{ padding: '32px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ marginBottom: '12px' }}>1. Introduction</h3>
        <p style={{ marginBottom: '20px' }}>
          Welcome to <strong>J-Pop Corner</strong> (accessible via <code>https://castrojosephzen.shop</code>). We respect your privacy and are committed to protecting the personal information you share with us when ordering snacks, custom popcorn, and donuts.
        </p>

        <h3 style={{ marginBottom: '12px' }}>2. Information We Collect</h3>
        <p style={{ marginBottom: '10px' }}>When you register an account, place an order, or interact with our chat system, we may collect:</p>
        <ul style={{ paddingLeft: '24px', marginBottom: '20px' }}>
          <li><strong>Contact Details:</strong> Your name, email address, mobile number, and Abra delivery address.</li>
          <li><strong>Order Details:</strong> Items purchased, flavor customizations, delivery preferences, and payment receipts.</li>
          <li><strong>Messenger Inquiries:</strong> Communications sent via Facebook Messenger or our live PopBot customer desk.</li>
        </ul>

        <h3 style={{ marginBottom: '12px' }}>3. How We Use Your Information</h3>
        <ul style={{ paddingLeft: '24px', marginBottom: '20px' }}>
          <li>To fulfill and dispatch your orders across the 27 municipalities of Abra.</li>
          <li>To notify you regarding order status, store pickup readiness, and customer support.</li>
          <li>To respond to your live inquiries via Facebook Messenger and multi-admin live chat.</li>
        </ul>

        <h3 style={{ marginBottom: '12px' }}>4. Third-Party Services & Meta Integration</h3>
        <p style={{ marginBottom: '20px' }}>
          We use Meta (Facebook Messenger) to connect customers directly with our live seller desk. We do not sell, rent, or trade your personal data to any third parties.
        </p>

        <h3 style={{ marginBottom: '12px' }}>5. Contact Us</h3>
        <p style={{ marginBottom: '24px' }}>
          If you have questions regarding this Privacy Policy or wish to request data deletion, contact our administration at <strong>Admin@gmail.com</strong> or via our Facebook Messenger channel.
        </p>

        <div style={{ textAlign: 'center' }}>
          <Link href="/" className="btn btn-primary">
            Return to J-Pop Corner
          </Link>
        </div>
      </div>
    </div>
  );
}

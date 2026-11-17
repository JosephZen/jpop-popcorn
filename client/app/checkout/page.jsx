"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiTruck,
  FiMapPin,
  FiClock,
  FiCreditCard,
  FiUpload,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiDollarSign,
  FiInfo,
  FiAlertCircle
} from 'react-icons/fi';
import { useAuth } from '../../src/features/auth/AuthContext';
import useCartStore from '../../src/store/cartStore';
import { ordersAPI, uploadAPI, settingsAPI, locationsAPI, formatImageUrl } from '../../src/services/api';
import toast from 'react-hot-toast';
import '../../src/pages/CheckoutPage.css';

const STEPS = ['Delivery & Area', 'Schedule Time', 'Payment Mode', 'Review & Confirm'];

export default function CheckoutPage() {
  const { user, isAuthenticated } = useAuth();
  const { items, getSubtotal, clearCart, getFreeShippingStatus } = useCartStore();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [qrCodes, setQrCodes] = useState({
    gcash: { label: 'GCash', accountName: 'Joseph Zen Castro', accountNumber: '0912-345-6789', imageUrl: '/qr/gcash.jpg' },
    maya: { label: 'Maya', accountName: 'Joseph Zen Castro', accountNumber: '0912-345-6789', imageUrl: '/qr/maya.jpg' },
    instapay: { label: 'InstaPay', accountName: 'Joseph Zen Castro (Maribank)', accountNumber: '10555184277', imageUrl: '/qr/instapay.png' },
  });

  // Locations state
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState('');
  const [selectedBarangayId, setSelectedBarangayId] = useState('');
  const [baseDeliveryFee, setBaseDeliveryFee] = useState(50.00);

  // Payment mode: 'cash' | 'manual_qr'
  const [checkoutMode, setCheckoutMode] = useState('manual_qr');
  const [showTierInfo, setShowTierInfo] = useState(false);

  const [form, setForm] = useState({
    deliveryMethod: 'delivery',
    deliveryAddress: user?.address || '',
    deliveryNotes: '',
    scheduledTime: '',
    paymentMethod: 'gcash',
    receiptReference: '',
    receiptFile: null,
    receiptPreview: null,
  });

  const promoStatus = getFreeShippingStatus();

  // Load initial settings & municipalities
  useEffect(() => {
    if (!isAuthenticated) {
      toast('Please sign in before checking out.', { icon: '🔐' });
      router.push('/login?redirect=/checkout');
      return;
    }
    if (items.length === 0) {
      router.push('/shop');
      return;
    }

    settingsAPI.get()
      .then(({ data }) => {
        const remoteQrs = data.settings?.qr_codes || {};
        setQrCodes((prev) => ({
          ...prev,
          ...remoteQrs,
        }));
      })
      .catch(() => {});

    locationsAPI.getMunicipalities()
      .then(({ data }) => {
        const list = data.municipalities || [];
        setMunicipalities(list);
        if (list.length > 0) {
          // Default to San Juan or Bangued
          const defaultMun = list.find(m => m.name.toLowerCase().includes('san juan')) || list[0];
          setSelectedMunicipalityId(String(defaultMun.id));
          setBaseDeliveryFee(parseFloat(defaultMun.deliveryFee || 50.00));
        }
      })
      .catch(() => {});
  }, [items, isAuthenticated, router]);

  // Load barangays when municipality changes
  useEffect(() => {
    if (!selectedMunicipalityId) return;

    const mun = municipalities.find(m => String(m.id) === String(selectedMunicipalityId));
    if (mun) {
      setBaseDeliveryFee(parseFloat(mun.deliveryFee || 50.00));
    }

    locationsAPI.getBarangays(selectedMunicipalityId)
      .then(({ data }) => {
        const list = data.barangays || [];
        setBarangays(list);
        if (list.length > 0) {
          setSelectedBarangayId(String(list[0].id));
        } else {
          setSelectedBarangayId('');
        }
      })
      .catch(() => {
        setBarangays([]);
      });
  }, [selectedMunicipalityId, municipalities]);

  // Update delivery fee if barangay has custom fee
  useEffect(() => {
    if (!selectedBarangayId) return;
    const b = barangays.find(item => String(item.id) === String(selectedBarangayId));
    if (b && b.customDeliveryFee) {
      setBaseDeliveryFee(parseFloat(b.customDeliveryFee));
    }
  }, [selectedBarangayId, barangays]);

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleReceiptUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      updateForm('receiptFile', file);
      const reader = new FileReader();
      reader.onloadend = () => updateForm('receiptPreview', reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Automated Free Shipping Promo Calculation
  const isFreeShipping = form.deliveryMethod === 'pickup' || promoStatus.isFree;
  const shippingFee = isFreeShipping ? 0 : baseDeliveryFee;
  const subtotal = getSubtotal();
  const grandTotal = subtotal + shippingFee;

  const canProceed = () => {
    if (step === 0) {
      if (form.deliveryMethod === 'delivery') {
        if (!selectedMunicipalityId || !selectedBarangayId) return false;
        if (!form.deliveryAddress.trim() && !form.deliveryNotes.trim()) return false;
      }
      return true;
    }
    if (step === 1) return true;
    if (step === 2) {
      if (checkoutMode === 'manual_qr') {
        return !!form.receiptFile;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 0 && form.deliveryMethod === 'delivery') {
      if (!form.deliveryAddress.trim() && !form.deliveryNotes.trim()) {
        toast.error('Please enter a delivery address or location landmark.');
        return;
      }
    }
    if (step === 2 && checkoutMode === 'manual_qr' && !form.receiptFile) {
      toast.error('Please upload your payment screenshot/receipt.');
      return;
    }
    setStep((prev) => Math.min(STEPS.length - 1, prev + 1));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(0, prev - 1));
  };

  const handleSubmitOrder = async () => {
    setSubmitting(true);
    try {
      let receiptUrl = null;

      // 1. If manual QR mode, attach screenshot (using instant preview base64 or upload)
      if (checkoutMode === 'manual_qr') {
        if (form.receiptPreview) {
          receiptUrl = form.receiptPreview;
        } else if (form.receiptFile) {
          try {
            const { data: uploadRes } = await uploadAPI.uploadImage(form.receiptFile, 'receipts');
            receiptUrl = uploadRes.url;
          } catch {
            receiptUrl = 'Uploaded Screenshot (Pending Review)';
          }
        }
      }

      const selectedMun = municipalities.find(m => String(m.id) === String(selectedMunicipalityId));
      const selectedBar = barangays.find(b => String(b.id) === String(selectedBarangayId));

      const locationDetails = form.deliveryMethod === 'delivery'
        ? `${selectedBar?.name || ''}, ${selectedMun?.name || ''}, Abra`
        : 'Store Pickup (Poblacion, San Juan, Abra)';

      // 2. Submit order payload to backend
      const payload = {
        customerName: user?.name || form.name || 'Customer',
        customerEmail: user?.email || '',
        customerPhone: form.phone || user?.phone || '',
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.name,
          quantity: i.quantity,
          flavor: i.flavor,
          size: i.size,
          customizationPayload: i.customizationPayload,
        })),
        deliveryMethod: form.deliveryMethod,
        municipalityId: form.deliveryMethod === 'delivery' ? parseInt(selectedMunicipalityId) : null,
        barangayId: form.deliveryMethod === 'delivery' ? parseInt(selectedBarangayId) : null,
        deliveryAddress: `${form.deliveryAddress} - [${locationDetails}]`,
        deliveryNotes: form.deliveryNotes,
        scheduledTime: form.scheduledTime || null,
        paymentMethod: checkoutMode === 'cash' ? 'cash' : form.paymentMethod,
        paymentReceiptUrl: receiptUrl,
      };

      const res = await ordersAPI.create(payload);
      const serverOrder = res.data?.order;
      const orderRecord = {
        ...(serverOrder || {}),
        id: serverOrder?.id || (Date.now() + Math.floor(Math.random() * 1000)),
        userId: user?.id || 1,
        customerName: user?.name || form.name || 'Customer',
        customerEmail: user?.email || '',
        customerPhone: form.phone || user?.phone || '',
        status: serverOrder?.status || 'pending',
        subtotal: serverOrder?.subtotal || getSubtotal().toFixed(2),
        shippingFee: serverOrder?.shippingFee || '0.00',
        total: serverOrder?.total || (getSubtotal() + (form.deliveryMethod === 'delivery' ? baseDeliveryFee : 0)).toFixed(2),
        deliveryMethod: payload.deliveryMethod,
        deliveryAddress: payload.deliveryAddress,
        deliveryNotes: payload.deliveryNotes,
        scheduledTime: payload.scheduledTime,
        paymentMethod: payload.paymentMethod,
        paymentReceiptUrl: payload.paymentReceiptUrl,
        paymentConfirmed: false,
        items: serverOrder?.items || payload.items,
        createdAt: serverOrder?.createdAt || new Date().toISOString(),
      };
      try {
        const stored = JSON.parse(localStorage.getItem('jpop_persisted_orders') || '[]');
        const filtered = stored.filter(o => String(o.id) !== String(orderRecord.id));
        filtered.unshift(orderRecord);
        localStorage.setItem('jpop_persisted_orders', JSON.stringify(filtered));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('jpop_order_updated'));
        }
      } catch {}

      clearCart();

      toast.success('🎉 Order placed successfully! We will prepare your snacks fresh! 🍿');
      router.push('/profile');
    } catch (err) {
      console.error('Order submission error:', err);
      toast.error(err.response?.data?.error || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeQr = qrCodes[form.paymentMethod];

  return (
    <div className="page checkout-page container">
      <div className="checkout-container">
        {/* Progress Bar */}
        <div className="checkout-steps">
          {STEPS.map((s, idx) => (
            <div
              key={s}
              className={`checkout-step-pill ${
                idx === step ? 'checkout-step-pill--active' : idx < step ? 'checkout-step-pill--completed' : ''
              }`}
            >
              <span className="step-num">{idx < step ? '✓' : idx + 1}</span>
              <span className="step-label">{s}</span>
            </div>
          ))}
        </div>

        {/* Free Shipping Alert Banner */}
        {promoStatus.isFree ? (
          <div style={{
            background: '#27ae60',
            color: '#ffffff',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 700,
          }}>
            <FiTruck size={22} />
            <span>🎉 FREE SHIPPING PROMO ACTIVE! Shipping fee is waived to ₱0.00!</span>
          </div>
        ) : form.deliveryMethod === 'delivery' ? (
          <div style={{
            background: 'var(--bg-subtle)',
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.86rem',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <FiTruck color="var(--color-primary)" size={18} />
            <span>
              Buy <strong>5+ 1kg popcorn</strong> or <strong>10+ 500g popcorn</strong> to unlock 100% Free Shipping!
            </span>
          </div>
        ) : null}

        <div className="checkout-card">
          <div className="checkout-card__body">
            {/* ─── STEP 0: Delivery Method & Area ─── */}
            {step === 0 && (
              <div>
                <h3 style={{ marginBottom: '16px' }}>Choose Delivery or Pickup</h3>

                <div className="delivery-method-grid">
                  <div
                    className={`method-option ${form.deliveryMethod === 'delivery' ? 'method-option--active' : ''}`}
                    onClick={() => updateForm('deliveryMethod', 'delivery')}
                  >
                    <FiTruck size={28} color="var(--color-primary)" />
                    <h4>Abra Direct Delivery</h4>
                    <p className="text-muted">Direct doorstep delivery across all 27 Abra Municipalities.</p>
                  </div>

                  <div
                    className={`method-option ${form.deliveryMethod === 'pickup' ? 'method-option--active' : ''}`}
                    onClick={() => updateForm('deliveryMethod', 'pickup')}
                  >
                    <FiMapPin size={28} color="var(--color-primary)" />
                    <h4>Store Pickup (₱0)</h4>
                    <p className="text-muted">Poblacion, San Juan, Abra. Prep time: 15–30 mins fresh!</p>
                  </div>
                </div>

                {form.deliveryMethod === 'delivery' && (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                      {/* Municipality Dropdown */}
                      <div>
                        <label className="form-label">Abra Municipality (27 Municipalities):</label>
                        <select
                          className="form-input"
                          value={selectedMunicipalityId}
                          onChange={(e) => setSelectedMunicipalityId(e.target.value)}
                        >
                          {municipalities.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} (Delivery: ₱{parseFloat(m.deliveryFee).toFixed(2)})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Barangay Dropdown */}
                      <div>
                        <label className="form-label">Barangay:</label>
                        <select
                          className="form-input"
                          value={selectedBarangayId}
                          onChange={(e) => setSelectedBarangayId(e.target.value)}
                        >
                          {barangays.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} {b.customDeliveryFee ? `(₱${b.customDeliveryFee})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">House / Street Address / Landmark</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., Zone 2, Near Municipal Hall, Yellow Gate"
                        value={form.deliveryAddress}
                        onChange={(e) => updateForm('deliveryAddress', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Special Delivery Instructions / Contact Note (Optional)</label>
                      <textarea
                        className="form-input"
                        rows="2"
                        placeholder="e.g., Call upon arrival, leave with security guard, etc."
                        value={form.deliveryNotes}
                        onChange={(e) => updateForm('deliveryNotes', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {form.deliveryMethod === 'pickup' && (
                  <div style={{
                    marginTop: '20px',
                    padding: '16px',
                    background: 'var(--bg-subtle)',
                    borderRadius: '8px',
                    borderLeft: '4px solid var(--color-primary)',
                  }}>
                    <strong style={{ display: 'block', marginBottom: '6px' }}>📍 Pickup Instructions:</strong>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      Location: <strong>J-Pop Corner Main Counter, Poblacion, San Juan, Abra</strong>.<br />
                      Orders are prepared fresh in 15–30 minutes. You can pick up anytime during our operating hours (9:00 AM – 8:00 PM).
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ─── STEP 1: Schedule Time ─── */}
            {step === 1 && (
              <div>
                <h3 style={{ marginBottom: '16px' }}>Preferred Fulfillment Schedule</h3>
                <p className="text-muted" style={{ marginBottom: '20px' }}>
                  Our store pops and fries fresh snacks Monday to Saturday, 9:00 AM to 8:00 PM.
                </p>

                <div className="form-group">
                  <label className="form-label">Select Date & Time (Optional for future scheduling)</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={form.scheduledTime}
                    onChange={(e) => updateForm('scheduledTime', e.target.value)}
                  />
                  <small className="text-muted" style={{ marginTop: '4px', display: 'block' }}>
                    Leave blank for earliest standard preparation (approx. 20–45 mins).
                  </small>
                </div>
              </div>
            )}

            {/* ─── STEP 2: Modular Payment Mode ─── */}
            {step === 2 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3>Select Payment Mode</h3>
                  <button
                    type="button"
                    onClick={() => setShowTierInfo(!showTierInfo)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <FiInfo /> PH Payment Tiers
                  </button>
                </div>

                {/* PH Payment Tiers Drawer / Comparison */}
                {showTierInfo && (
                  <div style={{
                    background: 'var(--bg-subtle)',
                    padding: '14px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '0.82rem',
                    border: '1px solid var(--border-color)',
                  }}>
                    <strong style={{ display: 'block', marginBottom: '8px' }}>🇵🇭 Philippine Payment Gateway Comparison (2026):</strong>
                    {PHILIPPINE_PAYMENT_TIERS.map((tier) => (
                      <div key={tier.tier} style={{ marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px dashed var(--border-color)' }}>
                        <strong>{tier.tier}: {tier.name}</strong> ({tier.monthlyFee})<br />
                        <span className="text-muted">{tier.description}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2 Streamlined Payment Modes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                  <button
                    type="button"
                    className={`method-option ${checkoutMode === 'cash' ? 'method-option--active' : ''}`}
                    onClick={() => setCheckoutMode('cash')}
                    style={{
                      padding: '18px 14px',
                      textAlign: 'center',
                      borderRadius: '16px',
                      border: checkoutMode === 'cash' ? '2px solid #FFD32A' : '1px solid var(--border-color)',
                      background: checkoutMode === 'cash' ? 'var(--color-primary-subtle, #2A1818)' : 'var(--bg-surface-elevated, #1E1918)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <FiDollarSign size={28} color="#FFD32A" style={{ margin: '0 auto 8px', display: 'block' }} />
                    <strong style={{ fontSize: '0.98rem', display: 'block', color: 'var(--text-primary)' }}>💵 Cash</strong>
                    <p style={{ fontSize: '0.78rem', margin: '4px 0 0', color: 'var(--text-muted)' }}>COD or Store Pickup</p>
                  </button>

                  <button
                    type="button"
                    className={`method-option ${checkoutMode === 'manual_qr' ? 'method-option--active' : ''}`}
                    onClick={() => setCheckoutMode('manual_qr')}
                    style={{
                      padding: '18px 14px',
                      textAlign: 'center',
                      borderRadius: '16px',
                      border: checkoutMode === 'manual_qr' ? '2px solid #FFD32A' : '1px solid var(--border-color)',
                      background: checkoutMode === 'manual_qr' ? 'var(--color-primary-subtle, #2A1818)' : 'var(--bg-surface-elevated, #1E1918)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <FiUpload size={28} color="#FFD32A" style={{ margin: '0 auto 8px', display: 'block' }} />
                    <strong style={{ fontSize: '0.98rem', display: 'block', color: 'var(--text-primary)' }}>📱 Scan QR Ph</strong>
                    <p style={{ fontSize: '0.78rem', margin: '4px 0 0', color: 'var(--text-muted)' }}>GCash, Maya, InstaPay</p>
                  </button>
                </div>

                {/* Mode 1: Cash Details */}
                {checkoutMode === 'cash' && (
                  <div style={{ padding: '20px', background: 'var(--bg-subtle, #2A2220)', border: '1px solid var(--border-color, #3D3230)', borderRadius: '16px' }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: '1rem', color: '#FFD32A' }}>💵 Cash on Delivery / Store Pickup</h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary, #D6CBC0)', lineHeight: 1.5 }}>
                      You can pay in cash upon receiving your delivery at your doorstep or when picking up your snacks at the store. Exact change is greatly appreciated!
                    </p>
                  </div>
                )}

                {/* Mode 2: QR Code Scan & Receipt Upload */}
                {checkoutMode === 'manual_qr' && (
                  <div style={{ padding: '20px', background: 'var(--bg-subtle, #2A2220)', border: '1px solid var(--border-color, #3D3230)', borderRadius: '16px' }}>
                    <label className="form-label" style={{ marginBottom: '12px', display: 'block', fontWeight: 700 }}>
                      1. Select Your Payment App / Bank to Scan:
                    </label>

                    {/* Method Tabs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                      {[
                        { id: 'gcash', label: 'GCash', color: '#007DFE' },
                        { id: 'maya', label: 'Maya', color: '#00D632' },
                        { id: 'instapay', label: 'InstaPay', color: '#9B51E0' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => updateForm('paymentMethod', tab.id)}
                          style={{
                            padding: '12px 8px',
                            borderRadius: '12px',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            border: form.paymentMethod === tab.id ? `2px solid ${tab.color}` : '1px solid var(--border-color)',
                            backgroundColor: form.paymentMethod === tab.id ? tab.color : 'var(--bg-surface-elevated, #1E1918)',
                            color: form.paymentMethod === tab.id ? '#FFFFFF' : 'var(--text-primary)',
                            boxShadow: form.paymentMethod === tab.id ? `0 4px 12px ${tab.color}40` : 'none',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* QR Display Card */}
                    {activeQr && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        padding: '24px 16px',
                        background: 'var(--bg-surface-elevated, #1E1918)',
                        border: '1px solid var(--border-color, #3D3230)',
                        borderRadius: '16px',
                        marginBottom: '20px',
                      }}>
                        <div style={{
                          background: '#FFFFFF',
                          padding: '14px',
                          borderRadius: '16px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                          display: 'inline-block',
                          marginBottom: '16px',
                          maxWidth: '320px',
                          width: '100%',
                        }}>
                          <img
                            src={activeQr.imageUrl ? formatImageUrl(activeQr.imageUrl) : `/qr/${form.paymentMethod || 'gcash'}.png`}
                            onError={(e) => {
                              const exts = ['.png', '.jpg', '.jpeg', '.webp'];
                              const method = (form.paymentMethod || 'gcash').toLowerCase();
                              const currentSrc = e.currentTarget.getAttribute('src') || e.currentTarget.src || '';
                              const currentExtIndex = exts.findIndex(ext => currentSrc.toLowerCase().includes(`${method}${ext}`));
                              const nextExt = exts[currentExtIndex + 1];
                              if (nextExt) {
                                e.currentTarget.src = `/qr/${method}${nextExt}`;
                              }
                            }}
                            alt={`${activeQr.label} QR`}
                            style={{ width: '100%', height: 'auto', maxHeight: '420px', display: 'block', borderRadius: '10px', objectFit: 'contain', margin: '0 auto' }}
                          />
                        </div>

                        <div style={{ fontSize: '0.92rem', lineHeight: 1.6 }}>
                          <p style={{ margin: '0 0 4px', color: 'var(--text-secondary)' }}>
                            <strong>Account Name:</strong> <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{activeQr.accountName}</span>
                          </p>
                          <p style={{ margin: '0 0 6px', color: 'var(--text-secondary)' }}>
                            <strong>Account Number:</strong>{' '}
                            <span style={{ color: '#FFD32A', fontWeight: 800, letterSpacing: '0.5px' }}>{activeQr.accountNumber}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(activeQr.accountNumber);
                                toast.success('Account number copied to clipboard!');
                              }}
                              style={{
                                marginLeft: '8px',
                                padding: '2px 8px',
                                fontSize: '0.74rem',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-subtle)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                              }}
                            >
                              📋 Copy
                            </button>
                          </p>
                          <div style={{ marginTop: '8px', padding: '8px 16px', background: 'rgba(255, 211, 42, 0.1)', border: '1px solid rgba(255, 211, 42, 0.3)', borderRadius: '8px' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>Amount to Transfer: </span>
                            <strong style={{ color: '#FFD32A', fontSize: '1.2rem', fontWeight: 900 }}>₱{grandTotal.toFixed(2)}</strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Screenshot Upload Requirement */}
                    <div className="form-group mt-md">
                      <label className="form-label" style={{ fontWeight: 700, color: '#FFD32A' }}>
                        2. Upload Payment Receipt Screenshot <span style={{ color: 'var(--color-danger)' }}>*</span>
                      </label>
                      <label
                        style={{
                          border: '2px dashed var(--border-color, #443634)',
                          borderRadius: '14px',
                          padding: '24px 16px',
                          textAlign: 'center',
                          backgroundColor: 'var(--bg-surface-elevated, #1E1918)',
                          cursor: 'pointer',
                          display: 'block',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleReceiptUpload}
                          style={{ display: 'none' }}
                        />
                        <FiUpload size={32} color="#FFD32A" style={{ margin: '0 auto 8px', display: 'block' }} />
                        <strong style={{ display: 'block', fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                          {form.receiptFile ? '✅ Receipt Selected: ' + form.receiptFile.name : 'Click to select payment screenshot'}
                        </strong>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                          PNG, JPG, or screenshot from your mobile banking app
                        </p>
                      </label>

                      {form.receiptPreview && (
                        <div style={{ textAlign: 'center', marginTop: '14px' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Receipt Preview:</span>
                          <img
                            src={form.receiptPreview}
                            alt="Receipt Preview"
                            style={{ maxHeight: '200px', borderRadius: '10px', display: 'block', margin: '8px auto', border: '2px solid #FFD32A' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── STEP 3: Review & Final Confirmation ─── */}
            {step === 3 && (
              <div>
                <h3 style={{ marginBottom: '16px' }}>Review Your Order</h3>

                <div style={{ marginBottom: '20px', padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <strong>Method:</strong> {form.deliveryMethod === 'pickup' ? 'Store Pickup (Poblacion, San Juan)' : 'Doorstep Delivery'}
                  </div>
                  {form.deliveryMethod === 'delivery' && (
                    <div>
                      <strong>Location:</strong> {form.deliveryAddress}
                    </div>
                  )}
                  {form.scheduledTime && (
                    <div><strong>Scheduled:</strong> {new Date(form.scheduledTime).toLocaleString()}</div>
                  )}
                  <div>
                    <strong>Payment Mode:</strong> {checkoutMode === 'cash' ? '💵 Cash on Delivery / Store Pickup' : `📱 QR Ph (${form.paymentMethod.toUpperCase()})`}
                  </div>
                </div>

                <h4 style={{ marginBottom: '12px' }}>Items ({items.length})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  {items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem' }}>
                      <span>
                        <strong>{item.name}</strong> {item.size ? `(${item.size})` : ''} {item.flavor ? `— ${item.flavor}` : ''} × {item.quantity}
                      </span>
                      <strong>₱{(item.price * item.quantity).toFixed(2)}</strong>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Subtotal:</span>
                    <span>₱{subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Delivery Fee:</span>
                    <span style={{ color: isFreeShipping ? '#27ae60' : 'inherit', fontWeight: isFreeShipping ? 700 : 400 }}>
                      {isFreeShipping ? 'FREE PROMO (₱0.00)' : `₱${shippingFee.toFixed(2)}`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                    <span>Grand Total:</span>
                    <span>₱{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="checkout-nav-actions">
              {step > 0 ? (
                <button type="button" className="btn btn-outline" onClick={handleBack}>
                  <FiChevronLeft /> Back
                </button>
              ) : <div />}

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  className="btn btn-accent"
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  Continue <FiChevronRight />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={handleSubmitOrder}
                  disabled={submitting}
                >
                  {submitting ? 'Placing Order...' : 'Confirm & Place Order 🍿'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

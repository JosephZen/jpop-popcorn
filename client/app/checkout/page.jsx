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
import { ordersAPI, uploadAPI, settingsAPI, locationsAPI } from '../../src/services/api';
import { PHILIPPINE_PAYMENT_TIERS, initiateThirdPartyCheckout } from '../../src/lib/payment-gateway';
import toast from 'react-hot-toast';
import '../../src/pages/CheckoutPage.css';

const STEPS = ['Delivery & Area', 'Schedule Time', 'Payment Mode', 'Review & Confirm'];

export default function CheckoutPage() {
  const { user, isAuthenticated } = useAuth();
  const { items, getSubtotal, clearCart, getFreeShippingStatus } = useCartStore();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [qrCodes, setQrCodes] = useState({});

  // Locations state
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState('');
  const [selectedBarangayId, setSelectedBarangayId] = useState('');
  const [baseDeliveryFee, setBaseDeliveryFee] = useState(50.00);

  // Payment mode: 'cash' | 'manual_qr' | 'automated_gateway'
  const [checkoutMode, setCheckoutMode] = useState('manual_qr');
  const [gatewayProvider, setGatewayProvider] = useState('paymongo');
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
        setQrCodes(data.settings?.qr_codes || {});
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

      // 1. If manual QR mode, upload screenshot
      if (checkoutMode === 'manual_qr' && form.receiptFile) {
        const { data: uploadRes } = await uploadAPI.uploadImage(form.receiptFile, 'receipts');
        receiptUrl = uploadRes.url;
      } else if (checkoutMode === 'automated_gateway') {
        const gatewayRes = await initiateThirdPartyCheckout({
          gateway: gatewayProvider,
          amount: grandTotal,
          orderId: `ORD-${Date.now()}`,
          customer: user,
        });
        receiptUrl = `GATEWAY:${gatewayProvider.toUpperCase()}:${gatewayRes.referenceId}`;
      }

      const selectedMun = municipalities.find(m => String(m.id) === String(selectedMunicipalityId));
      const selectedBar = barangays.find(b => String(b.id) === String(selectedBarangayId));

      const locationDetails = form.deliveryMethod === 'delivery'
        ? `${selectedBar?.name || ''}, ${selectedMun?.name || ''}, Abra`
        : 'Store Pickup (Poblacion, San Juan, Abra)';

      // 2. Submit order payload to backend
      const payload = {
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
        paymentMethod: checkoutMode === 'cash' ? 'cash' : checkoutMode === 'automated_gateway' ? gatewayProvider : form.paymentMethod,
        paymentReceiptUrl: receiptUrl,
      };

      await ordersAPI.create(payload);
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

                {/* 3 Checkout Modes */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                  <button
                    type="button"
                    className={`method-option ${checkoutMode === 'cash' ? 'method-option--active' : ''}`}
                    onClick={() => setCheckoutMode('cash')}
                    style={{ padding: '14px 10px', textAlign: 'center' }}
                  >
                    <FiDollarSign size={24} color="var(--color-primary)" style={{ margin: '0 auto 6px' }} />
                    <strong style={{ fontSize: '0.88rem' }}>Cash</strong>
                    <p className="text-muted" style={{ fontSize: '0.74rem', margin: 0 }}>COD or Cash on Pickup</p>
                  </button>

                  <button
                    type="button"
                    className={`method-option ${checkoutMode === 'manual_qr' ? 'method-option--active' : ''}`}
                    onClick={() => setCheckoutMode('manual_qr')}
                    style={{ padding: '14px 10px', textAlign: 'center' }}
                  >
                    <FiUpload size={24} color="var(--color-primary)" style={{ margin: '0 auto 6px' }} />
                    <strong style={{ fontSize: '0.88rem' }}>Manual QR Upload</strong>
                    <p className="text-muted" style={{ fontSize: '0.74rem', margin: 0 }}>GCash, Maya, InstaPay</p>
                  </button>

                  <button
                    type="button"
                    className={`method-option ${checkoutMode === 'automated_gateway' ? 'method-option--active' : ''}`}
                    onClick={() => setCheckoutMode('automated_gateway')}
                    style={{ padding: '14px 10px', textAlign: 'center' }}
                  >
                    <FiCreditCard size={24} color="var(--color-primary)" style={{ margin: '0 auto 6px' }} />
                    <strong style={{ fontSize: '0.88rem' }}>Automated Gateway</strong>
                    <p className="text-muted" style={{ fontSize: '0.74rem', margin: 0 }}>PayMongo / HitPay</p>
                  </button>
                </div>

                {/* Mode 1: Cash Details */}
                {checkoutMode === 'cash' && (
                  <div style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
                    <strong>💵 Cash Selected:</strong>
                    <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                      You can pay in cash upon receiving your delivery or when picking up your freshly popped snacks at the counter. Exact change is appreciated!
                    </p>
                  </div>
                )}

                {/* Mode 2: Manual QR Code Upload */}
                {checkoutMode === 'manual_qr' && (
                  <div>
                    {/* Method Tabs */}
                    <div className="payment-methods-tabs" style={{ marginBottom: '14px' }}>
                      {['gcash', 'maya', 'instapay'].map((method) => (
                        <button
                          key={method}
                          type="button"
                          className={`payment-tab ${form.paymentMethod === method ? 'payment-tab--active' : ''}`}
                          onClick={() => updateForm('paymentMethod', method)}
                        >
                          {method.toUpperCase()}
                        </button>
                      ))}
                    </div>

                    {/* QR Display */}
                    {activeQr && (
                      <div className="qr-container">
                        <img src={activeQr.imageUrl} alt={`${activeQr.label} QR`} className="qr-image" />
                        <div className="qr-details">
                          <p><strong>Account Name:</strong> {activeQr.accountName}</p>
                          <p><strong>Account Number:</strong> {activeQr.accountNumber}</p>
                          <p><strong>Amount to Transfer:</strong> <span style={{ color: 'var(--color-primary)', fontWeight: 800 }}>₱{grandTotal.toFixed(2)}</span></p>
                        </div>
                      </div>
                    )}

                    <div className="form-group mt-md">
                      <label className="form-label">Upload Payment Receipt Screenshot (Required for QR mode)</label>
                      <label className="receipt-upload-box">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleReceiptUpload}
                          style={{ display: 'none' }}
                        />
                        <FiUpload size={32} color="var(--color-primary)" style={{ margin: '0 auto 8px', display: 'block' }} />
                        <strong>Click to select payment screenshot</strong>
                        <p className="text-muted" style={{ fontSize: '0.82rem' }}>PNG, JPG, WEBP up to 10MB</p>
                      </label>

                      {form.receiptPreview && (
                        <div style={{ textAlign: 'center', marginTop: '14px' }}>
                          <span className="text-muted" style={{ fontSize: '0.85rem' }}>Receipt Preview:</span>
                          <img src={form.receiptPreview} alt="Receipt Preview" className="receipt-preview-img" style={{ maxHeight: '180px', borderRadius: '8px', display: 'block', margin: '6px auto' }} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Mode 3: Automated Payment Gateway */}
                {checkoutMode === 'automated_gateway' && (
                  <div style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
                    <label className="form-label">Select Payment Gateway Provider:</label>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                      <button
                        type="button"
                        className={`btn ${gatewayProvider === 'paymongo' ? 'btn-primary' : 'btn-outline'} btn-sm`}
                        onClick={() => setGatewayProvider('paymongo')}
                      >
                        PayMongo (QR Ph, Maya, GCash, Cards)
                      </button>
                      <button
                        type="button"
                        className={`btn ${gatewayProvider === 'hitpay' ? 'btn-primary' : 'btn-outline'} btn-sm`}
                        onClick={() => setGatewayProvider('hitpay')}
                      >
                        HitPay PH (Fast Settlement)
                      </button>
                    </div>

                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                      You will be securely redirected to complete your payment of <strong>₱{grandTotal.toFixed(2)}</strong> via {gatewayProvider.toUpperCase()} upon order confirmation.
                    </p>
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
                    <strong>Payment Mode:</strong> {checkoutMode === 'cash' ? 'Cash on Delivery/Pickup' : checkoutMode === 'automated_gateway' ? `Automated Gateway (${gatewayProvider.toUpperCase()})` : `Manual QR (${form.paymentMethod.toUpperCase()})`}
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

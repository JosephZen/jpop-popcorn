"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiTruck, FiMapPin, FiClock, FiCreditCard, FiUpload, FiCheck, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../../src/features/auth/AuthContext';
import useCartStore from '../../src/store/cartStore';
import { ordersAPI, uploadAPI, settingsAPI } from '../../src/services/api';
import toast from 'react-hot-toast';
import '../../src/pages/CheckoutPage.css';

const STEPS = ['Delivery Method', 'Schedule Time', 'QR Payment & Receipt', 'Review & Confirm'];

export default function CheckoutPage() {
  const { user, isAuthenticated } = useAuth();
  const { items, getSubtotal, getShippingFee, getGrandTotal, clearCart } = useCartStore();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [qrCodes, setQrCodes] = useState({});

  const [form, setForm] = useState({
    deliveryMethod: 'delivery',
    deliveryAddress: user?.address || '',
    deliveryNotes: '',
    scheduledTime: '',
    paymentMethod: 'gcash',
    receiptFile: null,
    receiptPreview: null,
  });

  // Redirect if cart is empty or not logged in
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
  }, [items, isAuthenticated, router]);

  useEffect(() => {
    if (user?.address && !form.deliveryAddress) {
      setForm((prev) => ({ ...prev, deliveryAddress: user.address }));
    }
  }, [user]);

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

  const subtotal = getSubtotal();
  const shippingFee = getShippingFee(form.deliveryMethod);
  const grandTotal = getGrandTotal(form.deliveryMethod);

  const canProceed = () => {
    if (step === 0) {
      if (form.deliveryMethod === 'delivery' && !form.deliveryAddress.trim() && !form.deliveryNotes.trim()) {
        return false;
      }
      return true;
    }
    if (step === 1) {
      return true; // Scheduled time optional/flexible
    }
    if (step === 2) {
      return !!form.receiptFile;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 0 && form.deliveryMethod === 'delivery' && !form.deliveryAddress.trim() && !form.deliveryNotes.trim()) {
      toast.error('Please enter a delivery address or location notes.');
      return;
    }
    if (step === 2 && !form.receiptFile) {
      toast.error('Please upload your payment screenshot/receipt.');
      return;
    }
    setStep((prev) => Math.min(STEPS.length - 1, prev + 1));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(0, prev - 1));
  };

  const handleSubmitOrder = async () => {
    if (!form.receiptFile) {
      toast.error('Payment receipt is required.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Upload receipt image
      const { data: uploadRes } = await uploadAPI.uploadImage(form.receiptFile, 'receipts');

      // 2. Submit order payload
      await ordersAPI.create({
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          flavor: i.flavor,
        })),
        deliveryMethod: form.deliveryMethod,
        deliveryAddress: form.deliveryAddress,
        deliveryNotes: form.deliveryNotes,
        scheduledTime: form.scheduledTime || null,
        paymentMethod: form.paymentMethod,
        paymentReceiptUrl: uploadRes.url,
      });

      clearCart();
      toast.success('Order placed successfully! We will pop your popcorn fresh! 🍿');
      router.push('/profile');
    } catch (err) {
      console.error('Order submission error:', err);
      toast.error(err.response?.data?.error || 'Failed to submit order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentQr = qrCodes[form.paymentMethod] || {
    label: form.paymentMethod.toUpperCase(),
    accountName: 'Joseph Zen Castro',
    accountNumber: '0912-345-6789',
    imageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=JPOP-${form.paymentMethod.toUpperCase()}`,
  };

  return (
    <div className="page checkout-page">
      <div className="container container-sm">
        <h1 className="page-title text-center" style={{ marginBottom: '12px' }}>
          Checkout 🍿
        </h1>

        {/* Step Wizard Progress */}
        <div className="checkout-steps">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`checkout-step ${i === step ? 'checkout-step--active' : ''} ${i < step ? 'checkout-step--done' : ''}`}
            >
              <div className="checkout-step__num">
                {i < step ? <FiCheck size={14} /> : i + 1}
              </div>
              <span>{s}</span>
            </div>
          ))}
        </div>

        <div className="card animate-fade-in-up">
          <div className="card-body">
            {/* ─── STEP 0: Delivery Method & Address ─── */}
            {step === 0 && (
              <div>
                <h3 style={{ marginBottom: '16px' }}>Choose Delivery or Pickup</h3>
                <div className="checkout-methods">
                  <label className={`checkout-method ${form.deliveryMethod === 'delivery' ? 'checkout-method--active' : ''}`}>
                    <input
                      type="radio"
                      name="delivery"
                      value="delivery"
                      checked={form.deliveryMethod === 'delivery'}
                      onChange={() => updateForm('deliveryMethod', 'delivery')}
                    />
                    <FiTruck size={28} color="var(--color-primary)" />
                    <strong>Doorstep Delivery</strong>
                    <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                      Fast delivery to your home or office
                    </span>
                  </label>

                  <label className={`checkout-method ${form.deliveryMethod === 'pickup' ? 'checkout-method--active' : ''}`}>
                    <input
                      type="radio"
                      name="delivery"
                      value="pickup"
                      checked={form.deliveryMethod === 'pickup'}
                      onChange={() => updateForm('deliveryMethod', 'pickup')}
                    />
                    <FiMapPin size={28} color="var(--color-accent-dark)" />
                    <strong>Store Pickup</strong>
                    <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                      Pick up hot & fresh at our counter (FREE)
                    </span>
                  </label>
                </div>

                {form.deliveryMethod === 'delivery' && (
                  <div>
                    <div className="form-group">
                      <label className="form-label">
                        Delivery Address {user?.address ? '(Loaded from Profile)' : '(Required)'}
                      </label>
                      <textarea
                        className="form-textarea"
                        placeholder="House / Unit No., Street, Barangay, City, Postal Code..."
                        value={form.deliveryAddress}
                        onChange={(e) => updateForm('deliveryAddress', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Delivery Notes / Landmarks (Optional)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Near town hall, gate code, leave at reception..."
                        value={form.deliveryNotes}
                        onChange={(e) => updateForm('deliveryNotes', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── STEP 1: Scheduled Time ─── */}
            {step === 1 && (
              <div>
                <h3 style={{ marginBottom: '16px' }}>Schedule Preferred Time</h3>
                <p className="text-muted" style={{ marginBottom: '20px' }}>
                  Let us know when you would like your popcorn prepared and {form.deliveryMethod === 'pickup' ? 'ready for pickup' : 'dispatched for delivery'}.
                </p>

                <div className="form-group">
                  <label className="form-label">Date & Time</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={form.scheduledTime}
                    onChange={(e) => updateForm('scheduledTime', e.target.value)}
                  />
                  <small className="text-muted" style={{ display: 'block', marginTop: '6px' }}>
                    Leave blank for earliest possible preparation (ASAP).
                  </small>
                </div>
              </div>
            )}

            {/* ─── STEP 2: QR Payment & Receipt Upload ─── */}
            {step === 2 && (
              <div>
                <h3 style={{ marginBottom: '16px' }}>Cashless QR Payment</h3>
                <p className="text-muted">
                  Select your e-wallet / bank below, scan the owner's QR code to send <strong>₱{grandTotal.toFixed(2)}</strong>, and upload your confirmation screenshot.
                </p>

                <div style={{ display: 'flex', gap: '10px', margin: '16px 0' }}>
                  {['gcash', 'maya', 'instapay'].map((pm) => (
                    <button
                      key={pm}
                      type="button"
                      className={`btn ${form.paymentMethod === pm ? 'btn-primary' : 'btn-outline'} btn-sm`}
                      onClick={() => updateForm('paymentMethod', pm)}
                    >
                      {pm.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="qr-payment-box">
                  <img
                    src={currentQr.imageUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=JPOP-${form.paymentMethod}`}
                    alt="Payment QR Code"
                    className="qr-payment-image"
                  />
                  <div className="qr-payment-details">
                    <div><strong>Account Name:</strong> {currentQr.accountName || 'Joseph Zen Castro'}</div>
                    <div><strong>Account / Mobile:</strong> {currentQr.accountNumber || '0912-345-6789'}</div>
                    <div style={{ marginTop: '6px', color: 'var(--color-primary)', fontWeight: 800 }}>
                      Amount to Pay: ₱{grandTotal.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Receipt Upload */}
                <div className="form-group">
                  <label className="form-label">Upload Payment Receipt Screenshot (Required)</label>
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
                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                      <span className="text-muted" style={{ fontSize: '0.85rem' }}>Receipt Preview:</span>
                      <img src={form.receiptPreview} alt="Receipt Preview" className="receipt-preview-img" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── STEP 3: Review & Final Confirmation ─── */}
            {step === 3 && (
              <div>
                <h3 style={{ marginBottom: '16px' }}>Review Your Order</h3>

                <div style={{ marginBottom: '20px', padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div><strong>Method:</strong> {form.deliveryMethod === 'pickup' ? 'Store Pickup' : 'Doorstep Delivery'}</div>
                  {form.deliveryMethod === 'delivery' && (
                    <div><strong>Address:</strong> {form.deliveryAddress} {form.deliveryNotes ? `(${form.deliveryNotes})` : ''}</div>
                  )}
                  {form.scheduledTime && (
                    <div><strong>Scheduled:</strong> {new Date(form.scheduledTime).toLocaleString()}</div>
                  )}
                  <div><strong>Payment:</strong> {form.paymentMethod.toUpperCase()} (Receipt attached)</div>
                </div>

                <h4 style={{ marginBottom: '12px' }}>Items ({items.length})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  {items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem' }}>
                      <span>
                        {item.name} {item.flavor ? `(${item.flavor})` : ''} &times; {item.quantity}
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
                    <span>Shipping Fee:</span>
                    <span>{shippingFee === 0 ? 'FREE (Bulk Promo / Pickup)' : `₱${shippingFee.toFixed(2)}`}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>
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
                  {submitting ? 'Placing Order...' : 'Confirm & Submit Order 🍿'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

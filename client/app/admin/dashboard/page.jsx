"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiPackage,
  FiShoppingBag,
  FiUsers,
  FiSliders,
  FiHeadphones,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiUpload,
  FiSave,
  FiImage,
  FiExternalLink,
  FiCheckCircle,
} from 'react-icons/fi';
import { useAuth } from '../../../src/features/auth/AuthContext';
import { productsAPI, ordersAPI, settingsAPI, uploadAPI, authAPI, formatImageUrl } from '../../../src/services/api';
import toast from 'react-hot-toast';
import AdminChatPanel from '../../../src/features/chat/AdminChatPanel';
import '../../../src/pages/AdminDashboard.css';

export default function AdminDashboardPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({});

  // Modals state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Product Form State
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    category: 'classic',
    flavors: [],
    newFlavorInput: '',
    isActive: true,
  });

  // Settings State
  const [settingsForm, setSettingsForm] = useState({
    site_customization: {
      heroTitle: '',
      heroSubtitle: '',
      bannerAnnouncement: '',
    },
    qr_codes: {
      gcash: { label: 'GCash', accountName: '', accountNumber: '', imageUrl: '' },
      maya: { label: 'Maya', accountName: '', accountNumber: '', imageUrl: '' },
      instapay: { label: 'InstaPay', accountName: '', accountNumber: '', imageUrl: '' },
    },
    faq: [],
  });

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/admin/login');
      return;
    }
    if (isAdmin) {
      loadAllAdminData();
    }
  }, [isAdmin, loading, router]);

  const loadAllAdminData = () => {
    productsAPI.adminGetAll()
      .then(({ data }) => setProducts(data.products || []))
      .catch(() => {});

    ordersAPI.adminGetAll()
      .then(({ data }) => setOrders(data.orders || []))
      .catch(() => {});

    authAPI.getUsers()
      .then(({ data }) => setUsers(data.users || []))
      .catch(() => {});

    settingsAPI.get()
      .then(({ data }) => {
        const s = data.settings || {};
        setSettings(s);
        setSettingsForm({
          site_customization: s.site_customization || { heroTitle: '', heroSubtitle: '', bannerAnnouncement: '' },
          qr_codes: s.qr_codes || {
            gcash: { label: 'GCash', accountName: '', accountNumber: '', imageUrl: '' },
            maya: { label: 'Maya', accountName: '', accountNumber: '', imageUrl: '' },
            instapay: { label: 'InstaPay', accountName: '', accountNumber: '', imageUrl: '' },
          },
          faq: Array.isArray(s.faq) ? s.faq : [],
        });
      })
      .catch(() => {});
  };

  // ─── Product CRUD Handlers ───
  const openNewProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      imageUrl: '',
      category: 'classic',
      flavors: ['Original'],
      newFlavorInput: '',
      isActive: true,
    });
    setShowProductModal(true);
  };

  const openEditProductModal = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      description: prod.description || '',
      price: prod.price,
      imageUrl: prod.imageUrl || '',
      category: prod.category || 'classic',
      flavors: Array.isArray(prod.flavors) ? prod.flavors : [],
      newFlavorInput: '',
      isActive: prod.isActive,
    });
    setShowProductModal(true);
  };

  const handleProductImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { data } = await uploadAPI.uploadImage(file, 'products');
      setProductForm((prev) => ({ ...prev, imageUrl: data.url }));
      toast.success('Product image uploaded successfully!');
    } catch (err) {
      toast.error('Image upload failed.');
    }
  };

  const handleAddFlavorTag = () => {
    if (productForm.newFlavorInput.trim()) {
      setProductForm((prev) => ({
        ...prev,
        flavors: [...prev.flavors, prev.newFlavorInput.trim()],
        newFlavorInput: '',
      }));
    }
  };

  const handleRemoveFlavorTag = (indexToRemove) => {
    setProductForm((prev) => ({
      ...prev,
      flavors: prev.flavors.filter((_, i) => i !== indexToRemove),
    }));
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) {
      toast.error('Product name and price are required.');
      return;
    }

    setSavingProduct(true);
    try {
      const payload = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        imageUrl: productForm.imageUrl,
        category: productForm.category,
        flavors: productForm.flavors,
        isActive: productForm.isActive,
      };

      if (editingProduct) {
        await productsAPI.update(editingProduct.id, payload);
        toast.success('Product updated successfully! 🍿');
      } else {
        await productsAPI.create(payload);
        toast.success('New product created successfully! 🍿');
      }

      setShowProductModal(false);
      loadAllAdminData();
    } catch (err) {
      toast.error('Failed to save product.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await productsAPI.delete(id);
      toast.success('Product deleted.');
      loadAllAdminData();
    } catch (err) {
      toast.error('Failed to delete product.');
    }
  };

  // ─── Order Management Handlers ───
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      toast.success(`Order #${orderId} status updated to ${newStatus}`);
      loadAllAdminData();
    } catch (err) {
      toast.error('Failed to update order status.');
    }
  };

  const handleConfirmPayment = async (orderId) => {
    try {
      await ordersAPI.confirmPayment(orderId);
      toast.success(`Payment verified and confirmed for Order #${orderId}! 🎉`);
      loadAllAdminData();
    } catch (err) {
      toast.error('Failed to confirm payment.');
    }
  };

  // ─── User Management Handlers ───
  const handleChangeUserRole = async (userId, role) => {
    try {
      await authAPI.updateUserRole(userId, role);
      toast.success('User role updated.');
      loadAllAdminData();
    } catch (err) {
      toast.error('Failed to update role.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to remove this user account?')) return;
    try {
      await authAPI.deleteUser(userId);
      toast.success('User removed.');
      loadAllAdminData();
    } catch (err) {
      toast.error('Failed to delete user.');
    }
  };

  // ─── Settings / QR Codes / Customization Handlers ───
  const handleQrImageUpload = async (paymentKey, e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { data } = await uploadAPI.uploadImage(file, 'qrcodes');
      setSettingsForm((prev) => ({
        ...prev,
        qr_codes: {
          ...prev.qr_codes,
          [paymentKey]: {
            ...prev.qr_codes[paymentKey],
            imageUrl: data.url,
          },
        },
      }));
      toast.success(`${paymentKey.toUpperCase()} QR image uploaded!`);
    } catch (err) {
      toast.error('Failed to upload QR code.');
    }
  };

  const handleSaveAllSettings = async () => {
    setSavingSettings(true);
    try {
      await settingsAPI.bulkUpdate(settingsForm);
      toast.success('All site customizations and QR codes saved and applied! 🚀');
      loadAllAdminData();
    } catch (err) {
      toast.error('Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="admin-dashboard container-lg">
      <div className="admin-header">
        <div>
          <h1>J-Pop Admin Control Center 🍿</h1>
          <p className="text-muted">
            Manage your gourmet popcorn products, customer orders, QR payment codes, and live inquiries.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline btn-sm" onClick={() => router.push('/')}>
            View Public Site
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'products' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <FiPackage /> Products ({products.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'orders' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <FiShoppingBag /> Orders ({orders.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <FiUsers /> Users ({users.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'customization' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('customization')}
        >
          <FiSliders /> QR Codes & Design
        </button>
        <button
          className={`admin-tab ${activeTab === 'chat' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <FiHeadphones /> Live Support Chat
        </button>
      </div>

      {/* ─── TAB 1: PRODUCTS INVENTORY ─── */}
      {activeTab === 'products' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Popcorn Catalog</h3>
            <button className="btn btn-primary" onClick={openNewProductModal}>
              <FiPlus /> Add New Flavor / Item
            </button>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Category</th>
                  <th>Flavor Options</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <img
                        src={formatImageUrl(p.imageUrl)}
                        alt={p.name}
                        className="table-img"
                      />
                    </td>
                    <td>
                      <strong>{p.name}</strong>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>{p.description}</div>
                    </td>
                    <td><strong>₱{parseFloat(p.price).toFixed(2)}</strong></td>
                    <td><span className="badge" style={{ background: 'var(--bg-subtle)' }}>{p.category}</span></td>
                    <td>
                      <div className="flavor-tags">
                        {p.flavors?.map((f, i) => (
                          <span key={i} className="flavor-tag">{f}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${p.isActive ? 'badge-ready' : 'badge-cancelled'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => openEditProductModal(p)}
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleDeleteProduct(p.id)}
                          style={{ color: 'var(--color-danger)' }}
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 2: ORDERS MANAGEMENT ─── */}
      {activeTab === 'orders' && (
        <div>
          <h3 style={{ marginBottom: '20px' }}>Customer Orders</h3>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Method & Address</th>
                  <th>Receipt</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                      No customer orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id}>
                      <td><strong>#{o.id}</strong></td>
                      <td>
                        <strong>{o.customerName || `User #${o.userId}`}</strong>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>{o.customerEmail}</div>
                        {o.customerPhone && <div className="text-muted" style={{ fontSize: '0.8rem' }}>📞 {o.customerPhone}</div>}
                      </td>
                      <td>
                        {o.items?.map((item, idx) => (
                          <div key={idx} style={{ fontSize: '0.82rem' }}>
                            • {item.productName} {item.flavor ? `(${item.flavor})` : ''} &times; {item.quantity}
                          </div>
                        ))}
                      </td>
                      <td><strong>₱{parseFloat(o.total).toFixed(2)}</strong></td>
                      <td>
                        <div><strong>{o.deliveryMethod === 'pickup' ? '📍 Store Pickup' : '🚚 Delivery'}</strong></div>
                        {o.deliveryAddress && <div className="text-muted" style={{ fontSize: '0.8rem' }}>{o.deliveryAddress}</div>}
                        {o.deliveryNotes && <div className="text-muted" style={{ fontSize: '0.78rem' }}>Note: {o.deliveryNotes}</div>}
                        {o.scheduledTime && (
                          <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                            ⏰ {new Date(o.scheduledTime).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td>
                        {o.paymentReceiptUrl ? (
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setSelectedReceiptUrl(o.paymentReceiptUrl)}
                            title="View Receipt Screenshot"
                          >
                            <FiImage /> View Receipt
                          </button>
                        ) : (
                          <span className="text-muted" style={{ fontSize: '0.8rem' }}>No receipt</span>
                        )}
                      </td>
                      <td>
                        {o.paymentConfirmed ? (
                          <span className="badge badge-delivered">✅ Confirmed</span>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleConfirmPayment(o.id)}
                          >
                            <FiCheckCircle /> Confirm Payment
                          </button>
                        )}
                      </td>
                      <td>
                        <select
                          className="form-select"
                          style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                          value={o.status}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 3: USERS AUTHORITY MANAGEMENT ─── */}
      {activeTab === 'users' && (
        <div>
          <h3 style={{ marginBottom: '20px' }}>Registered Customers & Authority</h3>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td>{u.address || '—'}</td>
                    <td>
                      <select
                        className="form-select"
                        style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                        value={u.role}
                        onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleDeleteUser(u.id)}
                        style={{ color: 'var(--color-danger)' }}
                      >
                        <FiTrash2 /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 4: SITE CUSTOMIZATION & QR CODES ─── */}
      {activeTab === 'customization' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3>Frontend Customization & QR Payments</h3>
            <button className="btn btn-primary btn-lg" onClick={handleSaveAllSettings} disabled={savingSettings}>
              <FiSave /> {savingSettings ? 'Applying...' : 'Save / Apply All Changes'}
            </button>
          </div>

          {/* Hero Branding Section */}
          <div className="card" style={{ marginBottom: '32px' }}>
            <div className="card-body">
              <h4 style={{ marginBottom: '16px' }}>Hero Section Headlines</h4>
              <div className="form-group">
                <label className="form-label">Hero Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={settingsForm.site_customization.heroTitle}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      site_customization: { ...settingsForm.site_customization, heroTitle: e.target.value },
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hero Subtitle</label>
                <textarea
                  className="form-textarea"
                  value={settingsForm.site_customization.heroSubtitle}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      site_customization: { ...settingsForm.site_customization, heroSubtitle: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* QR Codes Management */}
          <h4 style={{ marginBottom: '16px' }}>Payment QR Codes & Accounts</h4>
          <div className="qr-settings-grid">
            {['gcash', 'maya', 'instapay'].map((key) => {
              const qr = settingsForm.qr_codes[key] || {};
              return (
                <div key={key} className="qr-setting-card">
                  <h4 style={{ marginBottom: '12px' }}>{key.toUpperCase()} Payment QR</h4>
                  <img
                    src={qr.imageUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=JPOP-${key.toUpperCase()}`}
                    alt={`${key} QR`}
                    style={{ width: '160px', height: '160px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '16px' }}
                  />

                  <label className="btn btn-outline btn-sm" style={{ marginBottom: '16px', cursor: 'pointer' }}>
                    <FiUpload /> Upload QR Code Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleQrImageUpload(key, e)}
                      style={{ display: 'none' }}
                    />
                  </label>

                  <div className="form-group" style={{ width: '100%', textAlign: 'left' }}>
                    <label className="form-label">Account Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={qr.accountName || ''}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          qr_codes: {
                            ...settingsForm.qr_codes,
                            [key]: { ...qr, accountName: e.target.value },
                          },
                        })
                      }
                    />
                  </div>

                  <div className="form-group" style={{ width: '100%', textAlign: 'left' }}>
                    <label className="form-label">Account / Mobile Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={qr.accountNumber || ''}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          qr_codes: {
                            ...settingsForm.qr_codes,
                            [key]: { ...qr, accountNumber: e.target.value },
                          },
                        })
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 5: LIVE SUPPORT CHAT DESK ─── */}
      {activeTab === 'chat' && (
        <div>
          <h3 style={{ marginBottom: '20px' }}>Live Customer Support Desk</h3>
          <AdminChatPanel />
        </div>
      )}

      {/* ─── PRODUCT MODAL (Add / Edit) ─── */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowProductModal(false)}>
              <FiX />
            </button>

            <h3 style={{ marginBottom: '20px' }}>
              {editingProduct ? 'Edit Popcorn Flavor' : 'Add New Popcorn Product'}
            </h3>

            <form onSubmit={handleSaveProduct}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Salted Caramel Gold Popcorn"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Price (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="150.00"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                >
                  <option value="classic">Classic</option>
                  <option value="savory">Savory</option>
                  <option value="sweet">Sweet</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe the crunch, flavor profile, and artisanal ingredients..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                />
              </div>

              {/* Image Upload / URL */}
              <div className="form-group">
                <label className="form-label">Product Image</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                  {productForm.imageUrl && (
                    <img
                      src={formatImageUrl(productForm.imageUrl)}
                      alt="Preview"
                      style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
                    />
                  )}
                  <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                    <FiUpload /> Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProductImageUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Or enter image URL..."
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                />
              </div>

              {/* Flavor Options List */}
              <div className="form-group">
                <label className="form-label">Flavor Options (Customer Choices)</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Add flavor option (e.g. Extra Butter)..."
                    value={productForm.newFlavorInput}
                    onChange={(e) => setProductForm({ ...productForm, newFlavorInput: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFlavorTag();
                      }
                    }}
                  />
                  <button type="button" className="btn btn-outline" onClick={handleAddFlavorTag}>
                    Add
                  </button>
                </div>
                <div className="flavor-tags">
                  {productForm.flavors.map((f, i) => (
                    <span key={i} className="flavor-tag">
                      {f}
                      <button type="button" onClick={() => handleRemoveFlavorTag(i)}><FiX size={12} /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={productForm.isActive}
                  onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                />
                <label htmlFor="isActiveCheck" style={{ fontWeight: 600 }}>Active in Shop Catalog</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowProductModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingProduct}
                >
                  {savingProduct ? 'Saving...' : 'Save Product 🍿'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── RECEIPT SCREENSHOT MODAL ─── */}
      {selectedReceiptUrl && (
        <div className="modal-overlay" onClick={() => setSelectedReceiptUrl(null)}>
          <div className="modal-card" style={{ maxWidth: '500px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedReceiptUrl(null)}>
              <FiX />
            </button>
            <h3 style={{ marginBottom: '16px' }}>Payment Receipt Screenshot</h3>
            <img
              src={selectedReceiptUrl}
              alt="Payment Receipt"
              style={{ width: '100%', maxHeight: '500px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-color)' }}
            />
            <div style={{ marginTop: '16px' }}>
              <a
                href={selectedReceiptUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline btn-sm"
              >
                <FiExternalLink /> Open Full Image in New Tab
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

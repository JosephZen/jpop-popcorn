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
  FiMapPin,
  FiGrid,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';
import { useAuth } from '../../../src/features/auth/AuthContext';
import {
  productsAPI,
  ordersAPI,
  settingsAPI,
  uploadAPI,
  authAPI,
  categoriesAPI,
  customizationsAPI,
  locationsAPI,
  formatImageUrl,
} from '../../../src/services/api';
import toast from 'react-hot-toast';
import AdminChatPanel from '../../../src/features/chat/AdminChatPanel';
import JPopLogo from '../../../src/components/JPopLogo';
import '../../../src/pages/AdminDashboard.css';

export default function AdminDashboardPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [shippingMatrix, setShippingMatrix] = useState([]);
  const [expandedMunId, setExpandedMunId] = useState(null);
  const [settings, setSettings] = useState({});

  // Modals state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [selectedCatForOption, setSelectedCatForOption] = useState(null);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Product Form State
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    basePrice: '',
    sizeLabel: '500g',
    imageUrl: '',
    category: 'popcorn',
    categoryId: 1,
    flavors: [],
    newFlavorInput: '',
    isActive: true,
  });

  // Category Form State
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    sortOrder: 0,
    type: 'percentage_mix',
  });

  // Customization Option Form State
  const [optionForm, setOptionForm] = useState({
    groupName: 'Popcorn Flavor',
    name: '',
    extraPrice: '0.00',
    isAvailable: true,
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
    facebook_messenger: {
      enabled: true,
      url: 'https://m.me/josephzencastro',
      label: 'Chat with Joseph on Messenger',
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

    categoriesAPI.getAll()
      .then(({ data }) => setCategories(data.categories || []))
      .catch(() => {});

    locationsAPI.getMatrix()
      .then(({ data }) => setShippingMatrix(data.matrix || []))
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
          facebook_messenger: s.facebook_messenger || {
            enabled: true,
            url: 'https://m.me/josephzencastro',
            label: 'Chat with Team on Messenger',
          },
          faq: Array.isArray(s.faq) ? s.faq : [],
        });
      })
      .catch(() => {});
  };

  // ─── Product Handlers ───
  const openNewProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '35.00',
      basePrice: '35.00',
      sizeLabel: '500g',
      imageUrl: '',
      category: 'popcorn',
      categoryId: 1,
      flavors: ['Spicy BBQ', 'Sour Cream & Onion', 'Cheese', 'BBQ'],
      newFlavorInput: '',
      isActive: true,
    });
    setShowProductModal(true);
  };

  const openEditProductModal = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price || product.basePrice || '',
      basePrice: product.basePrice || product.price || '',
      sizeLabel: product.sizeLabel || '500g',
      imageUrl: product.imageUrl || '',
      category: product.category || 'popcorn',
      categoryId: product.categoryId || 1,
      flavors: Array.isArray(product.flavors) ? product.flavors : [],
      newFlavorInput: '',
      isActive: product.isActive !== false,
    });
    setShowProductModal(true);
  };

  const handleProductImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { data } = await uploadAPI.uploadImage(file, 'products');
      setProductForm((prev) => ({ ...prev, imageUrl: data.url }));
      toast.success('Product image uploaded!');
    } catch (err) {
      toast.error('Failed to upload image.');
    }
  };

  const handleAddFlavorTag = (e) => {
    e.preventDefault();
    const val = productForm.newFlavorInput.trim();
    if (val && !productForm.flavors.includes(val)) {
      setProductForm((prev) => ({
        ...prev,
        flavors: [...prev.flavors, val],
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
        basePrice: parseFloat(productForm.basePrice || productForm.price),
        sizeLabel: productForm.sizeLabel,
        imageUrl: productForm.imageUrl,
        category: productForm.category,
        categoryId: parseInt(productForm.categoryId) || 1,
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

  // ─── Category Management Handlers ───
  const openNewCategoryModal = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      slug: '',
      sortOrder: categories.length + 1,
      type: 'percentage_mix',
    });
    setShowCategoryModal(true);
  };

  const openEditCategoryModal = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      slug: cat.slug,
      sortOrder: cat.sortOrder || 0,
      type: cat.customizationConfig?.type || 'percentage_mix',
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name || !categoryForm.slug) {
      toast.error('Name and slug are required.');
      return;
    }

    try {
      const payload = {
        name: categoryForm.name,
        slug: categoryForm.slug.toLowerCase().trim(),
        sortOrder: parseInt(categoryForm.sortOrder) || 0,
        customizationConfig: {
          type: categoryForm.type,
          allowMix: categoryForm.type === 'percentage_mix',
        },
      };

      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, payload);
        toast.success('Category updated successfully!');
      } else {
        await categoriesAPI.create(payload);
        toast.success('Category created successfully!');
      }

      setShowCategoryModal(false);
      loadAllAdminData();
    } catch (err) {
      toast.error('Failed to save category.');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Are you sure you want to delete this category? All its options will also be deleted.')) return;
    try {
      await categoriesAPI.delete(id);
      toast.success('Category deleted.');
      loadAllAdminData();
    } catch (err) {
      toast.error('Failed to delete category.');
    }
  };

  // ─── Customization Option Handlers ───
  const openAddOptionModal = (cat) => {
    setSelectedCatForOption(cat);
    setOptionForm({
      groupName: cat.slug === 'mini-donut' ? 'Donut Syrup' : 'Popcorn Flavor',
      name: '',
      extraPrice: '0.00',
      isAvailable: true,
    });
    setShowOptionModal(true);
  };

  const handleSaveOption = async (e) => {
    e.preventDefault();
    if (!optionForm.name || !selectedCatForOption) {
      toast.error('Option name is required.');
      return;
    }

    try {
      await customizationsAPI.create({
        categoryId: selectedCatForOption.id,
        groupName: optionForm.groupName,
        name: optionForm.name,
        extraPrice: optionForm.extraPrice || '0.00',
        isAvailable: optionForm.isAvailable,
      });
      toast.success(`Option "${optionForm.name}" added to ${selectedCatForOption.name}!`);
      setShowOptionModal(false);
      loadAllAdminData();
    } catch (err) {
      toast.error('Failed to add option.');
    }
  };

  const handleDeleteOption = async (optionId) => {
    if (!confirm('Remove this customization option?')) return;
    try {
      await customizationsAPI.delete(optionId);
      toast.success('Option removed.');
      loadAllAdminData();
    } catch (err) {
      toast.error('Failed to remove option.');
    }
  };

  // ─── Shipping Matrix Handlers ───
  const handleUpdateMunicipalityFee = async (munId, fee) => {
    try {
      await locationsAPI.updateMunicipalityFee(munId, { deliveryFee: fee });
      toast.success('Municipality delivery rate updated!');
      loadAllAdminData();
    } catch (err) {
      toast.error('Failed to update rate.');
    }
  };

  const handleUpdateBarangayFee = async (bId, fee) => {
    try {
      await locationsAPI.updateBarangayFee(bId, { customDeliveryFee: fee || null });
      toast.success('Barangay delivery rate updated!');
      loadAllAdminData();
    } catch (err) {
      toast.error('Failed to update barangay rate.');
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
      toast.success(`Payment confirmed for Order #${orderId}! Order is now confirmed.`);
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

  // ─── Settings / QR Codes Handlers ───
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <JPopLogo width={48} height={48} />
          <div>
            <h1>J-Pop Corner Admin Desk</h1>
            <p className="text-muted">
              Manage snack inventory, custom categories & mix rules, 27 Abra shipping rates, orders, and multi-admin inquiries.
            </p>
          </div>
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
          className={`admin-tab ${activeTab === 'categories' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <FiGrid /> Categories & Customizations ({categories.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'shipping' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('shipping')}
        >
          <FiMapPin /> Abra Shipping Matrix ({shippingMatrix.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'orders' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <FiShoppingBag /> Orders ({orders.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'chat' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <FiHeadphones /> Multi-Admin Live Chat
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
      </div>

      {/* ─── TAB 1: PRODUCTS INVENTORY ─── */}
      {activeTab === 'products' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Snack & Treat Catalog</h3>
            <button className="btn btn-primary" onClick={openNewProductModal}>
              <FiPlus /> Add New Snack Product
            </button>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Size</th>
                  <th>Category</th>
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
                        style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px' }}
                      />
                    </td>
                    <td>
                      <strong>{p.name}</strong>
                      <p className="text-muted" style={{ fontSize: '0.78rem', margin: 0, maxWidth: '240px' }}>
                        {p.description}
                      </p>
                    </td>
                    <td><strong>₱{parseFloat(p.price || p.basePrice).toFixed(2)}</strong></td>
                    <td><span className="badge">{p.sizeLabel || '500g'}</span></td>
                    <td><span className="badge badge--primary">{p.category}</span></td>
                    <td>
                      <span className={`status-badge ${p.isActive ? 'status-badge--ready' : 'status-badge--cancelled'}`}>
                        {p.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEditProductModal(p)}>
                          <FiEdit2 size={13} />
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => handleDeleteProduct(p.id)} style={{ color: 'var(--color-danger)' }}>
                          <FiTrash2 size={13} />
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

      {/* ─── TAB 2: CATEGORY & CUSTOMIZATION MANAGEMENT ─── */}
      {activeTab === 'categories' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3>Dynamic Category & Customization Rules</h3>
              <p className="text-muted" style={{ fontSize: '0.88rem' }}>
                Manage snack categories (Popcorn, Mini Donuts), reorder presentation, and configure flavors, syrups, dips, and toppings.
              </p>
            </div>
            <button className="btn btn-primary" onClick={openNewCategoryModal}>
              <FiPlus /> Create New Category
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {categories.map((cat) => (
              <div key={cat.id} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '1.2rem', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {cat.name} <span className="badge badge--primary" style={{ fontSize: '0.72rem' }}>slug: {cat.slug}</span>
                    </h4>
                    <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                      Sort Order: #{cat.sortOrder} • Config Type: {cat.customizationConfig?.type || 'standard'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => openAddOptionModal(cat)}>
                      <FiPlus /> Add Flavor / Topping
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => openEditCategoryModal(cat)}>
                      <FiEdit2 size={13} /> Edit
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => handleDeleteCategory(cat.id)} style={{ color: 'var(--color-danger)' }}>
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Customization Options Under this Category */}
                <div>
                  <h5 style={{ fontSize: '0.9rem', marginBottom: '10px', color: 'var(--text-secondary)' }}>
                    Configured Flavors, Syrups & Toppings ({cat.options?.length || 0}):
                  </h5>
                  {(!cat.options || cat.options.length === 0) ? (
                    <p className="text-muted" style={{ fontSize: '0.82rem' }}>No options configured yet for this category.</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {cat.options.map((opt) => (
                        <div key={opt.id} style={{
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '0.84rem',
                        }}>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 700, display: 'block' }}>
                              {opt.groupName}
                            </span>
                            <strong>{opt.name}</strong>
                            {parseFloat(opt.extraPrice) > 0 && (
                              <span style={{ marginLeft: '4px', color: 'var(--color-accent)' }}>+₱{opt.extraPrice}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteOption(opt.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
                            title="Remove"
                          >
                            <FiX size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 3: ABRA SHIPPING MATRIX TABLE ─── */}
      {activeTab === 'shipping' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h3>Abra Municipality & Barangay Shipping Rates Matrix</h3>
            <p className="text-muted" style={{ fontSize: '0.88rem' }}>
              Set and update distance-based PHP delivery rates for all 27 municipalities of Abra or individual barangays.
            </p>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Municipality</th>
                  <th>Barangays Count</th>
                  <th>Delivery Fee (PHP)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shippingMatrix.map((mun) => {
                  const isExpanded = expandedMunId === mun.id;
                  return (
                    <React.Fragment key={mun.id}>
                      <tr>
                        <td>
                          <strong>{mun.name}</strong>
                        </td>
                        <td>{mun.barangays?.length || 0} barangays</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>₱</span>
                            <input
                              type="number"
                              step="5"
                              defaultValue={mun.deliveryFee}
                              onBlur={(e) => handleUpdateMunicipalityFee(mun.id, e.target.value)}
                              style={{ width: '80px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                            />
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${mun.isActive ? 'status-badge--ready' : 'status-badge--cancelled'}`}>
                            {mun.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setExpandedMunId(isExpanded ? null : mun.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            {isExpanded ? <><FiChevronUp /> Hide Barangays</> : <><FiChevronDown /> View Barangays</>}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Barangay list for this municipality */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="5" style={{ background: 'var(--bg-subtle)', padding: '16px' }}>
                            <h5 style={{ marginBottom: '10px' }}>Barangays of {mun.name}:</h5>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                              {mun.barangays?.map((b) => (
                                <div key={b.id} style={{
                                  background: 'var(--bg-card)',
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-color)',
                                  fontSize: '0.84rem',
                                }}>
                                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{b.name}</div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Custom Fee: ₱</span>
                                    <input
                                      type="number"
                                      step="5"
                                      placeholder={mun.deliveryFee}
                                      defaultValue={b.customDeliveryFee || ''}
                                      onBlur={(e) => handleUpdateBarangayFee(b.id, e.target.value)}
                                      style={{ width: '70px', padding: '2px 6px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 4: ORDERS MANAGEMENT ─── */}
      {activeTab === 'orders' && (
        <div>
          <h3 style={{ marginBottom: '20px' }}>Customer Orders ({orders.length})</h3>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Method</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td><strong>#{order.id}</strong></td>
                    <td>
                      <div><strong>{order.customerName}</strong></div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{order.customerPhone || order.customerEmail}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem' }}>
                        {order.items?.map((item, idx) => (
                          <div key={idx}>
                            • {item.productName} ({item.size || item.flavor || 'Standard'}) × {item.quantity}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td><strong>₱{parseFloat(order.total).toFixed(2)}</strong></td>
                    <td><span className="badge">{order.deliveryMethod}</span></td>
                    <td>
                      <div>
                        <span className="badge badge--primary">{order.paymentMethod?.toUpperCase()}</span>
                        {order.paymentReceiptUrl && (
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '0.72rem', padding: '2px 6px', marginTop: '4px', display: 'block' }}
                            onClick={() => setSelectedReceiptUrl(formatImageUrl(order.paymentReceiptUrl))}
                          >
                            <FiImage /> View Receipt
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge status-badge--${order.status}`}>
                        {order.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {!order.paymentConfirmed && (
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                            onClick={() => handleConfirmPayment(order.id)}
                          >
                            <FiCheckCircle /> Confirm Payment
                          </button>
                        )}
                        <select
                          className="form-input"
                          style={{ fontSize: '0.75rem', padding: '4px' }}
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 5: MULTI-ADMIN LIVE CHAT ─── */}
      {activeTab === 'chat' && (
        <AdminChatPanel />
      )}

      {/* ─── TAB 6: USERS MANAGEMENT ─── */}
      {activeTab === 'users' && (
        <div>
          <h3 style={{ marginBottom: '20px' }}>Registered Accounts ({users.length})</h3>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
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
                    <td>{u.phone || 'N/A'}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' || u.role === 'ADMIN' ? 'badge--primary' : ''}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleChangeUserRole(u.id, (u.role || '').toLowerCase() === 'admin' ? 'customer' : 'admin')}
                        >
                          Toggle Role
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ color: 'var(--color-danger)' }}
                          onClick={() => handleDeleteUser(u.id)}
                        >
                          <FiTrash2 size={13} />
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

      {/* ─── TAB 7: QR CODES & DESIGN ─── */}
      {activeTab === 'customization' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Store Brand & QR Payment Settings</h3>
            <button className="btn btn-primary" onClick={handleSaveAllSettings} disabled={savingSettings}>
              <FiSave /> {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Site Hero Customization */}
            <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ marginBottom: '14px' }}>Hero & Announcement Banner</h4>

              <div className="form-group">
                <label className="form-label">Hero Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={settingsForm.site_customization.heroTitle}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    site_customization: { ...settingsForm.site_customization, heroTitle: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hero Subtitle</label>
                <textarea
                  className="form-input"
                  rows="2"
                  value={settingsForm.site_customization.heroSubtitle}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    site_customization: { ...settingsForm.site_customization, heroSubtitle: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Top Banner Announcement</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Free delivery on orders of 5+ bags!"
                  value={settingsForm.site_customization.bannerAnnouncement}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    site_customization: { ...settingsForm.site_customization, bannerAnnouncement: e.target.value }
                  })}
                />
              </div>
            </div>

            {/* Facebook Messenger Settings */}
            <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ marginBottom: '14px' }}>Meta Messenger Integration</h4>

              <div className="form-group">
                <label className="form-label">Messenger Page Direct URL</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://m.me/yourpage"
                  value={settingsForm.facebook_messenger.url}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    facebook_messenger: { ...settingsForm.facebook_messenger, url: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Chat Button Label</label>
                <input
                  type="text"
                  className="form-input"
                  value={settingsForm.facebook_messenger.label}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    facebook_messenger: { ...settingsForm.facebook_messenger, label: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: PRODUCT CREATE/EDIT ─── */}
      {showProductModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px'
        }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '12px', width: '100%', maxWidth: '520px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4>{editingProduct ? 'Edit Snack Product' : 'Add New Snack Product'}</h4>
              <button onClick={() => setShowProductModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><FiX size={20} /></button>
            </div>

            <form onSubmit={handleSaveProduct}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows="2"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Base Price (PHP)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-input"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value, basePrice: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Size Label</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 500g, 1kg, Box of 8"
                    value={productForm.sizeLabel}
                    onChange={(e) => setProductForm({ ...productForm, sizeLabel: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={productForm.categoryId}
                  onChange={(e) => {
                    const cId = parseInt(e.target.value);
                    const catObj = categories.find(c => c.id === cId);
                    setProductForm({
                      ...productForm,
                      categoryId: cId,
                      category: catObj?.slug || 'popcorn',
                    });
                  }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.slug})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Image Upload</label>
                <input type="file" accept="image/*" onChange={handleProductImageUpload} className="form-input" />
                {productForm.imageUrl && (
                  <img src={formatImageUrl(productForm.imageUrl)} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', marginTop: '8px', borderRadius: '6px' }} />
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowProductModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingProduct}>
                  {savingProduct ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CATEGORY CREATE/EDIT ─── */}
      {showCategoryModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px'
        }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '12px', width: '100%', maxWidth: '420px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4>{editingCategory ? 'Edit Category' : 'Create Category'}</h4>
              <button onClick={() => setShowCategoryModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><FiX size={20} /></button>
            </div>

            <form onSubmit={handleSaveCategory}>
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Popcorn, Mini Donut, Nachos"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Slug</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. popcorn, mini-donut"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sort Order (Rank)</label>
                <input
                  type="number"
                  className="form-input"
                  value={categoryForm.sortOrder}
                  onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Customization Behavior Type</label>
                <select
                  className="form-input"
                  value={categoryForm.type}
                  onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value })}
                >
                  <option value="percentage_mix">Percentage Mix Sliders (25% Increments = 100%)</option>
                  <option value="multi_select">Multi-Select Flavors, Syrups & Toppings</option>
                  <option value="single_select">Single Select Option</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCategoryModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CUSTOMIZATION OPTION ADD ─── */}
      {showOptionModal && selectedCatForOption && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px'
        }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '12px', width: '100%', maxWidth: '400px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4>Add Option to {selectedCatForOption.name}</h4>
              <button onClick={() => setShowOptionModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><FiX size={20} /></button>
            </div>

            <form onSubmit={handleSaveOption}>
              <div className="form-group">
                <label className="form-label">Group Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Popcorn Flavor, Donut Syrup, Donut Topping"
                  value={optionForm.groupName}
                  onChange={(e) => setOptionForm({ ...optionForm, groupName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Option Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Spicy BBQ, Matcha, Sprinkles"
                  value={optionForm.name}
                  onChange={(e) => setOptionForm({ ...optionForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Extra Price (PHP)</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-input"
                  value={optionForm.extraPrice}
                  onChange={(e) => setOptionForm({ ...optionForm, extraPrice: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowOptionModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Option</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: RECEIPT PREVIEW ─── */}
      {selectedReceiptUrl && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px'
        }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', maxWidth: '500px', width: '100%', textAlign: 'center' }}>
            <h4 style={{ marginBottom: '12px', color: '#333' }}>Payment Receipt</h4>
            <img src={selectedReceiptUrl} alt="Customer Receipt" style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px' }} />
            <div style={{ marginTop: '12px' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setSelectedReceiptUrl(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import axios from 'axios';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || '';
const API_BASE = (rawApiUrl && !rawApiUrl.includes('api.castrojosephzen.shop')) ? rawApiUrl : '/api';

export const formatImageUrl = (url) => {
  if (!url) return '/jpop-logo.svg';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  let cleanPath = url.replace(/^public\//, '');
  if (!cleanPath.startsWith('/')) {
    cleanPath = `/${cleanPath}`;
  }
  const apiOrigin = API_BASE.replace(/\/api\/?$/, '');
  return `${apiOrigin}${cleanPath}`;
};

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: inject JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('jpop_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login')) {
        // Clear token if invalid
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ───
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  adminLogin: (data) => api.post('/auth/admin', data),
  adminSetup: (data) => api.post('/auth/admin/setup', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  getUsers: () => api.get('/auth/users'),
  updateUserRole: (id, role) => api.patch(`/auth/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
};

// ─── Categories API ───
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// ─── Customizations API ───
export const customizationsAPI = {
  getAll: (categoryId) => api.get(`/customizations${categoryId ? `?categoryId=${categoryId}` : ''}`),
  create: (data) => api.post('/customizations', data),
  update: (id, data) => api.put(`/customizations/${id}`, data),
  delete: (id) => api.delete(`/customizations/${id}`),
};

// ─── Cart API ───
export const cartAPI = {
  get: () => api.get('/cart'),
  sync: (items) => api.post('/cart', { items }),
  addItem: (data) => api.post('/cart', data),
  clear: () => api.delete('/cart'),
  deleteItem: (id) => api.delete(`/cart/${id}`),
};

// ─── Locations & Shipping Matrix API ───
export const locationsAPI = {
  getMunicipalities: () => api.get('/locations/municipalities'),
  getBarangays: (municipalityId) => api.get(`/locations/barangays/${municipalityId}`),
  getMatrix: () => api.get('/locations/matrix'),
  updateMunicipalityFee: (id, data) => api.put(`/locations/municipalities/${id}/fee`, data),
  updateBarangayFee: (id, data) => api.put(`/locations/barangays/${id}/fee`, data),
};

// ─── Products API ───
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  adminGetAll: () => api.get('/products/admin/all'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// ─── Orders API ───
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  adminGetAll: () => api.get('/orders/admin/all'),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  confirmPayment: (id) => api.patch(`/orders/${id}/confirm`),
};

// ─── Settings API ───
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (key, value) => api.put(`/settings/${key}`, { value }),
  bulkUpdate: (settings) => api.put('/settings', { settings }),
};

// ─── Upload API ───
export const uploadAPI = {
  uploadImage: async (file, folder = 'jpop') => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Upload failed');
    }

    const data = await res.json();
    return { data };
  },
};

export default api;

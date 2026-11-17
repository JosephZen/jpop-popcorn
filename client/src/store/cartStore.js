import { create } from 'zustand';
import { cartAPI } from '../services/api';

// Helper to determine the current user's isolated cart storage key
const getCurrentUserKey = (overrideUser = null) => {
  if (overrideUser?.email) {
    return overrideUser.email.toLowerCase().trim();
  }
  if (typeof window === 'undefined') return 'guest';
  try {
    const raw = localStorage.getItem('jpop_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.email) return u.email.toLowerCase().trim();
      if (u?.id) return `user_${u.id}`;
    }
  } catch {}
  return 'guest';
};

const getCartStorageKey = (overrideUser = null) => {
  const userKey = getCurrentUserKey(overrideUser);
  return `jpop_cart_${userKey}`;
};

// Helper to save locally strictly to this user's isolated storage
const saveLocalCart = (items, overrideUser = null) => {
  if (typeof window !== 'undefined') {
    try {
      const key = getCartStorageKey(overrideUser);
      localStorage.setItem(key, JSON.stringify(items));
    } catch {}
  }
};

// Helper to check if user has token and trigger backend sync
const syncBackendCart = async (items) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('jpop_token');
    if (token) {
      try {
        await cartAPI.sync(
          items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            customizationPayload: {
              flavor: i.flavor,
              size: i.size,
              ...i.customizationPayload,
            },
          }))
        );
      } catch (err) {
        console.warn('Backend cart sync note:', err.message);
      }
    }
  }
};

export const useCartStore = create((set, get) => ({
  items: [],
  isHydrated: false,

  initCart: async (currentUser = null) => {
    if (typeof window !== 'undefined') {
      let user = currentUser;
      if (!user) {
        try {
          const raw = localStorage.getItem('jpop_user');
          if (raw) user = JSON.parse(raw);
        } catch {}
      }

      const token = localStorage.getItem('jpop_token');
      const storageKey = getCartStorageKey(user);

      // If user is guest (no session token)
      if (!token || !user) {
        let guestItems = [];
        try {
          const saved = localStorage.getItem('jpop_cart_guest');
          if (saved) guestItems = JSON.parse(saved);
        } catch {}
        set({ items: guestItems, isHydrated: true });
        return;
      }

      // If authenticated user (Customer or Admin)
      let localItems = [];
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) localItems = JSON.parse(saved);
      } catch {}

      // Fetch persistent cart from database for this specific user
      try {
        const { data } = await cartAPI.get();
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          const dbItems = data.items.map(item => ({
            productId: item.productId,
            name: item.productName || item.name || 'J-Pop Snack',
            price: parseFloat(item.price || 35.00),
            imageUrl: item.imageUrl,
            flavor: item.customizationPayload?.flavor || item.flavor || null,
            size: item.customizationPayload?.size || item.sizeLabel || item.size || null,
            quantity: item.quantity || 1,
            customizationPayload: item.customizationPayload || {},
          }));
          set({ items: dbItems, isHydrated: true });
          saveLocalCart(dbItems, user);
          return;
        } else {
          // If remote cart is empty, use user's own local cart (or empty)
          set({ items: localItems, isHydrated: true });
          if (localItems.length > 0) {
            syncBackendCart(localItems);
          }
          return;
        }
      } catch (e) {
        set({ items: localItems, isHydrated: true });
      }
    }
  },

  resetCartOnLogout: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('jpop_cart');
        localStorage.removeItem('jpop_cart_guest');
      } catch {}
    }
    set({ items: [] });
  },

  addItem: (product, flavor = null, size = null, quantity = 1, customizationPayload = {}) => {
    set((state) => {
      const payloadKey = JSON.stringify(customizationPayload || {});
      const existingIndex = state.items.findIndex((i) => {
        const itemPayloadKey = JSON.stringify(i.customizationPayload || {});
        return (
          i.productId === product.id &&
          i.flavor === (flavor || null) &&
          i.size === (size || null) &&
          itemPayloadKey === payloadKey
        );
      });

      let newItems;
      if (existingIndex > -1) {
        newItems = [...state.items];
        newItems[existingIndex].quantity += quantity;
      } else {
        newItems = [
          ...state.items,
          {
            productId: product.id,
            name: product.name,
            price: parseFloat(product.price || product.basePrice || 35.00),
            imageUrl: product.imageUrl,
            flavor: flavor || null,
            size: size || product.sizeLabel || null,
            quantity,
            customizationPayload: customizationPayload || {},
          },
        ];
      }

      saveLocalCart(newItems);
      syncBackendCart(newItems);
      return { items: newItems };
    });
  },

  removeItem: (index) => {
    set((state) => {
      const newItems = state.items.filter((_, idx) => idx !== index);
      saveLocalCart(newItems);
      syncBackendCart(newItems);
      return { items: newItems };
    });
  },

  updateQuantity: (index, quantity) => {
    if (quantity <= 0) {
      get().removeItem(index);
      return;
    }
    set((state) => {
      const newItems = state.items.map((item, idx) => {
        if (idx === index) {
          return { ...item, quantity };
        }
        return item;
      });
      saveLocalCart(newItems);
      syncBackendCart(newItems);
      return { items: newItems };
    });
  },

  clearCart: () => {
    saveLocalCart([]);
    syncBackendCart([]);
    set({ items: [] });
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  // Promo Calculation logic
  getFreeShippingStatus: () => {
    const items = get().items;
    let units1kg = 0;
    let units500g = 0;

    for (const item of items) {
      const size = (item.size || '').toLowerCase();
      const name = (item.name || '').toLowerCase();
      const qty = item.quantity || 1;

      if (size.includes('1kg') || name.includes('1kg')) {
        units1kg += qty;
      } else if (size.includes('500g') || name.includes('500g')) {
        units500g += qty;
      }
    }

    const is1kgEligible = units1kg >= 5;
    const is500gEligible = units500g >= 10;
    const isFree = is1kgEligible || is500gEligible;

    return {
      isFree,
      units1kg,
      units500g,
      reason: is1kgEligible
        ? `Free Shipping Promo: ${units1kg}/5 units of 1kg Popcorn`
        : is500gEligible
        ? `Free Shipping Promo: ${units500g}/10 units of 500g Popcorn`
        : null,
      progress1kg: Math.min(100, Math.round((units1kg / 5) * 100)),
      progress500g: Math.min(100, Math.round((units500g / 10) * 100)),
    };
  },
}));

export default useCartStore;

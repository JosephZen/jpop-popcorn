import { create } from 'zustand';
import { cartAPI } from '../services/api';

const STORAGE_KEY = 'jpop_cart';

// Helper to save locally
const saveLocalCart = (items) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
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

  initCart: async () => {
    if (typeof window !== 'undefined') {
      let localItems = [];
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          localItems = JSON.parse(saved);
          set({ items: localItems, isHydrated: true });
        }
      } catch {}

      // If user has token, fetch persistent cart from database
      const token = localStorage.getItem('jpop_token');
      if (token) {
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
            saveLocalCart(dbItems);
            return;
          } else if (localItems.length > 0) {
            // Push existing local items up to the database
            syncBackendCart(localItems);
          }
        } catch (e) {
          console.warn('Could not retrieve remote cart:', e.message);
        }
      }
      set({ isHydrated: true });
    }
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

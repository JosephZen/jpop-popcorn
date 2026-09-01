import { create } from 'zustand';

const STORAGE_KEY = 'jpop_cart';

const loadCart = () => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveCart = (items) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }
};

export const useCartStore = create((set, get) => ({
  items: loadCart(),

  addItem: (product, flavor = null, quantity = 1) => {
    set((state) => {
      const existingIndex = state.items.findIndex(
        (i) => i.productId === product.id && i.flavor === (flavor || null)
      );

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
            price: parseFloat(product.price),
            imageUrl: product.imageUrl,
            flavor: flavor || null,
            quantity,
          },
        ];
      }

      saveCart(newItems);
      return { items: newItems };
    });
  },

  removeItem: (productId, flavor = null) => {
    set((state) => {
      const newItems = state.items.filter(
        (i) => !(i.productId === productId && i.flavor === (flavor || null))
      );
      saveCart(newItems);
      return { items: newItems };
    });
  },

  updateQuantity: (productId, flavor = null, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId, flavor);
      return;
    }
    set((state) => {
      const newItems = state.items.map((i) => {
        if (i.productId === productId && i.flavor === (flavor || null)) {
          return { ...i, quantity };
        }
        return i;
      });
      saveCart(newItems);
      return { items: newItems };
    });
  },

  clearCart: () => {
    saveCart([]);
    set({ items: [] });
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getShippingFee: (deliveryMethod = 'delivery') => {
    if (deliveryMethod === 'pickup') return 0;
    const count = get().getItemCount();
    if (count >= 10) return 0;
    if (count >= 7) return 5;
    if (count >= 2) return 40;
    if (count >= 1) return 50;
    return 0;
  },

  getGrandTotal: (deliveryMethod = 'delivery') => {
    return get().getSubtotal() + get().getShippingFee(deliveryMethod);
  },
}));

export default useCartStore;

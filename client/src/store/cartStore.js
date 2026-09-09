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

  addItem: (product, flavor = null, size = null, quantity = 1) => {
    set((state) => {
      const existingIndex = state.items.findIndex(
        (i) => i.productId === product.id && i.flavor === (flavor || null) && i.size === (size || null)
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
            size: size || null,
            quantity,
          },
        ];
      }

      saveCart(newItems);
      return { items: newItems };
    });
  },

  removeItem: (productId, flavor = null, size = null) => {
    set((state) => {
      const newItems = state.items.filter(
        (i) => !(i.productId === productId && i.flavor === (flavor || null) && i.size === (size || null))
      );
      saveCart(newItems);
      return { items: newItems };
    });
  },

  updateQuantity: (productId, flavor = null, size = null, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId, flavor, size);
      return;
    }
    set((state) => {
      const newItems = state.items.map((i) => {
        if (i.productId === productId && i.flavor === (flavor || null) && i.size === (size || null)) {
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
    return 0; // Delivery is free to eligible areas
  },

  getGrandTotal: (deliveryMethod = 'delivery') => {
    return get().getSubtotal() + get().getShippingFee(deliveryMethod);
  },
}));

export default useCartStore;

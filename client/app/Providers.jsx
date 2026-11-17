"use client";

import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'react-hot-toast';
import { AuthProvider } from '../src/features/auth/AuthContext';
import Navbar from '../src/components/Navbar';
import Footer from '../src/components/Footer';
import CartDrawer from '../src/components/CartDrawer';
import ChatWidget from '../src/components/ChatWidget';
import { usePathname } from 'next/navigation';
import useCartStore from '../src/store/cartStore';

export default function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30000, retry: 1 },
    },
  }));
  const [cartOpen, setCartOpen] = useState(false);
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const itemCount = useCartStore((s) => s.getItemCount());
  const subtotal = useCartStore((s) => s.getSubtotal());

  // Hydrate cart from localStorage on client side mount
  useEffect(() => {
    useCartStore.getState().initCart();

    // Dismiss notifications immediately when clicking anywhere
    const handleDismissAnywhere = (e) => {
      if (!e.target.closest?.('.react-hot-toast')) {
        toast.dismiss();
      }
    };
    window.addEventListener('pointerdown', handleDismissAnywhere);
    return () => window.removeEventListener('pointerdown', handleDismissAnywhere);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="app">
          {!isAdmin && <Navbar onCartClick={() => setCartOpen(true)} />}
          <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

          <main>
            {children}
          </main>

          {!isAdmin && <ChatWidget />}
          {!isAdmin && <Footer />}

          {/* Persistent Floating Bottom Cart Basket on Mobile */}
          {!isAdmin && itemCount > 0 && !pathname?.startsWith('/checkout') && (
            <div className="mobile-cart-bar" onClick={() => setCartOpen(true)} role="button" aria-label="Open Cart">
              <div className="mobile-cart-bar__left">
                <span>🛒 Basket</span>
                <span className="mobile-cart-bar__badge">{itemCount}</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="mobile-cart-bar__right">
                <span>View Order</span>
                <span>➜</span>
              </div>
            </div>
          )}

          <Toaster
            position="bottom-center"
            containerStyle={{
              top: '50%',
              left: '50%',
              bottom: 'auto',
              transform: 'translate(-50%, -50%)',
              zIndex: 99999,
              pointerEvents: 'none',
            }}
            toastOptions={{
              duration: 3000,
              style: {
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                background: '#1A1514',
                color: '#F7F1E9',
                border: '2px solid #FFD32A',
                borderRadius: '18px',
                padding: '18px 28px',
                boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85)',
                fontWeight: 700,
                fontSize: '1rem',
                textAlign: 'center',
                pointerEvents: 'auto',
                cursor: 'pointer',
              },
              success: {
                iconTheme: {
                  primary: '#FFD32A',
                  secondary: '#1A1514',
                },
              },
              error: {
                iconTheme: {
                  primary: '#FF4757',
                  secondary: '#1A1514',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

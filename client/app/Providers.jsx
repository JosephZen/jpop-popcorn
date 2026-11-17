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

  // Hydrate cart from localStorage on client side mount
  useEffect(() => {
    useCartStore.getState().initCart();

    // Dismiss notifications immediately when clicking anywhere
    const handleGlobalClick = () => {
      toast.dismiss();
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
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

          <Toaster
            position="top-center"
            containerStyle={{ top: 32, zIndex: 99999 }}
            toastOptions={{
              duration: 3000,
              style: {
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                background: '#1E1918',
                color: '#F7F1E9',
                border: '2px solid #FFD32A',
                borderRadius: '16px',
                padding: '14px 24px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                fontWeight: 700,
                fontSize: '0.94rem',
                cursor: 'pointer',
              },
              success: {
                iconTheme: {
                  primary: '#FFD32A',
                  secondary: '#1E1918',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

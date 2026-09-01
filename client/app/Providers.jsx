"use client";

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../src/features/auth/AuthContext';
import Navbar from '../src/components/Navbar';
import Footer from '../src/components/Footer';
import CartDrawer from '../src/components/CartDrawer';
import ChatWidget from '../src/components/ChatWidget';
import { usePathname } from 'next/navigation';

export default function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30000, retry: 1 },
    },
  }));
  const [cartOpen, setCartOpen] = useState(false);
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

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
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                borderRadius: '14px',
                padding: '12px 18px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                fontWeight: 600,
              },
            }}
          />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

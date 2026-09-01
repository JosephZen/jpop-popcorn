import '../src/index.css';
import Providers from './Providers';

export const metadata = {
  title: 'J-Pop Popcorn — Freshly Popped, Perfectly Flavored',
  description: 'Artisanal gourmet popcorn popped fresh daily and delivered to your door. Order online with GCash, Maya, and InstaPay.',
  keywords: 'J-Pop, gourmet popcorn, fresh popcorn, popcorn delivery, GCash, Maya, InstaPay, snacks, Philippines',
  metadataBase: new URL('https://castrojosephzen.shop'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'J-Pop Popcorn — Freshly Popped, Perfectly Flavored',
    description: 'Freshly popped, perfectly flavored gourmet popcorn crafted with love and delivered to your door.',
    url: 'https://castrojosephzen.shop',
    siteName: 'J-Pop Popcorn',
    type: 'website',
  },
  icons: {
    icon: '/favicon.svg',
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

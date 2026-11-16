import '../src/index.css';
import Providers from './Providers';

export const metadata = {
  title: 'J-Pop Corner — Gourmet Snacks & Custom Treats',
  description: 'Artisanal gourmet popcorn with custom mix sliders and freshly glazed mini donuts. Popped fresh daily in Abra with delivery & pickup across 27 municipalities.',
  keywords: 'J-Pop Corner, gourmet popcorn, custom flavor mix, mini donuts, snacks, Abra Philippines, GCash, Maya, PayMongo, HitPay',
  metadataBase: new URL('https://castrojosephzen.shop'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'J-Pop Corner — Gourmet Snacks & Custom Treats',
    description: 'Freshly popped gourmet popcorn and glazed mini donuts crafted with passion. Free shipping promo on bulk orders!',
    url: 'https://castrojosephzen.shop',
    siteName: 'J-Pop Corner',
    type: 'website',
  },
  icons: {
    icon: '/jpop-logo.svg',
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/jpop-logo.svg" type="image/svg+xml" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

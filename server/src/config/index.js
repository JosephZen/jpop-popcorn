import 'dotenv/config';

const config = {
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'jpop-gourmet-popcorn-jwt-secret-key-2024',
  jwtExpiresIn: '7d',
  siteDomain: process.env.SITE_DOMAIN || 'castrojosephzen.shop',
  apiDomain: process.env.API_DOMAIN || 'api.castrojosephzen.shop',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
    : ['http://localhost:3000', 'http://localhost:5173', 'https://castrojosephzen.shop', 'https://www.castrojosephzen.shop'],
  adminSetupKey: process.env.ADMIN_SETUP_KEY || 'jpop-initial-setup-2024',
  facebook: {
    verifyToken: process.env.FB_VERIFY_TOKEN || 'jpop_fb_verify_token_2024',
    pageAccessToken: process.env.FB_PAGE_ACCESS_TOKEN || '',
  }
};

export default config;

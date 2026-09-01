import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import config from './config/index.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import uploadRoutes from './routes/upload.js';
import settingsRoutes from './routes/settings.js';
import webhookRoutes from './routes/webhook.js';
import { setupChat } from './socket/chat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// ─── Socket.IO Setup ───
const io = new Server(httpServer, {
  cors: {
    origin: config.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

// ─── Middleware ───
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (config.corsOrigins.includes(origin) || config.corsOrigins.includes('*') || origin.includes('localhost') || origin.includes('castrojosephzen.shop')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in dev
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// ─── Static files for local uploads fallback ───
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// ─── API Routes ───
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/webhook', webhookRoutes);

// ─── Health Check ───
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'J-Pop Popcorn API (v3)',
    domain: config.siteDomain,
    timestamp: new Date().toISOString(),
  });
});

// ─── Real-time Chat Socket ───
setupChat(io);

// ─── Error Handling ───
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error.', details: err.message });
});

// ─── Start HTTP & WebSocket Server ───
httpServer.listen(config.port, () => {
  console.log(`🍿 J-Pop Popcorn Server v3 running on port ${config.port}`);
  console.log(`🌐 Target Domain: https://${config.siteDomain}`);
  console.log(`📡 API Domain: https://${config.apiDomain}`);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const cron = require('node-cron');
const db = require('./db');

// Import routes
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const fpoRoutes = require('./routes/fpo');
const pricesRoutes = require('./routes/prices');
const adminRoutes = require('./routes/admin');
const logisticsRoutes = require('./routes/logistics');
const storageRoutes = require('./routes/storage');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend clients
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware with large payload support for base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
try {
  const tmpUploads = path.join(os.tmpdir(), 'uploads');
  app.use('/uploads', express.static(tmpUploads));
} catch (e) {
  // Ignore
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/fpo', fpoRoutes);
app.use('/api', pricesRoutes); // Provides /api/prices, /api/crops, /api/districts
app.use('/api/admin', adminRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/storage', storageRoutes);

// Cron Job: Simulate mandi market fluctuations every 6 hours (only in persistent server mode)
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  cron.schedule('0 */6 * * *', async () => {
    console.log('[CRON] Simulating mandi market fluctuations...');
    try {
      const pricesResult = await db.query('SELECT id, price, min_price, max_price FROM mandi_prices');
      for (const item of pricesResult.rows) {
        // Random delta between -3% and +3%
        const factor = 1 + (Math.random() * 0.06 - 0.03);
        const newPrice = Math.round(Number(item.price) * factor * 10) / 10;
        const minPrice = Math.round(newPrice * 0.82 * 10) / 10;
        const maxPrice = Math.round(newPrice * 1.18 * 10) / 10;
        await db.query(
          'UPDATE mandi_prices SET price = $1, min_price = $2, max_price = $3, updated_at = NOW() WHERE id = $4',
          [newPrice, minPrice, maxPrice, item.id]
        );
      }
      console.log('[CRON] Mandi market prices updated successfully.');
    } catch (err) {
      console.error('[CRON] Error during price update:', err.message);
    }
  });
}

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start Server and Initialize Database
async function startServer() {
  try {
    await db.initDb();
    if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
      app.listen(PORT, () => {
        console.log(`=============================================`);
        console.log(`🌾 SIH Agri-Marketplace Backend API running`);
        console.log(`🌐 Base URL: http://localhost:${PORT}/api`);
        console.log(`🚀 Ready for Farmer, Buyer, and Admin clients`);
        console.log(`=============================================`);
      });
    }
  } catch (err) {
    console.error('Failed to start server:', err);
    if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
      process.exit(1);
    }
  }
}

startServer();

module.exports = app;

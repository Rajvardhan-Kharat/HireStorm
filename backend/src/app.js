require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const { globalLimiter } = require('./middleware/rateLimiter');

// Routes
const authRoutes = require('./routes/auth.routes');
const listingRoutes = require('./routes/listing.routes');
const applicationRoutes = require('./routes/application.routes');
const hackathonRoutes = require('./routes/hackathon.routes');
const ilmRoutes = require('./routes/ilm.routes');
const courseRoutes = require('./routes/course.routes');
const paymentRoutes = require('./routes/payment.routes');
const adminRoutes = require('./routes/admin.routes');
const notificationRoutes = require('./routes/notification.routes');

// Jobs & Workers
require('./jobs/reviewCycleJob');          // node-cron: daily log reminders, monthly reviews
require('./jobs/workers/hackathonWorker'); // BullMQ: hackathon deadline pipeline

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Connect Database
connectDB();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use(globalLimiter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API Routes
const API = '/api/v1';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/listings`, listingRoutes);
app.use(`${API}/applications`, applicationRoutes);
app.use(`${API}/hackathons`, hackathonRoutes);
app.use(`${API}/ilm`, ilmRoutes);
app.use(`${API}/internship`, require('./routes/internship.routes'));
app.use(`${API}/courses`, courseRoutes);
app.use(`${API}/payments`, paymentRoutes);
app.use(`${API}/admin`, adminRoutes);
app.use(`${API}/notifications`, notificationRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 HireStorm server running on port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = { app, server };

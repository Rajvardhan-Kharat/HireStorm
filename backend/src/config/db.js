const mongoose = require('mongoose');

let retryCount = 0;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    retryCount = 0; // reset on success
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    handleDisconnect();
  }
};

const handleDisconnect = () => {
  const timeout = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30s backoff
  retryCount++;
  console.log(`[DB Fallback] Attempting to reconnect in ${timeout / 1000}s... (Attempt ${retryCount})`);
  setTimeout(connectDB, timeout);
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected! Initiating fallback reconnection strategy.');
  handleDisconnect();
});

module.exports = connectDB;

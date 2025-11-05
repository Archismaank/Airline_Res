require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./models'); // Sequelize connection instance
const { startCancellationScheduler } = require('./utils/cancellationScheduler'); // ✅ import scheduler once

const app = express();

// ✅ Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', // local frontend
    'https://airline-reservation-frontend.onrender.com', // deployed Render frontend
    process.env.FRONTEND_URL // Allow frontend URL from environment variable
  ].filter(Boolean), // Remove undefined values
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// ✅ Import routes
const userRoutes = require('./routes/userRoutes');
const flightRoutes = require('./routes/flightRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const airportRoutes = require('./routes/airportRoutes');
const trackingRoutes = require('./routes/trackingRoutes');
const supportTicketRoutes = require('./routes/supportTicketRoutes');

// ✅ Use routes
app.use('/api/users', userRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/airports', airportRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/tickets', supportTicketRoutes);

// ✅ Root test route
app.get('/', (req, res) => {
  res.send('✈️ SQLite Airline Reservation Backend is Running Successfully!');
});

// ✅ Import models (ensures Sequelize knows them)
require('./models/User');
require('./models/Flight');
require('./models/Booking');
require('./models/SupportTicket');

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to SQLite database.');

    // Sync database schema safely (only creates tables if they don't exist)
    // Using { force: false } instead of { alter: true } to avoid SQLite constraint issues
    try {
      await sequelize.sync({ force: false });
      console.log('✅ Database schema synchronized.');
    } catch (syncError) {
      // If sync fails due to schema changes, log but continue
      // SQLite doesn't handle ALTER TABLE well, so we'll skip schema updates
      if (syncError.name === 'SequelizeUniqueConstraintError' || syncError.name === 'SequelizeDatabaseError') {
        console.log('⚠️ Database schema sync skipped (existing tables detected).');
        console.log('   If you need to update the schema, consider using migrations.');
      } else {
        throw syncError; // Re-throw if it's a different error
      }
    }

    // Start background scheduler (runs once backend is ready)
    startCancellationScheduler();

    console.log(`🚀 Server running on port ${PORT}`);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1); // Exit on critical errors
  }
});

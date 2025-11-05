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
    'https://airline-reservation-frontend.onrender.com' // deployed Render frontend
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
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

    // Sync database schema safely (does not delete existing data)
    await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
    console.log('✅ Database schema synchronized.');

    // Start background scheduler (runs once backend is ready)
    startCancellationScheduler();

    console.log(`🚀 Server running on port ${PORT}`);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
});

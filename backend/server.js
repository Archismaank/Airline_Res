require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./models'); // this will be created soon

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Routes
const userRoutes = require('./routes/userRoutes');
const flightRoutes = require('./routes/flightRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const airportRoutes = require('./routes/airportRoutes');
const trackingRoutes = require('./routes/trackingRoutes');
const supportTicketRoutes = require('./routes/supportTicketRoutes');

app.use('/api/users', userRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/airports', airportRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/tickets', supportTicketRoutes);


// Default Routes
app.get('/', (req, res) => {
  res.send('✈️ SQLite Airline Reservation Backend is Running!');
});

// Start cancellation scheduler
const { startCancellationScheduler } = require('./utils/cancellationScheduler');

// Import models to ensure they're registered
require('./models/User');
require('./models/Flight');
require('./models/Booking');
require('./models/SupportTicket');

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to SQLite database.');
    
    // Sync database schema (adds new columns without deleting data)
    await sequelize.sync({ alter: true });
    console.log('✅ Database schema synchronized.');
    
    console.log(`🚀 Server running on port ${PORT}`);
    
    // Start cancellation status scheduler
    startCancellationScheduler();
  } catch (error) {
    console.error('❌ DB connection failed:', error);
  }
});

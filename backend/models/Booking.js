const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const User = require('./User');
const Flight = require('./Flight');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  pnr: {
    type: DataTypes.STRING,
    unique: true,
  },
  passengers: {
    type: DataTypes.JSON, // array of passenger details
  },
  addons: {
    type: DataTypes.JSON,
  },
  seats: {
    type: DataTypes.JSON,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'confirmed',
  },
  cancellationStatus: {
    type: DataTypes.STRING,
    defaultValue: null, // null, 'pending_cancellation', 'cancelled', 'refunded'
  },
  cancellationDate: {
    type: DataTypes.DATE,
    defaultValue: null,
  },
  expectedRefundDate: {
    type: DataTypes.DATE,
    defaultValue: null,
  },
  flightData: {
    type: DataTypes.JSON, // Store flight details for reference
  },
  paymentData: {
    type: DataTypes.JSON, // Store payment details
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  cancellationCharges: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  refundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  refundCompletedDate: {
    type: DataTypes.DATE,
    defaultValue: null,
  },
});

// Relationships
User.hasMany(Booking);
Booking.belongsTo(User);

Flight.hasMany(Booking);
Booking.belongsTo(Flight);

module.exports = Booking;

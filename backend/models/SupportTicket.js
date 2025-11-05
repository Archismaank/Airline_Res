const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const User = require('./User');

const SupportTicket = sequelize.define('SupportTicket', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  ticketNumber: {
    type: DataTypes.STRING,
    unique: true,
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'open', // open, in_progress, resolved, closed
  },
  priority: {
    type: DataTypes.STRING,
    defaultValue: 'medium', // low, medium, high
  },
  response: {
    type: DataTypes.TEXT,
    defaultValue: null,
  },
  responseDate: {
    type: DataTypes.DATE,
    defaultValue: null,
  },
});

// Relationships
User.hasMany(SupportTicket);
SupportTicket.belongsTo(User);

module.exports = SupportTicket;


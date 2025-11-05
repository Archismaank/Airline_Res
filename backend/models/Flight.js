const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Flight = sequelize.define('Flight', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  airline: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  from: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  to: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  departTime: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  arriveTime: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  duration: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  travelType: {
    type: DataTypes.STRING, // domestic or international
    allowNull: false,
  },
});

module.exports = Flight;

const { Sequelize } = require('sequelize');
const path = require('path');

// Setup SQLite database connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'), // database file
  logging: false,
});

module.exports = sequelize;

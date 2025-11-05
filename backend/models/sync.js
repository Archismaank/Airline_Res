const sequelize = require('./index');
const User = require('./User');
const Flight = require('./Flight');
const Booking = require('./Booking');

(async () => {
  try {
    await sequelize.sync({ force: true }); // recreate tables if they exist
    console.log('✅ Database synchronized successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database synchronization failed:', error);
    process.exit(1);
  }
})();

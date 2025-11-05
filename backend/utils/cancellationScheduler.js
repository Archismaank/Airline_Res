// Utility to check and update cancellation status automatically
const Booking = require('../models/Booking');

async function checkAndUpdateCancellations() {
  try {
    const now = new Date();
    const bookings = await Booking.findAll({
      where: {
        cancellationStatus: 'pending_cancellation',
      },
    });
    
    let updatedCount = 0;
    
    for (const booking of bookings) {
      if (booking.expectedRefundDate && new Date(booking.expectedRefundDate) <= now) {
        booking.cancellationStatus = 'cancelled';
        booking.refundCompletedDate = new Date();
        await booking.save();
        updatedCount++;
        console.log(`✅ Updated booking ${booking.pnr} to cancelled status with refund.`);
      }
    }
    
    if (updatedCount > 0) {
      console.log(`✅ Updated ${updatedCount} booking(s) to cancelled status.`);
    }
    
    return updatedCount;
  } catch (error) {
    // Only log error if it's not a schema error (column doesn't exist)
    if (error.name !== 'SequelizeDatabaseError' || !error.message.includes('no such column')) {
      console.error('Error checking cancellations:', error);
    }
    return 0;
  }
}

// Run check every hour
function startCancellationScheduler() {
  // Check immediately on startup
  checkAndUpdateCancellations();
  
  // Then check every hour
  setInterval(() => {
    checkAndUpdateCancellations();
  }, 60 * 60 * 1000); // 1 hour in milliseconds
  
  console.log('🕐 Cancellation status scheduler started (checks every hour)');
}

module.exports = {
  checkAndUpdateCancellations,
  startCancellationScheduler,
};


const express = require('express');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Flight = require('../models/Flight');

const router = express.Router();

// 🧾 Get all bookings
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    const where = userId ? { UserId: userId } : {};
    
    const bookings = await Booking.findAll({
      where,
      include: [User, Flight],
      order: [['createdAt', 'DESC']],
    });
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// 🧾 Check cancellation status by PNR and lastName
router.post('/check-cancellation', async (req, res) => {
  try {
    const { pnr, lastName } = req.body;
    
    if (!pnr || !lastName) {
      return res.status(400).json({ error: 'PNR and last name are required' });
    }
    
    // Try to find booking with case-insensitive PNR search
    const allBookings = await Booking.findAll({
      include: [User, Flight],
    });
    
    const booking = allBookings.find(b => 
      b.pnr && b.pnr.toUpperCase() === pnr.toUpperCase()
    );
    
    if (!booking) {
      console.log(`Booking not found for PNR: ${pnr.toUpperCase()}`);
      console.log(`Available PNRs: ${allBookings.map(b => b.pnr).join(', ')}`);
      return res.status(404).json({ error: 'Booking not found with the provided PNR' });
    }
    
    // Verify last name matches one of the passengers
    const passengers = booking.passengers || [];
    const lastNameMatch = passengers.some(
      (passenger) => passenger.lastName && passenger.lastName.toUpperCase() === lastName.toUpperCase()
    );
    
    if (!lastNameMatch) {
      return res.status(403).json({ error: 'Last name does not match the booking' });
    }
    
    // Return booking with cancellation details
    res.json({
      ...booking.toJSON(),
      message: 'Cancellation status retrieved successfully',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check cancellation status' });
  }
});

// 🧾 Get booking by PNR
router.get('/:pnr', async (req, res) => {
  try {
    const { pnr } = req.params;
    const booking = await Booking.findOne({
      where: { pnr },
      include: [User, Flight],
    });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// 🧾 Cancel booking
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByPk(id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Get total price from flightData or flight
    let totalPrice = booking.totalPrice || 0;
    if (!totalPrice && booking.flightData) {
      totalPrice = booking.flightData.price || 0;
    }
    if (!totalPrice && booking.Flight) {
      totalPrice = booking.Flight.price || 0;
    }
    
    // Calculate cancellation charges (30% of total price)
    const cancellationCharges = totalPrice * 0.30;
    
    // Calculate refund amount (70% of total price)
    const refundAmount = totalPrice * 0.70;
    
    // Calculate expected refund date (4-7 days from now)
    const daysUntilRefund = 4 + Math.floor(Math.random() * 4); // 4-7 days
    const expectedRefundDate = new Date();
    expectedRefundDate.setDate(expectedRefundDate.getDate() + daysUntilRefund);
    
    booking.status = 'cancelled';
    booking.cancellationStatus = 'pending_cancellation';
    booking.cancellationDate = new Date();
    booking.expectedRefundDate = expectedRefundDate;
    booking.totalPrice = totalPrice;
    booking.cancellationCharges = cancellationCharges;
    booking.refundAmount = refundAmount;
    
    await booking.save();
    
    res.json({
      ...booking.toJSON(),
      message: `Your booking will be cancelled. Refunds will be processed in ${daysUntilRefund} business days.`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// 🧾 Check and update cancellation status (should be called periodically)
router.get('/check-cancellations', async (req, res) => {
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
      }
    }
    
    res.json({
      message: `Updated ${updatedCount} booking(s) to cancelled status.`,
      updatedCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check cancellations' });
  }
});

// 🧾 Create booking
router.post('/', async (req, res) => {
  try {
    // Extract total price from flightData or flight
    let totalPrice = req.body.totalPrice || 0;
    if (!totalPrice && req.body.flightData) {
      totalPrice = req.body.flightData.price || 0;
    }
    if (!totalPrice && req.body.flight) {
      totalPrice = req.body.flight.price || 0;
    }
    
    const bookingData = {
      ...req.body,
      totalPrice: totalPrice,
    };
    
    const booking = await Booking.create(bookingData);
    res.status(201).json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

module.exports = router;

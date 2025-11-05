const express = require('express');
const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');

const router = express.Router();

// Generate unique ticket number
function generateTicketNumber() {
  const prefix = 'TKT';
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `${prefix}${random}`;
}

// 🎫 Get all tickets for a user
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const tickets = await SupportTicket.findAll({
      where: { UserId: userId },
      include: [User],
      order: [['createdAt', 'DESC']],
    });
    
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// 🎫 Get ticket by ticket number
router.get('/:ticketNumber', async (req, res) => {
  try {
    const { ticketNumber } = req.params;
    const ticket = await SupportTicket.findOne({
      where: { ticketNumber },
      include: [User],
    });
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// 🎫 Create new ticket
router.post('/', async (req, res) => {
  try {
    const { userId, name, email, subject, message } = req.body;
    
    if (!userId || !name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    let ticketNumber = generateTicketNumber();
    
    // Ensure ticket number is unique
    let existingTicket = await SupportTicket.findOne({ where: { ticketNumber } });
    while (existingTicket) {
      ticketNumber = generateTicketNumber();
      existingTicket = await SupportTicket.findOne({ where: { ticketNumber } });
    }
    
    const ticket = await SupportTicket.create({
      ticketNumber,
      UserId: userId,
      subject,
      message,
      status: 'open',
      priority: 'medium',
    });
    
    const ticketWithUser = await SupportTicket.findByPk(ticket.id, {
      include: [User],
    });
    
    res.status(201).json(ticketWithUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// 🎫 Update ticket status (admin)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, response } = req.body;
    
    const ticket = await SupportTicket.findByPk(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    if (status) ticket.status = status;
    if (response) {
      ticket.response = response;
      ticket.responseDate = new Date();
    }
    
    await ticket.save();
    
    const ticketWithUser = await SupportTicket.findByPk(ticket.id, {
      include: [User],
    });
    
    res.json(ticketWithUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

module.exports = router;


const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'mysecretkey';

// 📝 Register new user
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, mobile, password } = req.body;

    if (!fullName || !email || !mobile || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already registered.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ fullName, email, mobile, password: hashedPassword });

    // Return user info (excluding password)
    const userInfo = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
    };

    res.status(201).json({ message: 'User registered successfully', user: userInfo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// 🔑 Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) return res.status(400).json({ error: 'Invalid email or password.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid email or password.' });

    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '1d' });
    
    // Return user info (excluding password)
    const userInfo = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
    };
    
    res.json({ message: 'Login successful', token, user: userInfo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

module.exports = router;

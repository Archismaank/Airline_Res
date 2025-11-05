const express = require('express');
const { searchAirports, getAllAirports } = require('../data/airports');
const router = express.Router();

// 🔍 Search airports for autocomplete
router.get('/search', (req, res) => {
  try {
    const { q } = req.query;
    console.log('Airport search request:', q);
    
    if (!q || q.trim().length === 0) {
      return res.json([]);
    }
    
    const results = searchAirports(q);
    console.log('Airport search results:', results.length);
    
    res.json(results.slice(0, 10)); // Limit to 10 results
  } catch (err) {
    console.error('Airport search error:', err);
    res.status(500).json({ error: 'Failed to search airports' });
  }
});

// 📍 Get all airports
router.get('/', (req, res) => {
  try {
    const allAirports = getAllAirports();
    res.json(allAirports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch airports' });
  }
});

module.exports = router;


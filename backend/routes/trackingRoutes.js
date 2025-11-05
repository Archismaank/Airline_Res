const express = require('express');
const { getFlightByNumber, getFlightsInRegion } = require('../utils/flightTracker');
const router = express.Router();

// 🛫 Get flight tracking by flight number
router.get('/flight/:flightNumber', async (req, res) => {
  try {
    const { flightNumber } = req.params;
    const flight = getFlightByNumber(flightNumber);
    
    if (!flight) {
      return res.status(404).json({ error: 'Flight not found' });
    }
    
    res.json(flight);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch flight tracking' });
  }
});

// 📍 Get flights in a region (for map view)
router.get('/region', async (req, res) => {
  try {
    const { lamin, lomin, lamax, lomax } = req.query;
    
    if (!lamin || !lomin || !lamax || !lomax) {
      return res.status(400).json({ error: 'Missing region bounds' });
    }
    
    const bounds = { lamin, lomin, lamax, lomax };
    const flights = await getFlightsInRegion(bounds);
    
    res.json(flights);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch flights in region' });
  }
});

module.exports = router;


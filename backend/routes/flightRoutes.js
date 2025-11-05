const express = require('express');
const Flight = require('../models/Flight');
const { generateFlights } = require('../utils/flightGenerator');
const { getRealTimeFlights } = require('../utils/flightAPI');
const router = express.Router();

// Get API key for checking
require('dotenv').config();
const AVIATION_STACK_API_KEY = process.env.AVIATION_STACK_API_KEY || '';

// ✈️ Search flights with filters
router.get('/', async (req, res) => {
  try {
    const { from, to, date, returnDate, travelType, tripType } = req.query;
    
    // If search parameters provided, generate flights dynamically
    if (from && to && date && travelType) {
      // Extract airport codes (e.g., "Delhi (DEL)" -> "DEL")
      let fromCode = from.match(/\(([A-Z]{3})\)/)?.[1];
      let toCode = to.match(/\(([A-Z]{3})\)/)?.[1];
      
      // If codes not found, try to extract from end of string
      if (!fromCode) {
        const parts = from.split(' ');
        fromCode = parts[parts.length - 1].replace(/[()]/g, '').toUpperCase();
      }
      if (!toCode) {
        const parts = to.split(' ');
        toCode = parts[parts.length - 1].replace(/[()]/g, '').toUpperCase();
      }
      
      console.log('Flight search - From:', fromCode, 'To:', toCode, 'Type:', travelType, 'Date:', date);
      
      if (!fromCode || !toCode || fromCode.length !== 3 || toCode.length !== 3) {
        return res.status(400).json({ error: 'Invalid airport codes. Please select airports from suggestions.' });
      }
      
      // Try to get real-time flights first (if API key is available) with timeout
      let flights = null;
      let useRealTime = false;
      
      if (AVIATION_STACK_API_KEY) {
        try {
          // Set a timeout for the API call (3 seconds)
          const apiPromise = getRealTimeFlights(fromCode, toCode, date);
          const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 3000));
          
          flights = await Promise.race([apiPromise, timeoutPromise]);
          
          if (flights && Array.isArray(flights) && flights.length > 0) {
            console.log('✅ Using real-time flight data from AviationStack:', flights.length);
            useRealTime = true;
            
            // If round trip, also generate return flights
            if (tripType === 'round' && returnDate) {
              const returnFlights = await getRealTimeFlights(toCode, fromCode, returnDate) || generateFlights(toCode, fromCode, travelType, returnDate);
              return res.json({
                outbound: flights,
                return: returnFlights,
              });
            }
            return res.json(flights);
          } else {
            console.log('⚠️ No real-time flights found, using generated flights');
          }
        } catch (error) {
          console.log('⚠️ Real-time API error, using generated flights:', error.message);
        }
      }
      
      // Fallback to generated flights (always ensure flights are generated)
      if (!useRealTime) {
        console.log('Generating fallback flights for:', fromCode, 'to', toCode);
        flights = generateFlights(fromCode, toCode, travelType, date);
      }
      
      console.log('Generated flights:', flights.length);
      
      if (flights.length === 0) {
        // Return error if no flights generated
        return res.status(404).json({ error: 'No flights available for this route. Please try different airports or dates.' });
      }
      
      // If round trip, also generate return flights
      if (tripType === 'round' && returnDate) {
        const returnFlights = generateFlights(toCode, fromCode, travelType, returnDate);
        return res.json({
          outbound: flights,
          return: returnFlights,
        });
      }
      
      return res.json(flights);
    }
    
    // If no search params, return all flights from database
    const flights = await Flight.findAll();
    res.json(flights);
  } catch (err) {
    console.error('Flight search error:', err);
    res.status(500).json({ error: 'Failed to fetch flights: ' + err.message });
  }
});

// ✈️ Add flight (admin)
router.post('/', async (req, res) => {
  try {
    const flight = await Flight.create(req.body);
    res.status(201).json(flight);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create flight' });
  }
});

module.exports = router;

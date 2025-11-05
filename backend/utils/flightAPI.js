// Flight API integration using AviationStack (free tier available)
// For production, you would need to sign up at https://aviationstack.com/
// and get an API key. For now, we'll use enhanced simulation.

const https = require('https');

// AviationStack API configuration (requires API key)
const AVIATION_STACK_API_KEY = process.env.AVIATION_STACK_API_KEY || '';
const AVIATION_STACK_BASE_URL = 'https://api.aviationstack.com/v1';

// Real-time flight data from AviationStack (if API key is available)
async function getRealTimeFlights(fromCode, toCode, date) {
  if (!AVIATION_STACK_API_KEY) {
    console.log('No AviationStack API key found, using fallback');
    return null;
  }

  try {
    // Format date for API (YYYY-MM-DD)
    const formattedDate = date.split('T')[0] || date.split(' ')[0] || date;
    
    const url = `${AVIATION_STACK_BASE_URL}/flights?access_key=${AVIATION_STACK_API_KEY}&dep_iata=${fromCode}&arr_iata=${toCode}&flight_date=${formattedDate}`;
    
    console.log('Fetching real-time flights from AviationStack:', url.replace(AVIATION_STACK_API_KEY, '***'));
    
    return new Promise((resolve, reject) => {
      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.log('AviationStack API timeout, using fallback');
        resolve(null);
      }, 5000); // 5 second timeout
      
      const request = https.get(url, (res) => {
        let data = '';
        
        // Check response status
        if (res.statusCode !== 200) {
          console.error(`AviationStack API returned status ${res.statusCode}`);
          clearTimeout(timeout);
          res.on('data', () => {}); // Drain response
          res.on('end', () => resolve(null));
          return;
        }
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          clearTimeout(timeout);
          try {
            const result = JSON.parse(data);
            
            // Check for API errors
            if (result.error) {
              console.error('AviationStack API error:', result.error);
              resolve(null);
              return;
            }
            
            if (result.data && result.data.length > 0) {
              console.log(`Found ${result.data.length} real-time flights from AviationStack`);
              
              // Transform AviationStack data to our format
              const flights = result.data.map((flight) => {
                const departTime = flight.departure?.scheduled 
                  ? new Date(flight.departure.scheduled).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
                  : '00:00';
                
                const arriveTime = flight.arrival?.scheduled 
                  ? new Date(flight.arrival.scheduled).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
                  : '00:00';
                
                return {
                  id: flight.flight?.iata || flight.flight?.number || `flight-${Math.random()}`,
                  airline: flight.airline?.name || 'Unknown Airline',
                  flightNumber: flight.flight?.iata || flight.flight?.number || 'N/A',
                  logoBg: getAirlineLogoBg(flight.airline?.iata),
                  from: `${flight.departure?.airport || flight.departure?.city || ''} (${flight.departure?.iata || fromCode})`,
                  fromCode: flight.departure?.iata || fromCode,
                  to: `${flight.arrival?.airport || flight.arrival?.city || ''} (${flight.arrival?.iata || toCode})`,
                  toCode: flight.arrival?.iata || toCode,
                  departTime: departTime,
                  arriveTime: arriveTime,
                  duration: calculateDurationFromTimes(flight.departure?.scheduled, flight.arrival?.scheduled),
                  price: generatePriceFromRoute(flight.departure?.iata || fromCode, flight.arrival?.iata || toCode),
                  travelType: isDomestic(flight.departure?.iata || fromCode, flight.arrival?.iata || toCode) ? 'domestic' : 'international',
                  date: formattedDate,
                  status: flight.flight_status || 'scheduled',
                  realTime: true,
                };
              });
              
              resolve(flights);
            } else {
              console.log('No flights found in AviationStack response, using fallback');
              resolve(null); // No flights found, use fallback
            }
          } catch (error) {
            clearTimeout(timeout);
            console.error('Error parsing AviationStack response:', error);
            console.error('Response data:', data.substring(0, 500));
            // If API fails, return null to use fallback
            resolve(null);
          }
        });
      }).on('error', (error) => {
        clearTimeout(timeout);
        console.error('Error fetching from AviationStack:', error);
        resolve(null);
      });
    });
  } catch (error) {
    console.error('Error in getRealTimeFlights:', error);
    return null;
  }
}

// Helper function to check if route is domestic
function isDomestic(fromCode, toCode) {
  // Comprehensive Indian airport codes list
  const indianAirports = [
    'DEL', 'BOM', 'BLR', 'CCU', 'MAA', 'HYD', 'PNQ', 'GOI', 'JAI', 'AMD', 'COK', 'IXC', 'LKO', 'VNS', 'GAU', 
    'PAT', 'TRV', 'IXE', 'IXM', 'IXZ', 'IXU', 'IXJ', 'SXR', 'ATQ', 'IXR', 'RPR', 'BBI', 'VTZ', 'IDR', 'BDQ', 
    'STV', 'NAG', 'IXA', 'IXD', 'IXG', 'BHO', 'CJB', 'TIR', 'JLR', 'JDH', 'UDR', 'DED', 'GAY', 'IXW', 'KNU', 
    'IXL', 'IXP', 'IXS', 'IXT', 'IXV', 'JGB', 'JSA', 'JRH', 'KLH', 'KUU', 'LDA', 'LUH', 'NDC', 'PBD', 'PGH', 
    'PNS', 'PUT', 'RJA', 'RTC', 'SAG', 'SXV', 'TCR', 'TEZ', 'TJV', 'TNI', 'VGA', 'WGC', 'IXB'
  ];
  return indianAirports.includes(fromCode) && indianAirports.includes(toCode);
}

// Get airline logo background color
function getAirlineLogoBg(airlineCode) {
  const logoMap = {
    '6E': 'bg-indigo-600', // IndiGo
    'AI': 'bg-red-600', // Air India
    'SG': 'bg-orange-500', // SpiceJet
    'UK': 'bg-blue-700', // Vistara
    'G8': 'bg-cyan-500', // GoAir
    'I5': 'bg-red-500', // AirAsia India
    'EK': 'bg-red-600', // Emirates
    'SQ': 'bg-blue-600', // Singapore Airlines
    'QR': 'bg-purple-600', // Qatar Airways
    'EY': 'bg-amber-600', // Etihad Airways
    'BA': 'bg-blue-800', // British Airways
    'LH': 'bg-yellow-600', // Lufthansa
    'AF': 'bg-blue-500', // Air France
    'TG': 'bg-purple-700', // Thai Airways
    'MH': 'bg-blue-400', // Malaysia Airlines
    'CX': 'bg-green-600', // Cathay Pacific
    'JL': 'bg-red-500', // Japan Airlines
    'NH': 'bg-blue-500', // ANA
    'VS': 'bg-red-500', // Virgin Atlantic
    'DL': 'bg-blue-600', // Delta
    'AA': 'bg-blue-600', // American Airlines
    'UA': 'bg-blue-700', // United Airlines
  };
  return logoMap[airlineCode?.toUpperCase()] || 'bg-slate-600';
}

// Calculate duration from scheduled times
function calculateDurationFromTimes(departTime, arriveTime) {
  if (!departTime || !arriveTime) return '2h 30m';
  
  const depart = new Date(departTime);
  const arrive = new Date(arriveTime);
  const diff = arrive - depart;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
}

// Generate price based on route
function generatePriceFromRoute(fromCode, toCode) {
  // This would be enhanced with real pricing data
  // For now, use a simple calculation
  const isDom = isDomestic(fromCode, toCode);
  if (isDom) {
    return Math.floor(Math.random() * 13000) + 2000; // ₹2,000 - ₹15,000
  } else {
    return Math.floor(Math.random() * 1200) + 300; // $300 - $1,500
  }
}

module.exports = {
  getRealTimeFlights,
  isDomestic,
};


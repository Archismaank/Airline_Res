const { getAirportByCode, airports } = require('../data/airports');

// Indian airline names
const domesticAirlines = [
  { name: 'IndiGo', code: '6E', logoBg: 'bg-indigo-600' },
  { name: 'Air India', code: 'AI', logoBg: 'bg-red-600' },
  { name: 'SpiceJet', code: 'SG', logoBg: 'bg-orange-500' },
  { name: 'Vistara', code: 'UK', logoBg: 'bg-blue-700' },
  { name: 'GoAir', code: 'G8', logoBg: 'bg-cyan-500' },
  { name: 'AirAsia India', code: 'I5', logoBg: 'bg-red-500' },
];

const internationalAirlines = [
  { name: 'Emirates', code: 'EK', logoBg: 'bg-red-600' },
  { name: 'Singapore Airlines', code: 'SQ', logoBg: 'bg-blue-600' },
  { name: 'Qatar Airways', code: 'QR', logoBg: 'bg-purple-600' },
  { name: 'Etihad Airways', code: 'EY', logoBg: 'bg-amber-600' },
  { name: 'British Airways', code: 'BA', logoBg: 'bg-blue-800' },
  { name: 'Lufthansa', code: 'LH', logoBg: 'bg-yellow-600' },
  { name: 'Air France', code: 'AF', logoBg: 'bg-blue-500' },
  { name: 'Thai Airways', code: 'TG', logoBg: 'bg-purple-700' },
];

// Generate flight number
function generateFlightNumber(airlineCode) {
  const numbers = Math.floor(Math.random() * 900) + 100;
  return `${airlineCode} ${numbers}`;
}

// Calculate duration between airports (simplified)
function calculateDuration(fromCode, toCode, travelType) {
  if (travelType === 'domestic') {
    // Domestic flights: 1-4 hours
    const hours = Math.floor(Math.random() * 3) + 1;
    const minutes = Math.floor(Math.random() * 60);
    return `${hours}h ${minutes}m`;
  } else {
    // International flights: 4-18 hours
    const hours = Math.floor(Math.random() * 14) + 4;
    const minutes = Math.floor(Math.random() * 60);
    if (hours >= 12) {
      return `${hours}h ${minutes}m`;
    }
    return `${hours}h ${minutes}m`;
  }
}

// Generate time with some randomness
function generateTime() {
  const hour = Math.floor(Math.random() * 24);
  const minute = Math.floor(Math.random() * 60);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

// Calculate arrival time based on departure and duration
function calculateArrivalTime(departTime, duration) {
  const durationMatch = duration.match(/(\d+)h\s*(\d+)m/);
  if (!durationMatch) {
    return '00:00';
  }
  const hours = parseInt(durationMatch[1], 10);
  const minutes = parseInt(durationMatch[2], 10);
  const [departHour, departMinute] = departTime.split(':').map(Number);
  
  let arriveHour = departHour + hours;
  let arriveMinute = departMinute + minutes;
  
  if (arriveMinute >= 60) {
    arriveHour += 1;
    arriveMinute -= 60;
  }
  
  const totalDays = Math.floor(arriveHour / 24);
  if (arriveHour >= 24) {
    arriveHour = arriveHour % 24;
  }
  
  const timeStr = `${String(arriveHour).padStart(2, '0')}:${String(arriveMinute).padStart(2, '0')}`;
  return totalDays > 0 ? `${timeStr} +${totalDays}` : timeStr;
}

// Generate price based on route and travel type
function generatePrice(fromCode, toCode, travelType) {
  if (travelType === 'domestic') {
    // Domestic: ₹2,000 - ₹15,000 (in rupees)
    return Math.floor(Math.random() * 13000) + 2000;
  } else {
    // International: $300 - $1500 (in dollars)
    return Math.floor(Math.random() * 1200) + 300;
  }
}

// Generate flights for a route
function generateFlights(fromCode, toCode, travelType, date) {
  const flights = [];
  const airlines = travelType === 'domestic' ? domesticAirlines : internationalAirlines;
  const fromAirport = getAirportByCode(fromCode);
  const toAirport = getAirportByCode(toCode);
  
  console.log('Generating flights - From:', fromCode, 'To:', toCode, 'From Airport:', fromAirport, 'To Airport:', toAirport);
  
  if (!fromAirport || !toAirport) {
    console.error('Airport not found - From:', fromCode, 'To:', toCode);
    // Even if airports not found, generate flights with basic info
    const fromCity = fromCode;
    const toCity = toCode;
    const numFlights = Math.floor(Math.random() * 4) + 3;
    
    for (let i = 0; i < numFlights; i++) {
      const airline = airlines[Math.floor(Math.random() * airlines.length)];
      const flightNumber = generateFlightNumber(airline.code);
      const departTime = generateTime();
      const duration = calculateDuration(fromCode, toCode, travelType);
      const arriveTime = calculateArrivalTime(departTime, duration);
      const price = generatePrice(fromCode, toCode, travelType);
      
      flights.push({
        id: `${airline.code}${Math.floor(Math.random() * 9000) + 1000}`,
        airline: airline.name,
        flightNumber: flightNumber,
        logoBg: airline.logoBg,
        from: `${fromCity} (${fromCode})`,
        fromCode: fromCode,
        to: `${toCity} (${toCode})`,
        toCode: toCode,
        departTime: departTime,
        arriveTime: arriveTime,
        duration: duration,
        price: price,
        travelType: travelType,
        date: date,
      });
    }
    
    return flights.sort((a, b) => a.departTime.localeCompare(b.departTime));
  }
  
  // Generate 3-6 flights per route
  const numFlights = Math.floor(Math.random() * 4) + 3;
  
  for (let i = 0; i < numFlights; i++) {
    const airline = airlines[Math.floor(Math.random() * airlines.length)];
    const flightNumber = generateFlightNumber(airline.code);
    const departTime = generateTime();
    const duration = calculateDuration(fromCode, toCode, travelType);
    const arriveTime = calculateArrivalTime(departTime, duration);
    const price = generatePrice(fromCode, toCode, travelType);
    
    flights.push({
      id: `${airline.code}${Math.floor(Math.random() * 9000) + 1000}`,
      airline: airline.name,
      flightNumber: flightNumber,
      logoBg: airline.logoBg,
      from: `${fromAirport.city} (${fromCode})`,
      fromCode: fromCode,
      to: `${toAirport.city} (${toCode})`,
      toCode: toCode,
      departTime: departTime,
      arriveTime: arriveTime,
      duration: duration,
      price: price,
      travelType: travelType,
      date: date,
    });
  }
  
  console.log('Generated', flights.length, 'flights');
  return flights.sort((a, b) => a.departTime.localeCompare(b.departTime));
}

module.exports = {
  generateFlights,
  generatePrice,
};


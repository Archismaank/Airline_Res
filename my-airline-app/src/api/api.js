// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// 👤 Register new user
export async function registerUser(userData) {
  const res = await fetch(`${API_BASE_URL}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return res.json();
}

// 🔐 Login user
export async function loginUser(credentials) {
  const res = await fetch(`${API_BASE_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return res.json();
}

// ✈️ Search flights with filters
export async function searchFlights(searchParams) {
  const { from, to, date, returnDate, travelType, tripType } = searchParams;
  const queryParams = new URLSearchParams({
    from: from || '',
    to: to || '',
    date: date || '',
    returnDate: returnDate || '',
    travelType: travelType || '',
    tripType: tripType || 'oneWay',
  });
  
  const url = `${API_BASE_URL}/flights?${queryParams}`;
  console.log('🔍 Searching flights at:', url.replace(API_BASE_URL, 'API_BASE_URL'));
  console.log('🔍 API Base URL:', API_BASE_URL);
  
  try {
    const res = await fetch(url);
    
    if (!res.ok) {
      // Try to get error details
      let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        const text = await res.text().catch(() => '');
        if (text) errorMessage = text;
      }
      
      // Provide more helpful error messages
      if (res.status === 404) {
        errorMessage = `API endpoint not found. Please check your REACT_APP_API_URL environment variable. Current: ${API_BASE_URL}`;
      } else if (res.status === 0 || res.status === 'TypeError') {
        errorMessage = `Cannot connect to backend API. Please verify REACT_APP_API_URL is set correctly. Current: ${API_BASE_URL}`;
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('❌ Flight search API error:', error);
    console.error('   API URL:', API_BASE_URL);
    console.error('   Full URL:', url);
    
    // Provide more helpful error for network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(`Cannot connect to backend API at ${API_BASE_URL}. Please check your REACT_APP_API_URL environment variable.`);
    }
    
    throw error;
  }
}

// ✈️ Get all flights (legacy)
export async function getFlights() {
  const res = await fetch(`${API_BASE_URL}/flights`);
  return res.json();
}

// 🔍 Search airports for autocomplete
export async function searchAirports(query) {
  if (!query || query.trim().length === 0) {
    return [];
  }
  try {
    const res = await fetch(`${API_BASE_URL}/airports/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      console.error('Airport search failed:', res.status, res.statusText);
      return [];
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error fetching airport suggestions:', error);
    return [];
  }
}

// 💺 Create a booking
export async function createBooking(bookingData) {
  const res = await fetch(`${API_BASE_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData),
  });
  return res.json();
}

// 🧾 Get all bookings
export async function getBookings() {
  const res = await fetch(`${API_BASE_URL}/bookings`);
  return res.json();
}

// 🛫 Get flight tracking by flight number
export async function getFlightTracking(flightNumber) {
  try {
    const res = await fetch(`${API_BASE_URL}/tracking/flight/${encodeURIComponent(flightNumber)}`);
    if (!res.ok) {
      throw new Error('Failed to fetch flight tracking');
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching flight tracking:', error);
    return null;
  }
}

// 📍 Get flights in a region
export async function getFlightsInRegion(bounds) {
  try {
    const { lamin, lomin, lamax, lomax } = bounds;
    const res = await fetch(`${API_BASE_URL}/tracking/region?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`);
    if (!res.ok) {
      throw new Error('Failed to fetch flights in region');
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching flights in region:', error);
    return [];
  }
}

// 🧾 Get user bookings
export async function getUserBookings(userId) {
  try {
    const res = await fetch(`${API_BASE_URL}/bookings?userId=${userId}`);
    if (!res.ok) {
      throw new Error('Failed to fetch bookings');
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return [];
  }
}

// 🧾 Cancel booking
export async function cancelBooking(bookingId) {
  try {
    const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Failed to cancel booking' }));
      throw new Error(errorData.error || 'Failed to cancel booking');
    }
    return res.json();
  } catch (error) {
    console.error('Error canceling booking:', error);
    throw error;
  }
}

// 🎫 Get user tickets
export async function getUserTickets(userId) {
  try {
    const res = await fetch(`${API_BASE_URL}/tickets?userId=${userId}`);
    if (!res.ok) {
      throw new Error('Failed to fetch tickets');
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    return [];
  }
}

// 🎫 Create support ticket
export async function createTicket(ticketData) {
  try {
    const res = await fetch(`${API_BASE_URL}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketData),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Failed to create ticket' }));
      throw new Error(errorData.error || 'Failed to create ticket');
    }
    return res.json();
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
}

// 🚫 Check cancellation status by PNR and lastName
export async function checkCancellationStatus(pnr, lastName) {
  try {
    const res = await fetch(`${API_BASE_URL}/bookings/check-cancellation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pnr, lastName }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Failed to check cancellation status' }));
      throw new Error(errorData.error || 'Failed to check cancellation status');
    }
    return res.json();
  } catch (error) {
    console.error('Error checking cancellation status:', error);
    throw error;
  }
}

import { registerUser, loginUser, searchFlights, createBooking, searchAirports, getUserBookings, cancelBooking, getUserTickets, createTicket, checkCancellationStatus } from './api/api';
import { searchAirportsLocal } from './data/airports';
import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  Plane,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Search,
  Loader2,
  LogIn,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  CreditCard,
  CheckCircle,
  Info,
  XCircle,
  Armchair,
} from 'lucide-react';

const HERO_IMAGE = "https://images.unsplash.com/photo-1502920917128-1aa500764b43?auto=format&fit=crop&w=1600&q=80";

const ADDONS = [
  { id: 'meal', label: 'In-Flight Meal', description: 'Enjoy a gourmet meal tailored to your preferences.', price: 450 },
  { id: 'baggage', label: 'Extra Baggage', description: 'Add 15kg of additional checked-in baggage.', price: 750 },
  { id: 'insurance', label: 'Travel Insurance', description: 'Comprehensive coverage for your entire journey.', price: 550 },
  { id: 'hotel', label: 'Hotel & Itinerary Package', description: 'Curated stays and excursions at your destination.', price: 950 },
];

const SEAT_COLS = ['A', 'B', 'C', 'D', 'E', 'F'];
const SEAT_ROWS = 10;

// Generate seat price (0-2000 range) based on seat position
const getSeatPrice = (seat) => {
  // Extract row and column from seat (e.g., "2F" -> row: 2, col: "F")
  const match = seat.match(/(\d+)([A-F])/);
  if (!match) return 0;
  
  const row = parseInt(match[1]);
  const col = match[2];
  const colIndex = SEAT_COLS.indexOf(col);
  
  // Price based on: window seats (A, F) cost more, front rows cost more
  // Formula: base price + row premium + column premium
  const basePrice = 100;
  const rowPremium = (SEAT_ROWS - row + 1) * 50; // Front rows cost more (up to 500)
  const colPremium = (colIndex === 0 || colIndex === 5) ? 200 : (colIndex === 1 || colIndex === 4) ? 100 : 0; // Window/middle/aisle
  
  const price = basePrice + rowPremium + colPremium;
  // Ensure price is in 0-2000 range
  return Math.min(Math.max(price, 0), 2000);
};

const tripTypeLabels = {
  round: 'Round Trip',
  oneWay: 'One Way',
};

const travelTypeLabels = {
  domestic: 'Domestic',
  international: 'International',
};

const formatPrice = (value, travelType = 'domestic') => {
  if (travelType === 'domestic') {
    return `₹${value.toLocaleString('en-IN')}`;
  } else {
    return `$${value.toLocaleString()}`;
  }
};

const generatePNR = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const pick = (source, length) =>
    Array.from({ length }, () => source[Math.floor(Math.random() * source.length)]).join('');
  return `${pick(letters, 3)}${pick(digits, 3)}`;
};

const Modal = ({ open, tone = 'info', title, message, onClose }) => {
  if (!open) return null;

  const toneStyles = {
    success: 'bg-emerald-100 text-emerald-800',
    info: 'bg-blue-100 text-blue-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-rose-100 text-rose-800',
  };

  const toneIcons = {
    success: CheckCircle,
    info: Info,
    warning: Info,
    danger: XCircle,
  };

  const Icon = toneIcons[tone] ?? Info;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className={`flex items-center gap-3 rounded-t-2xl px-6 py-4 ${toneStyles[tone]}`}>
          <Icon className="h-6 w-6" />
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm opacity-90">{message}</p>
          </div>
        </div>
        <div className="flex justify-end px-6 py-4">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const Header = ({ currentPage, onNavigate, onAuthToggle, user, handleLogout }) => (
  <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg">
          <Plane className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">MyAirline</p>
          <h1 className="text-xl font-bold text-slate-800">Fly Beyond Ordinary</h1>
        </div>
      </div>
      <nav className="flex items-center gap-6 text-sm font-medium">
        {[
          { label: 'Book', page: 'home' },
          { label: 'Manage Booking', page: 'manage' },
          { label: 'Check Cancellation', page: 'checkCancellation' },
          { label: 'Customer Support', page: 'support' },
          ...(user ? [{ label: 'Profile', page: 'profile' }] : []),
        ].map((item) => (
          <button
            key={item.page}
            onClick={() => onNavigate(item.page)}
            className={`cursor-pointer rounded-full px-4 py-2 transition ${
              currentPage === item.page ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {item.label}
          </button>
        ))}

        {user ? (
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="flex cursor-pointer items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-slate-700 hover:bg-slate-200"
            >
              <LogIn className="h-4 w-4" />
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={onAuthToggle}
            className={`flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 transition ${
              currentPage === 'auth'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <LogIn className="h-4 w-4" />
            Login / Register
          </button>
        )}

      </nav>
    </div>
  </header>
);

const PageShell = ({ children }) => (
  <main className="flex-1 bg-slate-50">
    <div className="mx-auto max-w-7xl px-6 py-10">{children}</div>
  </main>
);

const BookingStepper = ({ current }) => {
  const steps = [
    'Passenger Details',
    'Enhance Your Trip',
    'Seat Selection',
    'Payment',
    'Confirmation',
  ];

  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm">
      {steps.map((label, index) => {
        const step = index + 1;
        const isActive = current === step;
        const isComplete = current > step;
        return (
          <div key={label} className="flex flex-1 flex-col items-center text-center">
            <div
              className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${
                isActive
                  ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200'
                  : isComplete
                  ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                  : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              {step}
            </div>
            <p
              className={`text-xs font-medium uppercase tracking-wide ${
                isActive ? 'text-blue-600' : isComplete ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              {label}
            </p>
          </div>
        );
      })}
    </div>
  );
};

const SeatGrid = ({ selectedSeats, onToggleSeat, seatLimit, travelType = 'domestic' }) => {
  const seats = Array.from({ length: SEAT_ROWS }, (_, rowIndex) =>
    SEAT_COLS.map((col) => `${rowIndex + 1}${col}`)
  ).flat();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-6 gap-3 rounded-2xl bg-white p-6 shadow-sm">
        {seats.map((seat) => {
          const isSelected = selectedSeats.includes(seat);
          const disabled = !isSelected && selectedSeats.length >= seatLimit;
          const seatPrice = getSeatPrice(seat);
          return (
            <button
              key={seat}
              onClick={() => onToggleSeat(seat)}
              disabled={disabled}
              className={`flex h-20 flex-col items-center justify-center rounded-xl border text-xs font-semibold transition ${
                isSelected
                  ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-md'
                  : disabled
                  ? 'border-slate-200 bg-slate-100 text-slate-400'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50'
              }`}
            >
              <Armchair className="mb-1 h-4 w-4" />
              <span className="text-xs font-bold">{seat}</span>
              <span className="text-xs text-slate-500">{formatPrice(seatPrice, travelType)}</span>
            </button>
          );
        })}
      </div>
      {selectedSeats.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-800 mb-2">Selected Seats:</p>
          <div className="flex flex-wrap gap-2">
            {selectedSeats.map((seat) => {
              const seatPrice = getSeatPrice(seat);
              return (
                <span key={seat} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1 text-xs font-semibold text-blue-700">
                  {seat} - {formatPrice(seatPrice, travelType)}
                </span>
              );
            })}
          </div>
          <p className="text-xs text-blue-700 mt-2">
            Total Seats: {formatPrice(selectedSeats.reduce((sum, seat) => sum + getSeatPrice(seat), 0), travelType)}
          </p>
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [page, setPage] = useState('home');
  const [tripType, setTripType] = useState('round');
  const [travelType, setTravelType] = useState('domestic');
  const [searchForm, setSearchForm] = useState({
    from: '',
    to: '',
    depart: '',
    return: '',
    adults: 1,
    children: 0,
    infants: 0,
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingPassengers, setBookingPassengers] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [payment, setPayment] = useState({ cardName: '', cardNumber: '', expiry: '', cvv: '' });
  const [confirmation, setConfirmation] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [manageForm, setManageForm] = useState({ pnr: '', lastName: '' });
  const [activeBooking, setActiveBooking] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ fullName: '', email: '', mobile: '', password: '' });
  const [modal, setModal] = useState({ open: false, tone: 'info', title: '', message: '' });
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [supportForm, setSupportForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [cancellationCheckForm, setCancellationCheckForm] = useState({ pnr: '', lastName: '' });
  const [cancellationCheckResult, setCancellationCheckResult] = useState(null);
  const fromTimeoutRef = useRef(null);
  const toTimeoutRef = useRef(null);
  
  const fetchUserBookings = useCallback(async () => {
    if (!user || !user.id) return;
    try {
      const userBookings = await getUserBookings(user.id);
      setBookings(userBookings);
    } catch (error) {
      console.error('Error fetching user bookings:', error);
    }
  }, [user]);
  
  const fetchUserTickets = useCallback(async () => {
    if (!user || !user.id) return;
    try {
      const userTickets = await getUserTickets(user.id);
      setTickets(userTickets);
    } catch (error) {
      console.error('Error fetching user tickets:', error);
    }
  }, [user]);

  // Fetch user data on login
  React.useEffect(() => {
    if (user && user.id) {
      fetchUserBookings();
      fetchUserTickets();
    }
  }, [user, fetchUserBookings, fetchUserTickets]);
  
  // Auto-refresh bookings to check for cancellation status updates (every minute)
  React.useEffect(() => {
    if (user && user.id && bookings.length > 0) {
      const interval = setInterval(async () => {
        // Check if any booking has pending cancellation
        const hasPendingCancellation = bookings.some(b => b.cancellationStatus === 'pending_cancellation');
        if (hasPendingCancellation) {
          await fetchUserBookings();
        }
      }, 60000); // Check every minute
      
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, bookings.length, fetchUserBookings]);

  const totalPassengers = useMemo(
    () => searchForm.adults + searchForm.children + searchForm.infants,
    [searchForm]
  );

  const seatLimit = useMemo(
    () => bookingPassengers.filter((p) => p.type !== 'Infant').length || bookingPassengers.length,
    [bookingPassengers]
  );

  const closeModal = () => setModal((prev) => ({ ...prev, open: false }));
  const showModal = (tone, title, message) => setModal({ open: true, tone, title, message });

  const resetBookingFlow = () => {
    setSelectedFlight(null);
    setBookingStep(1);
    setBookingPassengers([]);
    setSelectedAddons([]);
    setSelectedSeats([]);
    setPayment({ cardName: '', cardNumber: '', expiry: '', cvv: '' });
    setConfirmation(null);
  };

  const resetHome = () => {
    resetBookingFlow();
    setSearchResults([]);
    setPage('home');
  };

  const toggleTripType = (type) => {
    setTripType(type);
    if (type === 'oneWay') {
      setSearchForm((prev) => ({ ...prev, return: '' }));
    }
  };

  const toggleTravelType = (type) => setTravelType(type);

  const updatePassengerCount = (field, delta) => {
    setSearchForm((prev) => {
      const minValue = field === 'adults' ? 1 : 0;
      const nextValue = Math.max(minValue, prev[field] + delta);
      const nextTotals = prev.adults + prev.children + prev.infants + (nextValue - prev[field]);
      if (delta > 0 && nextTotals > 100) {
        showModal('warning', 'Passenger Limit Reached', 'You can book up to 100 passengers per reservation.');
        return prev;
      }
      return { ...prev, [field]: nextValue };
    });
  };

  // Handle airport autocomplete with debouncing
  const handleFromInputChange = async (value) => {
    setSearchForm((prev) => ({ ...prev, from: value }));
    
    // Clear previous timeout
    if (fromTimeoutRef.current) {
      clearTimeout(fromTimeoutRef.current);
    }
    
    // Don't show suggestions if input is in format "City (CODE)"
    if (value.match(/\([A-Z]{3}\)$/)) {
      setFromSuggestions([]);
      setShowFromSuggestions(false);
      return;
    }
    
    if (value.length >= 1) {
      // Show immediate local results first
      const localResults = searchAirportsLocal(value);
      setFromSuggestions(localResults);
      setShowFromSuggestions(localResults.length > 0);
      
      // Then try to fetch from API (optional, for server-side filtering)
      fromTimeoutRef.current = setTimeout(async () => {
        try {
          const suggestions = await searchAirports(value);
          if (Array.isArray(suggestions) && suggestions.length > 0) {
            setFromSuggestions(suggestions);
            setShowFromSuggestions(true);
          }
        } catch (error) {
          console.error('Error fetching airport suggestions from API (using local results):', error);
          // Keep using local results
        }
      }, 100); // Very short delay for API call
    } else {
      setFromSuggestions([]);
      setShowFromSuggestions(false);
    }
  };

  const handleToInputChange = async (value) => {
    setSearchForm((prev) => ({ ...prev, to: value }));
    
    // Clear previous timeout
    if (toTimeoutRef.current) {
      clearTimeout(toTimeoutRef.current);
    }
    
    // Don't show suggestions if input is in format "City (CODE)"
    if (value.match(/\([A-Z]{3}\)$/)) {
      setToSuggestions([]);
      setShowToSuggestions(false);
      return;
    }
    
    if (value.length >= 1) {
      // Show immediate local results first
      const localResults = searchAirportsLocal(value);
      setToSuggestions(localResults);
      setShowToSuggestions(localResults.length > 0);
      
      // Then try to fetch from API (optional, for server-side filtering)
      toTimeoutRef.current = setTimeout(async () => {
        try {
          const suggestions = await searchAirports(value);
          if (Array.isArray(suggestions) && suggestions.length > 0) {
            setToSuggestions(suggestions);
            setShowToSuggestions(true);
          }
        } catch (error) {
          console.error('Error fetching airport suggestions from API (using local results):', error);
          // Keep using local results
        }
      }, 100); // Very short delay for API call
    } else {
      setToSuggestions([]);
      setShowToSuggestions(false);
    }
  };

  const selectFromAirport = (airport) => {
    const airportStr = `${airport.city} (${airport.code})`;
    setSearchForm((prev) => ({ ...prev, from: airportStr }));
    setShowFromSuggestions(false);
    setFromSuggestions([]);
  };

  const selectToAirport = (airport) => {
    const airportStr = `${airport.city} (${airport.code})`;
    setSearchForm((prev) => ({ ...prev, to: airportStr }));
    setShowToSuggestions(false);
    setToSuggestions([]);
  };

  // Helper function to extract or find airport code
  const getAirportCode = async (input) => {
    // If already in format "City (CODE)", extract code
    const match = input.match(/\(([A-Z]{3})\)/);
    if (match) {
      return match[1];
    }
    
    // Try to find airport by city name or code
    if (input.length >= 2) {
      try {
        const suggestions = await searchAirports(input);
        if (suggestions.length > 0) {
          // Use the first matching suggestion
          return suggestions[0].code;
        }
      } catch (error) {
        console.error('Error finding airport:', error);
      }
    }
    
    return null;
  };

  const handleSearchFlights = async () => {
    if (!searchForm.from || !searchForm.to || !searchForm.depart) {
      showModal('warning', 'Missing Details', 'Please provide origin, destination, and departure date.');
      return;
    }
    
    // Try to get airport codes - be more flexible
    const fromCode = await getAirportCode(searchForm.from);
    const toCode = await getAirportCode(searchForm.to);
    
    if (!fromCode || !toCode) {
      showModal('warning', 'Invalid Airport', 'Please select an airport from the suggestions or type the full city/airport name.');
      return;
    }
    
    // Format the airport strings properly
    const fromAirport = searchForm.from.match(/\(([A-Z]{3})\)/) 
      ? searchForm.from 
      : `${searchForm.from} (${fromCode})`;
    const toAirport = searchForm.to.match(/\(([A-Z]{3})\)/) 
      ? searchForm.to 
      : `${searchForm.to} (${toCode})`;
    
    setIsSearching(true);
    try {
      const searchParams = {
        from: fromAirport,
        to: toAirport,
        date: searchForm.depart,
        returnDate: searchForm.return || '',
        travelType: travelType,
        tripType: tripType,
      };
      
      const result = await searchFlights(searchParams);
      console.log('Flight search result:', result);
      
      // Handle both single array and round trip object
      if (result && result.outbound) {
        // Round trip
        const outboundFlights = Array.isArray(result.outbound) ? result.outbound : [];
        setSearchResults(outboundFlights);
        showModal('success', 'Flights Loaded', `Found ${outboundFlights.length} outbound and ${result.return?.length || 0} return flights.`);
      } else if (Array.isArray(result)) {
        // One way - result is an array
        setSearchResults(result);
        if (result.length === 0) {
          showModal('warning', 'No Flights Found', 'No flights available for the selected route and date. Please try different dates or routes.');
        } else {
          showModal('success', 'Flights Loaded', `Found ${result.length} available flights.`);
        }
      } else if (result && result.error) {
        // Error response
        showModal('danger', 'Error', result.error || 'Failed to fetch flights. Please try again.');
        setSearchResults([]);
      } else {
        // Unknown response format
        console.error('Unexpected response format:', result);
        setSearchResults([]);
        showModal('warning', 'No Flights Found', 'No flights available for the selected route.');
      }
    } catch (error) {
      console.error('Search error:', error);
      let errorMessage = error.message || 'Failed to fetch flights.';
      
      // Provide more helpful error messages
      if (error.message && error.message.includes('404')) {
        errorMessage = 'Backend API endpoint not found. Please check your REACT_APP_API_URL environment variable in Render.';
      } else if (error.message && error.message.includes('Cannot connect')) {
        errorMessage = 'Cannot connect to backend API. Please verify your backend is deployed and REACT_APP_API_URL is set correctly.';
      } else if (error.message && error.message.includes('localhost')) {
        errorMessage = 'API is pointing to localhost. Please set REACT_APP_API_URL to your deployed backend URL in Render environment variables.';
      }
      
      showModal('danger', 'Error', errorMessage);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };


  const startBookingFlow = (flight) => {
    if (totalPassengers < 1) {
      showModal('warning', 'Add Passengers', 'Please add at least one passenger before booking.');
      return;
    }
    const passengerTypes = [
      ...Array.from({ length: searchForm.adults }, () => 'Adult'),
      ...Array.from({ length: searchForm.children }, () => 'Child'),
      ...Array.from({ length: searchForm.infants }, () => 'Infant'),
    ];
    const initialPassengers = passengerTypes.map((type, index) => ({
      id: `${type}-${index + 1}`,
      type,
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      specialRequest: '',
    }));
    setSelectedFlight({ ...flight, travelType });
    setBookingPassengers(initialPassengers);
    setSelectedAddons([]);
    setSelectedSeats([]);
    setPayment({ cardName: '', cardNumber: '', expiry: '', cvv: '' });
    setConfirmation(null);
    setBookingStep(1);
    setPage('booking');
  };

  const updatePassengerField = (id, field, value) => {
    setBookingPassengers((prev) => prev.map((passenger) => (passenger.id === id ? { ...passenger, [field]: value } : passenger)));
  };

  const toggleAddon = (addonId) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  const toggleSeat = (seat) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seat)) {
        return prev.filter((item) => item !== seat);
      }
      if (prev.length >= seatLimit) {
        return prev;
      }
      return [...prev, seat];
    });
  };

  // Calculate total price including flight, add-ons, and seats
  // Price is multiplied by number of paying passengers (adults + children, not infants)
  const calculateTotalPrice = useMemo(() => {
    if (!selectedFlight) return 0;
    
    // Get number of paying passengers (adults + children, infants are free)
    const payingPassengers = searchForm.adults + searchForm.children;
    
    // Base flight price per passenger
    const flightPricePerPassenger = selectedFlight.price || 0;
    
    // Total flight price = price per passenger × number of passengers
    const totalFlightPrice = flightPricePerPassenger * payingPassengers;
    
    // Add-ons price (per passenger, so multiply by number of passengers)
    const addonPricePerPassenger = selectedAddons.reduce((sum, addonId) => {
      const addon = ADDONS.find(a => a.id === addonId);
      return sum + (addon ? addon.price : 0);
    }, 0);
    const totalAddonsPrice = addonPricePerPassenger * payingPassengers;
    
    // Seats price (already per seat, so no multiplication needed)
    const seatsPrice = selectedSeats.reduce((sum, seat) => {
      return sum + getSeatPrice(seat);
    }, 0);
    
    return totalFlightPrice + totalAddonsPrice + seatsPrice;
  }, [selectedFlight, selectedAddons, selectedSeats, searchForm.adults, searchForm.children]);

  const proceedToNextStep = async () => {
    if (bookingStep === 1) {
      const incompletePassenger = bookingPassengers.find((passenger) => !passenger.firstName || !passenger.lastName);
      if (incompletePassenger) {
        showModal(
          'warning',
          'Passenger Details Incomplete',
          'Please provide first and last name for every passenger to continue.'
        );
        return;
      }
    }
    if (bookingStep === 3 && selectedSeats.length < seatLimit) {
      showModal(
        'warning',
        'Seat Selection Incomplete',
        `Please select ${seatLimit} seat${seatLimit > 1 ? 's' : ''} to proceed.`
      );
      return;
    }
    if (bookingStep === 4) {
      if (!payment.cardName || !payment.cardNumber || !payment.expiry || !payment.cvv) {
        showModal('warning', 'Payment Details Missing', 'Kindly complete the payment form to continue.');
        return;
      }
      
      const pnr = generatePNR();
      
      // Calculate total price including add-ons and seats
      // Get number of paying passengers (adults + children, infants are free)
      const payingPassengers = searchForm.adults + searchForm.children;
      
      // Base flight price per passenger
      const flightPricePerPassenger = selectedFlight.price || 0;
      
      // Total flight price = price per passenger × number of passengers
      const totalFlightPrice = flightPricePerPassenger * payingPassengers;
      
      // Add-ons price (per passenger, so multiply by number of passengers)
      const addonPricePerPassenger = selectedAddons.reduce((sum, addonId) => {
        const addon = ADDONS.find(a => a.id === addonId);
        return sum + (addon ? addon.price : 0);
      }, 0);
      const totalAddonsPrice = addonPricePerPassenger * payingPassengers;
      
      // Seats price (already per seat, so no multiplication needed)
      const seatsPrice = selectedSeats.reduce((sum, seat) => {
        return sum + getSeatPrice(seat);
      }, 0);
      
      const totalPrice = totalFlightPrice + totalAddonsPrice + seatsPrice;
      
      const bookingRecord = {
        pnr,
        flight: selectedFlight,
        passengers: bookingPassengers,
        addons: ADDONS.filter((addon) => selectedAddons.includes(addon.id)),
        seats: selectedSeats,
        payment,
        status: 'confirmed',
        flightData: selectedFlight,
        paymentData: payment,
        totalPrice: totalPrice,
        UserId: user?.id || null,
      };
      
      // Always save to backend so it can be found for cancellation checks
      try {
        const savedBooking = await createBooking(bookingRecord);
        // Update with backend ID
        bookingRecord.id = savedBooking.id;
        bookingRecord.createdAt = savedBooking.createdAt;
        setBookings((prev) => [...prev, bookingRecord]);
        
        // Refresh user bookings if logged in
        if (user && user.id) {
          await fetchUserBookings();
        }
      } catch (error) {
        console.error('Error saving booking to backend:', error);
        // Still save locally even if backend save fails
        setBookings((prev) => [...prev, bookingRecord]);
        showModal('warning', 'Booking Saved Locally', `Your reservation is confirmed! PNR: ${pnr}. Note: Booking was not saved to backend.`);
      }
      
      setActiveBooking(bookingRecord);
      setConfirmation({ pnr, message: 'Your reservation is confirmed. A confirmation email has been sent to you.' });
      setBookingStep(5);
      
      if (user && user.id) {
        showModal('success', 'Booking Confirmed', `Your reservation is confirmed! PNR: ${pnr}`);
      } else {
        showModal('success', 'Booking Confirmed', `Your reservation is confirmed! PNR: ${pnr}. Login to save your booking permanently.`);
      }
      return;
    }
    setBookingStep((prev) => Math.min(prev + 1, 5));
  };

  const goToPreviousStep = () => setBookingStep((prev) => Math.max(prev - 1, 1));

  const handlePaymentField = (field, value) => setPayment((prev) => ({ ...prev, [field]: value }));

  const handleRetrieveBooking = async (event) => {
    event.preventDefault();
    const { pnr, lastName } = manageForm;
    if (!pnr || !lastName) {
      showModal('warning', 'Provide Booking Details', 'Enter both PNR and last name to retrieve your booking.');
      return;
    }
    
    // First check local bookings
    let booking = bookings.find(
      (item) => item.pnr.toUpperCase() === pnr.toUpperCase() &&
        item.passengers && item.passengers.some && item.passengers.some((passenger) => passenger.lastName.toUpperCase() === lastName.toUpperCase())
    );
    
    // If not found locally and user is logged in, try to fetch from backend
    if (!booking && user && user.id) {
      try {
        const userBookings = await getUserBookings(user.id);
        booking = userBookings.find(
          (item) => item.pnr.toUpperCase() === pnr.toUpperCase() &&
            item.passengers && item.passengers.some && item.passengers.some((passenger) => passenger.lastName.toUpperCase() === lastName.toUpperCase())
        );
        
        // Update local bookings list
        if (userBookings.length > 0) {
          setBookings(userBookings);
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    }
    
    if (booking) {
      setActiveBooking(booking);
      setPage('bookingInfo');
    } else {
      showModal('danger', 'Booking Not Found', 'We could not locate a booking with the provided details.');
    }
  };

  const handleCancelBooking = async () => {
    if (!activeBooking) return;
    
    try {
      // If booking has an ID (from backend), use API
      if (activeBooking.id) {
        const result = await cancelBooking(activeBooking.id);
        setBookings((prev) =>
          prev.map((item) => (item.id === activeBooking.id ? { ...item, ...result } : item))
        );
        setActiveBooking((prev) => (prev ? { ...prev, ...result } : prev));
        showModal('info', 'Booking Cancellation Requested', result.message || 'Your booking will be cancelled. Refunds will be processed in 5-7 business days.');
      } else {
        // Local booking (fallback)
        const daysUntilRefund = 5 + Math.floor(Math.random() * 3);
        const expectedRefundDate = new Date();
        expectedRefundDate.setDate(expectedRefundDate.getDate() + daysUntilRefund);
        
        setBookings((prev) =>
          prev.map((item) => 
            item.pnr === activeBooking.pnr 
              ? { 
                  ...item, 
                  status: 'cancelled',
                  cancellationStatus: 'pending_cancellation',
                  cancellationDate: new Date(),
                  expectedRefundDate: expectedRefundDate
                } 
              : item
          )
        );
        setActiveBooking((prev) => (prev ? { 
          ...prev, 
          status: 'cancelled',
          cancellationStatus: 'pending_cancellation',
          cancellationDate: new Date(),
          expectedRefundDate: expectedRefundDate
        } : prev));
        showModal('info', 'Booking Cancelled', `Your booking will be cancelled. Refunds will be processed in ${daysUntilRefund} business days.`);
      }
      
      // Refresh bookings if user is logged in
      if (user && user.id) {
        await fetchUserBookings();
        // Also refresh the active booking if it's the same
        if (activeBooking && activeBooking.id) {
          const userBookings = await getUserBookings(user.id);
          const updatedBooking = userBookings.find(b => b.id === activeBooking.id);
          if (updatedBooking) {
            setActiveBooking(updatedBooking);
          }
        }
      }
    } catch (error) {
      console.error('Error canceling booking:', error);
      showModal('danger', 'Error', error.message || 'Failed to cancel booking. Please try again.');
    }
  };

  const handleChangeBooking = () => {
    showModal('info', 'Contact Support', 'Please contact our support team to make changes to your booking.');
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
  
    if (!loginForm.email || !loginForm.password) {
      showModal('warning', 'Missing Credentials', 'Please enter your login credentials to continue.');
      return;
    }

    try {
      const response = await loginUser(loginForm);

      if (response.error) {
        showModal('danger', 'Login Failed', response.error);
      } else {
        // Save JWT and user info for session
        localStorage.setItem('token', response.token);
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
          setUser(response.user);
        }
        showModal('success', 'Welcome Back', 'Login successful. Redirecting...');
        setTimeout(() => {
          setAuthMode('none');
          setPage('home');
        }, 1000);
      }
    } catch (err) {
      console.error(err);
      showModal('danger', 'Error', 'Something went wrong while logging in.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    showModal('info', 'Logged Out', 'You have been logged out.');
    setAuthMode('login');
  };


  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
  
    if (!registerForm.fullName || !registerForm.email || !registerForm.mobile || !registerForm.password) {
      showModal('warning', 'Complete Registration', 'Fill out all required fields to create your account.');
      return;
    }

    try {
      const response = await registerUser(registerForm); // 🔗 Calls your backend API

      if (response.error) {
        showModal('danger', 'Registration Failed', response.error);
      } else {
        showModal('success', 'Account Created', 'Registration successful! Please log in.');
        setRegisterForm({ fullName: '', email: '', mobile: '', password: '' });
        setAuthMode('login');
      }
    } catch (err) {
      console.error(err);
      showModal('danger', 'Error', 'Something went wrong during registration.');
    }
  };

  const renderHomePage = () => (
    <PageShell>
    
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-xl">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-slate-900/70" />
        <div className="relative flex flex-col gap-10 px-8 py-16 text-white md:px-16">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-widest">
              <Plane className="h-4 w-4" /> Premium Airline Experiences
            </p>
            <h2 className="text-4xl font-bold leading-tight md:text-5xl">
              Seamless journeys tailored to your world-class adventures.
            </h2>
            <p className="mt-4 text-lg text-white/80">
              Discover curated flights, personalized add-ons, and concierge support you can trust. MyAirline elevates every mile you fly.
            </p>
          </div>
          <div className="rounded-3xl bg-white/95 p-8 text-slate-800 shadow-2xl backdrop-blur">
            <div className="mb-6 flex flex-wrap gap-4">
              {Object.entries(tripTypeLabels).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => toggleTripType(value)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    tripType === value
                      ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200'
                  }`}
                >
                  {label}
                </button>
              ))}
              <span className="mx-2 hidden h-8 w-px bg-slate-200 md:block" />
              {Object.entries(travelTypeLabels).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => toggleTravelType(value)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    travelType === value
                      ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2 relative">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">From</label>
                <div className="relative">
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <input
                      value={searchForm.from}
                      onChange={(event) => handleFromInputChange(event.target.value)}
                      onFocus={() => {
                        if (searchForm.from.length >= 1 && !searchForm.from.match(/\([A-Z]{3}\)$/)) {
                          handleFromInputChange(searchForm.from);
                        }
                      }}
                      onBlur={(e) => {
                        // Don't hide if clicking on suggestion
                        if (!e.currentTarget.parentElement.parentElement.querySelector('.absolute')) {
                          setTimeout(() => setShowFromSuggestions(false), 200);
                        }
                      }}
                      placeholder="City or airport (e.g., Chennai, Delhi)"
                      className="w-full border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                      autoComplete="off"
                    />
                  </div>
                  {showFromSuggestions && fromSuggestions.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl max-h-60 overflow-y-auto">
                      {fromSuggestions.map((airport) => (
                        <button
                          key={airport.code}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            selectFromAirport(airport);
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent blur from firing before click
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 transition flex items-center gap-3"
                        >
                          <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <div className="text-left">
                            <p className="text-sm font-semibold text-slate-800">{airport.city}</p>
                            <p className="text-xs text-slate-500">{airport.name} ({airport.code})</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showFromSuggestions && fromSuggestions.length === 0 && searchForm.from.length >= 1 && (
                    <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl p-4 text-sm text-slate-500">
                      No airports found. Try typing more characters.
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2 relative">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">To</label>
                <div className="relative">
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <input
                      value={searchForm.to}
                      onChange={(event) => handleToInputChange(event.target.value)}
                      onFocus={() => {
                        if (searchForm.to.length >= 1 && !searchForm.to.match(/\([A-Z]{3}\)$/)) {
                          handleToInputChange(searchForm.to);
                        }
                      }}
                      onBlur={(e) => {
                        // Don't hide if clicking on suggestion
                        if (!e.currentTarget.parentElement.parentElement.querySelector('.absolute')) {
                          setTimeout(() => setShowToSuggestions(false), 200);
                        }
                      }}
                      placeholder="City or airport (e.g., Mumbai, Delhi)"
                      className="w-full border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                      autoComplete="off"
                    />
                  </div>
                  {showToSuggestions && toSuggestions.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl max-h-60 overflow-y-auto">
                      {toSuggestions.map((airport) => (
                        <button
                          key={airport.code}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            selectToAirport(airport);
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent blur from firing before click
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 transition flex items-center gap-3"
                        >
                          <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <div className="text-left">
                            <p className="text-sm font-semibold text-slate-800">{airport.city}</p>
                            <p className="text-xs text-slate-500">{airport.name} ({airport.code})</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showToSuggestions && toSuggestions.length === 0 && searchForm.to.length >= 1 && (
                    <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl p-4 text-sm text-slate-500">
                      No airports found. Try typing more characters.
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Depart</label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <input
                    type="date"
                    value={searchForm.depart}
                    onChange={(event) => setSearchForm((prev) => ({ ...prev, depart: event.target.value }))}
                    className="w-full border-none bg-transparent text-sm text-slate-700 focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Return</label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <input
                    type="date"
                    value={searchForm.return}
                    disabled={tripType === 'oneWay'}
                    onChange={(event) => setSearchForm((prev) => ({ ...prev, return: event.target.value }))}
                    className="w-full border-none bg-transparent text-sm text-slate-700 focus:outline-none disabled:cursor-not-allowed disabled:text-slate-400"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Passengers</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {[
                    { key: 'adults', label: 'Adults', description: '12+ years' },
                    { key: 'children', label: 'Children', description: '2-11 years' },
                    { key: 'infants', label: 'Infants', description: 'Under 2' },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="rounded-xl border border-slate-200 p-3">
                      <p className="text-sm font-semibold text-slate-700">{label}</p>
                      <p className="text-xs text-slate-400">{description}</p>
                      <div className="mt-3 flex items-center justify-between rounded-full bg-slate-100 px-2 py-1">
                        <button
                          onClick={() => updatePassengerCount(key, -1)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-600 shadow hover:text-blue-600"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-semibold text-slate-700">{searchForm[key]}</span>
                        <button
                          onClick={() => updatePassengerCount(key, 1)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Travelers</p>
                <p className="text-4xl font-bold text-slate-800">{totalPassengers}</p>
                <p className="text-xs text-slate-400">Maximum 100 passengers per booking</p>
                <button
                  onClick={handleSearchFlights}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Search className="h-4 w-4" /> Search Flights
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h3 className="text-2xl font-bold text-slate-800">Available Flights</h3>
        <p className="text-sm text-slate-500">View curated flight options based on your preferences.</p>
        <div className="mt-6 space-y-4">
          {isSearching && (
            <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-3 text-sm font-medium text-slate-500">Searching for the best fares...</span>
            </div>
          )}
          {!isSearching && searchResults.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
              Initiate a search to explore premium flight experiences tailored to you.
            </div>
          )}
          {searchResults.map((flight) => (
            <div
              key={flight.id}
              className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-xl md:flex-row md:items-center"
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${flight.logoBg} text-white shadow-lg`}>
                  <Plane className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{flight.airline}</p>
                  <p className="text-lg font-bold text-slate-800">{flight.flightNumber}</p>
                  <p className="text-sm text-slate-500">
                    {flight.from} → {flight.to}
                  </p>
                </div>
              </div>
              <div className="flex flex-1 flex-wrap items-center gap-6 text-sm text-slate-500">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Departure</p>
                  <p className="text-lg font-semibold text-slate-800">{flight.departTime}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Arrival</p>
                  <p className="text-lg font-semibold text-slate-800">{flight.arriveTime}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Duration</p>
                  <p className="text-lg font-semibold text-slate-800">{flight.duration}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Cabin</p>
                  <p className="text-lg font-semibold text-slate-800 capitalize">{flight.travelType}</p>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between gap-3">
                <p className="text-xl font-bold text-blue-600">{formatPrice(flight.price, flight.travelType)}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => startBookingFlow(flight)}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
                  >
                    Book Now
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );

  const renderBookingStepOne = () => (
    <div className="space-y-6">
      {bookingPassengers.map((passenger, index) => (
        <div key={passenger.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Traveler {index + 1}
                </p>
                <p className="text-xs uppercase tracking-wide text-slate-400">{passenger.type}</p>
              </div>
            </div>
            <span className="text-xs font-medium text-blue-600">Required</span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">First Name</label>
              <input
                value={passenger.firstName}
                onChange={(event) => updatePassengerField(passenger.id, 'firstName', event.target.value)}
                placeholder="As on passport"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last Name</label>
              <input
                value={passenger.lastName}
                onChange={(event) => updatePassengerField(passenger.id, 'lastName', event.target.value)}
                placeholder="Surname"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date of Birth</label>
              <input
                type="date"
                value={passenger.dateOfBirth}
                onChange={(event) => updatePassengerField(passenger.id, 'dateOfBirth', event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Special Requests</label>
              <input
                value={passenger.specialRequest}
                onChange={(event) => updatePassengerField(passenger.id, 'specialRequest', event.target.value)}
                placeholder="Meal preference, assistance, etc."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderBookingStepTwo = () => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {ADDONS.map((addon) => {
        const isSelected = selectedAddons.includes(addon.id);
        return (
          <button
            key={addon.id}
            onClick={() => toggleAddon(addon.id)}
            className={`flex h-full flex-col items-start gap-3 rounded-2xl border p-6 text-left shadow-sm transition ${
              isSelected
                ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-100'
                : 'border-slate-200 bg-white hover:border-blue-200 hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckCircle className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-slate-300'}`} />
              <p className="text-base font-semibold text-slate-700">{addon.label}</p>
            </div>
            <p className="text-sm text-slate-500">{addon.description}</p>
            <p className="mt-auto text-sm font-semibold text-blue-600">{formatPrice(addon.price, travelType)}</p>
          </button>
        );
      })}
    </div>
  );

  const renderBookingStepThree = () => (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        Select {seatLimit} seat{seatLimit > 1 ? 's' : ''} for this journey. Seats highlighted in blue are confirmed for your passengers.
      </p>
      <SeatGrid selectedSeats={selectedSeats} onToggleSeat={toggleSeat} seatLimit={seatLimit} travelType={selectedFlight?.travelType || 'domestic'} />
    </div>
  );

  const renderBookingStepFour = () => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-slate-700">Billing Contact</p>
        <div className="space-y-3 text-sm text-slate-500">
          <p>
            <span className="font-semibold text-slate-700">Primary Traveler:</span>{' '}
            {bookingPassengers[0]?.firstName} {bookingPassengers[0]?.lastName}
          </p>
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-blue-500" /> +1 (800) 555-0199
          </p>
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-500" /> premiumdesk@myairline.com
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-slate-700">Payment Method</p>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name on Card</label>
            <input
              value={payment.cardName}
              onChange={(event) => handlePaymentField('cardName', event.target.value)}
              placeholder="As it appears on card"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Card Number</label>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <CreditCard className="h-5 w-5 text-blue-500" />
              <input
                value={payment.cardNumber}
                onChange={(event) => handlePaymentField('cardNumber', event.target.value)}
                placeholder="XXXX XXXX XXXX XXXX"
                className="w-full border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expiry</label>
              <input
                value={payment.expiry}
                onChange={(event) => handlePaymentField('expiry', event.target.value)}
                placeholder="MM/YY"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">CVV</label>
              <input
                value={payment.cvv}
                onChange={(event) => handlePaymentField('cvv', event.target.value)}
                placeholder="123"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBookingStepFive = () => (
    <div className="flex flex-col items-center gap-6 rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-lg">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 shadow">
        <CheckCircle className="h-8 w-8" />
      </div>
      <h3 className="text-2xl font-bold text-slate-800">Booking Confirmed!</h3>
      <p className="max-w-xl text-sm text-slate-500">{confirmation?.message}</p>
      <div className="rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-6 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">PNR</p>
        <p className="text-3xl font-bold text-blue-700">{confirmation?.pnr}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={() => setPage('bookingInfo')}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
        >
          View Booking Details
        </button>
        <button
          onClick={resetHome}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
        >
          Book Another Trip
        </button>
      </div>
    </div>
  );

  const renderBookingPage = () => (
    <PageShell>
      <div className="mb-6 flex items-center gap-3 text-sm text-slate-500">
        <button
          onClick={resetHome}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
        >
          <ChevronLeft className="h-4 w-4" /> Back to search
        </button>
        <span>Booking {selectedFlight?.airline}</span>
      </div>
      <BookingStepper current={bookingStep} />
      <div className="space-y-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Flight</p>
              <p className="text-lg font-semibold text-slate-800">{selectedFlight?.flightNumber}</p>
              <p>{selectedFlight?.from} → {selectedFlight?.to}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Schedule</p>
              <p>{selectedFlight?.departTime} → {selectedFlight?.arriveTime}</p>
              <p>{selectedFlight?.duration}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Passengers</p>
              <p>{bookingPassengers.length}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Fare</p>
              <p className="text-lg font-semibold text-blue-600">{formatPrice(calculateTotalPrice, selectedFlight?.travelType || 'domestic')}</p>
              {(searchForm.adults + searchForm.children) > 1 && (
                <p className="text-xs text-slate-500 mt-1">
                  Base: {formatPrice((selectedFlight?.price || 0) * (searchForm.adults + searchForm.children), selectedFlight?.travelType || 'domestic')} ({searchForm.adults + searchForm.children} {searchForm.adults + searchForm.children === 1 ? 'passenger' : 'passengers'})
                </p>
              )}
            </div>
          </div>
        </div>

        {bookingStep === 1 && renderBookingStepOne()}
        {bookingStep === 2 && renderBookingStepTwo()}
        {bookingStep === 3 && renderBookingStepThree()}
        {bookingStep === 4 && renderBookingStepFour()}
        {bookingStep === 5 && renderBookingStepFive()}

        {bookingStep < 5 && (
          <div className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm">
            <button
              onClick={goToPreviousStep}
              disabled={bookingStep === 1}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <button
              onClick={proceedToNextStep}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
            >
              {bookingStep === 4 ? 'Confirm Booking' : 'Continue'}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </PageShell>
  );

  const renderManagePage = () => (
    <PageShell>
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-800">Retrieve your booking</h3>
            <p className="mt-2 text-sm text-slate-500">Access itineraries, download invoices, and manage add-ons.</p>
            <form className="mt-6 space-y-5" onSubmit={handleRetrieveBooking}>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Flight PNR</label>
                <input
                  value={manageForm.pnr}
                  onChange={(event) => setManageForm((prev) => ({ ...prev, pnr: event.target.value }))}
                  placeholder="e.g. XYZ678"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last Name</label>
                <input
                  value={manageForm.lastName}
                  onChange={(event) => setManageForm((prev) => ({ ...prev, lastName: event.target.value }))}
                  placeholder="Registered surname"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
              >
                Retrieve Booking
              </button>
            </form>
          </div>
          <div className="flex flex-col justify-center gap-6 rounded-3xl border border-slate-200 bg-blue-50 p-8 text-blue-800 shadow-sm">
            <h4 className="text-xl font-semibold">Need to rebook?</h4>
            <p className="text-sm">
              We are here 24/7 to accommodate changes, upgrades, or special arrangements. Simply retrieve your booking or reach out to our premium concierge.
            </p>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 font-medium"><Phone className="h-4 w-4" /> +1 (800) 555-0101</p>
              <p className="flex items-center gap-2 font-medium"><Mail className="h-4 w-4" /> changes@myairline.com</p>
            </div>
          </div>
        </div>

        {/* Show user's bookings if logged in */}
        {user && user.id && bookings.length > 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Your Bookings</h3>
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id || booking.pnr} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-slate-800">PNR: {booking.pnr}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {booking.status}
                        </span>
                        {booking.cancellationStatus && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            booking.cancellationStatus === 'pending_cancellation' ? 'bg-yellow-100 text-yellow-700' :
                            booking.cancellationStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {booking.cancellationStatus.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      {booking.flightData && (
                        <p className="text-sm text-slate-600">
                          {booking.flightData.from} → {booking.flightData.to}
                        </p>
                      )}
                      {booking.flight && (
                        <p className="text-sm text-slate-600">
                          {booking.flight.from} → {booking.flight.to}
                        </p>
                      )}
                      {booking.cancellationStatus === 'pending_cancellation' && booking.expectedRefundDate && (
                        <p className="text-xs text-yellow-700 mt-2 font-semibold">
                          ⚠️ Cancellation in progress. Refund expected by: {new Date(booking.expectedRefundDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setActiveBooking(booking);
                        setPage('bookingInfo');
                      }}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );

  const renderBookingInfoPage = () => (
    <PageShell>
      {!activeBooking ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          Retrieve a booking to view its details here.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">PNR</p>
              <p className="text-3xl font-bold text-slate-800">{activeBooking.pnr}</p>
              <p className="text-sm text-slate-500">
                Status: <span className="capitalize">{activeBooking.status}</span>
                {activeBooking.cancellationStatus && (
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    activeBooking.cancellationStatus === 'pending_cancellation' ? 'bg-yellow-100 text-yellow-700' :
                    activeBooking.cancellationStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {activeBooking.cancellationStatus.replace('_', ' ')}
                  </span>
                )}
              </p>
              {activeBooking.cancellationStatus === 'pending_cancellation' && activeBooking.expectedRefundDate && (
                <p className="text-xs text-slate-500 mt-1">
                  Refund expected by: {new Date(activeBooking.expectedRefundDate).toLocaleDateString()}
                </p>
              )}
              {activeBooking.cancellationStatus === 'cancelled' && activeBooking.refundCompletedDate && (
                <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-4">
                  <p className="text-sm font-semibold text-green-800 mb-2">✅ Cancellation Completed</p>
                  <p className="text-xs text-green-700 mb-2">
                    Money has been refunded to your account after charging 30% cancellation charges.
                  </p>
                  {activeBooking.totalPrice && (
                    <div className="space-y-1 text-xs">
                      <p className="text-slate-600">
                        <span className="font-semibold">Total Amount:</span> {formatPrice(activeBooking.totalPrice, activeBooking.flight?.travelType || activeBooking.flightData?.travelType || 'domestic')}
                      </p>
                      {activeBooking.cancellationCharges && (
                        <p className="text-red-600">
                          <span className="font-semibold">Cancellation Charges (30%):</span> {formatPrice(activeBooking.cancellationCharges, activeBooking.flight?.travelType || activeBooking.flightData?.travelType || 'domestic')}
                        </p>
                      )}
                      {activeBooking.refundAmount && (
                        <p className="text-green-700 font-semibold">
                          <span className="font-semibold">Refunded Amount (70%):</span> {formatPrice(activeBooking.refundAmount, activeBooking.flight?.travelType || activeBooking.flightData?.travelType || 'domestic')}
                        </p>
                      )}
                      <p className="text-slate-500 text-xs mt-2">
                        Refund completed on: {new Date(activeBooking.refundCompletedDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              {activeBooking.cancellationStatus !== 'cancelled' && activeBooking.cancellationStatus !== 'pending_cancellation' && (
                <button
                  onClick={handleCancelBooking}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-5 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50"
                >
                  Cancel Booking
                </button>
              )}
              <button
                onClick={handleChangeBooking}
                className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-5 py-2 text-sm font-semibold text-blue-600 shadow-sm transition hover:bg-blue-50"
              >
                Change Booking
              </button>
            </div>
          </div>

          {/* Cancellation Details Section */}
          {activeBooking.cancellationStatus && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Cancellation Details</h3>
              <div className="space-y-4">
                {activeBooking.cancellationStatus === 'pending_cancellation' && (
                  <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                    <p className="text-sm font-semibold text-yellow-800 mb-2">⏳ Cancellation in Progress</p>
                    {activeBooking.cancellationDate && (
                      <p className="text-xs text-slate-600 mb-1">
                        Cancellation Date: {new Date(activeBooking.cancellationDate).toLocaleDateString()}
                      </p>
                    )}
                    {activeBooking.expectedRefundDate && (
                      <p className="text-xs text-slate-600 mb-1">
                        Refund Expected By: {new Date(activeBooking.expectedRefundDate).toLocaleDateString()}
                      </p>
                    )}
                    {activeBooking.totalPrice && (
                      <div className="mt-3 space-y-1 text-xs">
                        <p className="text-slate-600">
                          <span className="font-semibold">Total Amount Paid:</span> {formatPrice(activeBooking.totalPrice, activeBooking.flight?.travelType || activeBooking.flightData?.travelType || 'domestic')}
                        </p>
                        {activeBooking.cancellationCharges && (
                          <p className="text-red-600">
                            <span className="font-semibold">Cancellation Charges (30%):</span> {formatPrice(activeBooking.cancellationCharges, activeBooking.flight?.travelType || activeBooking.flightData?.travelType || 'domestic')}
                          </p>
                        )}
                        {activeBooking.refundAmount && (
                          <p className="text-green-700 font-semibold">
                            <span className="font-semibold">Expected Refund (70%):</span> {formatPrice(activeBooking.refundAmount, activeBooking.flight?.travelType || activeBooking.flightData?.travelType || 'domestic')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {activeBooking.cancellationStatus === 'cancelled' && activeBooking.refundCompletedDate && (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                    <p className="text-sm font-semibold text-green-800 mb-2">✅ Cancellation Completed</p>
                    <p className="text-xs text-green-700 mb-3">
                      Money has been refunded to your account after charging 30% cancellation charges.
                    </p>
                    {activeBooking.cancellationDate && (
                      <p className="text-xs text-slate-600 mb-1">
                        Cancellation Date: {new Date(activeBooking.cancellationDate).toLocaleDateString()}
                      </p>
                    )}
                    <p className="text-xs text-slate-600 mb-1">
                      Refund Completed: {new Date(activeBooking.refundCompletedDate).toLocaleDateString()}
                    </p>
                    {activeBooking.totalPrice && (
                      <div className="mt-3 space-y-1 text-xs">
                        <p className="text-slate-600">
                          <span className="font-semibold">Total Amount Paid:</span> {formatPrice(activeBooking.totalPrice, activeBooking.flight?.travelType || activeBooking.flightData?.travelType || 'domestic')}
                        </p>
                        {activeBooking.cancellationCharges && (
                          <p className="text-red-600">
                            <span className="font-semibold">Cancellation Charges (30%):</span> {formatPrice(activeBooking.cancellationCharges, activeBooking.flight?.travelType || activeBooking.flightData?.travelType || 'domestic')}
                          </p>
                        )}
                        {activeBooking.refundAmount && (
                          <p className="text-green-700 font-semibold">
                            <span className="font-semibold">Refunded Amount (70%):</span> {formatPrice(activeBooking.refundAmount, activeBooking.flight?.travelType || activeBooking.flightData?.travelType || 'domestic')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Flight</p>
              <p className="text-lg font-semibold text-slate-800">
                {(activeBooking.flight && activeBooking.flight.flightNumber) || (activeBooking.flightData && activeBooking.flightData.flightNumber) || 'N/A'}
              </p>
              <p className="text-sm text-slate-500">
                {(activeBooking.flight && activeBooking.flight.airline) || (activeBooking.flightData && activeBooking.flightData.airline) || 'N/A'}
              </p>
              <p className="mt-3 text-sm text-slate-500">
                {((activeBooking.flight && activeBooking.flight.from) || (activeBooking.flightData && activeBooking.flightData.from) || '')} → {((activeBooking.flight && activeBooking.flight.to) || (activeBooking.flightData && activeBooking.flightData.to) || '')}
              </p>
              <p className="text-sm text-slate-500">
                {((activeBooking.flight && activeBooking.flight.departTime) || (activeBooking.flightData && activeBooking.flightData.departTime) || '')} → {((activeBooking.flight && activeBooking.flight.arriveTime) || (activeBooking.flightData && activeBooking.flightData.arriveTime) || '')}
              </p>
              <p className="text-sm text-slate-500">
                {(activeBooking.flight && activeBooking.flight.duration) || (activeBooking.flightData && activeBooking.flightData.duration) || 'N/A'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Passengers</p>
              <div className="mt-3 space-y-3 text-sm text-slate-600">
                {(activeBooking.passengers || []).map((passenger) => (
                  <div key={passenger.id} className="rounded-xl bg-slate-50 p-3">
                    <p className="font-semibold text-slate-700">{passenger.firstName} {passenger.lastName}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-400">{passenger.type}</p>
                    {passenger.specialRequest && (
                      <p className="text-xs text-slate-400">Request: {passenger.specialRequest}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Add-ons & Seats</p>
              <div className="mt-3 space-y-3 text-sm text-slate-600">
                <div>
                  <p className="font-semibold text-slate-700">Selected Seats</p>
                  {(activeBooking.seats && activeBooking.seats.length > 0) ? (
                    <p>{activeBooking.seats.join(', ')}</p>
                  ) : (
                    <p className="text-xs text-slate-400">Seat selection not completed.</p>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Add-ons</p>
                  {(activeBooking.addons && activeBooking.addons.length > 0) ? (
                    <ul className="list-disc pl-5">
                      {activeBooking.addons.map((addon) => (
                        <li key={addon.id}>{addon.label}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400">No additional services booked.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );

  const renderSupportPage = () => (
    <PageShell>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-800">Customer Support</h3>
            <p className="mt-2 text-sm text-slate-500">
              Our global concierge desk is here around the clock to assist with bookings, special arrangements, and travel advisories.
            </p>
            <div className="mt-6 space-y-4 text-sm text-slate-600">
              <p className="flex items-center gap-3 font-medium text-slate-700">
                <Phone className="h-4 w-4 text-blue-500" /> +1 (800) 555-0150
              </p>
              <p className="flex items-center gap-3 font-medium text-slate-700">
                <Mail className="h-4 w-4 text-blue-500" /> support@myairline.com
              </p>
              <p className="flex items-center gap-3 font-medium text-slate-700">
                <MapPin className="h-4 w-4 text-blue-500" /> 500 Premium Avenue, Suite 19F, New York, NY 10001
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-8 text-blue-800 shadow-sm">
            <h4 className="text-xl font-semibold">Travel Advisory</h4>
            <p className="mt-2 text-sm">
              Stay informed with the latest travel guidelines, health requirements, and destination-specific notices curated by our travel experts.
            </p>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-800">Contact Us</h3>
          <p className="text-sm text-slate-500">Share your query and our concierge will respond within minutes.</p>
          <form
            className="mt-6 space-y-5"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!user || !user.id) {
                showModal('warning', 'Login Required', 'Please login to create a support ticket.');
                return;
              }
              
              if (!supportForm.subject || !supportForm.message) {
                showModal('warning', 'Missing Information', 'Please provide subject and message.');
                return;
              }
              
              try {
                const ticketData = {
                  userId: user.id,
                  name: supportForm.name || user.fullName || user.email,
                  email: supportForm.email || user.email,
                  subject: supportForm.subject,
                  message: supportForm.message,
                };
                
                const newTicket = await createTicket(ticketData);
                showModal('success', 'Ticket Created', `Thank you! Your ticket #${newTicket.ticketNumber} has been created. Our team will respond shortly.`);
                
                // Reset form
                setSupportForm({ name: '', email: '', subject: '', message: '' });
                
                // Refresh tickets
                await fetchUserTickets();
              } catch (error) {
                console.error('Error creating ticket:', error);
                showModal('danger', 'Error', error.message || 'Failed to create ticket. Please try again.');
              }
            }}
          >
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</label>
              <input
                value={supportForm.name || (user ? (user.fullName || user.email) : '')}
                onChange={(e) => setSupportForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Your full name"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
              <input
                type="email"
                value={supportForm.email || (user ? user.email : '')}
                onChange={(e) => setSupportForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</label>
              <input
                value={supportForm.subject}
                onChange={(e) => setSupportForm((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="What is this regarding?"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Message</label>
              <textarea
                rows={4}
                value={supportForm.message}
                onChange={(e) => setSupportForm((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="Describe how we can help"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
            >
              Create Ticket
            </button>
          </form>
          
          {/* Show previous tickets */}
          {user && user.id && tickets.length > 0 && (
            <div className="mt-8 space-y-4">
              <h4 className="text-lg font-semibold text-slate-800">Your Support Tickets</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-500">#{ticket.ticketNumber}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            ticket.status === 'open' ? 'bg-blue-100 text-blue-700' :
                            ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                            ticket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800">{ticket.subject}</p>
                        <p className="text-xs text-slate-500 mt-1">{ticket.message.substring(0, 100)}...</p>
                        {ticket.response && (
                          <div className="mt-2 p-2 bg-white rounded border border-slate-200">
                            <p className="text-xs font-semibold text-slate-700 mb-1">Response:</p>
                            <p className="text-xs text-slate-600">{ticket.response}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );

  const handleCancellationCheck = async (event) => {
    event.preventDefault();
    const { pnr, lastName } = cancellationCheckForm;
    
    if (!pnr || !lastName) {
      showModal('warning', 'Missing Information', 'Please enter both PNR and last name.');
      return;
    }
    
    try {
      setCancellationCheckResult(null);
      const result = await checkCancellationStatus(pnr, lastName);
      setCancellationCheckResult(result);
    } catch (error) {
      console.error('Error checking cancellation status:', error);
      showModal('danger', 'Error', error.message || 'Failed to check cancellation status. Please verify your PNR and last name.');
      setCancellationCheckResult(null);
    }
  };

  const renderCancellationCheckPage = () => (
    <PageShell>
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Check Cancellation Status</h2>
          <p className="text-sm text-slate-500 mb-6">
            Enter your flight PNR and last name to view your cancellation status and refund details.
          </p>
          
          <form onSubmit={handleCancellationCheck} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Flight PNR</label>
                <input
                  value={cancellationCheckForm.pnr}
                  onChange={(e) => setCancellationCheckForm((prev) => ({ ...prev, pnr: e.target.value.toUpperCase() }))}
                  placeholder="e.g. ABC123"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last Name</label>
                <input
                  value={cancellationCheckForm.lastName}
                  onChange={(e) => setCancellationCheckForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Your registered last name"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
            >
              Check Status
            </button>
          </form>
        </div>

        {/* Cancellation Status Result */}
        {cancellationCheckResult && (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Cancellation Status</h3>
            
            {/* Booking Info */}
            <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">PNR</p>
                  <p className="text-2xl font-bold text-slate-800">{cancellationCheckResult.pnr}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    cancellationCheckResult.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    cancellationCheckResult.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {cancellationCheckResult.status}
                  </span>
                </div>
              </div>
              
              {cancellationCheckResult.flightData && (
                <p className="text-sm text-slate-600">
                  {cancellationCheckResult.flightData.from} → {cancellationCheckResult.flightData.to}
                </p>
              )}
              {cancellationCheckResult.flight && (
                <p className="text-sm text-slate-600">
                  {cancellationCheckResult.flight.from} → {cancellationCheckResult.flight.to}
                </p>
              )}
            </div>

            {/* Cancellation Details */}
            {cancellationCheckResult.cancellationStatus ? (
              <div className="space-y-4">
                {cancellationCheckResult.cancellationStatus === 'pending_cancellation' && (
                  <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">⏳</span>
                      <h4 className="text-lg font-semibold text-yellow-800">Cancellation in Progress</h4>
                    </div>
                    {cancellationCheckResult.cancellationDate && (
                      <p className="text-sm text-slate-600 mb-2">
                        <span className="font-semibold">Cancellation Date:</span> {new Date(cancellationCheckResult.cancellationDate).toLocaleDateString()}
                      </p>
                    )}
                    {cancellationCheckResult.expectedRefundDate && (
                      <p className="text-sm text-slate-600 mb-4">
                        <span className="font-semibold">Refund Expected By:</span> {new Date(cancellationCheckResult.expectedRefundDate).toLocaleDateString()}
                      </p>
                    )}
                    {cancellationCheckResult.totalPrice && (
                      <div className="mt-4 space-y-2 text-sm">
                        <p className="text-slate-600">
                          <span className="font-semibold">Total Amount Paid:</span> {formatPrice(cancellationCheckResult.totalPrice, cancellationCheckResult.flight?.travelType || cancellationCheckResult.flightData?.travelType || 'domestic')}
                        </p>
                        {cancellationCheckResult.cancellationCharges && (
                          <p className="text-red-600">
                            <span className="font-semibold">Cancellation Charges (30%):</span> {formatPrice(cancellationCheckResult.cancellationCharges, cancellationCheckResult.flight?.travelType || cancellationCheckResult.flightData?.travelType || 'domestic')}
                          </p>
                        )}
                        {cancellationCheckResult.refundAmount && (
                          <p className="text-green-700 font-semibold">
                            <span className="font-semibold">Expected Refund (70%):</span> {formatPrice(cancellationCheckResult.refundAmount, cancellationCheckResult.flight?.travelType || cancellationCheckResult.flightData?.travelType || 'domestic')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {cancellationCheckResult.cancellationStatus === 'cancelled' && cancellationCheckResult.refundCompletedDate && (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">✅</span>
                      <h4 className="text-lg font-semibold text-green-800">Cancellation Completed</h4>
                    </div>
                    <p className="text-sm text-green-700 mb-4">
                      Money has been refunded to your account after charging 30% cancellation charges.
                    </p>
                    {cancellationCheckResult.cancellationDate && (
                      <p className="text-sm text-slate-600 mb-2">
                        <span className="font-semibold">Cancellation Date:</span> {new Date(cancellationCheckResult.cancellationDate).toLocaleDateString()}
                      </p>
                    )}
                    <p className="text-sm text-slate-600 mb-4">
                      <span className="font-semibold">Refund Completed:</span> {new Date(cancellationCheckResult.refundCompletedDate).toLocaleDateString()}
                    </p>
                    {cancellationCheckResult.totalPrice && (
                      <div className="mt-4 space-y-2 text-sm">
                        <p className="text-slate-600">
                          <span className="font-semibold">Total Amount Paid:</span> {formatPrice(cancellationCheckResult.totalPrice, cancellationCheckResult.flight?.travelType || cancellationCheckResult.flightData?.travelType || 'domestic')}
                        </p>
                        {cancellationCheckResult.cancellationCharges && (
                          <p className="text-red-600">
                            <span className="font-semibold">Cancellation Charges (30%):</span> {formatPrice(cancellationCheckResult.cancellationCharges, cancellationCheckResult.flight?.travelType || cancellationCheckResult.flightData?.travelType || 'domestic')}
                          </p>
                        )}
                        {cancellationCheckResult.refundAmount && (
                          <p className="text-green-700 font-semibold">
                            <span className="font-semibold">Refunded Amount (70%):</span> {formatPrice(cancellationCheckResult.refundAmount, cancellationCheckResult.flight?.travelType || cancellationCheckResult.flightData?.travelType || 'domestic')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                <p className="text-sm text-slate-600">This booking has not been cancelled.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );

  const renderProfilePage = () => {
    if (!user || !user.id) {
      return (
        <PageShell>
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
            <p>Please login to view your profile.</p>
            <button
              onClick={() => setPage('auth')}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
            >
              Login
            </button>
          </div>
        </PageShell>
      );
    }

    return (
      <PageShell>
        <div className="space-y-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-800">My Profile</h2>
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Full Name</p>
                <p className="text-lg font-semibold text-slate-800">{user.fullName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
                <p className="text-lg font-semibold text-slate-800">{user.email}</p>
              </div>
              {user.mobile && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mobile</p>
                  <p className="text-lg font-semibold text-slate-800">{user.mobile}</p>
                </div>
              )}
            </div>
          </div>

          {/* Bookings Section */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-6">My Bookings</h3>
            {bookings.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No bookings found.</p>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id || booking.pnr} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-slate-800">PNR: {booking.pnr}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {booking.status}
                          </span>
                          {booking.cancellationStatus && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              booking.cancellationStatus === 'pending_cancellation' ? 'bg-yellow-100 text-yellow-700' :
                              booking.cancellationStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {booking.cancellationStatus.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        {booking.flightData && (
                          <p className="text-sm text-slate-600">
                            {booking.flightData.from} → {booking.flightData.to}
                          </p>
                        )}
                        {booking.flight && (
                          <p className="text-sm text-slate-600">
                            {booking.flight.from} → {booking.flight.to}
                          </p>
                        )}
                        {booking.cancellationStatus === 'pending_cancellation' && booking.expectedRefundDate && (
                          <p className="text-xs text-slate-500 mt-2">
                            Refund expected by: {new Date(booking.expectedRefundDate).toLocaleDateString()}
                          </p>
                        )}
                        {booking.cancellationStatus === 'pending_cancellation' && booking.totalPrice && (
                          <div className="mt-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                            <p className="text-xs font-semibold text-yellow-800 mb-1">⏳ Cancellation in Progress</p>
                            {booking.cancellationCharges && booking.refundAmount && (
                              <div className="space-y-1 text-xs mt-2">
                                <p className="text-slate-600">
                                  <span className="font-semibold">Charges (30%):</span> {formatPrice(booking.cancellationCharges, booking.flight?.travelType || booking.flightData?.travelType || 'domestic')}
                                </p>
                                <p className="text-green-700 font-semibold">
                                  <span className="font-semibold">Expected Refund (70%):</span> {formatPrice(booking.refundAmount, booking.flight?.travelType || booking.flightData?.travelType || 'domestic')}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        {booking.cancellationStatus === 'cancelled' && booking.refundCompletedDate && (
                          <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-3">
                            <p className="text-xs font-semibold text-green-800 mb-1">✅ Cancellation Completed</p>
                            <p className="text-xs text-green-700 mb-2">
                              Money refunded after 30% cancellation charges.
                            </p>
                            {booking.totalPrice && booking.refundAmount && (
                              <div className="space-y-1 text-xs mt-2">
                                <p className="text-slate-600">
                                  <span className="font-semibold">Total Paid:</span> {formatPrice(booking.totalPrice, booking.flight?.travelType || booking.flightData?.travelType || 'domestic')}
                                </p>
                                {booking.cancellationCharges && (
                                  <p className="text-red-600">
                                    <span className="font-semibold">Charges (30%):</span> {formatPrice(booking.cancellationCharges, booking.flight?.travelType || booking.flightData?.travelType || 'domestic')}
                                  </p>
                                )}
                                <p className="text-green-700 font-semibold">
                                  <span className="font-semibold">Refunded (70%):</span> {formatPrice(booking.refundAmount, booking.flight?.travelType || booking.flightData?.travelType || 'domestic')}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setActiveBooking(booking);
                          setPage('bookingInfo');
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Support Tickets Section */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-6">My Support Tickets</h3>
            {tickets.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No support tickets found.</p>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-slate-800">#{ticket.ticketNumber}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            ticket.status === 'open' ? 'bg-blue-100 text-blue-700' :
                            ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                            ticket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800">{ticket.subject}</p>
                        <p className="text-xs text-slate-500 mt-1">{ticket.message.substring(0, 100)}...</p>
                        {ticket.response && (
                          <div className="mt-2 p-2 bg-white rounded border border-slate-200">
                            <p className="text-xs font-semibold text-slate-700 mb-1">Response:</p>
                            <p className="text-xs text-slate-600">{ticket.response}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PageShell>
    );
  };

  const renderAuthPage = () => (
    <PageShell>
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-800">Access your MyAirline account</h3>
            <p className="text-sm text-slate-500">Manage bookings, earn rewards, and access exclusive lounges.</p>
          </div>
          <div className="flex gap-2 rounded-full bg-slate-100 p-1">
            {[
              { value: 'login', label: 'Login' },
              { value: 'register', label: 'Register' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setAuthMode(value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  authMode === value ? 'bg-white text-blue-600 shadow' : 'text-slate-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {authMode === 'login' ? (
          <form className="mt-8 space-y-6" onSubmit={handleLoginSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email or Mobile</label>
              <input
                value={loginForm.email}
                onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="you@example.com or +1 555 0101"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
            >
              Login Securely
            </button>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleRegisterSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Full Name</label>
              <input
                value={registerForm.fullName}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, fullName: event.target.value }))}
                placeholder="Your legal name"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
              <input
                type="email"
                value={registerForm.email}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mobile Number</label>
              <input
                value={registerForm.mobile}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, mobile: event.target.value }))}
                placeholder="Include country code"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Password</label>
              <input
                type="password"
                value={registerForm.password}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="Create a secure password"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
            >
              Create Account
            </button>
          </form>
        )}
      </div>
    </PageShell>
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 font-sans">
      <Header
        currentPage={page}
        onNavigate={(value) => {
          if (value === 'home') {
            resetBookingFlow();
          }
          setPage(value);
        }}
        onAuthToggle={() => setPage('auth')}
        user={user}
        handleLogout={handleLogout}
      />

      {page === 'home' && renderHomePage()}
      {page === 'booking' && renderBookingPage()}
      {page === 'manage' && renderManagePage()}
      {page === 'bookingInfo' && renderBookingInfoPage()}
      {page === 'support' && renderSupportPage()}
      {page === 'auth' && renderAuthPage()}
      {page === 'profile' && renderProfilePage()}
      {page === 'checkCancellation' && renderCancellationCheckPage()}

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} MyAirline. All rights reserved.</p>
          <div className="flex gap-3">
            <button type="button" className="cursor-pointer hover:text-blue-600">Privacy Policy</button>
            <button type="button" className="cursor-pointer hover:text-blue-600">Terms</button>
            <button type="button" className="cursor-pointer hover:text-blue-600">Accessibility</button>
          </div>
        </div>
      </footer>

      <Modal {...modal} onClose={closeModal} />
    </div>
  );
};

export default App;
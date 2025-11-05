# Flight API Setup Instructions

## Real-Time Flight Data Integration

This application supports real-time flight data using **AviationStack API** (free tier available).

### Setup Steps:

1. **Sign up for AviationStack API**:
   - Visit: https://aviationstack.com/
   - Create a free account
   - Get your API key from the dashboard

2. **Set Environment Variable**:
   - Create a `.env` file in the `backend` directory
   - Add: `AVIATION_STACK_API_KEY=your_api_key_here`

3. **Restart Backend Server**:
   - The application will automatically use real-time flight data when API key is available
   - Falls back to generated flights if API key is not set

### Current Status:

- ✅ **70+ Indian airports** added to database
- ✅ **Real-time API integration** ready (requires API key)
- ✅ **Enhanced flight generation** as fallback
- ✅ **Comprehensive airport autocomplete**

### Free Tier Limits:

- AviationStack free tier: 1,000 requests/month
- For unlimited access, upgrade to paid plan

### Alternative APIs:

If you prefer different APIs:
- **OpenSky Network**: Free, no API key required (limited data)
- **Amadeus API**: Free tier available (requires registration)
- **FlightAware**: Limited free access

### Testing:

Without API key, the system uses enhanced flight generation that always returns flights for valid routes.


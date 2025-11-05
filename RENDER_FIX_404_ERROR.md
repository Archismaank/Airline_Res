# Fix 404 Error on Render Frontend

## 🔴 Problem: HTTP 404 Error When Searching Flights

The frontend is getting a 404 error because it cannot connect to your backend API.

## ✅ Solution: Set Environment Variable in Render

### Step 1: Get Your Backend URL

1. Go to your **Backend Service** on Render
2. Copy your backend URL (e.g., `https://your-backend-service.onrender.com`)
3. **Important:** Add `/api` at the end: `https://your-backend-service.onrender.com/api`

### Step 2: Add Environment Variable to Frontend

1. Go to your **Frontend Service** on Render
2. Navigate to **Environment** → **Environment Variables**
3. Click **Add Environment Variable**
4. Add:
   ```
   Key: REACT_APP_API_URL
   Value: https://your-backend-service.onrender.com/api
   ```
   **Replace `your-backend-service.onrender.com` with your actual backend URL**

5. **Save** the environment variable

### Step 3: Redeploy Frontend

After adding the environment variable:
- Render will **automatically redeploy** OR
- Go to **Manual Deploy** → **Deploy latest commit**

### Step 4: Verify

1. After deployment, open your frontend in browser
2. Open **Browser Console** (F12 → Console tab)
3. You should see: `🔗 API Base URL: https://your-backend-service.onrender.com/api`
4. If you see `localhost`, the environment variable is not set correctly

### Step 5: Test Flight Search

1. Search for a flight
2. Check browser console for:
   - `🔍 Searching flights at: API_BASE_URL/flights?...`
   - `🔍 API Base URL: https://your-backend-service.onrender.com/api`
3. If you see errors, check the console messages

---

## 🔍 Troubleshooting

### Still Getting 404?

1. **Check Browser Console:**
   - Look for the API URL being logged
   - Verify it's your backend URL, not localhost

2. **Verify Backend is Running:**
   - Visit: `https://your-backend-service.onrender.com/`
   - Should see: "✈️ SQLite Airline Reservation Backend is Running Successfully!"

3. **Check Backend CORS:**
   - Make sure your frontend URL is in the CORS origins in `backend/server.js`
   - Or set `FRONTEND_URL` environment variable in backend

4. **Verify Environment Variable:**
   - In Render frontend service → Environment Variables
   - Check `REACT_APP_API_URL` is set correctly
   - Make sure there are no extra spaces or quotes

5. **Check API Endpoint:**
   - Test directly: `https://your-backend-service.onrender.com/api/flights?from=Delhi%20(DEL)&to=Mumbai%20(BOM)&date=2024-12-20&travelType=domestic`
   - Should return flight data or an error message

---

## 📝 Quick Checklist

- [ ] Backend is deployed and running on Render
- [ ] Backend URL is accessible (test in browser)
- [ ] Frontend environment variable `REACT_APP_API_URL` is set
- [ ] Environment variable value is: `https://your-backend-service.onrender.com/api`
- [ ] Frontend is redeployed after adding environment variable
- [ ] Browser console shows correct API URL (not localhost)
- [ ] Backend CORS allows your frontend URL

---

## 🎯 Expected Result

After setting the environment variable correctly:
- ✅ No more 404 errors
- ✅ Flight search works
- ✅ Browser console shows your backend URL
- ✅ All API calls succeed


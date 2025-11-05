# Deployment Guide for Airline Reservation App

## ✅ Backend on Render - Next Steps

### 1. Add Environment Variables on Render

Go to your Render dashboard → Your Backend Service → Environment Variables and add:

#### Required Environment Variables:

```
AVIATION_STACK_API_KEY=5250c3204a70fb417fa1e3079ae6aaed
JWT_SECRET=mysecretkey
FRONTEND_URL=https://your-frontend-url.onrender.com
```

**Note:** 
- `PORT` is automatically set by Render (don't add it manually)
- Replace `your-frontend-url.onrender.com` with your actual frontend URL when deployed
- The `AVIATION_STACK_API_KEY` is your actual API key

### 2. Update CORS Settings (if needed)

If your frontend is deployed on a different domain, make sure to add it to the CORS origins in `backend/server.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend-url.onrender.com', // Add your frontend URL here
    process.env.FRONTEND_URL
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));
```

### 3. Redeploy Backend (if needed)

After adding environment variables:
- Render will automatically redeploy OR
- Go to your service → Manual Deploy → Deploy latest commit

### 4. Frontend Configuration

#### Option A: Deploy Frontend on Render

1. **Create a new Web Service** on Render
2. **Connect your GitHub repository**
3. **Build Settings:**
   - **Root Directory:** `my-airline-app`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment:** `Node`

4. **Add Environment Variables:**
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com/api
   ```

#### Option B: Use Local Frontend with Deployed Backend

1. **Update `.env` file** in `my-airline-app/`:
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com/api
   ```

2. **Restart your local frontend:**
   ```bash
   cd my-airline-app
   npm start
   ```

### 5. Verify Deployment

1. **Test Backend:**
   - Visit: `https://your-backend-url.onrender.com/`
   - Should see: "✈️ SQLite Airline Reservation Backend is Running Successfully!"

2. **Test API Endpoints:**
   - Test flight search: `https://your-backend-url.onrender.com/api/flights?from=Delhi%20(DEL)&to=Mumbai%20(BOM)&date=2024-12-20&travelType=domestic`

3. **Test Frontend:**
   - Make sure it can connect to the backend
   - Try searching for flights
   - Check browser console for errors

### 6. Database Considerations

**Important:** SQLite on Render has limitations:
- SQLite files are **ephemeral** - they may be deleted when the service restarts
- For production, consider:
  - Using Render's PostgreSQL (free tier available)
  - Or using a managed database service
  - Or implementing database persistence with file storage

### 7. Troubleshooting

#### Backend Issues:
- Check Render logs for errors
- Verify environment variables are set correctly
- Ensure CORS is configured for your frontend URL

#### Frontend Issues:
- Check browser console for CORS errors
- Verify `REACT_APP_API_URL` is set correctly
- Make sure backend URL is accessible

#### API Issues:
- Check if `AVIATION_STACK_API_KEY` is set correctly
- Verify API key is valid
- Check AviationStack API quota (free tier: 1,000 requests/month)

### 8. Environment Variables Summary

**Backend (Render):**
- `AVIATION_STACK_API_KEY` - Your AviationStack API key
- `JWT_SECRET` - Secret for JWT tokens
- `FRONTEND_URL` - Your frontend URL (optional, for CORS)
- `PORT` - Auto-set by Render

**Frontend (Render or Local):**
- `REACT_APP_API_URL` - Your backend API URL

---

## 🚀 Quick Checklist

- [ ] Add environment variables to Render backend
- [ ] Redeploy backend if needed
- [ ] Update frontend `.env` with backend URL
- [ ] Deploy frontend (or run locally)
- [ ] Test API endpoints
- [ ] Test flight search functionality
- [ ] Verify CORS is working
- [ ] Check AviationStack API integration

---

## 📝 Notes

- The backend will automatically use generated flights if AviationStack API fails
- All bookings are saved to SQLite database (may be ephemeral on Render)
- Cancellation scheduler runs automatically on backend startup
- Support tickets are persisted in the database


# Render Frontend Deployment - Fixed Configuration

## ⚠️ Critical Issue: Memory Error

Your frontend is failing because:
1. **JavaScript heap out of memory** - `npm start` (dev server) uses too much memory
2. **No HTTP port detected** - Dev server doesn't expose ports correctly on Render

## ✅ Solution: Use Production Build

For Render, you **MUST** use a production build, not the development server.

### Correct Render Configuration:

1. **Go to your Frontend Service on Render**
2. **Settings → Build & Deploy**

3. **Update these settings:**

   ```
   Root Directory: my-airline-app
   
   Build Command: npm install && NODE_OPTIONS=--max-old-space-size=4096 npm run build
   
   Start Command: npm run serve
   
   Environment: Node
   
   Node Version: 18.x or 20.x
   ```

4. **Environment Variables:**
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com/api
   NODE_ENV=production
   ```

5. **Save and Redeploy**

### What Changed:

- ❌ **Wrong:** `Start Command: npm start` (dev server - uses too much memory)
- ✅ **Correct:** `Start Command: npm run serve` (serves production build - efficient)

### Why This Works:

- `npm run build` creates optimized production files
- `npm run serve` serves the built files with minimal memory usage
- Uses the `serve` package (already added to package.json)
- Exposes port 10000 correctly on Render

### After Redeploying:

1. Wait for build to complete (should be faster)
2. Check logs - should see "serve" starting instead of "react-scripts start"
3. Your site should be live without memory errors

---

## 📝 Quick Checklist:

- [ ] Root Directory: `my-airline-app`
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm run serve` (NOT `npm start`)
- [ ] Environment: `Node`
- [ ] Node Version: `18.x` or `20.x`
- [ ] Environment Variable: `REACT_APP_API_URL` set to your backend URL
- [ ] Save settings
- [ ] Redeploy service

---

## 🔍 Verify Deployment:

After redeploy, check logs for:
- ✅ "serve" command starting
- ✅ "Serving!" message
- ✅ No memory errors
- ✅ Site accessible at your Render URL


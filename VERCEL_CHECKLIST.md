# ✅ Vercel Connection Checklist

## Pre-deployment
- [x] Backend running on localhost:8000
- [x] Cloudflare tunnel active
- [x] API accessible via https://api.freehosting.id.vn/api/health
- [x] CORS configured for *.vercel.app domains
- [x] Code pushed to GitHub

## Vercel Configuration
- [ ] Project imported from GitHub
- [ ] Root directory set to `frontend`
- [ ] Environment variables added:
  - [ ] `REACT_APP_LOCAL_API_URL` = `http://localhost:8000/api`
  - [ ] `REACT_APP_REMOTE_API_URL` = `https://api.freehosting.id.vn/api`
- [ ] Build command: `npm run build`
- [ ] Deployed successfully

## Post-deployment Tests
- [ ] Open Vercel URL: https://chatbot-vinhuni.vercel.app
- [ ] Check browser console - no CORS errors
- [ ] API Switcher visible in header
- [ ] Click API Switcher → Cloudflare Tunnel shows green (online)
- [ ] Test login with demo account
- [ ] Test query/chat functionality

## Common Issues

### CORS Error in Console
```
Access to XMLHttpRequest at 'https://api.freehosting.id.vn/...' from origin 'https://chatbot-vinhuni.vercel.app' has been blocked by CORS policy
```

**Fix:** Backend đã được update với CORS regex. Restart backend:
```bash
# Stop current process (Ctrl+C)
python main.py
```

### API Status shows Offline (Red)
1. Verify tunnel running: Kiểm tra terminal cloudflared
2. Test API: `curl https://api.freehosting.id.vn/api/health`
3. Check backend logs for errors

### Build Failed on Vercel
1. Check build logs in Vercel dashboard
2. Common fixes:
   - Missing dependencies: Update package.json
   - Wrong root directory: Should be `frontend`
   - Node version: Vercel uses Node 18 by default

## Quick Fix Commands

**Restart Backend:**
```bash
cd D:\Edu\4.2.1\personal_project\Chatbot-RAG
.\venv\Scripts\activate
python main.py
```

**Restart Tunnel:**
```bash
cloudflared tunnel run chatbot-backend
```

**Redeploy Vercel:**
```bash
git add .
git commit -m "Fix: Update configuration"
git push origin main
# Vercel auto-deploys
```

## Test URLs

- Backend Local: http://localhost:8000/api/health
- Backend Remote: https://api.freehosting.id.vn/api/health
- Frontend Local: http://localhost:3000
- Frontend Vercel: https://chatbot-vinhuni.vercel.app

## Success Criteria
✅ All checkboxes above checked  
✅ No errors in browser console  
✅ API Switcher shows green status  
✅ Can login and use chatbot features  

---
**Date:** 8/10/2025  
**Status:** Backend ✅ | Tunnel ✅ | CORS ✅ | Vercel ⏳ (pending deployment)

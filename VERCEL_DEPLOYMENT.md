# 🚀 Hướng dẫn Deploy Frontend lên Vercel

## Bước 1: Chuẩn bị Repository

1. **Đảm bảo code đã push lên GitHub**
   ```bash
   git add .
   git commit -m "Add API switcher and Cloudflare tunnel support"
   git push origin main
   ```

2. **Kiểm tra files quan trọng có trong repo:**
   - ✅ `frontend/.env.example`
   - ✅ `frontend/package.json`
   - ✅ `frontend/src/components/ApiSwitcher.js`
   - ✅ `API_SWITCHER_GUIDE.md`

## Bước 2: Deploy trên Vercel

### 2.1. Import Project

1. Đăng nhập vào [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Chọn repository: `anhngocdang2723/ChatBot-VinhUni-RAG_platform`
4. Click **"Import"**

### 2.2. Configure Project

**Framework Preset:** React (hoặc Create React App)

**Root Directory:** `frontend` ⚠️ **QUAN TRỌNG!**

**Build Command:**
```bash
npm run build
```

**Output Directory:**
```
build
```

**Install Command:**
```bash
npm install
```

### 2.3. Environment Variables

Click **"Environment Variables"** và thêm:

| Key | Value | Environment |
|-----|-------|-------------|
| `REACT_APP_LOCAL_API_URL` | `http://localhost:8000/api` | All |
| `REACT_APP_REMOTE_API_URL` | `https://api.freehosting.id.vn/api` | All |
| `REACT_APP_API_URL` | *(bỏ trống - sẽ auto-detect)* | All |

⚠️ **Lưu ý:** Vercel sẽ tự động chọn `REACT_APP_REMOTE_API_URL` khi deploy.

### 2.4. Deploy

1. Click **"Deploy"**
2. Đợi ~2-3 phút để build hoàn tất
3. Vercel sẽ cung cấp URL: `https://chatbot-vinhuni.vercel.app`

## Bước 3: Verify Deployment

### 3.1. Check Build Logs

Nếu build failed, kiểm tra logs:
- Missing dependencies? → `npm install <package>`
- Environment variables? → Check spelling

### 3.2. Test API Connection

1. Mở frontend URL: `https://chatbot-vinhuni.vercel.app`
2. Mở DevTools Console (F12)
3. Check API calls:
   ```
   Network tab → Filter: XHR
   Look for: https://api.freehosting.id.vn/api/health
   ```

### 3.3. Test API Switcher

1. Click **API Switcher** button (góc phải header)
2. Should see:
   - 🏠 Local Development (sẽ không connect khi trên Vercel)
   - ☁️ Cloudflare Tunnel (should be green ✅)

## Bước 4: Troubleshooting

### ❌ Build Failed

**Error: `Cannot find module 'react'`**
```bash
cd frontend
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

**Error: Environment variable not found**
- Check spelling: `REACT_APP_` prefix required
- Re-add variables in Vercel dashboard
- Redeploy: **Deployments** → **...** → **Redeploy**

### ❌ CORS Error

**Console error: `blocked by CORS policy`**

Backend đã được cấu hình để accept Vercel origins:
```python
allow_origin_regex=r"^https://.*\.vercel\.app$|..."
```

Nếu vẫn lỗi:
1. Check backend logs
2. Verify Cloudflare tunnel đang chạy
3. Test API trực tiếp: `curl https://api.freehosting.id.vn/api/health`

### ❌ API Connection Failed

**Status Indicator màu đỏ (offline)**

1. **Check Cloudflare tunnel:**
   ```bash
   cloudflared tunnel run chatbot-backend
   # Should see: "Registered tunnel connection"
   ```

2. **Check backend:**
   ```bash
   curl https://api.freehosting.id.vn/api/health
   # Expected: {"status":"ok"}
   ```

3. **Check DNS:**
   ```bash
   nslookup api.freehosting.id.vn
   # Should resolve to Cloudflare IPs
   ```

### ❌ Preview Deployments không work

Mỗi PR/branch tạo preview URL: `https://<branch>-chatbot-vinhuni.vercel.app`

CORS regex đã support wildcard:
```
^https://.*\.vercel\.app$
```

## Bước 5: Custom Domain (Optional)

### 5.1. Thêm domain riêng

1. Vercel Dashboard → **Project** → **Settings** → **Domains**
2. Add domain: `chatbot.freehosting.id.vn`
3. Vercel sẽ cung cấp DNS records

### 5.2. Cấu hình DNS trên Cloudflare

Vào Cloudflare Dashboard → **DNS**:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | chatbot | cname.vercel-dns.com | ✅ Enabled |

### 5.3. Verify

Đợi ~5 phút, sau đó test:
```bash
curl https://chatbot.freehosting.id.vn
```

## Bước 6: Continuous Deployment

Mỗi khi push code lên GitHub:
```bash
git add .
git commit -m "Update features"
git push origin main
```

Vercel sẽ **tự động deploy** trong ~2-3 phút.

## 📊 Monitoring

### Vercel Analytics

Vercel Dashboard → **Analytics**:
- Page views
- Unique visitors
- Performance metrics

### Check Deployment Status

Vercel Dashboard → **Deployments**:
- ✅ Ready - Deployed successfully
- 🔄 Building - In progress
- ❌ Error - Build failed

## 🔐 Security Checklist

- ✅ CORS configured với regex pattern
- ✅ Environment variables không exposed
- ✅ HTTPS enforced (Cloudflare + Vercel)
- ✅ API credentials trong .env (not in code)
- ✅ `.env` trong `.gitignore`

## 📝 Notes

- **Free tier limits:**
  - Vercel: 100GB bandwidth/month
  - Cloudflare: Unlimited bandwidth
  
- **Cold starts:**
  - Backend có thể sleep sau 15 phút không dùng
  - First request sẽ chậm (~5-10s)
  
- **Preview deployments:**
  - Mỗi PR tạo preview URL riêng
  - Automatically cleaned up sau merge

## 🆘 Support

Nếu gặp vấn đề:
1. Check Vercel build logs
2. Check browser console (F12)
3. Check backend logs
4. Verify tunnel status: `cloudflared tunnel info chatbot-backend`

---

**Last updated:** 8/10/2025  
**Vercel Docs:** https://vercel.com/docs  
**Cloudflare Tunnel Docs:** https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/

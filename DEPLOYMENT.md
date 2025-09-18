# 🚀 Deployment Guide - DramaYuk ke Vercel

## 📋 Pre-Deployment Checklist

### ✅ **Files Ready:**
- ✅ `vercel.json` - Konfigurasi Vercel
- ✅ `package.json` - Dependencies dan scripts
- ✅ `.gitignore` - File yang diabaikan
- ✅ Production-ready code

### ✅ **Code Optimizations:**
- ✅ CORS configured for production
- ✅ API_BASE URL dynamic (localhost/production)
- ✅ Unused imports removed
- ✅ Clean console logs
- ✅ No auto-search spam

## 🚀 Deploy ke Vercel

### **Method 1: Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login ke Vercel
vercel login

# Deploy
vercel --prod
```

### **Method 2: GitHub Integration**
1. Push code ke GitHub repository
2. Connect repository di Vercel dashboard
3. Auto-deploy on every push

## ⚙️ Vercel Configuration

### **vercel.json:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/backend/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ]
}
```

## 🔧 Environment Variables

Tidak ada environment variables yang diperlukan untuk deployment ini.

## 📱 Post-Deployment

### **Test URLs:**
- **Homepage**: `https://your-app.vercel.app`
- **API Health**: `https://your-app.vercel.app/api/health`
- **Latest Movies**: `https://your-app.vercel.app/api/latest`

### **Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🐛 Troubleshooting

### **Common Issues:**

1. **API Routes Not Working**
   - Check `vercel.json` routes configuration
   - Ensure `backend/server.js` exports default

2. **CORS Errors**
   - Verify CORS origin includes your Vercel domain
   - Check production environment detection

3. **Static Files Not Loading**
   - Ensure frontend files are in `/frontend` directory
   - Check route configuration in `vercel.json`

## 🎯 Success Indicators

- ✅ Homepage loads correctly
- ✅ Search functionality works
- ✅ Video player opens
- ✅ Genre sections display
- ✅ Mobile responsive
- ✅ No console errors

**Your DramaYuk website is ready for production!** 🎉
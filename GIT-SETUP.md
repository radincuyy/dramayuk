# 📚 Git Setup & Push Guide - DramaYuk

## 🚀 Quick Push ke GitHub

### **1. Initialize Git Repository**
```bash
git init
git add .
git commit -m "🎬 Initial commit: DramaYuk streaming platform"
```

### **2. Connect ke GitHub Repository**
```bash
# Ganti dengan URL repository Anda
git remote add origin https://github.com/yourusername/dramayuk.git
git branch -M main
git push -u origin main
```

### **3. Untuk Update Selanjutnya**
```bash
git add .
git commit -m "✨ Update: [describe your changes]"
git push
```

## 📋 Pre-Push Checklist

### ✅ **Files Ready:**
- ✅ `package.json` - Dependencies & scripts
- ✅ `vercel.json` - Vercel configuration
- ✅ `.gitignore` - Proper ignore rules
- ✅ `README.md` - Professional documentation
- ✅ `.env.example` - Environment template
- ✅ `.github/workflows/deploy.yml` - CI/CD (optional)

### ✅ **Code Quality:**
- ✅ No sensitive data in code
- ✅ Production-ready configurations
- ✅ Clean console logs
- ✅ Optimized for Vercel deployment

## 🔧 Git Commands Cheat Sheet

### **Basic Commands:**
```bash
# Check status
git status

# Add specific files
git add filename.js

# Add all files
git add .

# Commit with message
git commit -m "Your message"

# Push to remote
git push

# Pull latest changes
git pull
```

### **Branch Management:**
```bash
# Create new branch
git checkout -b feature-name

# Switch branch
git checkout main

# Merge branch
git merge feature-name
```

## 📱 After Push to GitHub

### **1. Connect to Vercel:**
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Import your repository
4. Deploy automatically

### **2. Expected Repository Structure:**
```
dramayuk/
├── .github/workflows/
├── backend/
│   ├── api/
│   └── server.js
├── frontend/
│   ├── index.html
│   ├── script.js
│   └── style.css
├── .gitignore
├── package.json
├── vercel.json
└── README.md
```

## 🎯 Success Indicators

- ✅ Repository created on GitHub
- ✅ All files pushed successfully
- ✅ No sensitive data exposed
- ✅ Ready for Vercel deployment
- ✅ CI/CD workflow configured (optional)

**Your DramaYuk project is ready for GitHub!** 🎉

## 📞 Need Help?

If you encounter issues:
1. Check git status: `git status`
2. Check remote: `git remote -v`
3. Force push (if needed): `git push --force-with-lease`
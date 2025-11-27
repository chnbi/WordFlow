# 🚀 Install and Run - Translation Wrapper

## Complete Step-by-Step Guide

This guide will walk you through installing and running the Translation Wrapper from scratch.

---

## ✅ Prerequisites Check

Before starting, make sure you have:

- [x] **Node.js 18+** installed ([Download](https://nodejs.org))
- [x] **MongoDB** installed or MongoDB Atlas account ([Download](https://www.mongodb.com/try/download/community))
- [x] **Git** (optional, for version control)

### Check if Node.js is installed:
```bash
node --version
# Should show v18.x.x or higher
```

### Check if MongoDB is installed:
```bash
# Windows - Check if service exists
sc query MongoDB
```

---

## 📦 Step 1: Install Dependencies (3 minutes)

Open Command Prompt or PowerShell in the project directory:

```bash
cd C:\Users\Asus\Desktop\ai\translation-wrapper
```

### Option A: Automatic Setup (Recommended)
```bash
setup.bat
```

This will:
- Install all dependencies (root + backend + frontend)
- Create .env files
- Create required directories

### Option B: Manual Setup
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

---

## 🗄️ Step 2: Start MongoDB (1 minute)

### Option A: Local MongoDB

**Windows:**
```bash
# Start MongoDB service
net start MongoDB

# Or open Services and start "MongoDB" manually
```

**Verify it's running:**
```bash
sc query MongoDB
# Should show "RUNNING"
```

### Option B: MongoDB Atlas (Cloud - Free Tier)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create cluster
4. Get connection string
5. Update `backend/.env`:
   ```
   MONGODB_URI=mongodb+srv://<your-username>:<your-password>@<cluster-name>.mongodb.net/translation-wrapper
   ```
   Replace `<your-username>`, `<your-password>`, and `<cluster-name>` with your actual MongoDB Atlas credentials.

---

## 🌱 Step 3: Seed Sample Data (30 seconds)

This adds sample glossary terms to test the app:

```bash
cd backend
node seed.js
```

You should see:
```
✅ Connected to MongoDB
✅ Added 10 glossary terms
🎉 Database seeding complete!
```

---

## 🎮 Step 4: Start the Application (10 seconds)

### Option A: Use the START script (Easiest)
```bash
# From project root
START.bat
```

### Option B: Manual start
```bash
# From project root
npm run dev
```

This starts both:
- **Backend** on http://localhost:3000
- **Frontend** on http://localhost:5173

---

## 🌐 Step 5: Access the Application

Open your browser and go to:

**👉 http://localhost:5173**

You should see the Translation Wrapper dashboard!

---

## 🎯 Step 6: Test the Features

### Create Your First Project

1. Click **"New Project"**
2. Enter:
   - Name: `Test Project`
   - Description: `My first translation project`
   - Created By: `Your Name`
3. Click **"Create Project"**
4. You'll be redirected to the project details page

### Add Some Content

**Option 1 - Add Text Manually:**
1. Click **"Add Text Manually"**
2. Fill in:
   ```
   Page: Homepage
   Section: Hero
   Element Type: Heading
   Content: Get 5G Now
   ```
3. Click **"Add Content"**

**Option 2 - Upload Image:**
1. Create or use a screenshot with text
2. Drag and drop into the upload zone
3. OCR will extract text (or use mock data if no API key)

### Generate Translations

1. Click **"Generate BM"** (Bahasa Malaysia)
2. Click **"Generate ZH"** (Chinese)
3. Wait for success notifications

**Note:** Without API keys, you'll get realistic mock translations!

### Review and Approve

1. Click **"Review"** button
2. See your translations side-by-side
3. Click **"Edit"** to modify if needed
4. Click **"Approve"** ✓ when satisfied

### Export to Excel

1. Click **"Export"** button
2. Click **"Export Excel"**
3. Click **"Download"**
4. Open the .xlsx file in Excel

**The file will have 4 sheets:**
- Content Translations (ready for WPML)
- Metadata
- Glossary Reference
- Instructions

### Manage Glossary

1. Click **"Glossary"** in the top navigation
2. Click **"Add Term"**
3. Enter translations for all 3 languages
4. Select category (Brand, Technical, Product, General)
5. Click **"Add Term"**

---

## 🔧 Common Issues and Solutions

### Issue 1: MongoDB Connection Error

**Error:**
```
MongoDB connection error: connect ECONNREFUSED
```

**Solution:**
```bash
# Make sure MongoDB is running
net start MongoDB

# Or check if service exists
sc query MongoDB
```

**Alternative:** Use MongoDB Atlas (cloud) instead

### Issue 2: Port 3000 Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find and kill the process
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Or change port in backend/.env
PORT=3001
```

### Issue 3: Frontend Won't Connect to Backend

**Symptom:** Frontend loads but no data appears

**Solution:**
1. Check backend is running: http://localhost:3000/api/health
2. Check `frontend/.env` has correct API URL:
   ```
   VITE_API_URL=http://localhost:3000/api
   ```
3. Restart frontend:
   ```bash
   cd frontend
   npm run dev
   ```

### Issue 4: npm install Errors

**Error:**
```
npm ERR! code ERESOLVE
```

**Solution:**
```bash
# Use legacy peer deps
npm install --legacy-peer-deps

# Or clear cache
npm cache clean --force
npm install
```

### Issue 5: Module Not Found

**Error:**
```
Cannot find module 'react' or similar
```

**Solution:**
```bash
# Reinstall frontend dependencies
cd frontend
rm -rf node_modules
npm install
```

---

## 📱 Without API Keys (Development Mode)

The app works perfectly without Google API keys!

**What you get:**
- ✅ Full UI functionality
- ✅ Mock OCR results
- ✅ Mock translations (realistic)
- ✅ All features except actual AI processing

**Mock Data Examples:**
- OCR: "Get 5G Now\nSign Up Today" (92% confidence)
- Translation: EN → BM → ZH with proper glossary terms

**Perfect for:**
- Testing the workflow
- UI/UX development
- Demos and presentations
- Development without API costs

---

## 🔑 Adding API Keys (Production Mode)

### Get Google Gemini API Key (Free Tier)

1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click **"Create API Key"**
4. Copy the key
5. Edit `backend/.env`:
   ```
   GEMINI_API_KEY=your_key_here
   ```
6. Restart backend

### Get Google Cloud Vision API Key

1. Go to https://console.cloud.google.com
2. Create project (if needed)
3. Enable **Cloud Vision API**
4. Go to **Credentials**
5. Create **API Key**
6. Copy the key
7. Edit `backend/.env`:
   ```
   GOOGLE_CLOUD_VISION_API_KEY=your_key_here
   GCP_PROJECT_ID=your_project_id
   ```
8. Restart backend

**After adding keys:**
- OCR will extract real text from images
- Translations will use actual AI (with glossary enforcement)

---

## 🎓 Learning Resources

### Project Documentation
- `README.md` - Project overview
- `QUICKSTART.md` - 5-minute setup
- `SETUP.md` - Detailed setup guide
- `PROTOTYPE_COMPLETE.md` - Feature checklist

### API Endpoints
- Health Check: http://localhost:3000/api/health
- Projects: http://localhost:3000/api/projects
- Translations: http://localhost:3000/api/translations
- Glossary: http://localhost:3000/api/glossary

### Database
- View data: Use MongoDB Compass
- Connection: mongodb://localhost:27017
- Database: translation-wrapper

---

## 🛑 Stopping the Application

**To stop the servers:**
1. Press `Ctrl + C` in the terminal
2. Type `Y` to confirm

**To stop MongoDB:**
```bash
net stop MongoDB
```

---

## 🔄 Restarting After Changes

### After Backend Code Changes:
1. Stop the server (Ctrl + C)
2. Restart: `npm run dev`

### After Frontend Code Changes:
- Vite auto-reloads, no restart needed!

### After .env Changes:
1. Stop servers
2. Restart: `npm run dev`

---

## 📊 System Requirements

**Minimum:**
- Node.js 18.x
- 4GB RAM
- 500MB disk space

**Recommended:**
- Node.js 20.x
- 8GB RAM
- 1GB disk space

---

## 🎉 You're All Set!

The Translation Wrapper is now running!

**Next Steps:**
1. Create a test project
2. Add some content
3. Generate translations
4. Review and approve
5. Export to Excel

**Need Help?**
- Check the troubleshooting section above
- Review QUICKSTART.md for examples
- Contact: weyxuan.chin@ytlcomms.my

**Happy Translating! 🚀**

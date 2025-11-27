# Quick Start Guide - Translation Wrapper

## ⚡ 5-Minute Setup (Development Mode)

This guide will get you up and running with the Translation Wrapper in under 5 minutes.

### Prerequisites
- Node.js 18+ installed
- MongoDB installed (or use MongoDB Atlas)

### Step 1: Install Dependencies (2 minutes)

```bash
# Navigate to project directory
cd C:\Users\Asus\Desktop\ai\translation-wrapper

# Install all dependencies (root + backend + frontend)
npm run install:all
```

### Step 2: Configure Environment (1 minute)

**Backend** - Create `backend/.env`:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/translation-wrapper

# Optional - App works with mock data if these are not set
GEMINI_API_KEY=
GOOGLE_CLOUD_VISION_API_KEY=
GCP_PROJECT_ID=

JWT_SECRET=translation-wrapper-dev-secret
CORS_ORIGIN=http://localhost:5173
```

**Frontend** - Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000/api
```

### Step 3: Start MongoDB (if running locally)

```bash
# Windows
net start MongoDB

# Or use MongoDB Compass to start the service
```

**Alternative:** Use MongoDB Atlas (cloud) - just update `MONGODB_URI` in backend/.env

### Step 4: Seed Sample Data (30 seconds)

Create `backend/seed.js`:
```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const Glossary = require('./src/models/Glossary');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing glossary
  await Glossary.deleteMany({});

  // Add sample glossary terms
  const terms = [
    { en: 'Yes', bm: 'Yes', zh: 'Yes', category: 'brand', doNotTranslate: true, version: 'v1.0' },
    { en: '5G', bm: '5G', zh: '5G', category: 'technical', doNotTranslate: true, version: 'v1.0' },
    { en: 'Unlimited', bm: 'Tanpa Had', zh: '无限', category: 'product', version: 'v1.0' },
    { en: 'Data', bm: 'Data', zh: '数据', category: 'technical', version: 'v1.0' },
    { en: 'Premium', bm: 'Premium', zh: '高级', category: 'product', version: 'v1.0' },
    { en: 'Plan', bm: 'Pelan', zh: '套餐', category: 'product', version: 'v1.0' },
    { en: 'Sign Up', bm: 'Daftar', zh: '注册', category: 'general', version: 'v1.0' },
    { en: 'Get', bm: 'Dapatkan', zh: '获取', category: 'general', version: 'v1.0' }
  ];

  await Glossary.insertMany(terms);
  console.log(`✅ Added ${terms.length} glossary terms`);

  process.exit(0);
};

seed().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
```

Run the seed script:
```bash
cd backend
node seed.js
```

### Step 5: Start the Application (30 seconds)

```bash
# From project root - runs both backend and frontend
npm run dev
```

The app will start on:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/api/health

---

## 🎮 Test Drive the Features

### 1. Create Your First Project (30 seconds)

1. Open http://localhost:5173
2. Click **"New Project"**
3. Enter:
   - Name: "Homepage Refresh"
   - Description: "Q4 homepage content updates"
4. Click **"Create Project"**

### 2. Add Content (1 minute)

Click on your project, then:

**Option A: Add Text Manually**
1. Click **"Add Text Manually"**
2. Fill in:
   - Page: "Homepage"
   - Section: "Hero"
   - Element Type: "Heading"
   - Content: "Get 5G Now"
3. Click **"Add Content"**

**Option B: Upload Image (requires OCR API)**
1. Drag & drop a screenshot with text
2. OCR will extract the text automatically

### 3. Generate AI Translations (10 seconds)

1. Click **"Generate BM"** to translate to Bahasa Malaysia
2. Click **"Generate ZH"** to translate to Chinese
3. Wait for the success message

**Note:** Without API keys, you'll get mock translations (perfect for testing UI!)

### 4. Review & Approve (30 seconds)

1. Click **"Review"** button
2. See side-by-side translations
3. Edit if needed
4. Click **"Approve"** ✓

### 5. Export (10 seconds)

1. Click **"Export"** button
2. Click **"Export Excel"**
3. Download the .xlsx file
4. Open in Excel and see your translations!

---

## 🔧 Without API Keys (Mock Mode)

The app works perfectly without any API keys! It will use mock data:

- **OCR**: Returns sample text like "Get 5G Now\nSign Up Today"
- **Translation**: Returns simple translations like:
  - EN: "Get 5G Now" → BM: "Dapatkan 5G Sekarang" → ZH: "立即获取5G"

Perfect for:
- UI/UX development
- Testing workflows
- Demos and presentations

---

## ⚙️ With API Keys (Full Features)

### Get Google Gemini API Key (Free)
1. Go to https://makersuite.google.com/app/apikey
2. Click **"Create API Key"**
3. Copy the key
4. Add to `backend/.env`: `GEMINI_API_KEY=your_key_here`

### Get Google Cloud Vision API Key
1. Go to https://console.cloud.google.com
2. Enable **Cloud Vision API**
3. Create credentials → API Key
4. Add to `backend/.env`: `GOOGLE_CLOUD_VISION_API_KEY=your_key_here`

Restart the backend after adding keys:
```bash
cd backend
npm run dev
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Windows - Start MongoDB service
net start MongoDB

# Or use MongoDB Atlas (cloud) - free tier available
# Update MONGODB_URI in backend/.env to your Atlas connection string
```

### Port 3000 Already in Use
Change the port in `backend/.env`:
```env
PORT=3001
```

### Frontend Won't Start
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules
npm install
npm run dev
```

### Translations Not Working
- Check that backend is running on port 3000
- Check browser console for errors
- Verify `VITE_API_URL` in `frontend/.env`

---

## 📂 Project Structure

```
translation-wrapper/
├── backend/              # Express API (Port 3000)
│   ├── src/
│   │   ├── controllers/  # API endpoints
│   │   ├── models/       # Database schemas
│   │   ├── services/     # OCR, Translation, Export
│   │   └── routes/       # Route definitions
│   └── server.js
│
├── frontend/            # React App (Port 5173)
│   ├── src/
│   │   ├── pages/       # Dashboard, Review, Export, Glossary
│   │   ├── components/  # UI components
│   │   └── services/    # API calls
│   └── vite.config.js
│
└── README.md
```

---

## 🎯 What's Working

✅ **Backend (100%)**
- All API endpoints
- MongoDB models
- OCR service (with fallback to mock data)
- Translation service (with fallback to mock data)
- Excel export generation
- File upload handling

✅ **Frontend (100%)**
- Dashboard (project list)
- Project details (upload & manage content)
- Translation review (side-by-side editing)
- Glossary manager (CRUD operations)
- Export page (download Excel files)
- Responsive UI with TailwindCSS

---

## 📞 Need Help?

- Check `SETUP.md` for detailed setup instructions
- Check backend logs in terminal
- Check browser console for frontend errors
- Email: weyxuan.chin@ytlcomms.my

---

## 🚀 Next Steps

1. **Test all features** using the test drive guide above
2. **Add real API keys** for full functionality
3. **Customize glossary** terms for your brand
4. **Refine UI/UX** based on user feedback
5. **Deploy to production** (see DEPLOYMENT.md)

---

**Happy translating! 🎉**

# ✅ COMPLETE SETUP INSTRUCTIONS - Speed Love Connect

Follow these steps exactly to get your Next.js dating app running.

---

## 📋 Prerequisites

Before starting, ensure you have:
- Node.js 18+ installed
- A text editor (VS Code recommended)
- PowerShell terminal access
- Internet connection

---

## 🚀 Step-by-Step Installation

### STEP 1: Prepare the Project Structure

Run the migration PowerShell script to copy all necessary files:

```powershell
# Navigate to the project directory
cd "C:\Users\Clifford\Documents\GratelaReactProjects\speed-love-connect-main"

# Set execution policy (if needed)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Run migration script
.\migrate.ps1
```

This will copy:
- ✅ All UI components from `src/components/ui/` to `components/ui/`
- ✅ Hooks from `src/hooks/` to `hooks/`
- ✅ SwipeCard component
- ✅ Header component

---

### STEP 2: Setup Package Configuration

Rename the Next.js package file:

```powershell
# Delete old Vite package.json
Remove-Item package.json -Force

# Rename Next.js package file
Rename-Item package-next.json package.json

# Rename TypeScript config
Remove-Item tsconfig.json -Force
Rename-Item tsconfig-next.json tsconfig.json
```

---

### STEP 3: Install Dependencies

```powershell
# Clean old installations
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# Install all Next.js dependencies
npm install
```

This installs:
- Next.js 15
- React 18
- MongoDB (Mongoose)
- OpenAI SDK
- JWT authentication
- bcryptjs
- All shadcn/ui dependencies

---

### STEP 4: Setup Environment Variables

Create a `.env.local` file in the root directory:

```powershell
# Create the file
New-Item -Path .env.local -ItemType File -Force
```

Then open `.env.local` and add:

```env
# MongoDB Connection (REQUIRED)
MONGODB_URI=your-mongodb-connection-string-here

# OpenAI API Key (REQUIRED)
OPENAI_API_KEY=your-openai-api-key-here

# JWT Secret (REQUIRED)
JWT_SECRET=your-very-long-random-secret-key-here

# Application URL
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

---

### STEP 5: Get Your API Keys

#### A. MongoDB Atlas Setup (Free):

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for a free account
3. Create a new cluster (M0 Free Tier)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database password
7. Replace `<dbname>` with `dating-app`
8. Paste into `.env.local` as `MONGODB_URI`

Example:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dating-app?retryWrites=true&w=majority
```

#### B. OpenAI API Key Setup:

1. Go to https://platform.openai.com/signup
2. Create an account
3. Navigate to API Keys: https://platform.openai.com/api-keys
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)
6. Paste into `.env.local` as `OPENAI_API_KEY`

Example:
```
OPENAI_API_KEY=sk-proj-abc123xyz789...
```

#### C. JWT Secret:

Generate a secure random string or use this PowerShell command:

```powershell
# Generate a random JWT secret
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

Copy the output and paste it into `.env.local` as `JWT_SECRET`.

---

### STEP 6: Verify File Structure

Your project should now look like this:

```
speed-love-connect-main/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── discover/
│   │   ├── swipe/
│   │   ├── matches/
│   │   ├── messages/
│   │   └── users/
│   ├── auth/page.tsx
│   ├── discover/page.tsx
│   ├── matches/page.tsx
│   ├── chat/[matchId]/page.tsx
│   ├── profile/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/ (80+ shadcn components)
│   ├── providers/
│   ├── discover/
│   └── layout/
├── contexts/
│   └── AuthContext.tsx
├── lib/
│   ├── mongodb.ts
│   ├── auth.ts
│   ├── matching.ts
│   └── utils.ts
├── models/
│   ├── User.ts
│   ├── Like.ts
│   ├── Match.ts
│   └── Message.ts
├── hooks/
├── .env.local
├── package.json
├── tsconfig.json
├── next.config.ts
└── tailwind.config.ts
```

---

### STEP 7: Start Development Server

```powershell
npm run dev
```

You should see:
```
✓ Ready in X.Xs
○ Local:   http://localhost:3000
```

---

### STEP 8: Test the Application

1. **Open browser**: Visit http://localhost:3000

2. **Register a user**:
   - Click "Get Started" or "Sign In"
   - Fill in registration form
   - Use any email (doesn't need to be real)
   - Create password
   - Add name, age, and bio

3. **Create more test users**:
   - Open incognito window
   - Register 2-3 more users with different interests
   - Example profiles:
     - User 1: Coffee, Hiking, Photography
     - User 2: Fitness, Cooking, Travel
     - User 3: Reading, Yoga, Music

4. **Test Discovery**:
   - Login as User 1
   - Go to `/discover`
   - AI will show recommended users based on similarity
   - Swipe right to like, left to skip

5. **Test Matching**:
   - Login as User 2
   - Like User 1
   - If User 1 liked User 2, see "It's a Match!" toast

6. **Test Chat**:
   - Go to `/matches`
   - Click on a match
   - Send messages
   - Messages are stored in MongoDB

---

## 🔧 Common Issues & Solutions

### Issue: "Cannot find module 'react'"
**Cause**: Dependencies not installed
**Solution**:
```powershell
npm install
```

### Issue: "MONGODB_URI is not defined"
**Cause**: Environment variables not configured
**Solution**: Create `.env.local` file with MongoDB connection string

### Issue: "OpenAI API error 401"
**Cause**: Invalid or missing API key
**Solution**: Check `.env.local` has correct `OPENAI_API_KEY`

### Issue: "No users showing in discover page"
**Cause**: Need at least 2 users in database
**Solution**: Register 2-3 test accounts

### Issue: Port 3000 already in use
**Solution**:
```powershell
# Kill process using port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Or use different port
$env:PORT=3001; npm run dev
```

### Issue: Migration script won't run
**Solution**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\migrate.ps1
```

---

## 📊 Database Collections

After running the app, check your MongoDB database. You should see these collections:

1. **users** - User profiles
2. **likes** - User swipe actions
3. **matches** - Mutual matches
4. **messages** - Chat messages

---

## 🎯 Features Checklist

Test each feature:

- [ ] User Registration
- [ ] User Login
- [ ] Profile View/Edit
- [ ] Discover Page (AI recommendations)
- [ ] Swipe Right (Like)
- [ ] Swipe Left (Skip)
- [ ] Match Detection
- [ ] Match Notification
- [ ] Matches List
- [ ] Chat Interface
- [ ] Send Messages
- [ ] View Message History
- [ ] Unmatch Functionality
- [ ] Logout

---

## 🚀 Production Deployment

### Deploy to Vercel:

```powershell
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

Then:
1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Add all variables from `.env.local`:
   - MONGODB_URI
   - OPENAI_API_KEY
   - JWT_SECRET
   - NEXT_PUBLIC_API_URL (change to your Vercel URL)
   - NODE_ENV=production
5. Redeploy

---

## 📈 Monitoring Costs

### OpenAI Costs:
- Embedding generation: ~$0.0001 per profile
- For 100 users: ~$0.01
- For 1000 users: ~$0.10

Very affordable! Set up billing alerts in OpenAI dashboard.

### MongoDB:
- M0 Free Tier: 512MB storage (good for ~5000 users)
- Free forever
- Upgrade if needed

---

## 🎓 Next Steps

### Bonus Features to Add:
1. **Real-time Chat** with WebSockets
2. **Photo Upload** to Cloudinary
3. **Location Filtering** (geospatial indexes already in place)
4. **Age Range Filters**
5. **Interest Tags**
6. **Block/Report Users**
7. **Push Notifications**
8. **Email Verification**
9. **Password Reset**
10. **Social Login** (Google, Facebook)

---

## 📞 Support Resources

- **Next.js Docs**: https://nextjs.org/docs
- **MongoDB Docs**: https://www.mongodb.com/docs
- **OpenAI Docs**: https://platform.openai.com/docs
- **Shadcn/ui**: https://ui.shadcn.com

---

## ✅ Success Checklist

Before submitting:
- [ ] App runs without errors
- [ ] Can register new users
- [ ] Can login
- [ ] Discover page shows AI recommendations
- [ ] Can swipe and match
- [ ] Chat works between matched users
- [ ] All data persists in MongoDB
- [ ] Environment variables configured
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Production deployed

---

## 🎉 You're Done!

Your AI-powered dating app is now fully functional with:
- ✅ Next.js 14 with App Router
- ✅ MongoDB database
- ✅ OpenAI-powered matching
- ✅ Collaborative filtering
- ✅ JWT authentication
- ✅ Real-time messaging
- ✅ Production-ready architecture

**Good luck with the WC Launchpad Builder Round! 🚀💕**

---

*Last updated: October 27, 2025*

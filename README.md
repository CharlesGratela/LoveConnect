# 💕 NxtDate - AI-Powered Dating App

A modern, full-stack dating application built with **Next.js 15**, **MongoDB**, and **OpenAI-powered matching algorithm**.

## 🌟 Features

### Core Features ✅
- **User Authentication** - Secure registration and login with JWT + HTTP-only cookies
- **Email Verification** - Verify email with OTP code via Nodemailer
- **AI-Powered Matching** - OpenAI embeddings + collaborative filtering algorithm
- **Profile Management** - Create and edit profiles with photos, bio, and interests
- **Password Management** - Secure password change functionality
- **Smart Discovery** - Swipe interface with age and distance filters
- **Real-time Matching** - Instant match detection with mutual interest
- **Push Notifications** - Service Worker-based notifications for new matches and messages
- **Chat System** - Real-time messaging with matched users
- **Unmatch Feature** - Remove unwanted matches
- **Dislike Tracking** - Never see disliked profiles again
- **Responsive Design** - Mobile-first design with touch gestures

### Technical Highlights ✅
- **No BaaS** - Custom backend with MongoDB (not Firebase/Supabase)
- **AI Algorithm** - 70% semantic similarity + 30% collaborative filtering
- **Service Workers** - Push notifications without polling
- **Type-Safe** - Full TypeScript implementation
- **Modern Stack** - Next.js 15 App Router, React 18, MongoDB, OpenAI
- **Production Ready** - Proper auth, error handling, database indexing
- **Mobile Optimized** - Fixed swipe view with no scrolling on mobile

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier available)
- OpenAI API key
- Gmail account (for email verification)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local file with your credentials
MONGODB_URI=your-mongodb-connection-string
OPENAI_API_KEY=your-openai-api-key
JWT_SECRET=your-jwt-secret-key
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:your-email@example.com

# 3. Generate VAPID keys for push notifications
npx web-push generate-vapid-keys

# 4. Start development server
npm run dev
```

Visit `http://localhost:3000`

## 📚 Documentation

**Start here:**
- **[INSTALLATION.md](./INSTALLATION.md)** - ⭐ Complete setup guide
- **[DEMO_SCRIPT.md](./DEMO_SCRIPT.md)** - 15-minute app demonstration guide

**Reference:**
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick reference guide
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Full project overview

## 🎯 Tech Stack

### Frontend
- Next.js 15 (App Router)
- React 18
- TypeScript 5
- Tailwind CSS
- shadcn/ui components
- Lucide React icons
- Service Workers (for push notifications)

### Backend
- Next.js API Routes
- MongoDB + Mongoose
- JWT Authentication (HTTP-only cookies)
- bcryptjs (password hashing)
- Nodemailer (email verification)
- Web Push (push notifications)

### AI & ML
- OpenAI Embeddings API
- Collaborative Filtering
- Cosine Similarity
- Haversine Distance Formula

## 🤖 AI Matching Algorithm

The app uses a hybrid matching system:

1. **OpenAI Embeddings (70% weight)** - Converts user profiles into semantic vectors
2. **Collaborative Filtering (30% weight)** - Learns from user behavior patterns
3. **Cosine Similarity** - Calculates compatibility scores
4. **Final Ranking** - Users sorted by match quality

```typescript
Final Score = (AI Similarity × 0.7) + (Collaborative × 0.3)
```

## 🗄️ API Endpoints

```
Authentication:
  POST   /api/auth/register        # Register new user
  POST   /api/auth/login           # Login user
  POST   /api/auth/logout          # Logout user
  GET    /api/auth/me              # Get current user
  POST   /api/auth/verify-email    # Verify email with OTP
  POST   /api/auth/resend-otp      # Resend verification code
  POST   /api/auth/change-password # Change user password

Discovery:
  GET    /api/discover             # AI-powered recommendations
  POST   /api/swipe                # Like/dislike users

Matching:
  GET    /api/matches              # Get all matches
  DELETE /api/matches/:matchId     # Unmatch user

Chat:
  GET    /api/messages/:matchId    # Get messages
  POST   /api/messages             # Send message

Profile:
  GET    /api/users/profile        # Get user profile
  PUT    /api/users/profile        # Update profile

Push Notifications:
  POST   /api/push/subscribe       # Subscribe to push
  POST   /api/push/unsubscribe     # Unsubscribe from push
```

## 📊 Project Structure

```
speed-love-connect-main/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── auth/              # Auth pages
│   ├── chat/              # Chat page
│   ├── discover/          # Swipe interface
│   ├── matches/           # Matches page
│   └── profile/           # Profile page
├── components/            # React components
│   ├── discover/         # Swipe card component
│   ├── layout/           # Header component
│   └── ui/               # shadcn/ui components
├── contexts/              # React contexts
│   └── AuthContext.tsx   # Auth state management
├── lib/                   # Utilities & algorithms
│   ├── auth.ts           # JWT functions
│   ├── email.ts          # Email service
│   ├── geolocation.ts    # Distance calculation
│   ├── matching.ts       # AI matching algorithm
│   ├── mongodb.ts        # Database connection
│   └── push-server.ts    # Push notifications
├── models/                # MongoDB schemas
│   ├── User.ts           # User model
│   ├── Like.ts           # Like/dislike model
│   ├── Match.ts          # Match model
│   ├── Message.ts        # Message model
│   └── PushSubscription.ts
├── public/
│   └── sw.js             # Service Worker
└── .env.local            # Environment variables
```

## 🌱 Environment Variables

Required in `.env.local`:

```env
# Database
MONGODB_URI=your-mongodb-atlas-connection-string

# AI
OPENAI_API_KEY=your-openai-api-key

# Authentication
JWT_SECRET=your-secret-key-min-32-characters

# App URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# Email (Gmail)
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password

# Push Notifications (Generate with: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:your-email@example.com

# Environment
NODE_ENV=development
```

## 🚢 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Add all environment variables in Vercel dashboard under Settings → Environment Variables.

### Important Notes
- Enable "Web Push" in browser settings for notifications
- Gmail App Password required (not regular password)
- VAPID keys must match on client and server

## 💰 Cost Estimates

- **OpenAI API**: ~$0.0001 per user profile (embeddings)
- **MongoDB Atlas**: Free tier (512MB storage)
- **Vercel**: Free tier for hobby projects
- **Total**: Essentially free for small-scale deployment!

## 🎉 Status

✅ **Production Ready** - All core features fully implemented!

### Statistics
- Lines of Code: ~6000+
- API Endpoints: 15+
- Database Models: 5
- React Components: 120+
- Pages: 7 (Landing, Auth, Verify, Discover, Matches, Chat, Profile)

### Key Features Implemented
- ✅ User registration with email verification
- ✅ JWT authentication with HTTP-only cookies
- ✅ AI-powered matching algorithm
- ✅ Swipe interface with filters
- ✅ Real-time chat system
- ✅ Push notifications via Service Workers
- ✅ Password change functionality
- ✅ Profile management with photo upload
- ✅ Match/unmatch system
- ✅ Dislike tracking and exclusion
- ✅ Mobile-optimized UI with touch gestures
- ✅ Responsive design for all screen sizes

## 📞 Support

For setup help:
1. Read **INSTALLATION.md** for detailed setup
2. Check **DEMO_SCRIPT.md** for feature walkthrough
3. Review documentation files for specific topics

## 🔐 Security Features

- JWT tokens stored in HTTP-only cookies
- Password hashing with bcryptjs (10 salt rounds)
- Email verification before account activation
- Secure session management
- Protected API routes with authentication middleware

---

**NxtDate** - Find your next date with AI-powered matching! 💕  
*Built with Next.js 15 + TypeScript + MongoDB + OpenAI*

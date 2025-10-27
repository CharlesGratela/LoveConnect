# 💕 Speed Love Connect - AI-Powered Dating App

A modern, full-stack dating application built with **Next.js 14**, **MongoDB**, and **OpenAI-powered matching algorithm** for the WC Launchpad Builder Round.

## 🌟 Features

### Core Features ✅
- **User Authentication** - Secure registration and login with JWT
- **AI-Powered Matching** - OpenAI embeddings + collaborative filtering
- **Profile Management** - Create and edit user profiles
- **Smart Discovery** - Swipe interface with intelligent recommendations
- **Real-time Matching** - Instant match detection when mutual interest
- **Chat System** - Message matched users in real-time
- **Responsive Design** - Works perfectly on all devices

### Technical Highlights ✅
- **No BaaS** - Custom backend with MongoDB (not Firebase/Supabase)
- **AI Algorithm** - 70% semantic similarity + 30% collaborative filtering
- **Type-Safe** - Full TypeScript implementation
- **Modern Stack** - Next.js 14 App Router, React 18, MongoDB
- **Production Ready** - Proper auth, error handling, database indexing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free)
- OpenAI API key

### Installation

```powershell
# 1. Run migration script to copy components
.\migrate.ps1

# 2. Setup package.json
Remove-Item package.json -Force
Rename-Item package-next.json package.json
Remove-Item tsconfig.json -Force
Rename-Item tsconfig-next.json tsconfig.json

# 3. Install dependencies
npm install

# 4. Create .env.local with your API keys
# See INSTALLATION.md for detailed instructions

# 5. Start development server
npm run dev
```

Visit `http://localhost:3000`

## 📚 Documentation

**Start here:**
- **[INSTALLATION.md](./INSTALLATION.md)** - ⭐ Complete setup guide (read this first!)
- **[CHECKLIST.md](./CHECKLIST.md)** - Step-by-step implementation checklist

**Reference:**
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick reference guide
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Full project overview
- **[NEXTJS_MIGRATION_README.md](./NEXTJS_MIGRATION_README.md)** - Technical migration details

## 🎯 Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Tanstack Query

### Backend
- Next.js API Routes
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs

### AI & ML
- OpenAI Embeddings
- Collaborative Filtering
- Cosine Similarity

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
  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/auth/logout
  GET    /api/auth/me

Discovery:
  GET    /api/discover        # AI-powered recommendations
  POST   /api/swipe           # Like/dislike

Matching:
  GET    /api/matches
  DELETE /api/matches

Chat:
  GET    /api/messages
  POST   /api/messages

Profile:
  GET    /api/users/profile
  PUT    /api/users/profile
```

## 📊 Project Structure

```
speed-love-connect-main/
├── app/                    # Next.js pages & API
├── components/             # React components
├── contexts/              # React contexts
├── lib/                   # Utilities & algorithms
├── models/                # MongoDB schemas
├── hooks/                 # Custom hooks
├── .env.local            # Environment variables
└── Documentation files
```

## 🌱 Environment Variables

Required in `.env.local`:

```env
MONGODB_URI=your-mongodb-connection-string
OPENAI_API_KEY=your-openai-api-key
JWT_SECRET=your-jwt-secret
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

## 🚢 Deployment

### Vercel (Recommended)
```powershell
npm i -g vercel
vercel
```

Add environment variables in Vercel dashboard.

## 💰 Cost Estimates

- **OpenAI**: ~$0.0001 per user profile (very cheap!)
- **MongoDB**: Free tier (512MB, ~5000 users)

## 🎉 Status

✅ **Production Ready** - All core features implemented!

- Lines of Code: ~5000+
- API Endpoints: 10
- Database Models: 4
- React Components: 100+

## 📞 Support

For setup help:
1. Read **INSTALLATION.md**
2. Follow **CHECKLIST.md**
3. Check documentation files

---

*Built for WC Launchpad Builder Round (Oct 27-31, 2025)*  
*Stack: Next.js 14 + TypeScript + MongoDB + OpenAI*

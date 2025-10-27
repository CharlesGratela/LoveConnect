# 🚀 Deploy to Vercel - Complete Guide

## Prerequisites

✅ Your code must be pushed to GitHub first (see GITHUB_PUSH_GUIDE.md)
✅ You have a Vercel account ([Sign up free](https://vercel.com/signup))
✅ You have your environment variables ready

---

## Step 1: Import Your Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Find your `loveconnect` repository
5. Click **"Import"**

---

## Step 2: Configure Your Project

### Project Settings:

- **Framework Preset**: Next.js
- **Root Directory**: `./` (leave as default)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

---

## Step 3: Add Environment Variables ⚠️ CRITICAL

Click **"Environment Variables"** and add these:

### Required Variables:

| Variable | Value | Where to Get It |
|----------|-------|-----------------|
| `MONGODB_URI` | Your MongoDB connection string | [MongoDB Atlas](https://cloud.mongodb.com) |
| `JWT_SECRET` | Random 32+ character string | Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `OPENAI_API_KEY` | Your OpenAI API key | [OpenAI Platform](https://platform.openai.com/api-keys) |

### Example:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/loveconnect?retryWrites=true&w=majority
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **IMPORTANT**: 
- Add these variables to **all environments** (Production, Preview, Development)
- Never commit `.env.local` to GitHub (already in .gitignore)

---

## Step 4: Deploy!

1. Click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. 🎉 Your app is live!

---

## Step 5: Get Your Live URL

After deployment completes, you'll get a URL like:
```
https://loveconnect-xxx.vercel.app
```

You can also add a custom domain in **Settings → Domains**

---

## 🔧 Troubleshooting Common Issues

### Build Failed?

**Check the build logs:**
1. Go to your deployment
2. Click on "Building" or "Failed"
3. Read the error messages

**Common fixes:**
- Missing environment variables
- TypeScript errors (run `npm run build` locally first)
- Missing dependencies (check `package.json`)

### MongoDB Connection Issues?

**Whitelist Vercel's IP:**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Navigate to **Network Access**
3. Click **"Add IP Address"**
4. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
5. Click **"Confirm"**

### OpenAI API Errors?

**Check your API key:**
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Verify your key is active
3. Check you have credits/billing enabled
4. Make sure the key starts with `sk-proj-` or `sk-`

---

## 🔄 Automatic Deployments

Once set up, Vercel automatically:
- ✅ Deploys on every push to `main` branch
- ✅ Creates preview deployments for pull requests
- ✅ Provides unique URLs for each deployment

---

## 📊 Monitor Your App

### View Analytics:
- **Vercel Dashboard** → Your Project → **Analytics**
- See real-time visitors, page views, and performance

### View Logs:
- **Vercel Dashboard** → Your Project → **Deployments** → Click a deployment → **Functions**
- View API route logs and errors

---

## ⚙️ Post-Deployment Configuration

### Enable Serverless Functions:
Already configured! Your `/app/api/*` routes work as serverless functions.

### Set Up Domains:
1. Go to **Settings** → **Domains**
2. Add your custom domain (e.g., `loveconnect.com`)
3. Update DNS records as instructed

### Configure CORS (if needed):
Already handled by Next.js!

---

## 🎯 Your App Features on Vercel

✅ **Automatic HTTPS** - Free SSL certificate
✅ **Global CDN** - Fast loading worldwide  
✅ **Serverless Functions** - Auto-scaling API routes
✅ **Environment Variables** - Secure secrets
✅ **Preview Deployments** - Test before production
✅ **Analytics** - Built-in monitoring

---

## 📱 Test Your Live App

After deployment, test these features:

1. **Registration**: Create a new account
2. **Location**: Allow browser location permission
3. **Profile**: Upload a photo and add interests
4. **Discovery**: Swipe through users with filters
5. **Matching**: Match with someone and check notifications
6. **Chat**: Send messages to matches
7. **Theme**: Toggle dark/light mode

---

## 🆘 Need Help?

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **MongoDB Atlas Docs**: [mongodb.com/docs/atlas](https://mongodb.com/docs/atlas)
- **Next.js Deployment**: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)

---

## 🎉 You're Live!

Share your app:
```
🎊 LoveConnect is now live!
🔗 https://your-app.vercel.app

Features:
✨ AI-Powered Matching
💕 Real-time Chat
📍 Location-Based Discovery
🎨 Dark Mode Support
🔔 Push Notifications
```

---

## 🔄 Future Updates

To update your live app:
```powershell
# Make changes to your code
git add .
git commit -m "Your update message"
git push

# Vercel automatically deploys! 🚀
```

---

**Congratulations! Your AI-powered dating app is now live on Vercel! 🎉**

# 📤 Push to GitHub - Step by Step Guide

## Step 1: Create a New GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Fill in the repository details:
   - **Repository name**: `loveconnect`
   - **Description**: AI-powered dating app with Next.js, MongoDB, and OpenAI
   - **Visibility**: Choose Public or Private
   - ⚠️ **IMPORTANT**: Do NOT initialize with README, .gitignore, or license (we already have these)
3. Click "Create repository"

## Step 2: Link Your Local Repository to GitHub

After creating the repository on GitHub, you'll see instructions. Run these commands:

```powershell
# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/loveconnect.git

# Rename branch to main (if needed)
git branch -M main

# Push your code to GitHub
git push -u origin main
```

## Step 3: Verify Upload

Go to your repository URL: `https://github.com/YOUR_USERNAME/loveconnect`

You should see all your files uploaded!

## 🔑 If You Get Authentication Errors

GitHub requires a Personal Access Token (PAT) for HTTPS:

### Create a Personal Access Token:

1. Go to [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a name: `LoveConnect Deploy`
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
5. Click "Generate token"
6. **COPY THE TOKEN** (you won't see it again!)

### Use the Token:

When pushing, Git will ask for credentials:
- Username: Your GitHub username
- Password: Paste the Personal Access Token (NOT your GitHub password)

## 🚀 Quick Commands (Copy-Paste)

```powershell
# View current remotes
git remote -v

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/loveconnect.git

# Push to GitHub
git push -u origin main
```

## 📝 After Successful Push

Your repository will be ready at:
`https://github.com/YOUR_USERNAME/loveconnect`

Then you can proceed to deploy on Vercel!

---

## 🎯 Next Steps After GitHub Upload

1. ✅ Push to GitHub (you're here)
2. 🚀 Deploy to Vercel
3. ⚙️ Add environment variables on Vercel
4. 🎉 Your app is live!

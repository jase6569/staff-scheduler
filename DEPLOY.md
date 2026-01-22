# Staff Scheduler - Deployment Guide

## Quick Deploy (15 minutes)

Your app needs two services:
1. **Backend API** (Railway) - handles data and database
2. **Frontend** (Vercel) - the web interface

---

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Name it `staff-scheduler`
3. Keep it **Private** (only you can see it)
4. Click **Create repository**

Then push your code:
```bash
cd c:\Users\maxim\OneDrive\Desktop\staff-scheduler
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/staff-scheduler.git
git push -u origin main
```

---

## Step 2: Deploy Backend to Railway (Free Tier)

1. Go to https://railway.app and sign in with GitHub
2. Click **New Project**  **Deploy from GitHub repo**
3. Select your `staff-scheduler` repository
4. When asked, set the **Root Directory** to: `server`
5. Railway will auto-detect Node.js and start building

### Add PostgreSQL Database:
1. In your Railway project, click **+ New**  **Database**  **PostgreSQL**
2. Wait for it to provision (30 seconds)
3. The `DATABASE_URL` is automatically connected!

### Add Environment Variables:
1. Click on your server service
2. Go to **Variables** tab
3. Add these variables:
   - `CORS_ORIGINS` = (leave empty for now, we'll add Vercel URL later)

### Get Your API URL:
1. Go to **Settings**  **Networking**
2. Click **Generate Domain**
3. Copy the URL (e.g., `https://staff-scheduler-server-production.up.railway.app`)

---

## Step 3: Deploy Frontend to Vercel (Free)

1. Go to https://vercel.com and sign in with GitHub
2. Click **Add New**  **Project**
3. Import your `staff-scheduler` repository
4. Configure:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite
5. Add Environment Variable:
   - `VITE_API_URL` = `https://YOUR-RAILWAY-URL.up.railway.app/api`
   (Replace with your Railway URL from Step 2)
6. Click **Deploy**

### Get Your Frontend URL:
After deployment, Vercel gives you a URL like:
`https://staff-scheduler.vercel.app`

---

## Step 4: Connect Everything

1. Go back to Railway  your server service  Variables
2. Update `CORS_ORIGINS` to your Vercel URL:
   `https://staff-scheduler.vercel.app`
3. Railway will auto-redeploy

---

## Step 5: Seed Initial Data (Optional)

To add your existing venues/staff:

1. In Railway, click your server service
2. Go to **Settings**  **Railway CLI** or use the web shell
3. Run: `npm run prisma:seed`

Or add them manually through the app!

---

## Done! 

Share these URLs with your team:
- **Staff URL**: `https://staff-scheduler.vercel.app` (click "View Schedule")
- **Admin URL**: Same URL, but login with password: `admin123`

---

## Costs (Free Tier Limits)

**Railway Free Tier:**
- 500 hours/month of server time
- 1GB database storage
- Perfect for small teams!

**Vercel Free Tier:**
- Unlimited for personal projects
- 100GB bandwidth/month

For your use case (2-3 staff viewing schedules), you'll stay well within free limits.

---

## Troubleshooting

**"Failed to fetch" errors:**
- Check CORS_ORIGINS in Railway matches your Vercel URL exactly
- Make sure VITE_API_URL in Vercel includes `/api` at the end

**Database errors:**
- In Railway, click PostgreSQL service  Connect  check DATABASE_URL is set

**Build failures:**
- Check Railway/Vercel build logs for specific errors

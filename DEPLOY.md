# Staff Scheduler - Easy Deploy Guide

## Deploy in 5 Minutes 

### Step 1: Push to GitHub

1. Create a new repo at https://github.com/new (keep it Private)
2. Run:
```
cd "c:\Users\maxim\OneDrive\Desktop\staff-scheduler"
git add .
git commit -m "Prepare for deployment"
git remote add origin https://github.com/YOUR_USERNAME/staff-scheduler.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Railway

1. Go to **https://railway.app**  Sign in with GitHub
2. Click **New Project**  **Deploy from GitHub repo**
3. Select your `staff-scheduler` repo
4. Click **Add Database**  **PostgreSQL**
5. Wait for deploy (2-3 minutes)
6. Click **Settings**  **Generate Domain**

### Done! 

Your app is live at your Railway URL.

Share with staff:
- **Staff view**: Just open the URL, click "View Schedule"
- **Admin access**: Same URL, use password: `admin123`

---

## Cost: FREE 

Railway free tier includes:
- 500 hours/month (plenty for a scheduling app)
- PostgreSQL database
- Custom domain support

---

## To Update the App

Just push to GitHub - Railway auto-deploys:
```
git add .
git commit -m "Update"
git push
```

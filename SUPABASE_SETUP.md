# QuizBlast — Supabase Setup Guide

## Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Click "New Project"
3. Fill in name: "QuizBlast"
4. Set a strong database password
5. Choose region closest to your users

## Step 2: Run Database Setup
1. In Supabase Dashboard → SQL Editor
2. Open: supabase-setup.sql (provided file)
3. Click "Run" — all tables created automatically

## Step 3: Get API Keys
1. Supabase Dashboard → Settings → API
2. Copy "Project URL"
3. Copy "anon public" key

## Step 4: Update js/supabase.js
Open js/supabase.js and replace:
```
const SUPABASE_URL      = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY';
```
With your actual values.

## Step 5: Deploy to GitHub Pages
Push all files — Supabase handles the backend!

## Features After Setup
✅ Player accounts (username + password)
✅ Profile syncs across all devices
✅ Global leaderboard (all players)
✅ Admin can set daily challenge for everyone
✅ Admin questions visible to all players
✅ Offline fallback (localStorage) if no connection

## Supabase Free Tier Limits
- 500MB database storage
- 50,000 monthly active users
- 2GB file storage
- Unlimited API calls
- 100 concurrent connections

## Folder Structure
QuizBlast/
├── index.html
├── admin.html
├── supabase-setup.sql  ← Run this in Supabase SQL Editor
├── js/
│   ├── supabase.js     ← Put your URL + KEY here
│   ├── script.js
│   ├── boss.js
│   └── security.js
└── css/
    ├── style.css
    └── boss.css

# Hold a Spot - Setup Instructions

## Phase 1: Database Setup Complete! ✅

This guide will help you set up your Supabase database and connect it to your local development environment.

---

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **"New Project"**
4. Fill in:
   - **Name**: `hold-a-spot` (or your preferred name)
   - **Database Password**: Create a strong password (save it somewhere safe)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is perfect for development
5. Click **"Create new project"**
6. Wait 2-3 minutes for project to provision

---

## Step 2: Run Database Migrations

1. In your Supabase project dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Open the file `supabase/migrations/001_initial_schema.sql` from this project
4. Copy ALL the contents and paste into the SQL Editor
5. Click **"Run"** (bottom right)
6. You should see: "Success. No rows returned"

7. Repeat for seed data:
   - Click **"New Query"** again
   - Open `supabase/migrations/002_seed_data.sql`
   - Copy and paste contents
   - Click **"Run"**
   - You should see verification results showing:
     - 1 sport (Pickleball)
     - 4 courts
     - 6 bays
     - 2 test users

---

## Step 3: Enable Realtime

1. In Supabase dashboard, click **"Database"** → **"Replication"**
2. Find the **"reservations"** table in the list
3. Toggle it **ON** (enable replication)
4. This allows real-time updates to work

---

## Step 4: Get API Keys

1. In Supabase dashboard, click **"Project Settings"** (gear icon, bottom left)
2. Click **"API"** in the settings sidebar
3. You'll see:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key (long string starting with `eyJ...`)
   - **service_role** key (another long string, keep this secret!)

---

## Step 5: Configure Local Environment

1. In this project, copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and fill in your values:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... (your anon key)
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (your service role key)
   CRON_SECRET=make-up-a-random-string-here
   ```

3. Save the file

---

## Step 6: Verify Setup Complete

At this point, you have:
- ✅ Supabase project created
- ✅ Database schema and seed data loaded
- ✅ Real-time enabled
- ✅ Environment variables configured

---

## Step 7: Verify Database (Optional)

You can explore your database in Supabase:

1. Click **"Table Editor"** in Supabase dashboard
2. You should see these tables:
   - ✅ sports (1 row: Pickleball)
   - ✅ users (2 rows: test users)
   - ✅ facilities (10 rows: 4 courts, 6 bays)
   - ✅ reservations (empty for now)
   - ✅ credit_transactions (2 rows: initial credits for test users)
   - ✅ calendar_blocks (empty, for future use)

3. Click on any table to see its data

---

## Troubleshooting

### Error: "Missing Supabase environment variables"

- Make sure `.env.local` exists in the project root
- Check that all three variables are filled in
- Restart your dev server (`npm run dev`)

### Error: "relation does not exist"

- You probably skipped running the migration SQL files
- Go back to Step 2 and run both SQL files in order

### Realtime not working

- Make sure you enabled replication on the `reservations` table (Step 3)
- Check browser console for WebSocket errors

### Can't find API keys

- Project Settings → API → Copy the keys
- Make sure you're copying the full key (they're very long!)

---

## What's Next?

✅ **Phase 1 Complete!** Your database foundation is ready.

🚀 **Next: Phase 2** - Build API routes:
- User management APIs
- Facilities APIs  
- Reservations APIs
- Credit calculation logic

No API routes exist yet - they'll be built in Phase 2.

---

## Quick Reference

**Test Users:**
- test@example.com
- demo@example.com

**Facilities:**
- Courts: Court 1, Court 2, Court 3, Court 4
- Bays: Bay 1-6

**Hours:** 6 AM - 10 PM (30-min slots)

**Credits:** Each user starts with 10 credits (resets weekly)

---

## Security Note

⚠️ **NEVER commit `.env.local` to git!**

It's already in `.gitignore`, but double-check:
```bash
git status
```

You should NOT see `.env.local` in the list.

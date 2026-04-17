# Supabase Setup Guide

This project has been fully migrated from Firebase to Supabase, providing better authentication, database, and real-time features with Next.js 16 compatibility.

## 1. Database Schema

Open **Supabase Dashboard → SQL Editor** and run the SQL in `supabase-schema.sql`.

**Important:** If you're updating an existing database, make sure to run the schema again after the latest changes to add the missing INSERT policy for the users table.

This creates:
- `users` (profiles extending Supabase Auth)
- `properties`
- `tenants`
- `invoices`
- `notices`
- `tickets`
- `payment_requests`
- `expenses`

With proper:
- Foreign key relationships
- Row Level Security (RLS) policies
- Indexes for performance
- Auto-updating `updated_at` triggers

## 2. Storage Buckets

In **Supabase Dashboard → Storage**, create two public buckets:

### nid-images
- **Name:** `nid-images`
- **Public bucket:** ✓ Enabled
- **File size limit:** 5MB
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`

### tenant-photos
- **Name:** `tenant-photos`
- **Public bucket:** ✓ Enabled
- **File size limit:** 5MB
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`

## 3. Verify Environment Variables

Ensure your `.env.local` has:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://aednrioutehpnrugrilk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SlW9P14v89nZ0q_Ohai5wg_940p5cyx
```

## 4. Client Configuration

The project includes multiple Supabase client configurations optimized for Next.js 16:

- **Browser Client** (`lib/supabaseClient.js`): Singleton client for client-side operations
- **SSR Client** (`lib/supabase/client.ts`): Factory functions for SSR contexts
- **Middleware Client** (`lib/supabase/middleware.ts`): For proxy.ts session management

All clients are properly configured with `@supabase/ssr` for optimal performance and security.

## 5. Create Admin User (if needed)

If the admin email `zahid.bdapp2026@gmail.com` doesn't exist in Supabase Auth yet:

1. Go to **Supabase Dashboard → Authentication → Users**
2. Click **"Add User"**
3. Enter:
   - **Email:** `zahid.bdapp2026@gmail.com`
   - **Password:** `za@#11708022`
   - **Auto Confirm User:** ✓ Enabled
4. Click **"Create User"**

This creates the admin user in Supabase Auth. The application will automatically create the database profile when the admin logs in.

## 6. Migration Notes

This project has been fully migrated from Firebase to Supabase:
- ✅ Removed all Firebase dependencies
- ✅ Updated authentication to Supabase Auth
- ✅ Replaced Firestore with Supabase PostgreSQL
- ✅ Updated all data operations for Supabase
- ✅ Next.js 16 proxy.ts configuration for session management

## 7. Test the Application

After running the schema, creating buckets, and ensuring the admin user exists:

```bash
npm run dev
```

- Visit http://localhost:3000
- Click **Demo দেখুন** to test demo mode (no login required)
- Or register a new account and test payment flow
- **Admin login:** Go to `/login` and use `zahid.bdapp2026@gmail.com` / `za@#11708022`

## 5. Google OAuth (Optional)

To enable Google Sign-In:

1. In Supabase Dashboard → Authentication → Providers
2. Enable **Google**
3. Add your redirect URL:
   - Dev: `http://localhost:3000/auth/callback`
   - Prod: `https://yourdomain.com/auth/callback`
4. Save

The code already supports Google OAuth via the `/auth/callback` route.

---

**All set!** 🚀

# Quick Supabase Setup Verification

This script helps verify your Supabase setup is correct.

## Run these commands to check your setup:

```bash
# 1. Check environment variables
echo "NEXT_PUBLIC_SUPABASE_URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"

# 2. Test Supabase connection
npm run dev
# Then visit http://localhost:3000 and check browser console

# 3. If you see fetchUserProfile errors, run the schema:
# Go to Supabase Dashboard → SQL Editor → Run supabase-schema.sql
```

## Common Issues & Fixes:

### Issue: `[fetchUserProfile] ❌ QUERY FAILED`
**Cause:** Database schema not applied
**Fix:** Run `supabase-schema.sql` in Supabase SQL Editor

### Issue: `permission denied for table users`
**Cause:** RLS policies not set up
**Fix:** Ensure schema was applied correctly

### Issue: `Access সীমিত` (Access Restricted)
**Cause:** Admin user not in database with correct role
**Fix:** Create admin user in Supabase Auth dashboard

### Issue: `No matching version found for postcss@8.5.10`
**Cause:** Wrong PostCSS version in package.json
**Fix:** Change to `"postcss": "^8.4.24"` in package.json, then `rm package-lock.json && npm install`
# Netlify Deployment Guide

## Setup Steps:

### 1. Environment Variables Setup in Netlify Dashboard

Go to: **Site settings → Build & deploy → Environment**

Add the following environment variables from `.env.example`:

```
NEXT_PUBLIC_FIREBASE_API_KEY = YOUR_VALUE
NEXT_PUBLIC_FIREBASE_APP_ID = YOUR_VALUE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = YOUR_VALUE
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = YOUR_VALUE
NEXT_PUBLIC_FIREBASE_PROJECT_ID = YOUR_VALUE
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = YOUR_VALUE
VERCEL_WEB_ANALYTICS_ID = YOUR_VALUE
```

### 2. Build Settings

- **Build command:** `npm run build`
- **Publish directory:** `.next`

### 3. Deploy

Connect your Git repository to Netlify and push your code. Netlify will automatically:
- Read `netlify.toml` configuration
- Run the build command
- Deploy the `.next` directory

## Important Security Notes:

✅ **What's been done:**
- ✓ `.gitignore` created - sensitive files won't be committed
- ✓ `.env.example` created - shows required variables
- ✓ `netlify.toml` created - build config ready
- ✓ TypeScript build errors are now visible (removed `ignoreBuildErrors`)

⚠️ **Before deploying:**
- Make sure `.env.development.local` is in `.gitignore`
- Never commit actual `.env` files with secrets
- Add all environment variables to Netlify dashboard

## Troubleshooting:

If build fails:
1. Check Netlify Build logs
2. Verify all NEXT_PUBLIC_* variables are set
3. Ensure Firebase config is correct

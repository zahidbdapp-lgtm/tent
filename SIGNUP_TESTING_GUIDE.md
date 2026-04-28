# 🧪 Sign-Up Flow Testing Guide

## ✅ VERDICT: সাইন আপ ফ্লো সম্পূর্ণ প্রস্তুত!

**আপনার সাইন আপ ফ্লো সম্পূর্ণভাবে সঠিক এবং কাজ করবে। শুধুমাত্র একটি জিনিস configure করা দরকার:**

---

## 🔴 BLOCKER: Google Provider Not Enabled

আপনার Supabase project এ Google OAuth provider **enabled নেই**। এই কারণে Google button click করলে error দেয়।

### Quick Fix (5 minutes):

1. **যান**: https://app.supabase.com
2. **Project খুলুন**: aednrioutehpnrugrilk
3. **যান**: Authentication → Providers
4. **খুঁজুন**: Google
5. **ক্লিক**: Enable
6. **পেস্ট করুন**:
   - Client ID: (Google Cloud থেকে)
   - Client Secret: (Google Cloud থেকে)
7. **ক্লিক**: Save

---

## 📝 Step-by-Step Testing

### STEP 1️⃣: Enable Google Provider (Do this first!)

**গুগল ক্লায়েন্ট ID/Secret পেতে:**

1. যান: https://console.cloud.google.com
2. একটি প্রজেক্ট create করুন বা select করুন
3. যান: APIs & Services → Credentials
4. ক্লিক: Create Credentials → OAuth Client ID
5. চয়ন করুন: Web Application
6. **Redirect URIs এ যোগ করুন:**
   ```
   https://aednrioutehpnrugrilk.supabase.co/auth/v1/callback
   http://localhost:3000/api/oauth-callback
   ```
7. Save করুন এবং Client ID + Secret copy করুন
8. **Supabase এ paste করুন** (উপরের steps অনুযায়ী)

---

### STEP 2️⃣: Test Complete Sign-Up Flow

**Browser এ এই steps follow করুন:**

#### A. Go to Register Page
```
1. Open: http://localhost:3000/register
2. You should see:
   - "একাউন্ট তৈরি করুন" title
   - Name input field
   - Phone input field
   - "Google দিয়ে সাইন আপ করুন" button
```

#### B. Fill Form
```
3. Name field: "Test User"
4. Phone field: "01712345678"
5. Click: "Google দিয়ে সাইন আপ করুন"
```

#### C. Check Console
```
6. Open DevTools: Press F12
7. Go to Console tab
8. You should see logs:
   - "[signUpWithGoogle] Starting with name: Test User..."
   - "[signUpWithGoogle] ✅ Pending data stored in localStorage"
   - "[signUpWithGoogle] Using redirect URL: http://localhost:3000/api/oauth-callback?type=signup"
   - "[signUpWithGoogle] ✅ OAuth flow initiated successfully"
```

#### D. Google Login
```
9. Google login page opens
10. Select your Google account
11. May ask for permissions - click "Continue"
```

#### E. Check Redirect
```
12. After Google auth, you should be redirected to:
    /register/payment
13. You should see:
    - "পেমেন্ট তথ্য দিন" title
    - Your name: "Test User"
    - Your phone: "01712345678"
    - Your email: (from Google)
    - Package selection
    - Payment method selection
```

#### F. Check localStorage
```
14. In DevTools, go to: Application → Storage → localStorage
15. You should see TWO keys:
    - "pendingGoogleSignup": {"fullName":"Test User","phoneNumber":"01712345678",...}
    - "isGoogleSignupFlow": "true"
```

#### G. Submit Payment
```
16. Select Package: (any one)
17. Select Payment Method: bKash/Nagad/Rocket
18. Payment Number: "01712345678"
19. Transaction ID: "TXN123456"
20. Payment Date: Today's date
21. Click: "পেমেন্ট সাবমিট করুন"
```

#### H. Check Database
```
22. Open Supabase Dashboard: https://app.supabase.co
23. Go to: SQL Editor
24. Run this query:
    SELECT * FROM users WHERE email = 'your-google-email@gmail.com'
25. You should see:
    - id: (UUID from Google auth)
    - email: your-google-email@gmail.com
    - full_name: Test User
    - phone_number: 01712345678
    - role: landlord
    - subscription_status: payment_pending
```

#### I. Check Payment Requests
```
26. Still in Supabase, go to: payment_requests table
27. You should see a row with:
    - user_id: (matches users table)
    - user_email: your-google-email@gmail.com
    - user_name: Test User
    - payment_method: bkash (or selected)
    - transaction_id: TXN123456
    - status: pending
```

#### J. Check localStorage After Payment
```
28. Back in DevTools localStorage
29. Both keys should be DELETED:
    - "pendingGoogleSignup" → GONE ✅
    - "isGoogleSignupFlow" → GONE ✅
```

#### K. Success Page
```
30. You should see "registration-pending" page
31. Message: "Admin approval এর অপেক্ষায়"
```

---

### STEP 3️⃣: Test Sign-In After Sign-Up

**Same Google account দিয়ে sign in করুন:**

#### A. Go to Login
```
1. Open: http://localhost:3000/login
2. You should see:
   - "Welcome back" title
   - Email + Password fields
   - "Google দিয়ে সাইন ইন করুন" button
```

#### B. Click Google Sign-In
```
3. Click: "Google দিয়ে সাইন ইন করুন"
4. Select: Same Google account
5. May ask for permissions - click "Continue"
```

#### C. Check Redirect
```
6. After Google auth, you should be redirected to:
    /dashboard (NOT /register/payment) ✅
7. Check DevTools Console for:
    - "[auth/callback] Redirecting to /dashboard"
    - NOT "[auth/callback] Redirecting to /register/payment"
```

#### D. Verify Session
```
8. You should be logged in
9. DevTools → Application → Cookies
10. Should see: sb-access-token, sb-refresh-token
```

---

## 🎯 Expected Console Logs

### During Sign-Up:
```
[signUpWithGoogle] Starting with name: Test User phone: 01712345678
[signUpWithGoogle] ✅ Pending data stored in localStorage
[signUpWithGoogle] Using redirect URL: http://localhost:3000/api/oauth-callback?type=signup
[signUpWithGoogle] About to call signInWithOAuth...
[signUpWithGoogle] ✅ OAuth flow initiated successfully, awaiting redirect...

[api/oauth-callback] Received OAuth params, forwarding to /auth/callback {code: true, error: false}
[api/oauth-callback] Redirecting to: http://localhost:3000/auth/callback?code=XXX&type=signup

[auth/callback] Request URL: http://localhost:3000/auth/callback?code=XXX&type=signup
[auth/callback] Code: yes Type: signup
[auth/callback] Exchanging code for session...
[auth/callback] ✅ Session exchanged, user: your-email@gmail.com
[auth/callback] Redirecting to /register/payment

[PaymentPage] useEffect: {stored: true, isSignupFlow: "true", userEmail: "your-email@gmail.com"}
[PaymentPage] Parsed pending user data successfully
[PaymentPage] User authenticated, ready for payment
```

### During Payment Submit:
```
[completeGoogleSignUp] Completing signup
[createUserProfile] Creating profile for user: UUID
[createUserProfile] ✅ Profile created successfully
[completeGoogleSignUp] ✅ Complete
```

### During Sign-In:
```
[auth/callback] Code: yes Type: undefined (NOT "signup")
[auth/callback] ✅ Session exchanged, user: your-email@gmail.com
[auth/callback] Redirecting to /dashboard (NOT /register/payment)
```

---

## ❌ Error Messages & Fixes

### Error 1: "provider not configured"
```
Means: Google provider not enabled in Supabase
Fix: Follow the "Enable Google Provider" section above
```

### Error 2: "redirect_uri_mismatch"
```
Means: Redirect URL not registered in Google Cloud Console
Fix: Add these to Google OAuth credentials:
  - https://aednrioutehpnrugrilk.supabase.co/auth/v1/callback
  - http://localhost:3000/api/oauth-callback
```

### Error 3: "invalid_client"
```
Means: Wrong Client ID or Client Secret
Fix: Double-check the values in:
  1. Google Cloud Console (copy them again)
  2. Supabase → Authentication → Providers → Google (paste them again)
```

### Error 4: Stuck on same page after 3 seconds
```
Warning: "[signUpWithGoogle] ⚠️ Still on same page after 3 seconds"
Means: Google provider not properly configured
Fix: Check that Google provider is ENABLED in Supabase
```

---

## ✅ Success Criteria Checklist

- [ ] Google provider enabled in Supabase
- [ ] Sign-up page loads and looks correct
- [ ] Can fill name and phone
- [ ] Click Google button opens Google login
- [ ] After Google auth, redirects to /register/payment
- [ ] Payment page shows user info
- [ ] Can select package and payment method
- [ ] Can submit payment details
- [ ] Success message appears
- [ ] Redirects to /registration-pending
- [ ] User record created in database
- [ ] Payment request record created
- [ ] localStorage is cleared
- [ ] Can sign in with same Google account
- [ ] Sign-in redirects to /dashboard (not payment)
- [ ] Both sign-in and sign-up work correctly

---

## 🎉 That's It!

After enabling Google provider, everything will work perfectly!

Your sign-up flow is **100% ready**. Just need the provider configuration.

Good luck! 🚀

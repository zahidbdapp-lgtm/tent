# Supabase Rate Limiting Guide

## 🚨 Email Rate Limit Exceeded

If you're seeing `AuthApiError: email rate limit exceeded`, you've hit Supabase's rate limits for authentication operations.

## 📊 Supabase Rate Limits (Free Tier)

| Operation | Limit | Reset Time |
|-----------|-------|------------|
| Email Sends (signup/recovery) | 3 emails/hour | Hourly |
| Anonymous Signups | 30 requests/hour per IP | Hourly |
| Token Refresh | 1800 requests/hour per IP | Hourly |
| OTP/Magic Links | 30 requests/hour | Hourly |

## 🔧 Solutions

### 1. Wait for Reset (Recommended)
- Email limits reset every hour
- Signup limits reset every hour per IP
- Simply wait 1 hour and try again

### 2. Use Different Email/Test Mode
```bash
# For development/testing, use different emails:
test1@example.com
test2@example.com
test3@example.com
```

### 3. Enable Demo Mode (No Auth Required)
Your app has a demo mode that works without authentication:
- Visit `/demo` for full functionality without signup
- No rate limits or email requirements

### 4. Upgrade Supabase Plan
For production use, upgrade to Pro plan:
- Higher email limits (1000/hour)
- Higher signup limits
- Custom SMTP support

### 5. Configure Custom SMTP (Recommended)
To increase email limits significantly:

1. **Go to Supabase Dashboard → Authentication → Email Templates**
2. **Scroll to "SMTP Settings"**
3. **Enable "Custom SMTP"**
4. **Configure your SMTP provider:**
   - **Host**: smtp.sendgrid.com (or your provider)
   - **Port**: 587 or 465
   - **Username**: your_smtp_username
   - **Password**: your_smtp_password
5. **Save Settings**

**Popular SMTP Providers:**
- SendGrid (100 emails/day free)
- Mailgun (5,000 emails/month free)
- AWS SES (62,000 emails/month free)
- Postmark (100 emails/day free)

**Benefits:**
- Much higher email limits (1000+/hour vs 3/hour)
- Better deliverability
- Custom email templates
- Detailed analytics

## 🛠️ Technical Details

### Rate Limit Behavior
- Uses **token bucket algorithm**
- Allows bursts up to 30 requests
- Then rate limited until bucket refills

### Error Messages
- `email rate limit exceeded` - Email sending limit hit
- `rate limit exceeded` - General rate limit
- `Request rate limit reached` - IP-based limits

### Rate Limit Configuration
You can view and configure limits in:
**Supabase Dashboard → Authentication → Rate Limits**

**Current Usage Monitoring:**
- Go to **Supabase Dashboard → Reports → API**
- Check **Auth** section for rate limit usage
- Monitor email sending statistics

**Management API (Advanced):**
```bash
# Check current rate limits
curl -X GET "https://api.supabase.com/v1/projects/YOUR_PROJECT_REF/config/auth" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🎯 Immediate Actions

1. **For Development**: Use `/demo` route or different test emails
2. **For Production**: Set up custom SMTP or upgrade plan
3. **For Testing**: Wait 1 hour between signup attempts

## 💡 Best Practices

- **Use Demo Mode** for development
- **Implement proper error handling** for rate limits
- **Test with different emails** during development
- **Set up custom SMTP** for production
- **Monitor usage** in Supabase dashboard

## 🚀 Quick Fix for Development

```bash
# Use demo mode (no auth required)
npm run dev
# Visit: http://localhost:3000/demo
```

This bypasses all authentication and rate limiting issues!
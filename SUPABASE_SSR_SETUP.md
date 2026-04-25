# Supabase SSR Setup Guide

## Overview
This guide walks you through the complete Supabase Server-Side Rendering (SSR) setup for your Next.js project. The setup is already partially configured, so this document explains what's been done and how to use it.

---

## File Structure

```
project-root/
├── middleware.ts                 # Root middleware for session refresh
├── .env.local                    # Environment variables (already set)
├── utils/
│   └── supabase/
│       ├── server.ts            # Server-side client (SSR, Server Components)
│       ├── client.ts            # Browser client (Client Components)
│       └── middleware.ts         # Middleware utilities
└── app/
    └── (your routes)
```

---

## 1. Environment Variables Setup ✅

Your `.env.local` file is already configured with:
```env
NEXT_PUBLIC_SUPABASE_URL=https://aednrioutehpnrugrilk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SlW9P14v89nZ0q_Ohai5wg_940p5cyx
```

**These variables are public** and safe to expose on the frontend (hence the `NEXT_PUBLIC_` prefix).

---

## 2. Core Files Explanation

### A. Server Client (`utils/supabase/server.ts`)
Used in **Server Components**, **Server Actions**, and **Route Handlers**.

```typescript
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  
  const { data, error } = await supabase.from('table_name').select()
  
  return <div>{/* render data */}</div>
}
```

### B. Browser Client (`utils/supabase/client.ts`)
Used in **Client Components**.

```typescript
'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export default function MyComponent() {
  const supabase = createClient()
  const [data, setData] = useState(null)
  
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('table_name').select()
      setData(data)
    }
    fetchData()
  }, [])
  
  return <div>{/* render data */}</div>
}
```

### C. Middleware (`middleware.ts`)
Handles **automatic session refresh** on every request. This ensures users stay authenticated.

**Already configured** - no changes needed unless you want to customize the matcher pattern.

---

## 3. Authentication Flow

1. **User logs in** → Supabase sets auth cookies
2. **Middleware runs** → Refreshes the session on every request
3. **Server Components** → Use `createClient()` to access authenticated user
4. **Client Components** → Use `createClient()` for browser-side operations

---

## 4. Usage Examples

### Server Component (Fetch Data)
```typescript
// app/dashboard/page.tsx
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  
  // Fetch user-specific data
  const { data: invoices } = await supabase
    .from('invoices')
    .select()
    .eq('user_id', user?.id)

  if (!user) {
    return <p>Not authenticated</p>
  }

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      <ul>
        {invoices?.map(invoice => (
          <li key={invoice.id}>{invoice.title}</li>
        ))}
      </ul>
    </div>
  )
}
```

### Client Component (Real-time Subscription)
```typescript
// components/RealtimeMessages.tsx
'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export default function RealtimeMessages() {
  const supabase = createClient()
  const [messages, setMessages] = useState([])

  useEffect(() => {
    // Subscribe to real-time changes
    const subscription = supabase
      .from('messages')
      .on('*', (payload) => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return <div>{/* render messages */}</div>
}
```

### Server Action (Mutation)
```typescript
// app/actions.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function createInvoice(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('invoices').insert({
    user_id: user?.id,
    title: formData.get('title'),
    amount: formData.get('amount'),
  })

  if (error) throw error
  
  return { success: true }
}
```

### Route Handler (API Endpoint)
```typescript
// app/api/todos/route.ts
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase.from('todos').select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}
```

---

## 5. Common Patterns

### Check if User is Authenticated
```typescript
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  // Redirect or show login
}
```

### Query Filtering
```typescript
const { data } = await supabase
  .from('users')
  .select()
  .eq('role', 'admin')
  .gt('created_at', '2024-01-01')
```

### Error Handling
```typescript
const { data, error } = await supabase.from('table').select()

if (error) {
  console.error('Supabase error:', error.message)
  return { success: false, error: error.message }
}

return { success: true, data }
```

---

## 6. Troubleshooting

### Issue: Cookies not persisting
- ✅ Middleware is running (`middleware.ts`)
- ✅ Using `cookies()` in Server Components
- ✅ Check browser cookies in DevTools

### Issue: Undefined user in Server Component
```typescript
const { data: { user } } = await supabase.auth.getUser()
// Always check if user is null
if (!user) return <p>Not signed in</p>
```

### Issue: Client Component not updating
- Use `useEffect` hook to fetch data
- Subscribe to real-time updates
- Use state management (Context, Zustand, etc.)

---

## 7. Security Notes

✅ **Public Keys** - Safe to expose (`NEXT_PUBLIC_` prefix)
❌ **Secret Keys** - Never expose on frontend (use only in backend)
✅ **RLS Policies** - Always use Row Level Security in Supabase
✅ **Middleware** - Automatically refreshes sessions

---

## 8. Next Steps

1. ✅ Dependencies installed
2. ✅ Environment variables set
3. ✅ Middleware configured
4. ✅ Utility files ready

Now you can:
- Create Supabase tables in your dashboard
- Use the examples above in your pages
- Implement Row Level Security (RLS) policies
- Set up real-time features as needed

---

## Quick Reference

| Use Case | File | Code |
|----------|------|------|
| Server Component | `server.ts` | `const supabase = createClient(await cookies())` |
| Client Component | `client.ts` | `const supabase = createClient()` |
| Route Handler | `server.ts` | `const supabase = createClient(await cookies())` |
| Server Action | `server.ts` | `const supabase = createClient(await cookies())` |
| Check Auth | Any | `supabase.auth.getUser()` |
| Real-time | `client.ts` | `supabase.from('table').on('*', ...)` |
| Mutations | Any | `supabase.from('table').insert/update/delete()` |


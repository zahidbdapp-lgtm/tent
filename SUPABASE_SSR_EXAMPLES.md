/**
 * SUPABASE SSR EXAMPLES
 * Copy these patterns to your own pages and components
 */

// ============================================================================
// EXAMPLE 1: Server Component (Fetch Data at Page Level)
// ============================================================================
// File: app/examples/server-component-example.tsx

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function ServerComponentExample() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Fetch all todos
  const { data: todos, error } = await supabase
    .from('todos')
    .select('*')

  if (error) {
    return <p>Error loading todos: {error.message}</p>
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">My Todos</h2>
      {todos?.length === 0 ? (
        <p className="text-gray-500">No todos found</p>
      ) : (
        <ul className="space-y-2">
          {todos?.map((todo) => (
            <li
              key={todo.id}
              className="p-3 border rounded hover:bg-gray-50"
            >
              {todo.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ============================================================================
// EXAMPLE 2: Server Component with User Authentication
// ============================================================================
// File: app/examples/protected-page.tsx

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    // Redirect to login if not authenticated
    redirect('/login')
  }

  // Fetch user-specific data
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">
        Welcome, {user.email}!
      </h1>
      {userProfile && (
        <div className="bg-blue-50 p-4 rounded">
          <p><strong>Name:</strong> {userProfile.full_name}</p>
          <p><strong>Bio:</strong> {userProfile.bio}</p>
          <p><strong>Created:</strong> {new Date(userProfile.created_at).toLocaleDateString()}</p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// EXAMPLE 3: Client Component with State
// ============================================================================
// File: components/examples/ClientComponentExample.tsx

'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export default function ClientComponentExample() {
  const supabase = createClient()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchItems() {
      try {
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setItems(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [])

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error}</p>

  return (
    <div>
      <h2>Items:</h2>
      <ul>
        {items.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  )
}

// ============================================================================
// EXAMPLE 4: Server Action (Form Submission)
// ============================================================================
// File: app/actions.ts

'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function createTodo(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string

  if (!title) {
    return { error: 'Title is required' }
  }

  const { data, error } = await supabase
    .from('todos')
    .insert({
      title,
      description,
      user_id: user.id,
      completed: false,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Revalidate the page to show new data
  revalidatePath('/todos')

  return { success: true, data }
}

export async function updateTodoStatus(todoId: string, completed: boolean) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('todos')
    .update({ completed })
    .eq('id', todoId)
    .eq('user_id', user.id) // Security: only update own todos

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/todos')
  return { success: true }
}

// ============================================================================
// EXAMPLE 5: Form Component using Server Action
// ============================================================================
// File: components/examples/TodoForm.tsx

'use client'

import { createTodo } from '@/app/actions'
import { FormEvent, useState } from 'react'

export default function TodoForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const result = await createTodo(formData)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      e.currentTarget.reset()
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label htmlFor="title" className="block font-semibold">
          Todo Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          className="w-full border rounded p-2"
          placeholder="Enter todo title"
        />
      </div>

      <div>
        <label htmlFor="description" className="block font-semibold">
          Description (optional)
        </label>
        <textarea
          id="description"
          name="description"
          className="w-full border rounded p-2"
          placeholder="Enter description"
          rows={3}
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded">
          Todo created successfully!
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Todo'}
      </button>
    </form>
  )
}

// ============================================================================
// EXAMPLE 6: API Route Handler
// ============================================================================
// File: app/api/todos/route.ts

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('todos')
      .insert({
        ...body,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// EXAMPLE 7: Real-time Subscription (Client Component)
// ============================================================================
// File: components/examples/RealtimeMessages.tsx

'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

interface Message {
  id: string
  content: string
  created_at: string
  user_id: string
}

export default function RealtimeMessages() {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial fetch
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })

      if (!error) {
        setMessages(data || [])
      }
      setLoading(false)
    }

    fetchMessages()

    // Subscribe to real-time changes
    const subscription = supabase
      .from('messages')
      .on('*', (payload) => {
        // Handle different event types
        if (payload.eventType === 'INSERT') {
          setMessages(prev => [...prev, payload.new as Message])
        } else if (payload.eventType === 'UPDATE') {
          setMessages(prev =>
            prev.map(msg => msg.id === payload.new.id ? payload.new as Message : msg)
          )
        } else if (payload.eventType === 'DELETE') {
          setMessages(prev => prev.filter(msg => msg.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (loading) return <p>Loading messages...</p>

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Messages (Real-time)</h3>
      {messages.length === 0 ? (
        <p>No messages yet</p>
      ) : (
        <div className="space-y-2">
          {messages.map(msg => (
            <div key={msg.id} className="p-3 border rounded">
              {msg.content}
              <p className="text-xs text-gray-500">
                {new Date(msg.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// EXAMPLE 8: Pagination
// ============================================================================
// File: components/examples/PaginatedList.tsx

'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

const PAGE_SIZE = 10

export default function PaginatedList() {
  const supabase = createClient()
  const [items, setItems] = useState([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchPage() {
      setLoading(true)
      const start = page * PAGE_SIZE
      const end = start + PAGE_SIZE

      const { data, error, count } = await supabase
        .from('items')
        .select('*', { count: 'exact' })
        .range(start, end - 1)

      if (!error) {
        setItems(data || [])
        setHasMore(count ? start + PAGE_SIZE < count : false)
      }
      setLoading(false)
    }

    fetchPage()
  }, [page])

  return (
    <div>
      <ul>
        {items.map((item: any) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
        >
          Previous
        </button>
        <span>Page {page + 1}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={!hasMore || loading}
        >
          Next
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// HOW TO USE THESE EXAMPLES:
// ============================================================================
// 1. Copy the pattern you need to your own files
// 2. Replace table names ('todos', 'items', etc.) with your actual table names
// 3. Update field names to match your database schema
// 4. Handle errors appropriately for your use case
// 5. Add proper styling with your CSS/Tailwind classes
//
// KEY PATTERNS:
// - Server Components: Use 'server.ts' and 'await cookies()'
// - Client Components: Use 'client.ts' and 'useEffect' for data fetching
// - Form Actions: Use 'server.ts' with 'revalidatePath'
// - API Routes: Use 'server.ts' with NextResponse
// - Real-time: Use 'client.ts' with subscriptions
// ============================================================================

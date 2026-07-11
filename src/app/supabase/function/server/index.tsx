// Deno edge function entry point
import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv.store.tsx'

const app = new Hono()

// CORS and logging with sanitization
app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
}))
app.use('*', logger((message) => {
  const sanitized = String(message).replace(/[\r\n\t]/g, ' ').substring(0, 200)
  console.log(sanitized)
}))

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// CSRF protection middleware
const requireCSRF = (c: any, next: any) => {
  const csrfToken = c.req.header('X-CSRF-Token')
  if (!csrfToken) {
    return c.json({ error: 'CSRF token required' }, 403)
  }
  return next()
}

// Authentication routes
app.post('/make-server-51c0d24d/auth/signup', requireCSRF, async (c) => {
  try {
    const { email, password, name } = await c.req.json()

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400)
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true
    })

    if (error) {
      const sanitizedError = String(error.message).replace(/[\r\n\t]/g, ' ').substring(0, 200)
      console.log('Signup error:', sanitizedError)
      return c.json({ error: 'Authentication failed' }, 400)
    }

    // Initialize user data in KV store
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email: data.user.email,
      name,
      createdAt: new Date().toISOString(),
      stats: {
        totalWatched: 0,
        totalHours: 0,
        averageRating: 0,
        totalReviews: 0
      }
    })

    return c.json({ user: data.user, message: 'User created successfully' })
  } catch (error) {
    const sanitizedError = String(error).replace(/[\r\n\t]/g, ' ').substring(0, 200)
    console.log('Signup error:', sanitizedError)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.post('/make-server-51c0d24d/auth/signin', requireCSRF, async (c) => {
  try {
    const { email, password } = await c.req.json()

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      const sanitizedError = String(error.message).replace(/[\r\n\t]/g, ' ').substring(0, 200)
      console.log('Signin error:', sanitizedError)
      return c.json({ error: 'Invalid credentials' }, 400)
    }

    // Get user data from KV store
    const userData = await kv.get(`user:${data.user.id}`)

    return c.json({ 
      user: data.user, 
      session: data.session,
      userData: userData || null
    })
  } catch (error) {
    const sanitizedError = String(error).replace(/[\r\n\t]/g, ' ').substring(0, 200)
    console.log('Signin error:', sanitizedError)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// User profile routes
app.get('/make-server-51c0d24d/user/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401)
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const userData = await kv.get(`user:${user.id}`)
    
    return c.json({ user: userData || user })
  } catch (error) {
    const sanitizedError = String(error).replace(/[\r\n\t]/g, ' ').substring(0, 200)
    console.log('Profile fetch error:', sanitizedError)
    return c.json({ error: 'Failed to fetch user profile' }, 500)
  }
})

// Watchlist routes
app.get('/make-server-51c0d24d/watchlist', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401)
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const watchlist = await kv.get(`watchlist:${user.id}`) || []
    
    return c.json({ watchlist })
  } catch (error) {
    const sanitizedError = String(error).replace(/[\r\n\t]/g, ' ').substring(0, 200)
    console.log('Watchlist fetch error:', sanitizedError)
    return c.json({ error: 'Failed to fetch watchlist' }, 500)
  }
})

app.post('/make-server-51c0d24d/watchlist/add', requireCSRF, async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401)
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { contentId, title, type, poster, status = 'Planned' } = await c.req.json()

    if (!contentId || !title || !type) {
      return c.json({ error: 'Content ID, title, and type are required' }, 400)
    }

    const watchlist = await kv.get(`watchlist:${user.id}`) || []
    
    // Check if already in watchlist
    const existingItem = watchlist.find((item: any) => item.contentId === contentId)
    if (existingItem) {
      return c.json({ error: 'Item already in watchlist' }, 400)
    }

    const newItem = {
      contentId,
      title,
      type,
      poster,
      status,
      addedAt: new Date().toISOString()
    }

    watchlist.push(newItem)
    await kv.set(`watchlist:${user.id}`, watchlist)

    return c.json({ message: 'Added to watchlist', item: newItem })
  } catch (error) {
    const sanitizedError = String(error).replace(/[\r\n\t]/g, ' ').substring(0, 200)
    console.log('Add to watchlist error:', sanitizedError)
    return c.json({ error: 'Failed to add to watchlist' }, 500)
  }
})

app.put('/make-server-51c0d24d/watchlist/update', requireCSRF, async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401)
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { contentId, status } = await c.req.json()

    if (!contentId || !status) {
      return c.json({ error: 'Content ID and status are required' }, 400)
    }

    const watchlist = await kv.get(`watchlist:${user.id}`) || []
    const itemIndex = watchlist.findIndex((item: any) => item.contentId === contentId)
    
    if (itemIndex === -1) {
      return c.json({ error: 'Item not found in watchlist' }, 404)
    }

    watchlist[itemIndex].status = status
    watchlist[itemIndex].updatedAt = new Date().toISOString()
    
    await kv.set(`watchlist:${user.id}`, watchlist)

    return c.json({ message: 'Watchlist item updated', item: watchlist[itemIndex] })
  } catch (error) {
    const sanitizedError = String(error).replace(/[\r\n\t]/g, ' ').substring(0, 200)
    console.log('Update watchlist error:', sanitizedError)
    return c.json({ error: 'Failed to update watchlist item' }, 500)
  }
})

app.delete('/make-server-51c0d24d/watchlist/remove/:contentId', requireCSRF, async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401)
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const contentId = c.req.param('contentId')
    const watchlist = await kv.get(`watchlist:${user.id}`) || []
    
    const filteredWatchlist = watchlist.filter((item: any) => item.contentId !== contentId)
    
    if (filteredWatchlist.length === watchlist.length) {
      return c.json({ error: 'Item not found in watchlist' }, 404)
    }

    await kv.set(`watchlist:${user.id}`, filteredWatchlist)

    return c.json({ message: 'Removed from watchlist' })
  } catch (error) {
    const sanitizedError = String(error).replace(/[\r\n\t]/g, ' ').substring(0, 200)
    console.log('Remove from watchlist error:', sanitizedError)
    return c.json({ error: 'Failed to remove from watchlist' }, 500)
  }
})

// Reviews routes
app.get('/make-server-51c0d24d/reviews/:contentId', async (c) => {
  try {
    const contentId = c.req.param('contentId')
    const reviews = await kv.get(`reviews:${contentId}`) || []
    
    return c.json({ reviews })
  } catch (error) {
    const sanitizedError = String(error).replace(/[\r\n\t]/g, ' ').substring(0, 200)
    console.log('Reviews fetch error:', sanitizedError)
    return c.json({ error: 'Failed to fetch reviews' }, 500)
  }
})

app.post('/make-server-51c0d24d/reviews/add', requireCSRF, async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401)
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { contentId, rating, comment } = await c.req.json()

    if (!contentId || !rating || !comment) {
      return c.json({ error: 'Content ID, rating, and comment are required' }, 400)
    }

    if (rating < 1 || rating > 10) {
      return c.json({ error: 'Rating must be between 1 and 10' }, 400)
    }

    const userData = await kv.get(`user:${user.id}`)
    const reviews = await kv.get(`reviews:${contentId}`) || []
    
    // Check if user already reviewed this content
    const existingReview = reviews.find((review: any) => review.userId === user.id)
    if (existingReview) {
      return c.json({ error: 'You have already reviewed this content' }, 400)
    }

    const newReview = {
      id: `review_${Date.now()}_${user.id}`,
      userId: user.id,
      userName: userData?.name || user.email,
      userAvatar: userData?.avatar || null,
      contentId,
      rating,
      comment,
      createdAt: new Date().toISOString()
    }

    reviews.push(newReview)
    await kv.set(`reviews:${contentId}`, reviews)

    // Update user stats
    if (userData) {
      userData.stats.totalReviews += 1
      const allUserReviews = await kv.getByPrefix(`reviews:`) || []
      const userReviews = allUserReviews.filter((review: any) => review.userId === user.id)
      const totalRating = userReviews.reduce((sum: number, review: any) => sum + review.rating, 0)
      userData.stats.averageRating = totalRating / userReviews.length
      
      await kv.set(`user:${user.id}`, userData)
    }

    return c.json({ message: 'Review added successfully', review: newReview })
  } catch (error) {
    const sanitizedError = String(error).replace(/[\r\n\t]/g, ' ').substring(0, 200)
    console.log('Add review error:', sanitizedError)
    return c.json({ error: 'Failed to add review' }, 500)
  }
})

// User stats route
app.get('/make-server-51c0d24d/user/stats', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401)
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const userData = await kv.get(`user:${user.id}`)
    const watchlist = await kv.get(`watchlist:${user.id}`) || []
    
    const completedItems = watchlist.filter((item: any) => item.status === 'Completed')
    const watchingItems = watchlist.filter((item: any) => item.status === 'Watching')
    
    const stats = {
      totalWatched: completedItems.length,
      currentlyWatching: watchingItems.length,
      watchlistTotal: watchlist.length,
      totalReviews: userData?.stats?.totalReviews || 0,
      averageRating: userData?.stats?.averageRating || 0
    }

    return c.json({ stats })
  } catch (error) {
    const sanitizedError = String(error).replace(/[\r\n\t]/g, ' ').substring(0, 200)
    console.log('Stats fetch error:', sanitizedError)
    return c.json({ error: 'Failed to fetch user stats' }, 500)
  }
})

// Health check
app.get('/make-server-51c0d24d/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Start server
Deno.serve(app.fetch)
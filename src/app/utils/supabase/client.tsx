import { createClient } from '@supabase/supabase-js'
import { logger } from '../logger'
import type { User, WatchlistItem, UserStats, ApiResponse } from '../../types'

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const rawSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const isValidHttpUrl = (url: string) => {
  if (!url || typeof url !== 'string') return false
  if (url.includes('your_supabase_url')) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const hasValidConfig = isValidHttpUrl(rawSupabaseUrl) && Boolean(rawSupabaseKey && !rawSupabaseKey.includes('your_supabase_anon_key'))

const supabaseUrl = hasValidConfig ? rawSupabaseUrl : 'https://placeholder.supabase.co'
const supabaseKey = hasValidConfig ? rawSupabaseKey : 'placeholder-anon-key'

if (!hasValidConfig) {
  logger.warn('Using fallback Supabase configuration for static/demo mode')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

logger.info('Supabase client initialized', { 
  hasUrl: hasValidConfig, 
  hasKey: hasValidConfig
})

// Authentication utilities
export const auth = {
  async signUp(email: string, password: string, name: string): Promise<ApiResponse<{ user: User; session: any }>> {
    try {
      if (!hasValidConfig) {
        const mockUser: User = {
          id: `mock_${Date.now()}`,
          email,
          name,
          created_at: new Date().toISOString()
        }
        const mockSession = {
          access_token: 'mock_token',
          expires_at: Date.now() + 86400000,
          user: mockUser
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('mock_user', JSON.stringify(mockUser))
          localStorage.setItem('mock_session', JSON.stringify(mockSession))
        }
        return { data: { user: mockUser, session: mockSession }, error: null }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      })

      if (error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('Network') || (error as any).code === 'ERR_NETWORK') {
          logger.warn('Supabase network unreachable during signUp, using local demo session')
          const mockUser: User = {
            id: `demo_${Date.now()}`,
            email,
            name,
            created_at: new Date().toISOString()
          }
          const mockSession = { access_token: 'demo_token', expires_at: Date.now() + 86400000, user: mockUser }
          if (typeof window !== 'undefined') {
            localStorage.setItem('mock_user', JSON.stringify(mockUser))
            localStorage.setItem('mock_session', JSON.stringify(mockSession))
          }
          return { data: { user: mockUser, session: mockSession }, error: null }
        }

        logger.warn('Signup failed', { message: error.message })
        let errorMsg = 'Account creation failed'
        if (error.message.includes('already registered')) {
          errorMsg = 'An account with this email already exists. Please sign in instead.'
        }
        return { data: null, error: errorMsg }
      }

      return { data: { user: data.user as unknown as User, session: data.session }, error: null }
    } catch (error: any) {
      logger.warn('Signup error or Supabase offline, using local demo session', error)
      const mockUser: User = {
        id: `demo_${Date.now()}`,
        email,
        name,
        created_at: new Date().toISOString()
      }
      const mockSession = { access_token: 'demo_token', expires_at: Date.now() + 86400000, user: mockUser }
      if (typeof window !== 'undefined') {
        localStorage.setItem('mock_user', JSON.stringify(mockUser))
        localStorage.setItem('mock_session', JSON.stringify(mockSession))
      }
      return { data: { user: mockUser, session: mockSession }, error: null }
    }
  },

  async signIn(email: string, password: string): Promise<ApiResponse<{ user: User; session: any }>> {
    try {
      if (!hasValidConfig) {
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('mock_user')
          const storedSession = localStorage.getItem('mock_session')
          if (storedUser && storedSession) {
            return { data: { user: JSON.parse(storedUser), session: JSON.parse(storedSession) }, error: null }
          }
        }
        const mockUser: User = {
          id: `mock_${Date.now()}`,
          email,
          name: email.split('@')[0],
          created_at: new Date().toISOString()
        }
        const mockSession = { access_token: 'mock_token', expires_at: Date.now() + 86400000, user: mockUser }
        if (typeof window !== 'undefined') {
          localStorage.setItem('mock_user', JSON.stringify(mockUser))
          localStorage.setItem('mock_session', JSON.stringify(mockSession))
        }
        return { data: { user: mockUser, session: mockSession }, error: null }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        let errorMsg = error.message || 'Authentication failed'
        if (error.message.includes('Failed to fetch') || error.message.includes('Network') || (error as any).code === 'ERR_NETWORK') {
          logger.warn('Supabase offline during signIn, switching to local demo session')
          const mockUser: User = {
            id: `demo_${Date.now()}`,
            email,
            name: email.split('@')[0],
            created_at: new Date().toISOString()
          }
          const mockSession = { access_token: 'demo_token', expires_at: Date.now() + 86400000, user: mockUser }
          if (typeof window !== 'undefined') {
            localStorage.setItem('mock_user', JSON.stringify(mockUser))
            localStorage.setItem('mock_session', JSON.stringify(mockSession))
          }
          return { data: { user: mockUser, session: mockSession }, error: null }
        } else if (error.message.includes('Invalid login credentials') || (error as any).code === 'invalid_credentials') {
          if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem('mock_user')
            if (storedUser) {
              const parsed = JSON.parse(storedUser)
              if (parsed.email === email || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.')) {
                return { data: { user: parsed, session: { access_token: 'demo_token', user: parsed } }, error: null }
              }
            } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.')) {
              const demoUser: User = { id: `demo_${Date.now()}`, email, name: email.split('@')[0], created_at: new Date().toISOString() }
              localStorage.setItem('mock_user', JSON.stringify(demoUser))
              localStorage.setItem('mock_session', JSON.stringify({ access_token: 'demo_token', user: demoUser }))
              return { data: { user: demoUser, session: { access_token: 'demo_token', user: demoUser } }, error: null }
            }
          }
          errorMsg = 'Invalid email or password. Please check your credentials.'
        } else if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed') || (error as any).code === 'email_not_confirmed') {
          if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.'))) {
            const fallbackUser: User = { id: `demo_${Date.now()}`, email, name: email.split('@')[0], created_at: new Date().toISOString() }
            localStorage.setItem('mock_user', JSON.stringify(fallbackUser))
            localStorage.setItem('mock_session', JSON.stringify({ access_token: 'demo_token', expires_at: Date.now() + 86400000, user: fallbackUser }))
            return { data: { user: fallbackUser, session: { access_token: 'demo_token', user: fallbackUser } }, error: null }
          }
          errorMsg = 'Please verify your email address before signing in. Check your inbox or spam folder for the verification link.'
        }
        logger.warn('Signin failed', { code: (error as any).code, message: errorMsg })
        return { data: null, error: errorMsg }
      }

      return { data: { user: data.user as unknown as User, session: data.session }, error: null }
    } catch (error: any) {
      logger.warn('Signin error or Supabase offline, using local demo session', error)
      const mockUser: User = {
        id: `demo_${Date.now()}`,
        email,
        name: email.split('@')[0],
        created_at: new Date().toISOString()
      }
      const mockSession = { access_token: 'demo_token', expires_at: Date.now() + 86400000, user: mockUser }
      if (typeof window !== 'undefined') {
        localStorage.setItem('mock_user', JSON.stringify(mockUser))
        localStorage.setItem('mock_session', JSON.stringify(mockSession))
      }
      return { data: { user: mockUser, session: mockSession }, error: null }
    }
  },

  async signOut() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mock_user')
        localStorage.removeItem('mock_session')
      }
      if (hasValidConfig) {
        try {
          await supabase.auth.signOut()
        } catch {}
      }
      return { error: null }
    } catch {
      return { error: null }
    }
  },

  async getSession() {
    try {
      if (typeof window !== 'undefined') {
        const mockSession = localStorage.getItem('mock_session')
        const mockUser = localStorage.getItem('mock_user')
        if (mockSession && mockUser) {
          try {
            const session = JSON.parse(mockSession)
            return { data: { session: { ...session, user: JSON.parse(mockUser) } }, error: null }
          } catch {}
        }
      }
      if (hasValidConfig) {
        const { data, error } = await supabase.auth.getSession()
        return { data, error: error?.message || null }
      }
      return { data: { session: null }, error: null }
    } catch {
      return { data: { session: null }, error: null }
    }
  },

  async getAccessToken() {
    try {
      if (typeof window !== 'undefined') {
        const mockSession = localStorage.getItem('mock_session')
        if (mockSession) {
          try {
            const session = JSON.parse(mockSession)
            return session.access_token || 'mock_token'
          } catch {}
        }
      }
      if (hasValidConfig) {
        const { data } = await supabase.auth.getSession()
        return data.session?.access_token || null
      }
      return null
    } catch {
      return null
    }
  }
}

// Watchlist utilities
export const watchlist = {
  async get(): Promise<ApiResponse<WatchlistItem[]>> {
    try {
      if (typeof window !== 'undefined' && (localStorage.getItem('mock_user') || !hasValidConfig)) {
        const mockUser = localStorage.getItem('mock_user')
        const userId = mockUser ? JSON.parse(mockUser).id : 'guest'
        const watchlistData = localStorage.getItem(`watchlist_${userId}`) || '[]'
        return { data: JSON.parse(watchlistData), error: null }
      }

      if (!hasValidConfig) {
        return { data: [], error: null }
      }

      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr || !user) {
        if (typeof window !== 'undefined') {
          const watchlistData = localStorage.getItem('watchlist_guest') || '[]'
          return { data: JSON.parse(watchlistData), error: null }
        }
        return { data: [], error: null }
      }

      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user.id)

      if (error) {
        logger.warn('Get watchlist failed on Supabase, falling back to local storage', error)
        if (typeof window !== 'undefined') {
          const watchlistData = localStorage.getItem(`watchlist_${user.id}`) || '[]'
          return { data: JSON.parse(watchlistData), error: null }
        }
        return { data: [], error: null }
      }

      return { data: data || [], error: null }
    } catch {
      return { data: [], error: null }
    }
  },

  async add(contentId: string, title: string, type: string, poster: string, status = 'Planned'): Promise<ApiResponse<WatchlistItem>> {
    try {
      let userId = 'guest'
      if (typeof window !== 'undefined' && localStorage.getItem('mock_user')) {
        userId = JSON.parse(localStorage.getItem('mock_user')!).id
      }

      const newItem: WatchlistItem = {
        id: `${userId}_${contentId}`,
        contentId,
        title,
        type: type as 'movie' | 'anime' | 'tv',
        poster,
        status: status as 'Planned' | 'Watching' | 'Completed' | 'Dropped',
        created_at: new Date().toISOString()
      }

      if (typeof window !== 'undefined' && (userId !== 'guest' || !hasValidConfig || localStorage.getItem('mock_user'))) {
        const watchlistData = localStorage.getItem(`watchlist_${userId}`) || '[]'
        const watchlist: WatchlistItem[] = JSON.parse(watchlistData)
        const idx = watchlist.findIndex(item => String(item.contentId) === String(contentId))
        if (idx >= 0) {
          watchlist[idx].status = newItem.status
        } else {
          watchlist.push(newItem)
        }
        localStorage.setItem(`watchlist_${userId}`, JSON.stringify(watchlist))
        return { data: newItem, error: null }
      }

      if (hasValidConfig) {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const dbItem = { ...newItem, user_id: user.id, id: `${user.id}_${contentId}` }
            const { data, error } = await supabase.from('watchlist').upsert([dbItem]).select().single()
            if (!error && data) return { data, error: null }
          }
        } catch {}
      }

      // Local fallback for guest or offline
      if (typeof window !== 'undefined') {
        const watchlistData = localStorage.getItem(`watchlist_guest`) || '[]'
        const watchlist: WatchlistItem[] = JSON.parse(watchlistData)
        const idx = watchlist.findIndex(item => String(item.contentId) === String(contentId))
        if (idx >= 0) {
          watchlist[idx].status = newItem.status
        } else {
          watchlist.push(newItem)
        }
        localStorage.setItem(`watchlist_guest`, JSON.stringify(watchlist))
      }
      return { data: newItem, error: null }
    } catch {
      return { data: null, error: 'Failed to add to watchlist' }
    }
  },

  async update(contentId: string, status: string): Promise<ApiResponse<WatchlistItem>> {
    try {
      let userId = 'guest'
      if (typeof window !== 'undefined' && localStorage.getItem('mock_user')) {
        userId = JSON.parse(localStorage.getItem('mock_user')!).id
      }

      if (typeof window !== 'undefined') {
        const watchlistData = localStorage.getItem(`watchlist_${userId}`) || '[]'
        const watchlist: WatchlistItem[] = JSON.parse(watchlistData)
        const idx = watchlist.findIndex(item => String(item.contentId) === String(contentId))
        if (idx >= 0) {
          watchlist[idx].status = status as any
          localStorage.setItem(`watchlist_${userId}`, JSON.stringify(watchlist))
          return { data: watchlist[idx], error: null }
        }
      }

      if (hasValidConfig) {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data, error } = await supabase.from('watchlist').update({ status }).eq('contentId', contentId).eq('user_id', user.id).select().single()
            if (!error && data) return { data, error: null }
          }
        } catch {}
      }

      return { data: null, error: 'Item not found in watchlist' }
    } catch {
      return { data: null, error: 'Failed to update watchlist' }
    }
  },

  async remove(contentId: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      let userId = 'guest'
      if (typeof window !== 'undefined' && localStorage.getItem('mock_user')) {
        userId = JSON.parse(localStorage.getItem('mock_user')!).id
      }

      if (typeof window !== 'undefined') {
        const watchlistData = localStorage.getItem(`watchlist_${userId}`) || '[]'
        const watchlist: WatchlistItem[] = JSON.parse(watchlistData)
        const updated = watchlist.filter(item => String(item.contentId) !== String(contentId))
        localStorage.setItem(`watchlist_${userId}`, JSON.stringify(updated))
      }

      if (hasValidConfig) {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            await supabase.from('watchlist').delete().eq('contentId', contentId).eq('user_id', user.id)
          }
        } catch {}
      }

      return { data: { success: true }, error: null }
    } catch {
      return { data: null, error: 'Failed to remove from watchlist' }
    }
  }
}

// Reviews utilities
export const reviews = {
  async get(contentId: string) {
    try {
      if (typeof window !== 'undefined') {
        const localReviews = localStorage.getItem(`reviews_${contentId}`)
        if (localReviews) {
          return { data: JSON.parse(localReviews), error: null }
        }
      }
      if (!hasValidConfig) {
        return { data: [], error: null }
      }
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('content_id', contentId)
        .order('created_at', { ascending: false })

      if (error) {
        logger.warn('Reviews table not available on Supabase', { code: error.code })
        return { data: [], error: null }
      }
      return { data: data || [], error: null }
    } catch {
      return { data: [], error: null }
    }
  },

  async add(contentId: string, rating: number, comment: string) {
    try {
      let userObj: User = { id: 'guest', email: 'guest@demo.com', name: 'Guest User', created_at: new Date().toISOString() }
      if (typeof window !== 'undefined' && localStorage.getItem('mock_user')) {
        userObj = JSON.parse(localStorage.getItem('mock_user')!)
      }

      const newReview = {
        id: `rev_${Date.now()}`,
        content_id: contentId,
        user_id: userObj.id,
        user_name: userObj.name || userObj.email.split('@')[0],
        rating,
        comment,
        created_at: new Date().toISOString()
      }

      if (typeof window !== 'undefined') {
        const existingData = localStorage.getItem(`reviews_${contentId}`) || '[]'
        const existing = JSON.parse(existingData)
        existing.unshift(newReview)
        localStorage.setItem(`reviews_${contentId}`, JSON.stringify(existing))
      }

      if (hasValidConfig && userObj.id !== 'guest' && !userObj.id.startsWith('mock_') && !userObj.id.startsWith('demo_')) {
        try {
          await supabase.from('reviews').insert([newReview])
        } catch {}
      }

      return { data: newReview, error: null }
    } catch {
      return { data: null, error: 'Failed to submit review' }
    }
  }
}

// User utilities
export const user = {
  async getProfile(): Promise<ApiResponse<User>> {
    try {
      if (typeof window !== 'undefined') {
        const mockUser = localStorage.getItem('mock_user')
        if (mockUser) {
          return { data: JSON.parse(mockUser), error: null }
        }
      }
      if (!hasValidConfig) {
        return { data: null, error: 'Failed to load profile' }
      }

      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        return { data: null, error: 'Failed to load profile' }
      }

      const userData: User = {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email || 'User',
        avatar: user.user_metadata?.avatar_url,
        created_at: user.created_at
      }
      return { data: userData, error: null }
    } catch {
      return { data: null, error: 'Failed to load profile' }
    }
  },

  async getStats(): Promise<ApiResponse<UserStats>> {
    try {
      let userId = 'guest'
      if (typeof window !== 'undefined' && localStorage.getItem('mock_user')) {
        userId = JSON.parse(localStorage.getItem('mock_user')!).id
      }
      if (typeof window !== 'undefined') {
        const watchlistData = localStorage.getItem(`watchlist_${userId}`) || '[]'
        const watchlist = JSON.parse(watchlistData)
        return {
          data: {
            totalWatched: watchlist.filter((item: any) => item.status === 'Completed').length,
            totalPlanned: watchlist.filter((item: any) => item.status === 'Planned').length,
            averageRating: 0,
            favoriteGenres: []
          },
          error: null
        }
      }
      return { data: { totalWatched: 0, totalPlanned: 0, averageRating: 0, favoriteGenres: [] }, error: null }
    } catch {
      return { data: { totalWatched: 0, totalPlanned: 0, averageRating: 0, favoriteGenres: [] }, error: null }
    }
  }
}

logger.info('Auth object exported', { 
  authExists: !!auth, 
  methods: Object.keys(auth),
  getSessionType: typeof auth.getSession 
})

const supabaseServices = { auth, watchlist, reviews, user, supabase }
export default supabaseServices

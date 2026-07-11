import { useState, useCallback } from 'react'
import { auth, watchlist as watchlistApi, user as userApi } from '../utils/supabase/client'
import { toast } from 'sonner'
import { logger } from '../utils/logger'
import type { User, WatchlistItem, UserStats } from '../types'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshWatchlist = useCallback(async () => {
    if (user) {
      try {
        const { data, error } = await watchlistApi.get()
        if (error && error !== 'Please sign in to view your watchlist') {
          logger.warn('Failed to refresh watchlist', { error })
        } else {
          setWatchlist(data || [])
        }
      } catch (error) {
        logger.warn('Watchlist refresh error', error)
      }
    }
  }, [user])

  const refreshStats = useCallback(async () => {
    if (user) {
      try {
        const { data, error } = await userApi.getStats()
        if (error) {
          logger.error('Failed to refresh stats', error)
          toast.error('Failed to load stats')
        } else {
          setStats(data)
        }
      } catch (error) {
        logger.error('Stats refresh error', error)
        toast.error('Failed to load stats')
      }
    }
  }, [user])

  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      const { error } = await auth.signOut()
      if (error) {
        logger.error('Sign out error', error)
        toast.error('Failed to sign out')
      } else {
        setUser(null)
        setWatchlist([])
        setStats(null)
        toast.success('Signed out successfully')
      }
    } catch (error) {
      logger.error('Sign out error', error)
      toast.error('Failed to sign out')
    } finally {
      setLoading(false)
    }
  }, [])

  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true)
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (!auth || typeof auth.getSession !== 'function') {
        logger.warn('Auth methods not available, retrying...')
        await new Promise(resolve => setTimeout(resolve, 500))
        
        if (!auth || typeof auth.getSession !== 'function') {
          logger.warn('Auth methods still not available, skipping session check')
          setLoading(false)
          return
        }
      }

      const { data, error } = await auth.getSession()
      
      if (error) {
        logger.error('Session check error', error)
      } else if (data?.session?.user) {
        logger.info('Found existing session, loading user data')
        
        try {
          const { data: userData, error: userError } = await userApi.getProfile()
          if (!userError && userData) {
            setUser(userData)
            logger.info('User profile loaded', { userId: userData.id })
            
            // Load watchlist and stats after setting user
            try {
              const [watchlistResult, statsResult] = await Promise.allSettled([
                watchlistApi.get(),
                userApi.getStats()
              ])
              
              if (watchlistResult.status === 'fulfilled' && !watchlistResult.value.error) {
                setWatchlist(watchlistResult.value.data || [])
              }
              
              if (statsResult.status === 'fulfilled' && !statsResult.value.error) {
                setStats(statsResult.value.data)
              }
            } catch (dataError) {
              logger.error('Error loading user data', dataError)
            }
          } else {
            logger.warn('Failed to load user profile', userError)
            setUser({
              id: data.session.user.id,
              email: data.session.user.email,
              name: data.session.user.user_metadata?.name || 'User'
            })
          }
        } catch (profileError) {
          logger.error('Error loading user profile', profileError)
          setUser({
            id: data.session.user.id,
            email: data.session.user.email,
            name: data.session.user.user_metadata?.name || 'User'
          })
        }
      } else {
        logger.info('No existing session found')
      }
    } catch (error) {
      logger.error('Session initialization error', error)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    user,
    setUser,
    watchlist,
    setWatchlist,
    stats,
    setStats,
    loading,
    setLoading,
    refreshWatchlist,
    refreshStats,
    signOut,
    initializeAuth
  }
}
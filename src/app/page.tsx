'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home } from './components/pages/Home'
import { Browse } from './components/pages/Browse'
import { MovieDetail } from './components/pages/Moviedetail'
import { Dashboard } from './components/pages/Dashboard'
import { Auth } from './components/pages/auth'
import { Watch } from './components/pages/Watch'
import { Navbar } from './components/layout/Navbar'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PageLoading } from './components/ui/loading'
import { Toaster } from 'sonner'
import { useAuth } from './hooks/useAuth'
import type { AppState } from './types'

import { AppContext } from './context/AppContext'

export default function App() {
  const [state, setStateInternal] = useState<AppState>({
    currentPage: 'home',
    user: null,
    watchlist: [],
    searchQuery: '',
    darkMode: true, // Default to dark mode
    loading: true,
    stats: null,
    selectedContentId: undefined
  })
  const [mounted, setMounted] = useState(false)

  const setState = useCallback((newState: Partial<AppState>) => {
    setStateInternal(prev => {
      const keys = Object.keys(newState) as (keyof AppState)[]
      const hasChanged = keys.some(key => prev[key] !== newState[key])
      if (!hasChanged) return prev

      const updated = { ...prev, ...newState }
      // Persist theme changes
      if ('darkMode' in newState && typeof window !== 'undefined') {
        localStorage.setItem('theme', updated.darkMode ? 'dark' : 'light')
        document.documentElement.classList.toggle('dark', updated.darkMode)
      }
      return updated
    })
  }, [])

  const authHook = useAuth()
  
  const refreshWatchlist = authHook.refreshWatchlist
  const refreshStats = authHook.refreshStats
  const signOut = useCallback(async () => {
    await authHook.signOut()
    setState({ currentPage: 'home' })
  }, [authHook, setState])

  // Sync auth state with app state
  useEffect(() => {
    setState({
      user: authHook.user,
      watchlist: authHook.watchlist,
      stats: authHook.stats,
      loading: authHook.loading
    })
  }, [authHook.user, authHook.watchlist, authHook.stats, authHook.loading, setState])

  const themeInitialized = useRef(false)
  const authInitialized = useRef(false)

  useEffect(() => {
    if (!themeInitialized.current) {
      themeInitialized.current = true
      setMounted(true)
      if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('theme')
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const darkMode = savedTheme ? savedTheme === 'dark' : systemDark
        setState({ darkMode })
        document.documentElement.classList.toggle('dark', darkMode)
      }
    }
  }, [setState])

  useEffect(() => {
    if (!authInitialized.current) {
      authInitialized.current = true
      authHook.initializeAuth()
    }
  }, [authHook])

  const renderCurrentPage = useMemo(() => {
    if (state.loading) {
      return <PageLoading />
    }

    // Show auth page if not logged in and trying to access protected pages
    if (!state.user && ['dashboard'].includes(state.currentPage)) {
      return <Auth />
    }

    switch (state.currentPage) {
      case 'home':
        return <Home />
      case 'browse':
        return <Browse />
      case 'movie':
        return <MovieDetail />
      case 'moviedetail':
        return <MovieDetail />
      case 'watch':
        return <Watch />
      case 'dashboard':
        return <Dashboard />
      case 'auth':
        return <Auth />
      default:
        return <Home />
    }
  }, [state.loading, state.user, state.currentPage])

  const contextValue = useMemo(() => ({
    state,
    setState,
    refreshWatchlist,
    refreshStats,
    signOut
  }), [state, setState, refreshWatchlist, refreshStats, signOut])

  const themeClass = useMemo(() => 
    `min-h-screen ${mounted && state.darkMode ? 'dark' : ''}`,
    [mounted, state.darkMode]
  )

  return (
    <ErrorBoundary>
      <AppContext.Provider value={contextValue}>
        <div className={themeClass}>
          <div className="bg-background text-foreground">
            <Navbar />
            <AnimatePresence mode="wait">
              <motion.main
                key={state.currentPage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderCurrentPage}
              </motion.main>
            </AnimatePresence>
            <Toaster position="bottom-right" theme={state.darkMode ? 'dark' : 'light'} />
          </div>
        </div>
      </AppContext.Provider>
    </ErrorBoundary>
  )
}
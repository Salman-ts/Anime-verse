'use client'

import { createContext, useContext } from 'react'
import type { AppState } from '../types'

export interface AppContextType {
  state: AppState
  setState: (state: Partial<AppState>) => void
  refreshWatchlist: () => Promise<void>
  refreshStats: () => Promise<void>
  signOut: () => Promise<void>
}

export const AppContext = createContext<AppContextType>({
  state: {
    currentPage: 'home',
    user: null,
    watchlist: [],
    searchQuery: '',
    darkMode: true,
    loading: true,
    stats: null,
    selectedContentId: undefined
  },
  setState: () => {},
  refreshWatchlist: async () => {},
  refreshStats: async () => {},
  signOut: async () => {}
})

export const useAppContext = () => useContext(AppContext)

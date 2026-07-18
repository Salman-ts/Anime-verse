export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  created_at?: string
}

export interface WatchlistItem {
  id: string
  contentId: string
  title: string
  type: 'movie' | 'anime' | 'tv'
  poster: string
  status: 'Planned' | 'Watching' | 'Completed' | 'Dropped'
  rating?: number
  created_at: string
}

export interface UserStats {
  totalWatched: number
  totalPlanned: number
  averageRating: number
  favoriteGenres: string[]
}

export interface AppState {
  currentPage: string
  user: User | null
  watchlist: WatchlistItem[]
  searchQuery: string
  darkMode: boolean
  loading: boolean
  stats: UserStats | null
  selectedContentId?: number
}

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface AuthResponse {
  user: User | null
  session: {
    access_token: string
    expires_at: number
    user: User
  } | null
}

export interface StreamingContent {
  id: string
  title: string
  videoUrl: string
  previewUrl?: string
  qualities: StreamQuality[]
  duration: number
  requiresSubscription: boolean
}

export interface StreamQuality {
  quality: string
  url: string
  bitrate: number
}

export interface UserSubscription {
  id: string
  userId: string
  plan: 'free' | 'basic' | 'premium'
  status: 'active' | 'cancelled' | 'expired'
  expiresAt: string
}

export interface WatchProgress {
  contentId: string
  userId: string
  currentTime: number
  duration: number
  completed: boolean
  lastWatched: string
}
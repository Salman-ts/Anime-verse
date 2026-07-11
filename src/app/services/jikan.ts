// Jikan v4 API — MyAnimeList Proxy
// https://docs.api.jikan.moe/
const JIKAN_BASE = 'https://api.jikan.moe/v4'

const jikanFetch = async (endpoint: string, params?: Record<string, string>) => {
  const url = new URL(`${JIKAN_BASE}${endpoint}`)
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000)
  
  try {
    const res = await fetch(url.toString(), { signal: controller.signal })
    clearTimeout(timeoutId)
    
    if (res.status === 429) {
      // Jikan rate limit: 3 req/sec, 60 req/min
      await new Promise(r => setTimeout(r, 1000))
      return jikanFetch(endpoint, params)
    }
    
    if (!res.ok) throw new Error(`Jikan ${res.status}: ${res.statusText}`)
    return await res.json()
  } catch (err: any) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') throw new Error('Jikan API timeout')
    throw err
  }
}

export interface JikanAnime {
  mal_id: number
  title: string
  title_english: string | null
  title_japanese: string | null
  images: {
    jpg: { image_url: string; large_image_url: string }
    webp: { image_url: string; large_image_url: string }
  }
  trailer: {
    youtube_id: string | null
    url: string | null
    embed_url: string | null
  }
  score: number | null
  scored_by: number | null
  rank: number | null
  popularity: number | null
  members: number | null
  status: string
  airing: boolean
  episodes: number | null
  duration: string
  synopsis: string | null
  year: number | null
  season: string | null
  genres: Array<{ mal_id: number; name: string }>
  studios: Array<{ mal_id: number; name: string }>
  broadcast: { day: string | null; time: string | null; string: string | null }
}

export interface JikanCharacter {
  character: {
    mal_id: number
    name: string
    images: { jpg: { image_url: string }; webp: { image_url: string } }
  }
  role: string
  voice_actors: Array<{
    person: { mal_id: number; name: string; images: { jpg: { image_url: string } } }
    language: string
  }>
}

export interface JikanScheduleItem {
  mal_id: number
  title: string
  title_english: string | null
  images: { jpg: { image_url: string; large_image_url: string } }
  score: number | null
  episodes: number | null
  genres: Array<{ name: string }>
  broadcast: { day: string | null; time: string | null; string: string | null }
}

const transformJikanAnime = (a: JikanAnime) => ({
  id: a.mal_id,
  title: a.title_english || a.title,
  originalTitle: a.title_japanese || a.title,
  type: 'anime' as const,
  rating: a.score ? a.score / 1 : 0,
  year: a.year || new Date().getFullYear(),
  genre: a.genres?.[0]?.name || 'Unknown',
  genres: a.genres?.map(g => g.name) || [],
  poster: a.images?.webp?.large_image_url || a.images?.jpg?.large_image_url || '',
  backdrop: a.images?.webp?.large_image_url || a.images?.jpg?.large_image_url || '',
  status: a.status,
  airing: a.airing,
  episodes: a.episodes,
  duration: a.duration,
  synopsis: a.synopsis,
  studio: a.studios?.[0]?.name || 'Unknown',
  trailer: a.trailer,
  broadcast: a.broadcast,
  members: a.members,
  rank: a.rank,
  source: 'jikan' as const
})

export const jikanApi = {
  async getTopAnime(page = 1, filter: 'airing' | 'upcoming' | 'bypopularity' | 'favorite' = 'bypopularity', limit = 12) {
    try {
      const data = await jikanFetch('/top/anime', { page: String(page), filter, limit: String(limit) })
      return (data.data as JikanAnime[]).map(transformJikanAnime)
    } catch (err) {
      console.warn('Jikan getTopAnime failed:', err)
      return []
    }
  },

  async getSeasonNow(page = 1, limit = 12) {
    try {
      const data = await jikanFetch('/seasons/now', { page: String(page), limit: String(limit) })
      return (data.data as JikanAnime[]).map(transformJikanAnime)
    } catch (err) {
      console.warn('Jikan getSeasonNow failed:', err)
      return []
    }
  },

  async getSeasonUpcoming(page = 1, limit = 12) {
    try {
      const data = await jikanFetch('/seasons/upcoming', { page: String(page), limit: String(limit) })
      return (data.data as JikanAnime[]).map(transformJikanAnime)
    } catch (err) {
      console.warn('Jikan getSeasonUpcoming failed:', err)
      return []
    }
  },

  async getAnimeCharacters(malId: number): Promise<JikanCharacter[]> {
    try {
      const data = await jikanFetch(`/anime/${malId}/characters`)
      return (data.data as JikanCharacter[]).slice(0, 12)
    } catch (err) {
      console.warn('Jikan getAnimeCharacters failed:', err)
      return []
    }
  },

  async getAnimeRecommendations(malId: number) {
    try {
      const data = await jikanFetch(`/anime/${malId}/recommendations`)
      return (data.data || []).slice(0, 8).map((r: any) => ({
        id: r.entry.mal_id,
        title: r.entry.title,
        poster: r.entry.images?.webp?.large_image_url || r.entry.images?.jpg?.large_image_url || '',
        votes: r.votes
      }))
    } catch (err) {
      console.warn('Jikan getAnimeRecommendations failed:', err)
      return []
    }
  },

  async getSchedules(day?: string) {
    try {
      const params: Record<string, string> = { limit: '25' }
      if (day) params.filter = day
      const data = await jikanFetch('/schedules', params)
      return (data.data as JikanScheduleItem[]).map(item => ({
        id: item.mal_id,
        title: item.title_english || item.title,
        poster: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
        score: item.score,
        episodes: item.episodes,
        genres: item.genres?.map(g => g.name) || [],
        broadcast: item.broadcast?.string || 'TBA'
      }))
    } catch (err) {
      console.warn('Jikan getSchedules failed:', err)
      return []
    }
  },

  async getAnimeById(malId: number) {
    try {
      const data = await jikanFetch(`/anime/${malId}/full`)
      return transformJikanAnime(data.data as JikanAnime)
    } catch (err) {
      console.warn('Jikan getAnimeById failed:', err)
      return null
    }
  }
}

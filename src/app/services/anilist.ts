import { fallbackData } from './fallback'

const ANILIST_API = 'https://graphql.anilist.co'

export interface AniListMedia {
  id: number
  title: { romaji: string; english: string }
  coverImage: { large: string; extraLarge: string }
  bannerImage: string
  averageScore: number
  startDate: { year: number }
  genres: string[]
  status: string
  description: string
  episodes: number
  duration: number
  studios: { nodes: Array<{ name: string }> }
  trailer: { id: string; site: string } | null
  nextAiringEpisode: { airingAt: number; episode: number } | null
  characters: { nodes: Array<{ id: number; name: { full: string }; image: { large: string } }> }
  recommendations: { nodes: Array<{ mediaRecommendation: { id: number; title: { english: string; romaji: string }; coverImage: { large: string }; averageScore: number } }> }
  relations: { edges: Array<{ relationType: string; node: { id: number; title: { english: string; romaji: string }; coverImage: { large: string }; type: string } }> }
  externalLinks: Array<{ url: string; site: string }>
  season: string
  seasonYear: number
  format: string
  source: string
  meanScore: number
}

const query = async (q: string, variables = {}) => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query: q, variables }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      if (response.status === 429) throw new Error('Too many requests. Please wait a moment.')
      if (response.status >= 500) throw new Error('AniList service temporarily unavailable.')
      throw new Error(`AniList error (${response.status})`)
    }
    
    const data = await response.json()
    if (data.errors) throw new Error(data.errors[0]?.message || 'Unknown AniList error')
    return data
  } catch (error: any) {
    if (error instanceof TypeError || error.name === 'AbortError') {
      throw new Error('Network error. Please check your connection.')
    }
    throw error
  }
}

const MEDIA_FIELDS = `
  id
  title { romaji english }
  coverImage { large extraLarge }
  bannerImage
  averageScore
  startDate { year }
  genres
  status
  format
  season
  seasonYear
  episodes
  duration
  source
  meanScore
`

const DETAIL_FIELDS = `
  ${MEDIA_FIELDS}
  description
  studios { nodes { name } }
  trailer { id site }
  nextAiringEpisode { airingAt episode }
  characters(sort: ROLE, perPage: 12) {
    nodes { id name { full } image { large } }
  }
  recommendations(perPage: 8) {
    nodes {
      mediaRecommendation {
        id title { english romaji } coverImage { large } averageScore
      }
    }
  }
  relations {
    edges {
      relationType
      node { id title { english romaji } coverImage { large } type }
    }
  }
  externalLinks { url site }
`

export const anilistApi = {
  async getTrending(page = 1, perPage = 20) {
    const TRENDING_QUERY = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, sort: TRENDING_DESC) { ${MEDIA_FIELDS} }
        }
      }
    `
    try {
      const data = await query(TRENDING_QUERY, { page, perPage })
      return data.data.Page.media.map(transformMedia)
    } catch (error: any) {
      console.warn('AniList trending unavailable:', error.message)
      return fallbackData.trending.slice(0, perPage)
    }
  },

  async getPopular(page = 1, perPage = 20) {
    const POPULAR_QUERY = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, sort: POPULARITY_DESC) { ${MEDIA_FIELDS} }
        }
      }
    `
    try {
      const data = await query(POPULAR_QUERY, { page, perPage })
      return data.data.Page.media.map(transformMedia)
    } catch (error: any) {
      console.warn('AniList popular unavailable:', error.message)
      return fallbackData.popular.slice(0, perPage)
    }
  },

  async search(searchTerm: string, page = 1, perPage = 20) {
    const SEARCH_QUERY = `
      query ($search: String, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, search: $search) { ${MEDIA_FIELDS} }
        }
      }
    `
    try {
      const data = await query(SEARCH_QUERY, { search: searchTerm, page, perPage })
      return data.data.Page.media.map(transformMedia)
    } catch (error: any) {
      console.warn('AniList search unavailable:', error.message)
      const allData = [...fallbackData.trending, ...fallbackData.popular]
      return allData.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, perPage)
    }
  },

  async getById(id: number) {
    const DETAIL_QUERY_ID = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) { ${DETAIL_FIELDS} }
      }
    `
    const DETAIL_QUERY_MAL = `
      query ($id: Int) {
        Media(idMal: $id, type: ANIME) { ${DETAIL_FIELDS} }
      }
    `
    try {
      const data = await query(DETAIL_QUERY_ID, { id })
      if (data?.data?.Media) {
        return transformDetailedMedia(data.data.Media)
      }
    } catch {
      // Try idMal query below
    }

    try {
      const malData = await query(DETAIL_QUERY_MAL, { id })
      if (malData?.data?.Media) {
        return transformDetailedMedia(malData.data.Media)
      }
    } catch {
      // Fallback below
    }

    const allData = [...fallbackData.trending, ...fallbackData.popular]
    const item = allData.find((item: any) => item.id === id || item.idMal === id)
    if (item) {
      return {
        ...item,
        originalTitle: (item as any).originalTitle || item.title,
        description: (item as any).description || `${item.title} is a popular ${item.genre.toLowerCase()} anime from ${item.year}.`,
        duration: (item as any).duration || '24 min per episode',
        studio: (item as any).studio || 'Studio Name',
        episodes: (item as any).episodes || '12',
        backdrop: (item as any).backdrop || item.poster,
        characters: [],
        recommendations: [],
        relations: [],
        trailer: null,
        nextAiringEpisode: null,
        externalLinks: []
      }
    }
    throw new Error('Anime not found')
  },

  async getSeasonPopular(season?: string, year?: number, perPage = 12) {
    const currentDate = new Date()
    const seasons = ['WINTER', 'SPRING', 'SUMMER', 'FALL']
    const currentSeason = season || seasons[Math.floor(currentDate.getMonth() / 3)]
    const currentYear = year || currentDate.getFullYear()

    const SEASON_QUERY = `
      query ($season: MediaSeason, $seasonYear: Int, $perPage: Int) {
        Page(perPage: $perPage) {
          media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC) { ${MEDIA_FIELDS} }
        }
      }
    `
    try {
      const data = await query(SEASON_QUERY, { season: currentSeason, seasonYear: currentYear, perPage })
      return data.data.Page.media.map(transformMedia)
    } catch (error: any) {
      console.warn('AniList season unavailable:', error.message)
      return fallbackData.trending.slice(0, perPage)
    }
  },

  async getGenreCollection(genre: string, page = 1, perPage = 20) {
    const GENRE_QUERY = `
      query ($genre: String, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, genre: $genre, sort: POPULARITY_DESC) { ${MEDIA_FIELDS} }
        }
      }
    `
    try {
      const data = await query(GENRE_QUERY, { genre, page, perPage })
      return data.data.Page.media.map(transformMedia)
    } catch (error: any) {
      console.warn('AniList genre unavailable:', error.message)
      return []
    }
  }
}

const transformMedia = (media: any) => ({
  id: media.id,
  title: media.title.english || media.title.romaji,
  type: 'anime' as const,
  rating: media.averageScore ? media.averageScore / 10 : 0,
  year: media.startDate?.year || 2020,
  genre: media.genres?.[0] || 'Unknown',
  genres: media.genres || [],
  poster: media.coverImage?.extraLarge || media.coverImage?.large || '',
  status: media.status,
  episodes: media.episodes,
  duration: media.duration,
  format: media.format,
  season: media.season,
  seasonYear: media.seasonYear,
  bannerImage: media.bannerImage,
  source: 'anilist' as const
})

const transformDetailedMedia = (media: any) => ({
  id: media.id,
  title: media.title.english || media.title.romaji,
  originalTitle: media.title.romaji,
  description: media.description?.replace(/<[^>]*>/g, '') || '',
  rating: media.averageScore ? media.averageScore / 10 : 0,
  year: media.startDate?.year || 2020,
  genre: media.genres || [],
  duration: media.duration ? `${media.duration} min per episode` : 'Unknown',
  status: media.status,
  studio: media.studios?.nodes?.[0]?.name || 'Unknown',
  episodes: media.episodes || 'Unknown',
  backdrop: media.bannerImage || media.coverImage?.extraLarge || media.coverImage?.large,
  poster: media.coverImage?.extraLarge || media.coverImage?.large,
  trailer: media.trailer ? {
    id: media.trailer.id,
    site: media.trailer.site,
    url: media.trailer.site === 'youtube' ? `https://www.youtube.com/embed/${media.trailer.id}` : null
  } : null,
  nextAiringEpisode: media.nextAiringEpisode ? {
    airingAt: media.nextAiringEpisode.airingAt,
    episode: media.nextAiringEpisode.episode
  } : null,
  characters: (media.characters?.nodes || []).map((c: any) => ({
    id: c.id,
    name: c.name.full,
    image: c.image?.large || ''
  })),
  recommendations: (media.recommendations?.nodes || [])
    .filter((r: any) => r.mediaRecommendation)
    .map((r: any) => ({
      id: r.mediaRecommendation.id,
      title: r.mediaRecommendation.title.english || r.mediaRecommendation.title.romaji,
      poster: r.mediaRecommendation.coverImage?.large || '',
      rating: r.mediaRecommendation.averageScore ? r.mediaRecommendation.averageScore / 10 : 0
    })),
  relations: (media.relations?.edges || []).map((e: any) => ({
    type: e.relationType,
    id: e.node.id,
    title: e.node.title.english || e.node.title.romaji,
    poster: e.node.coverImage?.large || '',
    mediaType: e.node.type
  })),
  externalLinks: media.externalLinks || [],
  source: 'anilist' as const
})
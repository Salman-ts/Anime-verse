'use client'

import { useState, useEffect } from 'react'
import { Grid, List, Search, Sparkles } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { ContentCard } from '../cards/ContentCards'
import { useAppContext } from '../../context/AppContext'
import { anilistApi } from '../../services/anilist'
import { jikanApi } from '../../services/jikan'

const GENRES = [
  'All', 'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
  'Sci-Fi', 'Romance', 'Supernatural', 'Slice of Life', 'Thriller'
]

export function Browse() {
  const { state } = useAppContext()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [content, setContent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'popular' | 'airing' | 'upcoming'>('popular')
  const [selectedGenre, setSelectedGenre] = useState('All')
  const [searchQuery, setSearchQuery] = useState(state.searchQuery || '')

  useEffect(() => {
    let mounted = true
    setLoading(true)

    const loadBrowseData = async () => {
      try {
        let items: any[] = []
        if (searchQuery.trim()) {
          items = await anilistApi.search(searchQuery.trim(), 1, 24)
        } else if (selectedGenre !== 'All') {
          items = await anilistApi.getGenreCollection(selectedGenre, 1, 24)
        } else if (activeTab === 'popular') {
          items = await anilistApi.getPopular(1, 24)
        } else if (activeTab === 'airing') {
          items = await jikanApi.getSeasonNow(1, 24)
        } else if (activeTab === 'upcoming') {
          items = await jikanApi.getSeasonUpcoming(1, 24)
        }

        if (mounted) {
          setContent(items)
          setLoading(false)
        }
      } catch (err) {
        console.warn('Browse fetch error:', err)
        if (mounted) setLoading(false)
      }
    }

    const timer = setTimeout(loadBrowseData, searchQuery ? 400 : 0)
    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [searchQuery, selectedGenre, activeTab])

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <Badge className="mb-2 bg-primary/20 text-primary border border-primary/40 px-3 py-1 font-semibold">
              Complete Library
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Explore Anime & Movies
            </h1>
            <p className="text-muted-foreground mt-2 text-base">
              Filter by genre, seasonal simulcasts, or live popular charts
            </p>
          </div>

          {/* View Mode & Source Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 glass">
              <button
                onClick={() => { setActiveTab('popular'); setSelectedGenre('All'); setSearchQuery('') }}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === 'popular' && !searchQuery && selectedGenre === 'All'
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                All-Time Popular
              </button>
              <button
                onClick={() => { setActiveTab('airing'); setSelectedGenre('All'); setSearchQuery('') }}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === 'airing' && !searchQuery
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                Simulcast Airing
              </button>
            </div>

            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 glass">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="h-9 w-9 rounded-lg"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="h-9 w-9 rounded-lg"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Search & Genre Chips Bar */}
        <div className="space-y-4">
          <div className="relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search by anime title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-3 bg-white/5 border-white/10 text-white rounded-xl focus:border-primary"
            />
          </div>

          {/* Genre Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => {
                  setSelectedGenre(g)
                  setSearchQuery('')
                }}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all border ${
                  selectedGenre === g
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30'
                    : 'bg-white/5 text-white/70 border-white/10 hover:border-white/30 hover:text-white'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Grid/List Results */}
        {loading ? (
          <div className={viewMode === 'grid'
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
            : "space-y-3"
          }>
            {Array.from({ length: 12 }).map((_, idx) => (
              <div
                key={idx}
                className={viewMode === 'grid' ? "aspect-[2/3] skeleton rounded-xl" : "h-24 skeleton rounded-2xl"}
              />
            ))}
          </div>
        ) : content.length === 0 ? (
          <div className="text-center py-24 glass rounded-2xl border border-white/10">
            <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white">No content found</h3>
            <p className="text-muted-foreground mt-1">Try adjusting your search or filter keywords.</p>
          </div>
        ) : (
          <div className={viewMode === 'grid'
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6"
            : "space-y-3"
          }>
            {content.map((item, index) => (
              <ContentCard
                key={`${item.id}-${index}`}
                content={item}
                viewMode={viewMode}
                index={index}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
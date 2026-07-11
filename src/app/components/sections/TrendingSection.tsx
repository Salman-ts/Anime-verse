'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Play, Flame, Calendar, ChevronRight } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ImageWithFallback } from '../figma/ImagewithFallback'
import { anilistApi } from '../../services/anilist'
import { jikanApi } from '../../services/jikan'
import { useAppContext } from '../../context/AppContext'

type TabType = 'trending' | 'airing' | 'upcoming'

export function TrendingSection() {
  const [activeTab, setActiveTab] = useState<TabType>('trending')
  const [content, setContent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { setState } = useAppContext()

  useEffect(() => {
    let mounted = true
    setLoading(true)

    const fetchTabContent = async () => {
      try {
        let items: any[] = []
        if (activeTab === 'trending') {
          items = await anilistApi.getTrending(1, 12)
        } else if (activeTab === 'airing') {
          items = await jikanApi.getSeasonNow(1, 12)
        } else if (activeTab === 'upcoming') {
          items = await jikanApi.getSeasonUpcoming(1, 12)
        }
        if (mounted) {
          setContent(items)
          setLoading(false)
        }
      } catch (error) {
        console.error('TrendingSection load error:', error)
        if (mounted) setLoading(false)
      }
    }

    fetchTabContent()
    return () => { mounted = false }
  }, [activeTab])

  const handleItemClick = (item: any) => {
    setState({
      currentPage: 'moviedetail',
      selectedContentId: item.id
    })
  }

  const handleViewAll = () => {
    setState({ currentPage: 'browse' })
  }

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header with Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <Badge className="mb-3 bg-primary/20 text-primary border border-primary/40 px-3 py-1 font-medium">
              Seasonal Spotlight
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              Discover & Track
            </h2>
            <p className="text-muted-foreground mt-2 text-base sm:text-lg">
              Explore live charts powered by MyAnimeList & AniList
            </p>
          </div>

          {/* Interactive Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10 glass">
            <button
              onClick={() => setActiveTab('trending')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'trending'
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <Flame className="w-4 h-4" />
              Trending Now
            </button>

            <button
              onClick={() => setActiveTab('airing')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'airing'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <span className="airing-dot" />
              Currently Airing
            </button>

            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Upcoming Season
            </button>
          </div>
        </div>

        {/* Content Carousel Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="aspect-[2/3] skeleton rounded-xl" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6"
            >
              {content.map((item, idx) => (
                <motion.div
                  key={`${item.id}-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  whileHover={{ y: -6 }}
                  onClick={() => handleItemClick(item)}
                  className="group relative rounded-xl overflow-hidden glass-card cursor-pointer flex flex-col"
                >
                  {/* Poster Image */}
                  <div className="relative aspect-[2/3] overflow-hidden bg-white/5">
                    <ImageWithFallback
                      src={item.poster}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />

                    {/* Top Right Rating Badge */}
                    <div className="absolute top-2.5 right-2.5">
                      <Badge className="bg-black/70 backdrop-blur-md text-amber-400 border border-white/10 font-bold text-xs px-2 py-0.5">
                        <Star className="w-3 h-3 mr-1 fill-amber-400" />
                        {item.rating ? Number(item.rating).toFixed(1) : 'N/A'}
                      </Badge>
                    </div>

                    {/* Top Left Airing Status dot if active */}
                    {item.airing && (
                      <div className="absolute top-2.5 left-2.5">
                        <span className="airing-dot block" title="Airing Now" />
                      </div>
                    )}

                    {/* Hover Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-lg shadow-primary/50 transform scale-75 group-hover:scale-100 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Info */}
                  <div className="p-3.5 flex flex-col justify-between flex-1 bg-gradient-to-b from-transparent to-black/60">
                    <div>
                      <h3 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                        <span>{item.year || '2024'}</span>
                        <span className="truncate max-w-[80px]">{item.genre || item.genres?.[0] || 'Anime'}</span>
                      </div>
                    </div>

                    {item.episodes && (
                      <div className="mt-2 text-[11px] text-white/60 font-medium">
                        {item.episodes} Episodes
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <Button
            onClick={handleViewAll}
            variant="outline"
            size="lg"
            className="glass border-white/20 hover:bg-white/10 text-white px-8 rounded-xl font-semibold"
          >
            Explore Complete Library
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

      </div>
    </section>
  )
}
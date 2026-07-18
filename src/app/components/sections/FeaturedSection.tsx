'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PlayCircle, Info, Sparkles } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { jikanApi, type JikanAnime } from '../../services/jikan'
import { ImageWithFallback } from '../figma/ImagewithFallback'
import { useAppContext } from '../../context/AppContext'

const FALLBACK_FEATURED: JikanAnime[] = [
  {
    mal_id: 5114,
    title: 'Fullmetal Alchemist: Brotherhood',
    title_english: 'Fullmetal Alchemist: Brotherhood',
    title_japanese: '鋼の錬金術師 FULLMETAL ALCHEMIST',
    images: {
      jpg: {
        image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920&q=80',
        large_image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920&q=80'
      },
      webp: {
        image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920&q=80',
        large_image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920&q=80'
      }
    },
    trailer: { youtube_id: null, url: null, embed_url: null },
    score: 9.09,
    scored_by: 2000000,
    rank: 1,
    popularity: 3,
    members: 3200000,
    status: 'Finished Airing',
    airing: false,
    episodes: 64,
    duration: '24 min per ep',
    synopsis: 'After a horrific alchemy experiment goes wrong in the Elric household, brothers Edward and Alphonse are left in a catastrophic new reality. To restore their bodies, they seek the legendary Philosopher\'s Stone.',
    year: 2009,
    season: 'spring',
    genres: [{ mal_id: 1, name: 'Action' }, { mal_id: 2, name: 'Adventure' }, { mal_id: 8, name: 'Drama' }, { mal_id: 10, name: 'Fantasy' }],
    studios: [{ mal_id: 4, name: 'Bones' }],
    broadcast: { day: 'Sundays', time: '17:00', string: 'Sundays at 17:00 (JST)' }
  }
]

export function FeaturedSection() {
  const { setState } = useAppContext()
  const [featuredList, setFeaturedList] = useState<JikanAnime[]>(FALLBACK_FEATURED)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    let mounted = true
    const loadFeatured = async () => {
      try {
        const items = await jikanApi.getTopAnime(1, 'favorite', 5)
        if (mounted && items && items.length > 0) {
          setFeaturedList(items as unknown as JikanAnime[])
        }
      } catch (err) {
        console.warn('Featured load error:', err)
      }
    }
    loadFeatured()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (featuredList.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredList.length)
    }, 9000)
    return () => clearInterval(timer)
  }, [featuredList.length])

  const current = featuredList[currentIndex] || FALLBACK_FEATURED[0]

  const handleWatch = () => {
    setState({ selectedContentId: current.mal_id || 1, currentPage: 'watch' })
  }

  const handleDetails = () => {
    setState({ selectedContentId: current.mal_id || 1, currentPage: 'moviedetail' })
  }

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden glass-heavy border border-white/10 shadow-2xl">
          
          {/* Background Blurred Banner Image */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current.mal_id || currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 bg-cover bg-center filter blur-3xl scale-110"
              style={{
                backgroundImage: `url(${current.images?.webp?.large_image_url || current.images?.jpg?.large_image_url || ''})`
              }}
            />
          </AnimatePresence>
          
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-transparent" />

          {/* Main Container */}
          <div className="relative z-10 p-8 sm:p-12 lg:p-16 min-h-[520px] flex items-center">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 w-full items-center">
              
              {/* Left Column: Text Content */}
              <div className="lg:col-span-7 space-y-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.mal_id || current.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className="bg-purple-600 text-white font-semibold px-3 py-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Staff Pick Collection
                      </Badge>

                      {current.score && (
                        <Badge className="bg-amber-400/20 text-amber-400 border border-amber-400/30 px-3 py-1 font-semibold">
                          ⭐ {current.score}
                        </Badge>
                      )}
                    </div>

                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
                      {current.title_english || current.title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
                      <span>{current.year || '2023'}</span>
                      <span>•</span>
                      <span>{current.episodes ? `${current.episodes} Episodes` : 'TV Series'}</span>
                      <span>•</span>
                      <div className="flex flex-wrap gap-2">
                        {(current.genres || []).slice(0, 3).map((g, idx) => (
                          <span key={idx} className="bg-white/10 px-2.5 py-0.5 rounded-md text-xs">
                            {g.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-white/85 text-base sm:text-lg leading-relaxed max-w-2xl line-clamp-4">
                      {current.synopsis}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Button
                    onClick={handleWatch}
                    size="lg"
                    className="bg-white text-black hover:bg-white/90 font-semibold px-8 py-6 rounded-xl shadow-lg transition-transform hover:scale-105"
                  >
                    <PlayCircle className="w-5 h-5 mr-2.5 fill-black" />
                    Watch Now
                  </Button>

                  <Button
                    onClick={handleDetails}
                    size="lg"
                    variant="outline"
                    className="glass border-white/20 hover:bg-white/10 text-white font-semibold px-8 py-6 rounded-xl"
                  >
                    <Info className="w-5 h-5 mr-2.5" />
                    Inspect Details
                  </Button>
                </div>
              </div>

              {/* Right Column: Poster Card */}
              <div className="lg:col-span-5 flex justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.mal_id || currentIndex}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5 }}
                    onClick={handleDetails}
                    className="relative cursor-pointer group w-64 sm:w-72 lg:w-80 rounded-2xl overflow-hidden shadow-2xl gradient-border"
                  >
                    <ImageWithFallback
                      src={current.images?.webp?.large_image_url || current.images?.jpg?.large_image_url || ''}
                      alt={current.title}
                      className="w-full aspect-[2/3] object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-center">
                      <span className="text-xs font-semibold text-white/90 bg-black/60 px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md">
                        Staff Pick Highlight #{currentIndex + 1}
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
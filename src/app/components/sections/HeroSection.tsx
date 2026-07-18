'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Info, Sparkles, Quote, Star } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ThreeScene } from '../3d/ThreeScene'
import { jikanApi, type JikanAnime } from '../../services/jikan'
import { animechanApi, type AnimeQuote } from '../../services/animechan'
import { ImageWithFallback } from '../figma/ImagewithFallback'
import { useAppContext } from '../../context/AppContext'

const FALLBACK_HERO: JikanAnime[] = [
  {
    mal_id: 52991,
    title: 'Frieren: Beyond Journey\'s End',
    title_english: 'Frieren: Beyond Journey\'s End',
    title_japanese: '葬送のフリーレン',
    images: {
      jpg: {
        image_url: 'https://cdn.myanimelist.net/images/anime/1015/138006l.jpg',
        large_image_url: 'https://cdn.myanimelist.net/images/anime/1015/138006l.jpg'
      },
      webp: {
        image_url: 'https://cdn.myanimelist.net/images/anime/1015/138006l.jpg',
        large_image_url: 'https://cdn.myanimelist.net/images/anime/1015/138006l.jpg'
      }
    },
    trailer: { youtube_id: null, url: null, embed_url: null },
    score: 9.14,
    scored_by: 450000,
    rank: 1,
    popularity: 45,
    members: 800000,
    status: 'Finished Airing',
    airing: false,
    episodes: 28,
    duration: '24 min per ep',
    synopsis: 'After the party of heroes defeats the Demon King, they restore peace to the land and return to lives of solitude. Elven mage Frieren sets out on a journey across decades to understand human connection.',
    year: 2023,
    season: 'fall',
    genres: [{ mal_id: 2, name: 'Adventure' }, { mal_id: 8, name: 'Drama' }, { mal_id: 10, name: 'Fantasy' }],
    studios: [{ mal_id: 11, name: 'Madhouse' }],
    broadcast: { day: 'Fridays', time: '23:00', string: 'Fridays at 23:00 (JST)' }
  }
]

export function HeroSection() {
  const { setState } = useAppContext()
  const [featuredAnime, setFeaturedAnime] = useState<JikanAnime[]>(FALLBACK_HERO)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [quotes, setQuotes] = useState<AnimeQuote[]>([])
  const [quoteIndex, setQuoteIndex] = useState(0)

  useEffect(() => {
    let mounted = true
    const loadHeroData = async () => {
      try {
        const [topData, quoteData] = await Promise.all([
          jikanApi.getTopAnime(1, 'bypopularity', 5),
          animechanApi.getRandomQuotes(5)
        ])
        if (mounted) {
          if (topData && topData.length > 0) {
            // map transformed back or keep rich
            setFeaturedAnime(topData as unknown as JikanAnime[])
          }
          if (quoteData && quoteData.length > 0) {
            setQuotes(quoteData)
          }
        }
      } catch (err) {
        console.warn('Hero data load fallback:', err)
      }
    }
    loadHeroData()
    return () => { mounted = false }
  }, [])

  // Auto-rotate anime spotlight every 8 seconds
  useEffect(() => {
    if (featuredAnime.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredAnime.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [featuredAnime.length])

  // Auto-rotate quotes every 6 seconds
  useEffect(() => {
    if (quotes.length <= 1) return
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [quotes.length])

  const current = featuredAnime[currentIndex] || FALLBACK_HERO[0]
  const currentQuote = quotes[quoteIndex] || {
    content: "People's lives don't end when they die. It ends when they lose faith.",
    anime: { name: 'Naruto' },
    character: { name: 'Itachi Uchiha' }
  }

  const handleWatchNow = () => {
    setState({
      selectedContentId: current.mal_id || 1,
      currentPage: 'watch'
    })
  }

  const handleDetails = () => {
    setState({
      selectedContentId: current.mal_id || 1,
      currentPage: 'moviedetail'
    })
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background text-foreground py-20 lg:py-0 transition-colors duration-300">
      {/* 3D Visual Mesh Backdrop */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <ThreeScene />
      </div>

      {/* Dynamic Background Image Glow Layer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.mal_id || currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 0.25, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 z-0 bg-cover bg-center filter blur-2xl"
          style={{
            backgroundImage: `url(${current.images?.webp?.large_image_url || current.images?.jpg?.large_image_url || ''})`
          }}
        />
      </AnimatePresence>

      {/* Radial Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-0" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent z-0" />

      {/* Main Content Grid */}
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Spotlight details */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Live Status Badge & Season Info */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center gap-3"
            >
              <Badge className="bg-primary/20 text-primary border border-primary/40 px-3 py-1 flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Spotlight #{currentIndex + 1}
              </Badge>

              {current.airing && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-1 flex items-center gap-1.5 font-medium">
                  <span className="airing-dot" />
                  Currently Airing
                </Badge>
              )}

              {current.score && (
                <span className="flex items-center gap-1 text-sm font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {current.score}
                </span>
              )}
            </motion.div>

            {/* Anime Title */}
            <AnimatePresence mode="wait">
              <motion.h1
                key={current.mal_id || current.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight"
              >
                {current.title_english || current.title}
              </motion.h1>
            </AnimatePresence>

            {/* Genres & Meta */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {current.year && <span>{current.year}</span>}
              <span>•</span>
              {current.episodes && <span>{current.episodes} Episodes</span>}
              <span>•</span>
              <div className="flex flex-wrap gap-2">
                {(current.genres || []).slice(0, 3).map((g, idx) => (
                  <span key={idx} className="bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-md text-xs text-white/80">
                    {g.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Synopsis */}
            <AnimatePresence mode="wait">
              <motion.p
                key={current.mal_id || current.synopsis}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="text-white/80 text-base sm:text-lg leading-relaxed line-clamp-3 max-w-2xl"
              >
                {current.synopsis || 'Experience the journey in stunning clarity on CinemaVerse.'}
              </motion.p>
            </AnimatePresence>

            {/* Animated Quote Widget (AnimeChan) */}
            <div className="glass rounded-xl p-4 max-w-xl border border-white/10 relative overflow-hidden group">
              <div className="absolute -right-6 -bottom-6 text-white/5 font-serif text-8xl pointer-events-none">”</div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={quoteIndex}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-1.5"
                >
                  <p className="text-sm italic text-purple-200/90 flex items-start gap-2">
                    <Quote className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    &ldquo;{currentQuote.content}&rdquo;
                  </p>
                  <p className="text-xs text-white/60 font-medium pl-6">
                    — {currentQuote.character.name} <span className="text-primary/80">({currentQuote.anime.name})</span>
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                onClick={handleWatchNow}
                size="lg"
                className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:to-rose-700 text-white font-semibold px-8 py-6 rounded-xl shadow-lg shadow-purple-600/30 transition-all duration-300 hover:scale-105"
              >
                <Play className="w-5 h-5 mr-2.5 fill-white" />
                Watch Now
              </Button>

              <Button
                onClick={handleDetails}
                size="lg"
                variant="outline"
                className="glass border-white/20 hover:bg-white/10 text-white font-semibold px-8 py-6 rounded-xl transition-all duration-300"
              >
                <Info className="w-5 h-5 mr-2.5" />
                View Details
              </Button>
            </div>

            {/* Platform Stats Counters */}
            <div className="grid grid-cols-3 gap-4 max-w-md pt-6 border-t border-white/10">
              <div>
                <div className="text-2xl font-bold text-white tracking-tight">50,000+</div>
                <div className="text-xs text-muted-foreground">Anime & Movies</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400 tracking-tight">4K HDR</div>
                <div className="text-xs text-muted-foreground">Streaming Quality</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-pink-400 tracking-tight">100% Free</div>
                <div className="text-xs text-muted-foreground">Ad-Free Experience</div>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Poster Showcase */}
          <div className="lg:col-span-5 flex justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.mal_id || currentIndex}
                initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.6 }}
                onClick={handleDetails}
                className="relative group cursor-pointer w-72 sm:w-80 lg:w-96 rounded-2xl overflow-hidden shadow-2xl gradient-border card-hover"
              >
                <ImageWithFallback
                  src={current.images?.webp?.large_image_url || current.images?.jpg?.large_image_url || 'https://cdn.myanimelist.net/images/anime/1015/138006l.jpg'}
                  alt={current.title}
                  className="w-full aspect-[2/3] object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <Badge className="bg-purple-600/90 text-white">
                    {current.score ? `⭐ ${current.score}` : 'Top Rated'}
                  </Badge>
                  <span className="text-xs text-white/80 font-medium">Click to Inspect →</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>

        {/* Indicator dots for spotlight carousel */}
        {featuredAnime.length > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            {featuredAnime.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'w-8 bg-purple-500' : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
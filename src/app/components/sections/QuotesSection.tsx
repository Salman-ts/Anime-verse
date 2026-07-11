'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Quote, RefreshCw } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { animechanApi, type AnimeQuote } from '../../services/animechan'

export function QuotesSection() {
  const [quotes, setQuotes] = useState<AnimeQuote[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const hasFetched = useRef(false)

  const loadQuotes = useCallback(async () => {
    setRefreshing(true)
    try {
      const data = await animechanApi.getRandomQuotes(6)
      if (data && data.length > 0) {
        setQuotes(data)
        setCurrentIndex(0)
      }
    } catch (err) {
      console.warn('Quotes load error:', err)
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    loadQuotes()
  }, [loadQuotes])

  useEffect(() => {
    if (quotes.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % quotes.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [quotes.length])

  const currentQuote = quotes[currentIndex] || {
    content: "People's lives don't end when they die. It ends when they lose faith.",
    anime: { name: "Naruto" },
    character: { name: "Itachi Uchiha" }
  }

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-5xl mx-auto">
        <div className="relative rounded-3xl p-8 sm:p-12 lg:p-16 overflow-hidden glass-heavy border border-white/10 shadow-2xl">
          
          {/* Background Gradient Mesh */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Decorative Giant Quote Icon */}
          <div className="absolute right-8 top-8 text-white/5 font-serif text-9xl pointer-events-none select-none">
            ”
          </div>

          <div className="relative z-10 flex flex-col items-center text-center space-y-8">
            
            <div className="flex items-center justify-between w-full">
              <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3.5 py-1 font-semibold flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5" />
                Anime Quotes Wisdom
              </Badge>

              <Button
                onClick={loadQuotes}
                disabled={refreshing}
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10 text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
                New Quotes
              </Button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="space-y-6 max-w-3xl"
              >
                <blockquote className="text-xl sm:text-2xl md:text-3xl font-medium text-white leading-relaxed italic">
                  &ldquo;{currentQuote.content}&rdquo;
                </blockquote>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                  <span className="font-bold text-base sm:text-lg text-purple-300">
                    {currentQuote.character.name}
                  </span>
                  <span className="hidden sm:inline text-white/40">•</span>
                  <span className="text-sm sm:text-base text-white/70 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                    {currentQuote.anime.name}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Pagination dots */}
            {quotes.length > 1 && (
              <div className="flex items-center gap-2 pt-4">
                {quotes.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentIndex ? 'w-8 bg-purple-500' : 'w-2 bg-white/20 hover:bg-white/40'
                    }`}
                    aria-label={`Go to quote ${idx + 1}`}
                  />
                ))}
              </div>
            )}

          </div>

        </div>
      </div>
    </section>
  )
}

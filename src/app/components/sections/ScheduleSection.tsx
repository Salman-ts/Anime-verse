'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock } from 'lucide-react'
import { Badge } from '../ui/badge'
import { ImageWithFallback } from '../figma/ImagewithFallback'
import { jikanApi } from '../../services/jikan'
import { useAppContext } from '../../context/AppContext'

const DAYS = [
  { label: 'Monday', value: 'monday' },
  { label: 'Tuesday', value: 'tuesday' },
  { label: 'Wednesday', value: 'wednesday' },
  { label: 'Thursday', value: 'thursday' },
  { label: 'Friday', value: 'friday' },
  { label: 'Saturday', value: 'saturday' },
  { label: 'Sunday', value: 'sunday' },
]

export function ScheduleSection() {
  const [selectedDay, setSelectedDay] = useState(() => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[new Date().getDay()] || 'friday'
  })
  const [scheduleItems, setScheduleItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { setState } = useAppContext()

  useEffect(() => {
    let mounted = true
    setLoading(true)

    const fetchSchedule = async () => {
      try {
        const items = await jikanApi.getSchedules(selectedDay)
        if (mounted) {
          setScheduleItems(items.slice(0, 12))
          setLoading(false)
        }
      } catch (err) {
        console.warn('Schedule load error:', err)
        if (mounted) setLoading(false)
      }
    }

    fetchSchedule()
    return () => { mounted = false }
  }, [selectedDay])

  const handleItemClick = (id: number) => {
    setState({ currentPage: 'moviedetail', selectedContentId: id })
  }

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <Badge className="mb-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-1 font-medium flex items-center gap-1.5 w-fit">
              <Calendar className="w-3.5 h-3.5" />
              Live Simulcast Guide
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              Weekly Airing Schedule
            </h2>
            <p className="text-muted-foreground mt-2 text-base sm:text-lg">
              Never miss a new episode release. Powered by MyAnimeList broadcast schedule.
            </p>
          </div>

          {/* Days selector bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none bg-white/5 p-1.5 rounded-xl border border-white/10 glass">
            {DAYS.map((d) => (
              <button
                key={d.value}
                onClick={() => setSelectedDay(d.value)}
                className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  selectedDay === d.value
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="h-28 skeleton rounded-xl" />
            ))}
          </div>
        ) : scheduleItems.length === 0 ? (
          <div className="text-center py-16 glass rounded-2xl border border-white/10">
            <p className="text-muted-foreground text-lg">No scheduled broadcasts found for this day.</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedDay}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {scheduleItems.map((item, idx) => (
                <motion.div
                  key={`${item.id}-${idx}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => handleItemClick(item.id)}
                  className="group flex items-center gap-4 p-3 rounded-xl glass-card cursor-pointer border border-white/10 hover:border-primary/50 transition-all"
                >
                  <div className="relative w-16 h-20 shrink-0 rounded-lg overflow-hidden bg-white/5">
                    <ImageWithFallback
                      src={item.poster}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>

                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span className="truncate">{item.broadcast || 'Simulcast'}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {item.score && (
                        <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                          ⭐ {Number(item.score).toFixed(1)}
                        </span>
                      )}
                      <span className="text-[11px] text-white/60 truncate">
                        {item.genres?.[0] || 'Anime'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

      </div>
    </section>
  )
}

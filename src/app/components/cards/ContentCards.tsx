'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Plus, Calendar, Tag, Check } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ImageWithFallback } from '../figma/ImagewithFallback'
import { useAppContext } from '../../context/AppContext'
import { watchlist as watchlistApi } from '../../utils/supabase/client'
import { toast } from 'sonner'

interface ContentCardProps {
  content: {
    id: number
    title: string
    type: 'anime' | 'movie'
    rating: number
    year: number
    genre: string
    poster: string
    status?: string
    episodes?: number
    airing?: boolean
  }
  viewMode: 'grid' | 'list'
  index: number
}

export function ContentCard({ content, viewMode, index }: ContentCardProps) {
  const { state, setState, refreshWatchlist } = useAppContext()
  const [isLoading, setIsLoading] = useState(false)

  const handleViewDetails = () => {
    setState({
      currentPage: 'moviedetail',
      selectedContentId: content.id
    })
  }

  const isInWatchlist = state.watchlist?.some((item: any) => item.contentId === content.id.toString())

  const handleWatchlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLoading(true)
    try {
      if (isInWatchlist) {
        const res = await watchlistApi.remove(content.id.toString())
        if (res.error && res.error !== 'Please sign in to manage your watchlist') {
          toast.error(res.error)
        } else {
          toast.success('Removed from your Watchlist!')
          await refreshWatchlist()
        }
      } else {
        const res = await watchlistApi.add(
          content.id.toString(),
          content.title,
          content.type || 'anime',
          content.poster,
          'Planned'
        )
        if (res.error && res.error !== 'Please sign in to manage your watchlist') {
          toast.error(res.error)
        } else {
          toast.success('Added to your Watchlist!')
          await refreshWatchlist()
        }
      }
    } catch {
      toast.error('An error occurred updating watchlist')
    } finally {
      setIsLoading(false)
    }
  }

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        onClick={handleViewDetails}
        className="group flex items-center gap-5 p-3.5 rounded-2xl glass-card cursor-pointer border border-white/10 hover:border-primary/50 transition-all"
      >
        <div className="relative w-20 h-28 shrink-0 rounded-xl overflow-hidden bg-white/5">
          <ImageWithFallback
            src={content.poster}
            alt={content.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-base line-clamp-1 group-hover:text-primary transition-colors">
              {content.title}
            </h3>
            {content.airing && <span className="airing-dot shrink-0" title="Airing Now" />}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              {content.year || '2024'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-primary" />
              {content.genre || 'Anime'}
            </span>
            {content.episodes && (
              <>
                <span>•</span>
                <span>{content.episodes} eps</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {content.rating > 0 && (
            <Badge className="bg-amber-400/20 text-amber-400 border border-amber-400/30 px-2.5 py-1 font-bold">
              ⭐ {Number(content.rating).toFixed(1)}
            </Badge>
          )}

          <Button
            size="icon"
            variant="ghost"
            onClick={handleWatchlistToggle}
            disabled={isLoading}
            className="rounded-xl glass hover:bg-white/10"
          >
            {isInWatchlist ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={handleViewDetails}
      className="group relative rounded-2xl overflow-hidden glass-card cursor-pointer flex flex-col"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden bg-white/5">
        <ImageWithFallback
          src={content.poster}
          alt={content.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />

        {/* Rating badge */}
        {content.rating > 0 && (
          <div className="absolute top-2.5 right-2.5">
            <Badge className="bg-black/70 backdrop-blur-md text-amber-400 border border-white/10 font-bold text-xs px-2 py-0.5">
              ⭐ {Number(content.rating).toFixed(1)}
            </Badge>
          </div>
        )}

        {/* Airing Dot */}
        {content.airing && (
          <div className="absolute top-2.5 left-2.5">
            <span className="airing-dot block" title="Currently Airing" />
          </div>
        )}

        {/* Play Icon Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-lg shadow-primary/50 transform scale-75 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>

        {/* Quick Add to Watchlist */}
        <button
          onClick={handleWatchlistToggle}
          disabled={isLoading}
          className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary"
          title="Add to Watchlist"
        >
          {isInWatchlist ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {/* Footer Details */}
      <div className="p-3.5 flex flex-col justify-between flex-1 bg-gradient-to-b from-transparent to-black/60">
        <div>
          <h3 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {content.title}
          </h3>
          <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
            <span>{content.year || '2024'}</span>
            <span className="truncate max-w-[80px]">{content.genre || 'Anime'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
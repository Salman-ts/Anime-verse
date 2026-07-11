'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Play, Plus, Share2, Calendar, Clock,
  MessageSquare, Quote, Send, Check
} from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ImageWithFallback } from '../figma/ImagewithFallback'
import { useAppContext } from '../../context/AppContext'
import { anilistApi } from '../../services/anilist'
import { animechanApi, type AnimeQuote } from '../../services/animechan'
import { reviews as reviewsApi, watchlist as watchlistApi } from '../../utils/supabase/client'
import { toast } from 'sonner'

export function MovieDetail() {
  const { state, setState } = useAppContext()
  const [content, setContent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [characters, setCharacters] = useState<any[]>([])
  const [quotes, setQuotes] = useState<AnimeQuote[]>([])
  const [reviewsList, setReviewsList] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [newRating, setNewRating] = useState(9)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [inWatchlist, setInWatchlist] = useState(false)

  useEffect(() => {
    let mounted = true
    setLoading(true)

    const fetchDetails = async () => {
      const id = state.selectedContentId || 1
      try {
        const data = await anilistApi.getById(Number(id))
        if (!mounted) return
        setContent(data)
        setCharacters(data.characters || [])

        // Load quotes & reviews in parallel
        const [quoteRes, revRes] = await Promise.all([
          animechanApi.getQuotesByAnime(data.title || 'Anime'),
          reviewsApi.get(String(id))
        ])

        if (mounted) {
          setQuotes(quoteRes || [])
          if (revRes.data) setReviewsList(revRes.data)
          setLoading(false)
        }
      } catch (err) {
        console.warn('Detail load fallback:', err)
        if (mounted) setLoading(false)
      }
    }

    fetchDetails()
    return () => { mounted = false }
  }, [state.selectedContentId])

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!state.user) {
      toast.error('Please sign in to write a review')
      setState({ currentPage: 'auth' })
      return
    }
    if (!newComment.trim()) return

    setSubmittingReview(true)
    const id = state.selectedContentId || 1
    const res = await reviewsApi.add(String(id), newRating, newComment)
    setSubmittingReview(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Review posted successfully!')
      setNewComment('')
      const updated = await reviewsApi.get(String(id))
      if (updated.data) setReviewsList(updated.data)
    }
  }

  const handleAddToWatchlist = async () => {
    if (!state.user) {
      toast.error('Sign in to add to your watchlist')
      setState({ currentPage: 'auth' })
      return
    }
    const id = state.selectedContentId || 1
    const res = await watchlistApi.add(
      String(id),
      content?.title || 'Title',
      content?.type || 'anime',
      content?.poster || '',
      'Planned'
    )
    if (res.error) {
      toast.error(res.error)
    } else {
      setInWatchlist(true)
      toast.success('Added to your Watchlist!')
    }
  }

  if (loading || !content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">Loading high-definition metadata...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 transition-colors duration-300">
      
      {/* Top Floating Back Button */}
      <div className="fixed top-20 left-4 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setState({ currentPage: 'home' })}
          className="glass-heavy border-white/20 text-white hover:bg-white/10 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Hub
        </Button>
      </div>

      {/* Hero Banner Section */}
      <div className="relative h-[65vh] w-full overflow-hidden">
        <ImageWithFallback
          src={content.backdrop || content.poster}
          alt={content.title}
          className="w-full h-full object-cover filter brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />

        {/* Banner Content Overlay */}
        <div className="absolute bottom-10 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-end gap-8">
            
            {/* Poster thumbnail */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-44 sm:w-52 rounded-2xl overflow-hidden shadow-2xl border border-white/20 shrink-0 hidden sm:block"
            >
              <ImageWithFallback
                src={content.poster}
                alt={content.title}
                className="w-full aspect-[2/3] object-cover"
              />
            </motion.div>

            {/* Main Info */}
            <div className="space-y-4 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge className="bg-primary text-white font-semibold">
                  {content.status || 'Airing'}
                </Badge>
                {content.rating > 0 && (
                  <Badge className="bg-amber-400/20 text-amber-400 border border-amber-400/30">
                    ⭐ {Number(content.rating).toFixed(1)}
                  </Badge>
                )}
                {content.nextAiringEpisode && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="airing-dot" />
                    Ep {content.nextAiringEpisode.episode} Airing Soon
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
                {content.title}
              </h1>

              {content.originalTitle && content.originalTitle !== content.title && (
                <p className="text-sm sm:text-base text-white/60 font-medium">
                  {content.originalTitle}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  {content.year}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" />
                  {content.duration}
                </span>
                <span>•</span>
                <span>Studio: {content.studio}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  onClick={() => setState({ currentPage: 'watch' })}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 rounded-xl shadow-lg shadow-purple-600/30"
                >
                  <Play className="w-5 h-5 mr-2.5 fill-white" />
                  Start Watching
                </Button>

                <Button
                  onClick={handleAddToWatchlist}
                  size="lg"
                  variant="outline"
                  className="glass border-white/20 hover:bg-white/10 text-white rounded-xl font-semibold"
                >
                  {inWatchlist ? (
                    <>
                      <Check className="w-5 h-5 mr-2 text-emerald-400" />
                      In Watchlist
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Add to Watchlist
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                    toast.success('URL copied to clipboard!')
                  }}
                  className="rounded-xl glass hover:bg-white/10"
                >
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-white/5 border border-white/10 p-1.5 rounded-2xl glass mb-8 flex flex-wrap gap-1">
            <TabsTrigger value="overview" className="rounded-xl px-6">Overview</TabsTrigger>
            <TabsTrigger value="characters" className="rounded-xl px-6">
              Characters ({characters.length})
            </TabsTrigger>
            {content.trailer && (
              <TabsTrigger value="trailer" className="rounded-xl px-6">Trailer</TabsTrigger>
            )}
            <TabsTrigger value="reviews" className="rounded-xl px-6">
              Community Reviews ({reviewsList.length})
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-12">
            
            {/* Synopsis & Quotes grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              <div className="lg:col-span-8 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-3">Synopsis</h3>
                  <p className="text-white/80 leading-relaxed text-base sm:text-lg">
                    {content.description || 'No synopsis available.'}
                  </p>
                </div>

                {/* Genre chips */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Genres</h4>
                  <div className="flex flex-wrap gap-2">
                    {(content.genre || []).map((g: string, idx: number) => (
                      <Badge key={idx} className="bg-white/10 text-white hover:bg-white/20 px-3 py-1 text-sm rounded-lg">
                        {g}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar quotes widget */}
              <div className="lg:col-span-4 space-y-4">
                <div className="glass-heavy rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center gap-2 text-purple-300 font-semibold mb-3">
                    <Quote className="w-4 h-4" />
                    Memorable Quotes
                  </div>
                  {quotes.length > 0 ? (
                    <div className="space-y-4">
                      {quotes.slice(0, 2).map((q, idx) => (
                        <div key={idx} className="border-l-2 border-primary/50 pl-3 py-1">
                          <p className="text-xs italic text-white/85">&ldquo;{q.content}&rdquo;</p>
                          <p className="text-[11px] text-muted-foreground mt-1">— {q.character.name}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No quotes registered for this title.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Recommendations Grid */}
            {content.recommendations && content.recommendations.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">You Might Also Enjoy</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {content.recommendations.map((rec: any) => (
                    <div
                      key={rec.id}
                      onClick={() => setState({ selectedContentId: rec.id })}
                      className="group cursor-pointer rounded-xl overflow-hidden glass-card"
                    >
                      <div className="aspect-[2/3] overflow-hidden">
                        <ImageWithFallback
                          src={rec.poster}
                          alt={rec.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="p-2.5">
                        <h4 className="text-xs font-semibold text-white line-clamp-1 group-hover:text-primary">
                          {rec.title}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </TabsContent>

          {/* CHARACTERS TAB */}
          <TabsContent value="characters">
            {characters.length === 0 ? (
              <p className="text-muted-foreground">No character data available.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {characters.map((char: any) => (
                  <div key={char.id} className="glass-card rounded-xl overflow-hidden p-3 flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border border-white/10 bg-white/5">
                      <ImageWithFallback
                        src={char.image}
                        alt={char.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h4 className="font-semibold text-white text-sm line-clamp-1">{char.name}</h4>
                    <span className="text-xs text-muted-foreground mt-0.5">Main Character</span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TRAILER TAB */}
          {content.trailer && (
            <TabsContent value="trailer">
              <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden aspect-video bg-black border border-white/10 shadow-2xl">
                {content.trailer.url ? (
                  <iframe
                    src={content.trailer.url}
                    title="Anime Trailer"
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    Trailer unavailable for embed.
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {/* REVIEWS TAB */}
          <TabsContent value="reviews" className="space-y-8">
            
            {/* Write a review form */}
            <form onSubmit={handleAddReview} className="glass-heavy rounded-2xl p-6 border border-white/10 space-y-4 max-w-3xl">
              <h3 className="text-lg font-bold text-white">Post Your Verdict</h3>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Score Out Of 10</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setNewRating(num)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        newRating === num ? 'bg-primary text-white scale-110' : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <textarea
                  rows={3}
                  placeholder="Share your experience, character thoughts, or animation breakdown..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <Button
                type="submit"
                disabled={submittingReview}
                className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 font-semibold"
              >
                <Send className="w-4 h-4 mr-2" />
                {submittingReview ? 'Publishing...' : 'Publish Review'}
              </Button>
            </form>

            {/* List of reviews */}
            <div className="space-y-4 max-w-3xl">
              {reviewsList.length === 0 ? (
                <div className="glass rounded-xl p-8 text-center border border-white/10">
                  <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No reviews yet. Be the first to share your thoughts!</p>
                </div>
              ) : (
                reviewsList.map((rev: any) => (
                  <div key={rev.id} className="glass rounded-xl p-5 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                          {rev.user_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">{rev.user_name || 'Anime Fan'}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(rev.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <Badge className="bg-amber-400/20 text-amber-400 border border-amber-400/30">
                        ⭐ {rev.rating}/10
                      </Badge>
                    </div>

                    <p className="text-sm text-white/85 leading-relaxed pl-11">
                      {rev.comment}
                    </p>
                  </div>
                ))
              )}
            </div>

          </TabsContent>

        </Tabs>
      </div>

    </div>
  )
}
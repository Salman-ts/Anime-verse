'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, AlertCircle, Play, ListVideo, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { VideoPlayer } from '../ui/video-player'
import { Alert, AlertDescription } from '../ui/alert'
import { useAppContext } from '../../context/AppContext'
import { streamingApi, DEMO_STREAMS } from '../../services/streaming'
import { anilistApi } from '../../services/anilist'
import type { StreamingContent, WatchProgress } from '../../types'
import type { StreamingEpisode } from '../../services/streaming'

export function Watch() {
  const { state, setState } = useAppContext()
  const [content, setContent] = useState<StreamingContent | null>(null)
  const [episodes, setEpisodes] = useState<StreamingEpisode[]>([])
  const [currentEpisode, setCurrentEpisode] = useState(1)
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [episodeLoading, setEpisodeLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEpisodesList, setShowEpisodesList] = useState(true)
  const [animeTitle, setAnimeTitle] = useState('')

  // Fetch streaming URL with fast timeout race for snappy responsiveness
  const loadEpisode = useCallback(async (title: string, episodeNumber: number) => {
    setEpisodeLoading(true)
    setError(null)
    try {
      // Race against a 1.8s timeout so UI switches episodes instantly if external scraper mirrors are slow
      const streamPromise = streamingApi.getStreamingUrl(title, episodeNumber)
      const timeoutPromise = new Promise<null>(resolve => setTimeout(() => resolve(null), 1800))
      const streamResult = await Promise.race([streamPromise, timeoutPromise])
      
      const fallbackStream = DEMO_STREAMS[(episodeNumber - 1) % DEMO_STREAMS.length]
      const activeUrl = streamResult?.url || fallbackStream.url

      setContent(prev => prev ? {
        ...prev,
        videoUrl: activeUrl,
        qualities: DEMO_STREAMS.map(s => ({ quality: s.quality, url: s.url, bitrate: 3000 }))
      } : {
        id: state.selectedContentId?.toString() || '140960',
        title,
        videoUrl: activeUrl,
        qualities: DEMO_STREAMS.map(s => ({ quality: s.quality, url: s.url, bitrate: 3000 })),
        duration: 1440,
        requiresSubscription: false
      })
      setCurrentEpisode(episodeNumber)
      setHasAccess(true)
    } catch (err) {
      console.error('Episode load error:', err)
      const fallbackStream = DEMO_STREAMS[(episodeNumber - 1) % DEMO_STREAMS.length]
      setContent(prev => prev ? { ...prev, videoUrl: fallbackStream.url } : null)
      setCurrentEpisode(episodeNumber)
    } finally {
      setEpisodeLoading(false)
    }
  }, [state.selectedContentId])

  useEffect(() => {
    let mounted = true
    const contentId = state.selectedContentId || 140960

    // 1. INSTANT SETUP: Immediately render video player and episodes without waiting for external API mirrors!
    setHasAccess(true)
    setLoading(false)
    setError(null)

    // Quick title guess for immediate UI response
    const initialTitle = contentId === 52991 || contentId === 140960 
      ? "Frieren: Beyond Journey's End" 
      : `Anime ${contentId}`
    setAnimeTitle(initialTitle)

    // Populate immediate playable fallback stream and episodes so user can watch instantly
    const initialEpisodes = streamingApi.getEpisodeListSync(initialTitle)
    setEpisodes(initialEpisodes)

    setContent({
      id: contentId.toString(),
      title: initialTitle,
      videoUrl: DEMO_STREAMS[0].url,
      qualities: DEMO_STREAMS.map(s => ({ quality: s.quality, url: s.url, bitrate: 3000 })),
      duration: 1440,
      requiresSubscription: false
    })

    // 2. BACKGROUND RESOLUTION: Fetch real metadata & live stream URLs silently in parallel
    const fetchBackgroundData = async () => {
      try {
        const detailsPromise = anilistApi.getById(Number(contentId))
        const detailsTimeout = new Promise<any>(resolve => setTimeout(() => resolve(null), 2500))
        const details = await Promise.race([detailsPromise, detailsTimeout])
        
        const resolvedTitle = details?.title || initialTitle
        if (!mounted) return
        setAnimeTitle(resolvedTitle)
        
        // Fetch real episode list independently (AniList GraphQL / backup DB)
        streamingApi.getEpisodeList(resolvedTitle).then(episodeList => {
          if (mounted && episodeList && episodeList.length > 0) {
            setEpisodes(episodeList)
          }
        }).catch(err => console.warn('Background episode list update failed:', err))

        // Fetch stream URL independently
        const streamPromise = streamingApi.getStreamingUrl(resolvedTitle, 1)
        const parallelTimeout = new Promise<any>(resolve => 
          setTimeout(() => resolve({ url: DEMO_STREAMS[0].url, isM3U8: DEMO_STREAMS[0].isM3U8 }), 2500)
        )

        const streamResult = await Promise.race([streamPromise, parallelTimeout])
        
        if (!mounted) return
        if (streamResult?.url) {
          setContent(prev => prev ? {
            ...prev,
            title: resolvedTitle,
            videoUrl: streamResult.url
          } : {
            id: contentId.toString(),
            title: resolvedTitle,
            videoUrl: streamResult.url,
            qualities: DEMO_STREAMS.map(s => ({ quality: s.quality, url: s.url, bitrate: 3000 })),
            duration: 1440,
            requiresSubscription: false
          })
        }
      } catch (err) {
        console.warn('Background stream upgrade fallback used:', err)
      }
    }

    fetchBackgroundData()
    return () => { mounted = false }
  }, [state.selectedContentId])

  const handleProgress = async (progress: WatchProgress) => {
    if (state.user) {
      await streamingApi.saveProgress({
        ...progress,
        userId: state.user.id
      })
    }
  }

  const handleEpisodeSelect = (epNumber: number) => {
    setError(null)
    loadEpisode(animeTitle, epNumber)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Connecting to streaming servers...</p>
        </div>
      </div>
    )
  }

  if (error && (!content || !hasAccess)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
        <div className="max-w-md w-full space-y-4">
          <Alert className="border-rose-500/50 bg-rose-500/10 text-rose-400 dark:text-rose-300">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Unable to access streaming content'}
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => setState({ currentPage: 'home' })}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return Home
          </Button>
        </div>
      </div>
    )
  }

  const totalEpisodes = episodes.length || 12

  return (
    <div className="min-h-screen bg-black text-white flex flex-col lg:flex-row">
      
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col relative min-h-screen">
        {/* Top Controls Overlay */}
        <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setState({ currentPage: 'moviedetail' })}
            className="bg-black/60 backdrop-blur-md border-white/20 text-white hover:bg-black/80 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Details
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEpisodesList(!showEpisodesList)}
            className="lg:hidden bg-black/60 backdrop-blur-md border-white/20 text-white hover:bg-black/80 rounded-xl"
          >
            <ListVideo className="w-4 h-4 mr-2" />
            Episodes ({currentEpisode}/{totalEpisodes})
          </Button>
        </div>

        {/* Video Player Container */}
        <div className="w-full flex-1 flex items-center justify-center bg-black p-2 sm:p-4 lg:p-6 min-h-[50vh] lg:min-h-[75vh]">
          {episodeLoading ? (
            <div className="flex flex-col items-center justify-center space-y-4 min-h-[400px]">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm text-white/60">Loading Episode {currentEpisode}...</p>
            </div>
          ) : content?.videoUrl ? (
            <div className="w-full max-w-[1500px] aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-950 relative">
              <VideoPlayer
                src={content.videoUrl}
                qualities={content.qualities}
                onProgress={handleProgress}
                onComplete={() => {
                  if (currentEpisode < totalEpisodes) {
                    handleEpisodeSelect(currentEpisode + 1)
                  }
                }}
                autoPlay={true}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 text-center p-8 min-h-[400px]">
              <Play className="w-16 h-16 text-white/30" />
              <p className="text-white/60">Select an episode to start watching</p>
            </div>
          )}
        </div>

        {/* Bottom Info Banner */}
        <div className="p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Episode {currentEpisode} of {totalEpisodes}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                {content?.title || animeTitle}
              </h1>
              {error && (
                <p className="text-xs text-amber-400 mt-1">{error}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Episode Sidebar */}
      {showEpisodesList && (
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-white/10 bg-zinc-950/95 backdrop-blur-xl flex flex-col h-auto lg:h-screen sticky top-0 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-bold text-white flex items-center gap-2">
              <ListVideo className="w-4 h-4 text-primary" />
              Episodes List
            </h2>
            <span className="text-xs text-zinc-400">{totalEpisodes} Eps</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {(episodes.length > 0 ? episodes : Array.from({ length: totalEpisodes })).map((ep, idx) => {
              const epNum = (ep as StreamingEpisode)?.number || idx + 1
              const epTitle = (ep as StreamingEpisode)?.title || `Episode ${epNum}`
              const isFiller = (ep as StreamingEpisode)?.isFiller || false
              const isActive = epNum === currentEpisode
              return (
                <button
                  key={`ep-${epNum}-${idx}`}
                  onClick={() => handleEpisodeSelect(epNum)}
                  disabled={episodeLoading}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/30 font-semibold'
                      : 'bg-white/5 hover:bg-white/10 text-white/80'
                  } ${episodeLoading ? 'opacity-50 cursor-wait' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isActive ? 'bg-white/20' : 'bg-black/40'
                    }`}>
                      {epNum}
                    </span>
                    <div>
                      <div className="text-sm truncate max-w-[160px]">{epTitle}</div>
                      <div className="text-[11px] text-white/60">
                        24 mins{isFiller ? ' • Filler' : ''}
                      </div>
                    </div>
                  </div>

                  {isActive && !episodeLoading && <Play className="w-4 h-4 fill-white" />}
                  {isActive && episodeLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                </button>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
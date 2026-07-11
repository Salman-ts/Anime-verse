'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, AlertCircle, Play, ListVideo, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { VideoPlayer } from '../ui/video-player'
import { Alert, AlertDescription } from '../ui/alert'
import { useAppContext } from '../../context/AppContext'
import { streamingApi } from '../../services/streaming'
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

  // Fetch streaming URL for a specific episode
  const loadEpisode = useCallback(async (title: string, episodeNumber: number) => {
    setEpisodeLoading(true)
    try {
      const streamResult = await streamingApi.getStreamingUrl(title, episodeNumber)
      
      if (streamResult) {
        setContent(prev => prev ? {
          ...prev,
          videoUrl: streamResult.url,
        } : {
          id: state.selectedContentId?.toString() || '140960',
          title,
          videoUrl: streamResult.url,
          qualities: [
            { quality: '720p', url: streamResult.url, bitrate: 2500 },
          ],
          duration: 1440,
          requiresSubscription: false
        })
        setCurrentEpisode(episodeNumber)
        setHasAccess(true)
      } else {
        setError(`No streaming source found for Episode ${episodeNumber}. Try another episode.`)
      }
    } catch (err) {
      console.error('Episode load error:', err)
      setError('Failed to load episode stream')
    } finally {
      setEpisodeLoading(false)
    }
  }, [state.selectedContentId])

  useEffect(() => {
    let mounted = true
    const initializeWatch = async () => {
      const contentId = state.selectedContentId || 140960 // Default to Spy x Family if opened directly

      try {
        setHasAccess(true)

        // Get anime details from AniList
        const details = await anilistApi.getById(Number(contentId))
        const title = details?.title || `Anime ${contentId}`
        
        if (mounted) {
          setAnimeTitle(title)
          
          // Get episode list from streaming API
          const episodeList = await streamingApi.getEpisodeList(title)
          setEpisodes(episodeList)
          
          // Load the first episode's streaming URL
          const streamResult = await streamingApi.getStreamingUrl(title, 1)
          
          if (streamResult) {
            setContent({
              id: contentId.toString(),
              title,
              videoUrl: streamResult.url,
              qualities: [
                { quality: '720p', url: streamResult.url, bitrate: 2500 },
              ],
              duration: 1440,
              requiresSubscription: false
            })
            setHasAccess(true)
          } else {
            // Fallback: show episode list but no video yet
            setContent({
              id: contentId.toString(),
              title,
              videoUrl: '',
              qualities: [],
              duration: 0,
              requiresSubscription: false
            })
            setHasAccess(true)
            if (episodeList.length === 0) {
              setError('No streaming sources available for this title yet. Check back later.')
            }
          }
          
          setLoading(false)
        }
      } catch (err) {
        console.error('Watch init error:', err)
        if (mounted) {
          setError('Failed to load streaming session. Please try again.')
          setLoading(false)
        }
      }
    }

    initializeWatch()
    return () => { mounted = false }
  }, [state.selectedContentId, state.user])

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
          <Alert className="border-rose-500/50 bg-rose-500/10 text-rose-300">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Unable to access streaming content'}
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => setState({ currentPage: 'moviedetail' })}
            className="w-full bg-white/10 hover:bg-white/20 text-white rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Details
          </Button>
        </div>
      </div>
    )
  }

  const totalEpisodes = episodes.length || 12

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row transition-colors duration-300">
      
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
        <div className="w-full flex-1 flex items-center justify-center bg-black">
          {episodeLoading ? (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm text-white/60">Loading Episode {currentEpisode}...</p>
            </div>
          ) : content?.videoUrl ? (
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
          ) : (
            <div className="flex flex-col items-center space-y-4 text-center p-8">
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
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-white/10 glass-heavy flex flex-col h-auto lg:h-screen sticky top-0 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-bold text-white flex items-center gap-2">
              <ListVideo className="w-4 h-4 text-primary" />
              Episodes List
            </h2>
            <span className="text-xs text-muted-foreground">{totalEpisodes} Eps</span>
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
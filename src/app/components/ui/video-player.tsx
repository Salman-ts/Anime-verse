'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react'
import { Button } from './button'
import { Slider } from './slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import type { StreamQuality, WatchProgress } from '../../types'

interface VideoPlayerProps {
  src: string
  poster?: string
  qualities?: StreamQuality[]
  onProgress?: (progress: WatchProgress) => void
  onComplete?: () => void
  autoPlay?: boolean
}

export function VideoPlayer({ 
  src, 
  poster, 
  qualities = [], 
  onProgress, 
  onComplete,
  autoPlay = false 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hlsRef = useRef<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [selectedQuality, setSelectedQuality] = useState<string>(qualities[0]?.quality || '720p')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null)

  // HLS.js initialization for .m3u8 streams with automatic failover
  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    // If selectedQuality doesn't match available qualities, fallback to first quality or src
    const currentQualityObj = qualities.find(q => q.quality === selectedQuality) || qualities[0]
    const effectiveSrc = currentQualityObj?.url || src
    const isHLS = effectiveSrc.includes('.m3u8')
    const fallbackDirectUrl = qualities.find(q => !q.url.includes('.m3u8'))?.url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'

    if (qualities.length > 0 && !qualities.some(q => q.quality === selectedQuality)) {
      if (qualities[0]?.quality) {
        setSelectedQuality(qualities[0].quality)
      }
    }

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    let networkErrorCount = 0

    const triggerFallback = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
      if (video.src !== fallbackDirectUrl) {
        video.src = fallbackDirectUrl
        video.load()
        if (autoPlay) {
          video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
        } else {
          setIsPlaying(false)
        }
      }
    }

    if (isHLS) {
      // Dynamic import of hls.js to avoid SSR issues
      import('hls.js').then(({ default: Hls }) => {
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
          })
          hlsRef.current = hls
          hls.loadSource(effectiveSrc)
          hls.attachMedia(video)
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (autoPlay) {
              video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
            } else {
              setIsPlaying(false)
            }
          })
          hls.on(Hls.Events.ERROR, (_: any, data: any) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  networkErrorCount++
                  if (networkErrorCount > 1) {
                    triggerFallback()
                  } else {
                    hls.startLoad()
                  }
                  break
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError()
                  break
                default:
                  triggerFallback()
                  break
              }
            }
          })
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Safari native HLS support
          video.src = effectiveSrc
          video.load()
          if (autoPlay) {
            video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
          } else {
            setIsPlaying(false)
          }
        } else {
          triggerFallback()
        }
      }).catch(() => {
        triggerFallback()
      })
    } else {
      // Direct MP4/WebM playback
      video.src = effectiveSrc
      video.load()
      if (autoPlay) {
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
      } else {
        setIsPlaying(false)
      }
    }

    const handleVideoError = () => {
      triggerFallback()
    }
    video.addEventListener('error', handleVideoError)

    return () => {
      video.removeEventListener('error', handleVideoError)
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [src, selectedQuality, qualities, autoPlay])

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      // Throttle progress saves to every ~5 seconds
      if (Math.floor(video.currentTime) % 5 === 0) {
        onProgress?.({
          contentId: src,
          userId: 'current-user',
          currentTime: video.currentTime,
          duration: video.duration,
          completed: video.currentTime >= video.duration * 0.9,
          lastWatched: new Date().toISOString()
        })
      }
    }

    const handleLoadedMetadata = () => setDuration(video.duration)
    const handleEnded = () => {
      setIsPlaying(false)
      onComplete?.()
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('ended', handleEnded)
    }
  }, [src, onProgress, onComplete])

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true)
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current)
    hideControlsTimer.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 3000)
  }, [isPlaying])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMove = () => resetControlsTimer()
    container.addEventListener('mousemove', handleMove)
    container.addEventListener('touchstart', handleMove)

    return () => {
      container.removeEventListener('mousemove', handleMove)
      container.removeEventListener('touchstart', handleMove)
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current)
    }
  }, [resetControlsTimer])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (isPlaying) {
      video.pause()
    } else {
      video.play().catch(() => {})
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = value[0]
    setCurrentTime(value[0])
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current
    if (!video) return
    video.volume = value[0]
    setVolume(value[0])
  }

  const toggleFullscreen = () => {
    const container = containerRef.current
    if (!container) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
      setIsFullscreen(false)
    } else {
      container.requestFullscreen()
      setIsFullscreen(true)
    }
  }

  const formatTime = (time: number) => {
    if (!isFinite(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div 
      ref={containerRef}
      className="relative bg-black rounded-xl overflow-hidden w-full h-full flex items-center justify-center cursor-pointer select-none"
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full object-contain max-h-full"
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      {/* Central Play Button Overlay when paused or autoplay blocked */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/20 transition-all z-40">
          <div className="w-20 h-20 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-2xl border border-white/20 hover:scale-110 transition-transform">
            <Play className="w-10 h-10 fill-white ml-1" />
          </div>
        </div>
      )}
      
      {/* Controls Overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div className="mb-3">
          <Slider
            value={[currentTime]}
            max={duration || 1}
            step={0.5}
            onValueChange={handleSeek}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePlay}
            className="text-white hover:bg-white/20 p-1.5"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
          </Button>

          <span className="text-white text-xs font-mono min-w-[80px]">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className="text-white hover:bg-white/20 p-1.5"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>

          <div className="w-20 hidden sm:block">
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.05}
              onValueChange={handleVolumeChange}
              className="w-full"
            />
          </div>

          {qualities.length > 1 && (
            <Select value={selectedQuality} onValueChange={(val: string) => setSelectedQuality(val)}>
              <SelectTrigger className="w-40 h-8 bg-black/60 border-white/20 text-white text-xs px-2.5 rounded-md hover:bg-black/80 transition-colors">
                <SelectValue placeholder="Select Server" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                {qualities.map(quality => (
                  <SelectItem key={quality.quality} value={quality.quality} className="text-xs hover:bg-zinc-800 cursor-pointer">
                    {quality.quality}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-white hover:bg-white/20 p-1.5"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Center Play Button (when paused) */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-primary/80 backdrop-blur-sm flex items-center justify-center shadow-2xl shadow-primary/50">
            <Play className="w-7 h-7 fill-white text-white ml-1" />
          </div>
        </div>
      )}
    </div>
  )
}
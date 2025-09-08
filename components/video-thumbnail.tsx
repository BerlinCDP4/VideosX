"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Video, AlertCircle } from "lucide-react"

interface Props {
  src: string
  title?: string
  className?: string
  onClick?: () => void
  onError?: () => void
}

export function VideoThumbnail({ src, title, className = "", onClick, onError }: Props) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const videoRef = useRef<HTMLVideoElement>(null)

  // Load only metadata to grab first frame (safer than drawing to canvas)
  useEffect(() => {
    setStatus("loading")
  }, [src])

  const handleLoaded = () => {
    const video = videoRef.current
    if (!video) return
    try {
      // Seek a bit to avoid black frames on some videos
      video.currentTime = Math.min(0.1, (video.duration || 1) / 10)
      video.pause()
      setStatus("ready")
    } catch {
      // Even if seeking fails, we can still display the default poster frame
      setStatus("ready")
    }
  }

  const handleError = () => {
    setStatus("error")
    onError?.()
  }

  /* ---------- Render ---------- */
  if (status === "error") {
    return (
      <div className={`relative bg-gray-800 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-red-400 text-sm font-medium">Video no disponible</p>
          <p className="text-gray-500 text-xs mt-1">Verifica la URL del video</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative cursor-pointer group ${className}`}
      onClick={() => {
        if (status === "ready") onClick?.()
      }}
    >
      {/* Actual video element - shows first frame as thumbnail */}
      <video
        ref={videoRef}
        src={src}
        preload="metadata"
        muted
        playsInline
        className="w-full h-full object-cover rounded-lg"
        onLoadedData={handleLoaded}
        onError={handleError}
      />

      {/* Overlay: play icon & badge only when ready */}
      {status === "ready" && (
        <>
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
            <div className="bg-green-500/90 backdrop-blur-sm rounded-full p-4 shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-white fill-current" />
            </div>
          </div>

          <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-2">
            <Video className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-white font-medium">Video</span>
          </div>
        </>
      )}

      {/* Loading placeholder */}
      {status === "loading" && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-orange-400 border-t-transparent"></div>
        </div>
      )}
    </div>
  )
}

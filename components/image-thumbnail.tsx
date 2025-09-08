"use client"

import { useState } from "react"
import { ImageIcon, AlertCircle } from "lucide-react"

interface ImageThumbnailProps {
  src: string
  alt?: string
  className?: string
  onClick?: () => void
  onError?: () => void
}

export function ImageThumbnail({ src, alt, className = "", onClick, onError }: ImageThumbnailProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  const handleClick = () => {
    if (!hasError) {
      onClick?.()
    }
  }

  if (hasError) {
    return (
      <div className={`relative bg-gray-800 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-purple-400 text-sm font-medium">Imagen no disponible</p>
          <p className="text-gray-500 text-xs mt-1">Verifica la URL de la imagen</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative cursor-pointer group ${className}`} onClick={handleClick}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-400 border-t-transparent"></div>
            </div>
            <p className="text-purple-400 text-sm font-medium">Cargando imagen...</p>
          </div>
        </div>
      )}

      <img
        src={src || "/placeholder.svg"}
        alt={alt || "Imagen"}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        onLoad={handleLoad}
        onError={handleError}
        style={{ display: hasError ? "none" : "block" }}
      />

      {/* Overlay en hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <ImageIcon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  )
}

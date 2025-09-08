"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  ImageIcon as ImageLucide,
  X,
  Eye,
  Share2,
  Heart,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Menu,
  Home,
  TrendingUp,
  User,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  BarChart3,
  HelpCircle,
  Settings,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { UploadForm } from "./upload-form"
import { StatsModal } from "./stats-modal"
import { TutorialModal } from "./tutorial-modal"
import { VideoThumbnail } from "./video-thumbnail"
import { ImageThumbnail } from "./image-thumbnail"

interface MediaItem {
  id: string
  url: string
  type: "image" | "video"
  title: string
  addedAt: string
  uploaderId: string
  views: number
}

interface Stats {
  totalItems: number
  totalViews: number
  totalImages: number
  totalVideos: number
  trending: MediaItem[]
}

type SortOption = "newest" | "oldest" | "most-viewed" | "least-viewed"
type FilterOption = "all" | "images" | "videos" | "my-content" | "favorites"

interface SwipeState {
  startX: number
  startY: number
  currentX: number
  currentY: number
  startTime: number
  isActive: boolean
  direction: "left" | "right" | "up" | "down" | null
  velocity: number
}

interface SwipeAction {
  icon: React.ComponentType<any>
  color: string
  bgColor: string
  label: string
  action: () => void
}

export function MobileOptimizedViewer() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [filterBy, setFilterBy] = useState<FilterOption>("all")
  const [stats, setStats] = useState<Stats | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [showBottomSheet, setShowBottomSheet] = useState(false)
  const [activeTab, setActiveTab] = useState<"home" | "trending" | "profile" | "upload">("home")
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [showTutorialModal, setShowTutorialModal] = useState(false)
  const { toast } = useToast()
  const [uploaderId, setUploaderId] = useState<string>("")

  const [swipeState, setSwipeState] = useState<SwipeState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: 0,
    isActive: false,
    direction: null,
    velocity: 0,
  })
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [swipeActions, setSwipeActions] = useState<{
    left?: SwipeAction
    right?: SwipeAction
    up?: SwipeAction
    down?: SwipeAction
  }>({})
  const [showSwipeHint, setShowSwipeHint] = useState(true)

  // Referencias para manejar touch events
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Al cargar el componente
  useEffect(() => {
    let storedUploaderId = localStorage.getItem("uploader-id")
    if (!storedUploaderId) {
      storedUploaderId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem("uploader-id", storedUploaderId)
    }
    setUploaderId(storedUploaderId)

    const storedFavorites = localStorage.getItem("favorites")
    if (storedFavorites) {
      setFavorites(new Set(JSON.parse(storedFavorites)))
    }

    // Mostrar tutorial en primera visita
    const hasSeenTutorial = localStorage.getItem("has-seen-tutorial")
    if (!hasSeenTutorial) {
      setTimeout(() => setShowTutorialModal(true), 1000)
    }
  }, [])

  // Manejar scroll para mostrar botón "volver arriba"
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Guardar favoritos
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(Array.from(favorites)))
  }, [favorites])

  // Cargar datos
  const fetchItems = useCallback(async () => {
    try {
      const response = await fetch("/api/media")
      const data = await response.json()
      setItems(data.items || [])
    } catch (error) {
      console.error("Error loading items:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los elementos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/media/stats")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }, [])

  useEffect(() => {
    fetchItems()
    fetchStats()
  }, [fetchItems, fetchStats])

  // Incrementar visitas
  const incrementViews = useCallback(
    async (id: string) => {
      try {
        const response = await fetch("/api/media/views", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        })

        if (response.ok) {
          const data = await response.json()
          setItems((prev) => prev.map((item) => (item.id === id ? { ...item, views: data.views } : item)))
          fetchStats()
        }
      } catch (error) {
        console.error("Error incrementing views:", error)
      }
    },
    [fetchStats],
  )

  // Manejar touch events mejorados para móvil
  const handleSwipeStart = (e: React.TouchEvent, item: MediaItem, index: number) => {
    const touch = e.touches[0]
    setSwipeState({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      startTime: Date.now(),
      isActive: true,
      direction: null,
      velocity: 0,
    })

    // Configurar acciones de swipe para este elemento
    setSwipeActions({
      left: {
        icon: Heart,
        color: "text-red-400",
        bgColor: "bg-red-500/20",
        label: favorites.has(item.id) ? "Quitar favorito" : "Favorito",
        action: () => toggleFavorite(item.id),
      },
      right: {
        icon: Share2,
        color: "text-blue-400",
        bgColor: "bg-blue-500/20",
        label: "Compartir",
        action: () => shareItem(item),
      },
      up:
        index > 0
          ? {
              icon: ChevronUp,
              color: "text-green-400",
              bgColor: "bg-green-500/20",
              label: "Anterior",
              action: () => navigateToMedia(index - 1),
            }
          : undefined,
      down:
        index < filteredAndSortedItems.length - 1
          ? {
              icon: ChevronDown,
              color: "text-green-400",
              bgColor: "bg-green-500/20",
              label: "Siguiente",
              action: () => navigateToMedia(index + 1),
            }
          : undefined,
    })
  }

  const handleSwipeMove = (e: React.TouchEvent) => {
    if (!swipeState.isActive) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - swipeState.startX
    const deltaY = touch.clientY - swipeState.startY
    const deltaTime = Date.now() - swipeState.startTime

    // Calcular dirección y velocidad
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)
    let direction: "left" | "right" | "up" | "down" | null = null

    if (absX > absY && absX > 20) {
      direction = deltaX > 0 ? "right" : "left"
    } else if (absY > absX && absY > 20) {
      direction = deltaY > 0 ? "down" : "up"
    }

    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / (deltaTime || 1)

    setSwipeState((prev) => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
      direction,
      velocity,
    }))

    // Prevenir scroll si es un swipe horizontal
    if (direction === "left" || direction === "right") {
      e.preventDefault()
    }
  }

  const handleSwipeEnd = (e: React.TouchEvent, item: MediaItem, index: number) => {
    if (!swipeState.isActive) return

    const deltaX = swipeState.currentX - swipeState.startX
    const deltaY = swipeState.currentY - swipeState.startY
    const deltaTime = Date.now() - swipeState.startTime
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    // Determinar si es un swipe válido
    const isSwipe = (absX > 50 || absY > 50) && deltaTime < 500 && swipeState.velocity > 0.3

    if (isSwipe && swipeState.direction) {
      const action = swipeActions[swipeState.direction]
      if (action) {
        action.action()

        // Mostrar feedback visual
        toast({
          title: action.label,
          description: `Acción realizada con swipe ${swipeState.direction}`,
        })
      }
    } else if (!isSwipe && absX < 10 && absY < 10 && deltaTime < 300) {
      // Es un tap, abrir el contenido
      handleMediaClick(item)
    }

    // Reset swipe state
    setSwipeState({
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      startTime: 0,
      isActive: false,
      direction: null,
      velocity: 0,
    })
    setSwipeActions({})
  }

  // Nueva función para navegar entre contenido
  const navigateToMedia = (index: number) => {
    if (index >= 0 && index < filteredAndSortedItems.length) {
      const item = filteredAndSortedItems[index]
      setCurrentMediaIndex(index)
      handleMediaClick(item)

      // Scroll suave al elemento
      setTimeout(() => {
        const element = document.getElementById(`media-${item.id}`)
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }, 100)
    }
  }

  const handleMediaClick = useCallback(
    (item: MediaItem) => {
      incrementViews(item.id)
      setSelectedMedia(item)
    },
    [incrementViews],
  )

  // Toggle favoritos
  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(id)) {
        newFavorites.delete(id)
        toast({ title: "Removido de favoritos" })
      } else {
        newFavorites.add(id)
        toast({ title: "Agregado a favoritos" })
      }
      return newFavorites
    })
  }

  // Compartir
  const shareItem = async (item: MediaItem) => {
    try {
      await navigator.share({
        title: `TusVideosCN - ${item.type === "video" ? "Video" : "Imagen"}`,
        text: `Mira este ${item.type === "video" ? "video" : "imagen"} en TusVideosCN`,
        url: item.url,
      })
    } catch (error) {
      try {
        await navigator.clipboard.writeText(item.url)
        toast({ title: "¡Enlace copiado!" })
      } catch (clipboardError) {
        toast({ title: "Error al compartir", variant: "destructive" })
      }
    }
  }

  // Manejar navegación de tabs
  const handleTabChange = (tab: "home" | "trending" | "profile" | "upload") => {
    setActiveTab(tab)

    switch (tab) {
      case "home":
        setFilterBy("all")
        break
      case "trending":
        setSortBy("most-viewed")
        setFilterBy("all")
        break
      case "profile":
        setFilterBy("my-content")
        break
      case "upload":
        setShowUploadForm(true)
        break
    }
  }

  // Filtrar items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.url.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (filterBy === "images") {
      filtered = filtered.filter((item) => item.type === "image")
    } else if (filterBy === "videos") {
      filtered = filtered.filter((item) => item.type === "video")
    } else if (filterBy === "my-content") {
      filtered = filtered.filter((item) => item.uploaderId === uploaderId)
    } else if (filterBy === "favorites") {
      filtered = filtered.filter((item) => favorites.has(item.id))
    }

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
        case "oldest":
          return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()
        case "most-viewed":
          return (b.views || 0) - (a.views || 0)
        case "least-viewed":
          return (a.views || 0) - (b.views || 0)
        default:
          return 0
      }
    })
  }, [items, searchQuery, filterBy, sortBy, uploaderId, favorites])

  // Componente de tarjeta optimizada para móvil
  const MobileMediaCard = ({ item, index }: { item: MediaItem; index: number }) => {
    const deltaX = swipeState.isActive ? swipeState.currentX - swipeState.startX : 0
    const deltaY = swipeState.isActive ? swipeState.currentY - swipeState.startY : 0
    const isCurrentSwipe = swipeState.isActive

    return (
      <div className="relative" id={`media-${item.id}`}>
        {/* Indicadores de swipe */}
        {isCurrentSwipe && swipeState.direction && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            {swipeState.direction === "left" && swipeActions.left && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2 bg-red-500/90 backdrop-blur-sm rounded-full px-4 py-2 animate-pulse">
                <swipeActions.left.icon className="w-5 h-5 text-white" />
                <span className="text-white font-medium">{swipeActions.left.label}</span>
              </div>
            )}

            {swipeState.direction === "right" && swipeActions.right && (
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2 bg-blue-500/90 backdrop-blur-sm rounded-full px-4 py-2 animate-pulse">
                <swipeActions.right.icon className="w-5 h-5 text-white" />
                <span className="text-white font-medium">{swipeActions.right.label}</span>
              </div>
            )}

            {swipeState.direction === "up" && swipeActions.up && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-green-500/90 backdrop-blur-sm rounded-full px-4 py-2 animate-pulse">
                <swipeActions.up.icon className="w-5 h-5 text-white" />
                <span className="text-white font-medium">{swipeActions.up.label}</span>
              </div>
            )}

            {swipeState.direction === "down" && swipeActions.down && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-green-500/90 backdrop-blur-sm rounded-full px-4 py-2 animate-pulse">
                <swipeActions.down.icon className="w-5 h-5 text-white" />
                <span className="text-white font-medium">{swipeActions.down.label}</span>
              </div>
            )}
          </div>
        )}

        <Card
          className={`group overflow-hidden border border-green-500/20 shadow-lg bg-gray-900/90 backdrop-blur-sm rounded-2xl mb-4 mx-2 transition-transform duration-200 ${
            isCurrentSwipe ? "scale-105" : ""
          }`}
          style={{
            transform: isCurrentSwipe ? `translate(${deltaX * 0.1}px, ${deltaY * 0.1}px)` : "none",
          }}
        >
          <CardContent className="p-0">
            <div
              className="relative aspect-video bg-gradient-to-br from-gray-800 to-black overflow-hidden rounded-t-2xl"
              onTouchStart={(e) => handleSwipeStart(e, item, index)}
              onTouchMove={handleSwipeMove}
              onTouchEnd={(e) => handleSwipeEnd(e, item, index)}
            >
              {item.type === "video" ? (
                <VideoThumbnail
                  src={item.url}
                  title={item.title}
                  className="w-full h-full"
                  onClick={() => handleMediaClick(item)}
                  onError={() => {
                    console.error("Error loading video:", item.url)
                  }}
                />
              ) : (
                <ImageThumbnail
                  src={item.url || "/placeholder.svg"}
                  alt={item.title || "Imagen"}
                  className="w-full h-full"
                  onClick={() => handleMediaClick(item)}
                  onError={() => {
                    console.error("Error loading image:", item.url)
                  }}
                />
              )}

              {/* Contador de visitas */}
              <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-2 z-10">
                <Eye className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400 font-medium">{item.views || 0}</span>
              </div>

              {/* Indicadores de estado */}
              <div className="absolute bottom-3 right-3 flex gap-2 z-10">
                {favorites.has(item.id) && (
                  <div className="bg-red-500/90 backdrop-blur-sm rounded-full p-2">
                    <Heart className="w-4 h-4 text-white fill-current" />
                  </div>
                )}
                {item.uploaderId === uploaderId && (
                  <div className="bg-green-500/90 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-xs text-white font-medium">Tuyo</span>
                  </div>
                )}
              </div>
            </div>

            {/* Información del contenido */}
            <div className="p-4 space-y-3">
              {item.type === "video" && item.title && item.title !== "Media" && (
                <h3 className="text-lg font-semibold text-green-400 line-clamp-2 leading-tight">{item.title}</h3>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>
                    {new Date(item.addedAt).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Indicador de posición */}
                <div className="text-xs text-gray-500">
                  {index + 1} de {filteredAndSortedItems.length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hint de swipe para el primer elemento */}
        {index === 0 && showSwipeHint && filteredAndSortedItems.length > 0 && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500/90 backdrop-blur-sm rounded-full px-4 py-2 animate-bounce">
            <div className="flex items-center gap-2 text-white text-xs">
              <span>👆 Desliza para acciones rápidas</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 text-white hover:text-gray-300"
                onClick={() => setShowSwipeHint(false)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Modal optimizado para móvil
  const MobileMediaModal = () => {
    if (!selectedMedia) return null

    const currentIndex = filteredAndSortedItems.findIndex((item) => item.id === selectedMedia.id)
    const canGoPrevious = currentIndex > 0
    const canGoNext = currentIndex < filteredAndSortedItems.length - 1

    const handleModalSwipe = (direction: "left" | "right" | "down") => {
      if (direction === "left" && canGoNext) {
        const nextItem = filteredAndSortedItems[currentIndex + 1]
        setSelectedMedia(nextItem)
        incrementViews(nextItem.id)
      } else if (direction === "right" && canGoPrevious) {
        const prevItem = filteredAndSortedItems[currentIndex - 1]
        setSelectedMedia(prevItem)
        incrementViews(prevItem.id)
      } else if (direction === "down") {
        setSelectedMedia(null)
      }
    }

    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Header del modal */}
        <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm border-b border-green-500/20">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-full"
              onClick={() => setSelectedMedia(null)}
            >
              <X className="w-6 h-6 text-white" />
            </Button>

            <div className="text-sm text-gray-400">
              {currentIndex + 1} de {filteredAndSortedItems.length}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-full"
              onClick={() => toggleFavorite(selectedMedia.id)}
            >
              <Heart
                className={`w-5 h-5 ${favorites.has(selectedMedia.id) ? "fill-current text-red-400" : "text-white"}`}
              />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-full"
              onClick={() => shareItem(selectedMedia)}
            >
              <Share2 className="w-5 h-5 text-white" />
            </Button>
          </div>
        </div>

        {/* Contenido del modal con swipe */}
        <div
          className="flex-1 flex items-center justify-center p-4 relative"
          onTouchStart={(e) => {
            const touch = e.touches[0]
            setSwipeState((prev) => ({
              ...prev,
              startX: touch.clientX,
              startY: touch.clientY,
              startTime: Date.now(),
              isActive: true,
            }))
          }}
          onTouchMove={(e) => {
            if (!swipeState.isActive) return
            const touch = e.touches[0]
            setSwipeState((prev) => ({
              ...prev,
              currentX: touch.clientX,
              currentY: touch.clientY,
            }))
          }}
          onTouchEnd={(e) => {
            if (!swipeState.isActive) return

            const deltaX = swipeState.currentX - swipeState.startX
            const deltaY = swipeState.currentY - swipeState.startY
            const absX = Math.abs(deltaX)
            const absY = Math.abs(deltaY)

            if (absX > 50 && absX > absY) {
              handleModalSwipe(deltaX > 0 ? "right" : "left")
            } else if (deltaY > 100 && absY > absX) {
              handleModalSwipe("down")
            }

            setSwipeState((prev) => ({ ...prev, isActive: false }))
          }}
        >
          {/* Indicadores de navegación */}
          {canGoPrevious && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 backdrop-blur-sm rounded-full p-3 z-10">
              <ChevronLeft className="w-6 h-6 text-white" />
            </div>
          )}

          {canGoNext && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 backdrop-blur-sm rounded-full p-3 z-10">
              <ChevronRight className="w-6 h-6 text-white" />
            </div>
          )}

          {selectedMedia.type === "video" ? (
            <VideoThumbnail
              src={selectedMedia.url}
              title={selectedMedia.title}
              className="max-w-full max-h-full"
              onError={() => {
                console.error("Error loading video in modal:", selectedMedia.url)
              }}
            />
          ) : (
            <ImageThumbnail
              src={selectedMedia.url || "/placeholder.svg"}
              alt={selectedMedia.title}
              className="max-w-full max-h-full"
              onError={() => {
                console.error("Error loading image in modal:", selectedMedia.url)
              }}
            />
          )}

          {/* Hint de swipe */}
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-full px-4 py-2">
            <div className="flex items-center gap-4 text-white text-xs">
              <span>← → Navegar</span>
              <span>↓ Cerrar</span>
            </div>
          </div>
        </div>

        {/* Footer del modal */}
        <div className="p-4 bg-black/80 backdrop-blur-sm border-t border-green-500/20">
          {selectedMedia.type === "video" && selectedMedia.title && selectedMedia.title !== "Media" && (
            <h3 className="text-xl font-semibold text-green-400 mb-3">{selectedMedia.title}</h3>
          )}

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <Clock className="w-4 h-4" />
              <span>
                {new Date(selectedMedia.addedAt).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="flex items-center gap-2 text-green-400">
              <Eye className="w-4 h-4" />
              <span className="font-medium">{selectedMedia.views || 0} visitas</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Skeleton optimizado para móvil
  const MobileSkeleton = () => (
    <Card className="overflow-hidden border border-green-500/20 bg-gray-900/90 rounded-2xl mb-4 mx-2">
      <CardContent className="p-0">
        <Skeleton className="aspect-video w-full rounded-t-2xl" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Navegación inferior
  const BottomNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-green-500/20 z-40">
      <div className="flex items-center justify-around py-2">
        {[
          { id: "home", icon: Home, label: "Inicio" },
          { id: "trending", icon: TrendingUp, label: "Trending" },
          { id: "upload", icon: Plus, label: "Subir" },
          { id: "profile", icon: User, label: "Perfil" },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 h-auto py-2 px-4 ${
              activeTab === tab.id ? "text-green-400" : "text-gray-400"
            }`}
            onClick={() => handleTabChange(tab.id as any)}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-xs">{tab.label}</span>
          </Button>
        ))}
      </div>
    </div>
  )

  // Botón scroll to top
  const ScrollToTopButton = () => {
    if (!showScrollTop) return null

    return (
      <Button
        className="fixed bottom-20 right-4 h-12 w-12 rounded-full bg-green-500 hover:bg-green-600 shadow-lg z-30"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <ChevronUp className="w-6 h-6 text-black" />
      </Button>
    )
  }

  // Bottom sheet para opciones adicionales
  const BottomSheet = () => {
    if (!showBottomSheet) return null

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end">
        <div className="w-full bg-gray-900/95 backdrop-blur-sm rounded-t-3xl border-t border-green-500/30 p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-green-400">Opciones</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowBottomSheet(false)} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center gap-2 border-green-500/30 hover:bg-green-900/30"
              onClick={() => {
                setShowStatsModal(true)
                setShowBottomSheet(false)
              }}
            >
              <BarChart3 className="w-6 h-6 text-green-400" />
              <span className="text-sm">Estadísticas</span>
            </Button>

            <Button
              variant="outline"
              className="h-16 flex flex-col items-center gap-2 border-blue-500/30 hover:bg-blue-900/30"
              onClick={() => {
                setShowTutorialModal(true)
                setShowBottomSheet(false)
              }}
            >
              <HelpCircle className="w-6 h-6 text-blue-400" />
              <span className="text-sm">Tutorial</span>
            </Button>

            <Button
              variant="outline"
              className="h-16 flex flex-col items-center gap-2 border-purple-500/30 hover:bg-purple-900/30"
              onClick={() => {
                fetchItems()
                fetchStats()
                setShowBottomSheet(false)
                toast({ title: "Contenido actualizado" })
              }}
            >
              <RefreshCw className="w-6 h-6 text-purple-400" />
              <span className="text-sm">Actualizar</span>
            </Button>

            <Button
              variant="outline"
              className="h-16 flex flex-col items-center gap-2 border-gray-500/30 hover:bg-gray-900/30"
              onClick={() => {
                // Configuraciones futuras
                setShowBottomSheet(false)
                toast({ title: "Próximamente", description: "Configuraciones en desarrollo" })
              }}
            >
              <Settings className="w-6 h-6 text-gray-400" />
              <span className="text-sm">Configuración</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900 pb-20">
      {/* Header móvil */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-sm border-b border-green-500/20">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
            TusVideosCN
          </h1>
          <Button variant="ghost" size="sm" onClick={() => setShowBottomSheet(true)}>
            <Menu className="w-6 h-6 text-green-400" />
          </Button>
        </div>

        {/* Barra de búsqueda móvil */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar contenido..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-lg border-2 border-green-500/30 bg-black/50 text-green-100 placeholder-gray-500 focus:border-green-400 rounded-xl"
            />
          </div>
        </div>

        {/* Filtros móviles */}
        <div className="flex gap-3 px-4 pb-4 overflow-x-auto">
          <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
            <SelectTrigger className="w-32 h-10 border-2 border-green-500/30 bg-black/50 text-green-100 rounded-xl">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-green-500/30">
              <SelectItem value="all">Todo</SelectItem>
              <SelectItem value="images">Imágenes</SelectItem>
              <SelectItem value="videos">Videos</SelectItem>
              <SelectItem value="favorites">Favoritos</SelectItem>
              <SelectItem value="my-content">Mi contenido</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-40 h-10 border-2 border-green-500/30 bg-black/50 text-green-100 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-green-500/30">
              <SelectItem value="newest">Más reciente</SelectItem>
              <SelectItem value="oldest">Más antiguo</SelectItem>
              <SelectItem value="most-viewed">Más visto</SelectItem>
              <SelectItem value="least-viewed">Menos visto</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchItems()
              fetchStats()
            }}
            className="h-10 px-4 border-2 border-green-500/30 bg-black/50 text-green-400 hover:bg-green-900/30 rounded-xl"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Contenido principal */}
      <div ref={scrollContainerRef} className="pt-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <MobileSkeleton key={i} />
            ))}
          </div>
        ) : filteredAndSortedItems.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-3xl p-8 max-w-sm mx-auto shadow-xl border border-green-500/20">
              <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-full p-4 w-20 h-20 mx-auto mb-6">
                <ImageLucide className="w-12 h-12 text-black" />
              </div>
              <h3 className="text-xl font-bold text-green-400 mb-3">
                {searchQuery || filterBy !== "all" ? "Sin resultados" : "Sin contenido"}
              </h3>
              <p className="text-gray-400 mb-4">
                {searchQuery || filterBy !== "all" ? "Prueba con otros filtros" : "Sé el primero en compartir algo"}
              </p>
              {!searchQuery && filterBy === "all" && (
                <Button
                  onClick={() => setShowUploadForm(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-black font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Subir contenido
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredAndSortedItems.map((item, index) => (
              <MobileMediaCard key={item.id} item={item} index={index} />
            ))}
          </div>
        )}
      </div>

      {/* Componentes adicionales */}
      <MobileMediaModal />
      <BottomNavigation />
      <ScrollToTopButton />
      <BottomSheet />

      {/* Modales */}
      {showUploadForm && (
        <UploadForm
          onClose={() => setShowUploadForm(false)}
          onSuccess={() => {
            fetchItems()
            fetchStats()
          }}
        />
      )}

      <StatsModal isOpen={showStatsModal} onClose={() => setShowStatsModal(false)} />

      <TutorialModal
        isOpen={showTutorialModal}
        onClose={() => {
          setShowTutorialModal(false)
          localStorage.setItem("has-seen-tutorial", "true")
        }}
      />
    </div>
  )
}

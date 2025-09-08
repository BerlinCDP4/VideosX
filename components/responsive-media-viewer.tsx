"use client"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Video,
  ImagePlusIcon as ImageLucide,
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
  BarChart3,
  HelpCircle,
  Grid3X3,
  List,
  Download,
  Shield,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { UploadForm } from "./upload-form"
import { StatsModal } from "./stats-modal"
import { TutorialModal } from "./tutorial-modal"
import { AdminPanel } from "./admin-panel"

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
type ViewMode = "grid" | "list"

export function ResponsiveMediaViewer() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [filterBy, setFilterBy] = useState<FilterOption>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [stats, setStats] = useState<Stats | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [showSidebar, setShowSidebar] = useState(false)
  const [activeTab, setActiveTab] = useState<"home" | "trending" | "profile">("home")
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [showTutorialModal, setShowTutorialModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const { toast } = useToast()
  const [uploaderId, setUploaderId] = useState<string>("")

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Inicialización
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

  // Manejar click en media
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
      if (navigator.share) {
        await navigator.share({
          title: `TusVideosCN - ${item.type === "video" ? "Video" : "Imagen"}`,
          text: `Mira este ${item.type === "video" ? "video" : "imagen"} en TusVideosCN`,
          url: item.url,
        })
      } else {
        await navigator.clipboard.writeText(item.url)
        toast({ title: "¡Enlace copiado!" })
      }
    } catch (error) {
      try {
        await navigator.clipboard.writeText(item.url)
        toast({ title: "¡Enlace copiado!" })
      } catch (clipboardError) {
        toast({ title: "Error al compartir", variant: "destructive" })
      }
    }
  }

  // Descargar
  const downloadItem = (item: MediaItem) => {
    const link = document.createElement("a")
    link.href = item.url
    link.download = item.title || "media"
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Manejar navegación de tabs
  const handleTabChange = (tab: "home" | "trending" | "profile") => {
    setActiveTab(tab)
    setShowSidebar(false)

    switch (tab) {
      case "home":
        setFilterBy("all")
        setSortBy("newest")
        break
      case "trending":
        setSortBy("most-viewed")
        setFilterBy("all")
        break
      case "profile":
        setFilterBy("my-content")
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

  // Componente de tarjeta de media
  const MediaCard = ({ item, index }: { item: MediaItem; index: number }) => {
    const [imageError, setImageError] = useState(false)
    const [imageLoading, setImageLoading] = useState(true)

    return (
      <Card className="group overflow-hidden border border-gray-700 hover:border-green-500/50 transition-all duration-300 bg-gray-900/50 hover:bg-gray-900/80 hover:shadow-xl hover:shadow-green-500/10">
        <CardContent className="p-0">
          <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
            {item.type === "video" ? (
              <div className="w-full h-full cursor-pointer relative" onClick={() => handleMediaClick(item)}>
                <video
                  src={item.url}
                  className="w-full h-full object-cover"
                  preload="metadata"
                  muted
                  playsInline
                  onError={() => setImageError(true)}
                  onLoadedData={() => setImageLoading(false)}
                />
                {!imageError && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/30 transition-colors">
                    <div className="bg-green-500 rounded-full p-3 shadow-lg group-hover:scale-110 transition-transform">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                  <Video className="w-3 h-3 text-orange-400" />
                  <span className="text-xs text-white">Video</span>
                </div>
              </div>
            ) : (
              <div className="w-full h-full cursor-pointer relative" onClick={() => handleMediaClick(item)}>
                {imageLoading && (
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-400 border-t-transparent"></div>
                  </div>
                )}
                <img
                  src={item.url || "/placeholder.svg"}
                  alt={item.title || "Imagen"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={() => {
                    setImageError(true)
                    setImageLoading(false)
                  }}
                  onLoad={() => setImageLoading(false)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </div>
            )}

            {imageError && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                    {item.type === "video" ? (
                      <Video className="w-6 h-6 text-gray-400" />
                    ) : (
                      <ImageLucide className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">No disponible</p>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 bg-black/80 border-red-500/50 text-red-400 hover:bg-red-600 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavorite(item.id)
                }}
              >
                <Heart className={`w-3 h-3 ${favorites.has(item.id) ? "fill-current" : ""}`} />
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 bg-black/80 border-blue-500/50 text-blue-400 hover:bg-blue-600 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  shareItem(item)
                }}
              >
                <Share2 className="w-3 h-3" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 bg-black/80 border-purple-500/50 text-purple-400 hover:bg-purple-600 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  downloadItem(item)
                }}
              >
                <Download className="w-3 h-3" />
              </Button>
            </div>

            {/* Contador de visitas */}
            <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
              <Eye className="w-3 h-3 text-green-400" />
              <span className="text-xs text-green-400 font-medium">{item.views || 0}</span>
            </div>

            {/* Indicadores */}
            <div className="absolute bottom-2 right-2 flex gap-1">
              {favorites.has(item.id) && (
                <div className="bg-red-500/90 rounded-full p-1">
                  <Heart className="w-3 h-3 text-white fill-current" />
                </div>
              )}
              {item.uploaderId === uploaderId && (
                <Badge variant="outline" className="text-xs bg-green-500/90 text-white border-none">
                  Tuyo
                </Badge>
              )}
            </div>
          </div>

          {/* Información */}
          <div className="p-3">
            {item.type === "video" && item.title && item.title !== "Media" && (
              <h3 className="font-semibold text-green-400 mb-2 line-clamp-2 text-sm">{item.title}</h3>
            )}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>
                  {new Date(item.addedAt).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <span>#{index + 1}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Modal de media
  const MediaModal = () => {
    if (!selectedMedia) return null

    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
          <Button
            variant="outline"
            size="sm"
            className="absolute top-4 right-4 bg-black/80 border-red-500/50 text-red-400 hover:bg-red-600 hover:text-white z-10"
            onClick={() => setSelectedMedia(null)}
          >
            <X className="w-4 h-4" />
          </Button>

          {selectedMedia.type === "video" ? (
            <video
              src={selectedMedia.url}
              controls
              autoPlay
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          ) : (
            <img
              src={selectedMedia.url || "/placeholder.svg"}
              alt={selectedMedia.title}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          )}

          <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4">
            {selectedMedia.type === "video" && selectedMedia.title && selectedMedia.title !== "Media" && (
              <h3 className="text-lg font-semibold text-green-400 mb-2">{selectedMedia.title}</h3>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
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
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-green-400">
                  <Eye className="w-4 h-4" />
                  <span className="font-medium">{selectedMedia.views || 0} visitas</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleFavorite(selectedMedia.id)}
                    className={`border-red-500/50 hover:bg-red-600 ${
                      favorites.has(selectedMedia.id) ? "text-red-400 bg-red-900/30" : "text-red-400"
                    }`}
                  >
                    <Heart className={`w-4 h-4 mr-1 ${favorites.has(selectedMedia.id) ? "fill-current" : ""}`} />
                    Favorito
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareItem(selectedMedia)}
                    className="border-blue-500/50 text-blue-400 hover:bg-blue-600"
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Compartir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadItem(selectedMedia)}
                    className="border-purple-500/50 text-purple-400 hover:bg-purple-600"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Descargar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Skeleton
  const MediaSkeleton = () => (
    <Card className="overflow-hidden border border-gray-700 bg-gray-900/50">
      <CardContent className="p-0">
        <Skeleton className="aspect-video w-full" />
        <div className="p-3 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </CardContent>
    </Card>
  )

  // Sidebar para desktop
  const Sidebar = () => (
    <div
      className={`fixed left-0 top-0 h-full w-64 bg-gray-900/95 backdrop-blur-sm border-r border-gray-700 z-40 transform transition-transform duration-300 ${showSidebar || !isMobile ? "translate-x-0" : "-translate-x-full"}`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
            TusVideosCN
          </h1>
          {isMobile && (
            <Button variant="ghost" size="sm" onClick={() => setShowSidebar(false)}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <nav className="space-y-2">
          {[
            { id: "home", icon: Home, label: "Inicio" },
            { id: "trending", icon: TrendingUp, label: "Trending" },
            { id: "profile", icon: User, label: "Mi Perfil" },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              className={`w-full justify-start ${
                activeTab === tab.id ? "bg-green-900/30 text-green-400" : "text-gray-400 hover:text-green-400"
              }`}
              onClick={() => handleTabChange(tab.id as any)}
            >
              <tab.icon className="w-4 h-4 mr-3" />
              {tab.label}
            </Button>
          ))}
        </nav>

        <div className="mt-8 pt-8 border-t border-gray-700 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-green-400"
            onClick={() => setShowUploadForm(true)}
          >
            <Plus className="w-4 h-4 mr-3" />
            Subir Contenido
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-green-400"
            onClick={() => setShowStatsModal(true)}
          >
            <BarChart3 className="w-4 h-4 mr-3" />
            Estadísticas
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-green-400"
            onClick={() => setShowTutorialModal(true)}
          >
            <HelpCircle className="w-4 h-4 mr-3" />
            Tutorial
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-red-400"
            onClick={() => setShowAdminPanel(true)}
          >
            <Shield className="w-4 h-4 mr-3" />
            Panel Admin
          </Button>
        </div>

        {stats && (
          <div className="mt-8 pt-8 border-t border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">Estadísticas</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total elementos:</span>
                <span className="text-green-400 font-medium">{stats.totalItems}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total visitas:</span>
                <span className="text-blue-400 font-medium">{stats.totalViews}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Mis favoritos:</span>
                <span className="text-red-400 font-medium">{favorites.size}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // Navegación móvil
  const MobileNavigation = () => {
    if (!isMobile) return null

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 z-40">
        <div className="flex items-center justify-around py-2">
          {[
            { id: "home", icon: Home, label: "Inicio" },
            { id: "trending", icon: TrendingUp, label: "Trending" },
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
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2 px-4 text-gray-400"
            onClick={() => setShowSidebar(true)}
          >
            <Menu className="w-5 h-5" />
            <span className="text-xs">Más</span>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900">
      <Sidebar />

      {/* Overlay para móvil */}
      {isMobile && showSidebar && (
        <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setShowSidebar(false)} />
      )}

      {/* Contenido principal */}
      <div className={`${!isMobile ? "ml-64" : ""} ${isMobile ? "pb-16" : ""}`}>
        {/* Header */}
        <div className="sticky top-0 z-20 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              {isMobile && (
                <Button variant="ghost" size="sm" onClick={() => setShowSidebar(true)}>
                  <Menu className="w-5 h-5" />
                </Button>
              )}

              <div className="flex items-center gap-4 flex-1 max-w-2xl mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar contenido..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-400"
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUploadForm(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-black font-semibold border-none"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Subir
                </Button>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-4 flex-wrap">
              <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
                <SelectTrigger className="w-40 bg-gray-800/50 border-gray-600 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all">Todo</SelectItem>
                  <SelectItem value="images">Imágenes</SelectItem>
                  <SelectItem value="videos">Videos</SelectItem>
                  <SelectItem value="favorites">Favoritos</SelectItem>
                  <SelectItem value="my-content">Mi contenido</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-40 bg-gray-800/50 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="newest">Más reciente</SelectItem>
                  <SelectItem value="oldest">Más antiguo</SelectItem>
                  <SelectItem value="most-viewed">Más visto</SelectItem>
                  <SelectItem value="least-viewed">Menos visto</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={`${viewMode === "grid" ? "bg-green-900/30 text-green-400" : "text-gray-400"}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`${viewMode === "list" ? "bg-green-900/30 text-green-400" : "text-gray-400"}`}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchItems()
                  fetchStats()
                }}
                className="text-gray-400 hover:text-green-400"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4">
          {isLoading ? (
            <div
              className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <MediaSkeleton key={i} />
              ))}
            </div>
          ) : filteredAndSortedItems.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-gray-900/80 backdrop-blur-sm rounded-3xl p-8 max-w-md mx-auto shadow-xl border border-gray-700">
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
            <div
              className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 max-w-4xl mx-auto"}`}
            >
              {filteredAndSortedItems.map((item, index) => (
                <MediaCard key={item.id} item={item} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Componentes adicionales */}
      <MediaModal />
      <MobileNavigation />

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

      <AdminPanel isOpen={showAdminPanel} onClose={() => setShowAdminPanel(false)} />
    </div>
  )
}

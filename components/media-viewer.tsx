"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Video, ImageIcon as ImageLucide, X, Eye, BarChart3, Share2, Download, Globe, Heart, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
type FilterOption = "all" | "images" | "videos" | "my-content"
type UploadMethod = "url" | "file"

export function MediaViewer() {
  const [url, setUrl] = useState("")
  const [videoTitle, setVideoTitle] = useState("")
  const [detectedType, setDetectedType] = useState<"image" | "video" | null>(null)
  const [items, setItems] = useState<MediaItem[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [copiedStep, setCopiedStep] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [filterBy, setFilterBy] = useState<FilterOption>("all")
  const [stats, setStats] = useState<Stats | null>(null)
  const [uploadMethod, setUploadMethod] = useState<UploadMethod>("url")
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const { toast } = useToast()
  const [uploaderId, setUploaderId] = useState<string>("")

  // Al cargar el componente, obtener o generar uploaderId y favoritos
  useEffect(() => {
    let storedUploaderId = localStorage.getItem("uploader-id")
    if (!storedUploaderId) {
      storedUploaderId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem("uploader-id", storedUploaderId)
    }
    setUploaderId(storedUploaderId)

    // Cargar favoritos
    const storedFavorites = localStorage.getItem("favorites")
    if (storedFavorites) {
      setFavorites(new Set(JSON.parse(storedFavorites)))
    }
  }, [])

  // Guardar favoritos en localStorage
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(Array.from(favorites)))
  }, [favorites])

  // Cargar items del servidor
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

  // Cargar estadísticas
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

  // Función para incrementar visitas con debounce
  const incrementViews = useCallback(
    async (id: string) => {
      try {
        const response = await fetch("/api/media/views", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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
        toast({
          title: "Removido de favoritos",
          description: "El elemento fue removido de tus favoritos",
        })
      } else {
        newFavorites.add(id)
        toast({
          title: "Agregado a favoritos",
          description: "El elemento fue agregado a tus favoritos",
        })
      }
      return newFavorites
    })
  }

  // Validar URL mejorada
  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url)
      return ["http:", "https:"].includes(urlObj.protocol)
    } catch {
      return false
    }
  }

  // Detectar si la URL ya existe
  const isDuplicateUrl = (url: string): boolean => {
    return items.some((item) => item.url === url.trim())
  }

  const detectMediaType = async (url: string): Promise<"image" | "video" | null> => {
    try {
      const response = await fetch(url, { method: "HEAD" })
      const contentType = response.headers.get("content-type") || ""

      let type: "image" | "video" | null = null
      if (contentType.startsWith("image/")) type = "image"
      else if (contentType.startsWith("video/")) type = "video"
      else {
        // Fallback: detectar por extensión
        const extension = url.split(".").pop()?.toLowerCase()
        if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff"].includes(extension || "")) type = "image"
        else if (["mp4", "webm", "mov", "avi", "mkv", "flv", "wmv", "m4v"].includes(extension || "")) type = "video"
      }

      setDetectedType(type)
      return type
    } catch {
      // Si falla la detección, intentar por extensión
      const extension = url.split(".").pop()?.toLowerCase()
      let type: "image" | "video" | null = null
      if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff"].includes(extension || "")) type = "image"
      else if (["mp4", "webm", "mov", "avi", "mkv", "flv", "wmv", "m4v"].includes(extension || "")) type = "video"

      setDetectedType(type)
      return type
    }
  }

  // Detectar tipo de media cuando cambie la URL
  useEffect(() => {
    const detectTypeOnChange = async () => {
      if (url.trim() && validateUrl(url.trim())) {
        await detectMediaType(url.trim())
      } else {
        setDetectedType(null)
        setVideoTitle("")
      }
    }

    const timeoutId = setTimeout(detectTypeOnChange, 500) // Debounce
    return () => clearTimeout(timeoutId)
  }, [url])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa una URL válida",
        variant: "destructive",
      })
      return
    }

    if (!validateUrl(url.trim())) {
      toast({
        title: "Error",
        description: "La URL no es válida o no es segura",
        variant: "destructive",
      })
      return
    }

    if (isDuplicateUrl(url)) {
      toast({
        title: "Contenido duplicado",
        description: "Esta URL ya ha sido compartida anteriormente",
        variant: "destructive",
      })
      return
    }

    setIsValidating(true)

    try {
      const mediaType = await detectMediaType(url.trim())

      if (!mediaType) {
        toast({
          title: "Error",
          description: "No se pudo detectar si es imagen o video. Verifica que el enlace sea directo.",
          variant: "destructive",
        })
        return
      }

      // Validar título para videos
      if (mediaType === "video" && !videoTitle.trim()) {
        toast({
          title: "Título requerido",
          description: "Los videos requieren un título descriptivo",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-uploader-id": uploaderId,
        },
        body: JSON.stringify({
          url: url.trim(),
          type: mediaType,
          title: mediaType === "video" ? videoTitle.trim() : url.split("/").pop() || "Media",
        }),
      })

      if (!response.ok) {
        throw new Error("Error al agregar el elemento")
      }

      const result = await response.json()

      setItems((prev) => [result.item, ...prev])
      setUrl("")
      setVideoTitle("")
      setDetectedType(null)
      setShowUploadForm(false)
      fetchStats() // Actualizar estadísticas

      toast({
        title: "¡Agregado exitosamente!",
        description: `${mediaType === "video" ? "Video" : "Imagen"} compartido y visible para todos`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el elemento. Verifica la URL.",
        variant: "destructive",
      })
    } finally {
      setIsValidating(false)
    }
  }

  // Manejar subida de archivos drag & drop
  const handleFileUpload = async (files: File[]) => {
    // Esta función sería para integrar con un servicio de almacenamiento
    // Por ahora solo mostramos un mensaje
    toast({
      title: "Función en desarrollo",
      description: "La subida directa de archivos estará disponible pronto. Por ahora usa URLs.",
      variant: "destructive",
    })
  }

  const removeItem = async (id: string) => {
    try {
      const response = await fetch("/api/media", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-uploader-id": uploaderId,
        },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "No se pudo eliminar el elemento",
          variant: "destructive",
        })
        return
      }

      setItems((prev) => prev.filter((item) => item.id !== id))
      fetchStats() // Actualizar estadísticas
      toast({
        title: "Eliminado",
        description: "Elemento eliminado correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el elemento",
        variant: "destructive",
      })
    }
  }

  const shareItem = async (item: MediaItem) => {
    try {
      await navigator.share({
        title: `TusVideosCN - ${item.type === "video" ? "Video" : "Imagen"}`,
        text: `Mira este ${item.type === "video" ? "video" : "imagen"} en TusVideosCN`,
        url: item.url,
      })
    } catch (error) {
      // Fallback: copiar al portapapeles
      try {
        await navigator.clipboard.writeText(item.url)
        toast({
          title: "¡Copiado!",
          description: "Enlace copiado al portapapeles",
        })
      } catch (clipboardError) {
        toast({
          title: "Error",
          description: "No se pudo compartir el contenido",
          variant: "destructive",
        })
      }
    }
  }

  const downloadItem = (item: MediaItem) => {
    const link = document.createElement("a")
    link.href = item.url
    link.download = item.title
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const copyToClipboard = async (text: string, stepNumber: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStep(stepNumber)
      setTimeout(() => setCopiedStep(null), 2000)
      toast({
        title: "¡Copiado!",
        description: "Enlace copiado al portapapeles",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace",
        variant: "destructive",
      })
    }
  }

  // Filtrar y ordenar items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items

    // Aplicar filtros
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
    }

    // Aplicar ordenamiento
    const sorted = [...filtered].sort((a, b) => {
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

    return sorted
  }, [items, searchQuery, filterBy, sortBy, uploaderId])

  const videos = filteredAndSortedItems.filter((item) => item.type === "video")
  const images = filteredAndSortedItems.filter((item) => item.type === "image")

  const MediaCard = ({ item }: { item: MediaItem }) => (
    <Card className="group overflow-hidden border border-green-500/20 shadow-lg hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-300 bg-gray-900/90 backdrop-blur-sm hover:scale-[1.02]">
      <CardContent className="p-0">
        <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-black overflow-hidden">
          {item.type === "video" ? (
            <video
              src={item.url}
              controls
              className="w-full h-full object-cover cursor-pointer"
              preload="metadata"
              onClick={() => handleMediaClick(item)}
              onTouchStart={() => handleMediaClick(item)}
              onPlay={() => incrementViews(item.id)}
            />
          ) : (
            <div
              className="w-full h-full cursor-pointer relative group"
              onClick={() => handleMediaClick(item)}
              onTouchStart={() => handleMediaClick(item)}
            >
              <img
                src={item.url || "/placeholder.svg"}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg?height=200&width=300"
                }}
              />
              {/* Overlay en hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              variant="outline"
              size="sm"
              className="bg-black/80 backdrop-blur-sm hover:bg-red-600 border-red-500/50 text-red-400 hover:text-white transition-colors w-8 h-8 p-0"
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite(item.id)
              }}
            >
              <Heart className={`w-3 h-3 ${favorites.has(item.id) ? "fill-current text-red-400" : ""}`} />
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="bg-black/80 backdrop-blur-sm hover:bg-blue-600 border-blue-500/50 text-blue-400 hover:text-white transition-colors w-8 h-8 p-0"
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
              className="bg-black/80 backdrop-blur-sm hover:bg-purple-600 border-purple-500/50 text-purple-400 hover:text-white transition-colors w-8 h-8 p-0"
              onClick={(e) => {
                e.stopPropagation()
                downloadItem(item)
              }}
            >
              <Download className="w-3 h-3" />
            </Button>

            {item.uploaderId === uploaderId && (
              <Button
                variant="outline"
                size="sm"
                className="bg-black/80 backdrop-blur-sm hover:bg-red-600 border-red-500/50 text-red-400 hover:text-white transition-colors w-8 h-8 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  removeItem(item.id)
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>

          {/* Contador de visitas */}
          <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1 pointer-events-none">
            <Eye className="w-3 h-3 text-green-400" />
            <span className="text-xs text-green-400 font-medium">{item.views || 0}</span>
          </div>

          {/* Indicadores */}
          <div className="absolute bottom-2 right-2 flex gap-1">
            {favorites.has(item.id) && (
              <div className="bg-red-600/80 backdrop-blur-sm rounded-lg px-2 py-1">
                <Heart className="w-3 h-3 text-white fill-current" />
              </div>
            )}
            {item.uploaderId === uploaderId && (
              <div className="bg-green-600/80 backdrop-blur-sm rounded-lg px-2 py-1">
                <span className="text-xs text-white font-medium">Tuyo</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-3 sm:p-4">
          {item.type === "video" && item.title && item.title !== "Media" && (
            <h3 className="text-sm font-semibold text-green-400 mb-2 line-clamp-2 leading-tight">{item.title}</h3>
          )}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(item.addedAt).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            {item.type === "video" && (
              <div className="flex items-center gap-1 text-xs text-orange-400">
                <Video className="w-3 h-3" />
                <span>Video</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Skeleton loading mejorado
  const SkeletonCard = () => (
    <Card className="overflow-hidden border border-green-500/20 bg-gray-900/90">
      <CardContent className="p-0">
        <Skeleton className="aspect-video w-full" />
        <div className="p-3 sm:p-4 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </CardContent>
    </Card>
  )

  // Modal para ver media en pantalla completa (mejorado)
  const MediaModal = () => {
    if (!selectedMedia) return null

    return (
      <div
        className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
        onClick={() => setSelectedMedia(null)}
      >
        <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
          <Button
            variant="outline"
            size="sm"
            className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/80 backdrop-blur-sm hover:bg-red-600 border-red-500/50 text-red-400 hover:text-white transition-colors z-10 w-10 h-10 p-0 sm:w-auto sm:h-auto sm:p-2"
            onClick={() => setSelectedMedia(null)}
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>

          {selectedMedia.type === "video" ? (
            <video
              src={selectedMedia.url}
              controls
              autoPlay
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={selectedMedia.url || "/placeholder.svg"}
              alt={selectedMedia.title}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          )}

          <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 sm:p-4">
            {selectedMedia.type === "video" && selectedMedia.title && selectedMedia.title !== "Media" && (
              <h3 className="text-lg font-semibold text-green-400 mb-2">{selectedMedia.title}</h3>
            )}
            <div className="flex items-center justify-between">
              <p className="text-gray-500 text-xs flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {new Date(selectedMedia.addedAt).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400 font-medium">{selectedMedia.views || 0} visitas</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleFavorite(selectedMedia.id)}
                    className={`bg-black/50 border-red-500/50 hover:bg-red-600 ${
                      favorites.has(selectedMedia.id) ? "text-red-400 bg-red-900/30" : "text-red-400"
                    }`}
                  >
                    <Heart className={`w-4 h-4 mr-1 ${favorites.has(selectedMedia.id) ? "fill-current" : ""}`} />
                    {favorites.has(selectedMedia.id) ? "Favorito" : "Favorito"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareItem(selectedMedia)}
                    className="bg-black/50 border-blue-500/50 text-blue-400 hover:bg-blue-600"
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Compartir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadItem(selectedMedia)}
                    className="bg-black/50 border-purple-500/50 text-purple-400 hover:bg-purple-600"
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

  // Modal de estadísticas (mantenido igual)
  const StatsModal = () => {
    if (!showStats || !stats) return null

    return (
      <div
        className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => setShowStats(false)}
      >
        <div
          className="bg-gray-900/95 backdrop-blur-sm rounded-2xl border border-green-500/30 max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-green-400 flex items-center gap-2">
                <BarChart3 className="w-8 h-8" />
                Estadísticas de TusVideosCN
              </h2>
              <Button
                variant="outline"
                size="sm"
                className="bg-black/80 backdrop-blur-sm hover:bg-red-600 border-red-500/50 text-red-400 hover:text-white transition-colors"
                onClick={() => setShowStats(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 border-green-500/30">
                <CardContent className="p-4 text-center">
                  <Globe className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-400">{stats.totalItems}</div>
                  <div className="text-sm text-gray-400">Total Elementos</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border-blue-500/30">
                <CardContent className="p-4 text-center">
                  <Eye className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-400">{stats.totalViews}</div>
                  <div className="text-sm text-gray-400">Total Visitas</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-purple-500/30">
                <CardContent className="p-4 text-center">
                  <ImageLucide className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-400">{stats.totalImages}</div>
                  <div className="text-sm text-gray-400">Imágenes</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-900/50 to-red-900/50 border-orange-500/30">
                <CardContent className="p-4 text-center">
                  <Video className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-400">{stats.totalVideos}</div>
                  <div className="text-sm text-gray-400">Videos</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredAndSortedItems.map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <MediaModal />
      <StatsModal />
    </div>
  )
}

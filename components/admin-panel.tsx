"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Shield,
  Trash2,
  Eye,
  Video,
  ImageIcon,
  AlertTriangle,
  Crown,
  X,
  RefreshCw,
  Search,
  Calendar,
  User,
} from "lucide-react"
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

interface AdminPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminCode, setAdminCode] = useState("")
  const [items, setItems] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const { toast } = useToast()

  // Verificar si ya es admin al abrir
  useEffect(() => {
    if (isOpen) {
      const adminStatus = localStorage.getItem("admin-status")
      if (adminStatus === "true") {
        setIsAdmin(true)
        fetchAllItems()
      }
    }
  }, [isOpen])

  // Verificar código de admin
  const verifyAdminCode = () => {
    if (adminCode === "2269") {
      setIsAdmin(true)
      localStorage.setItem("admin-status", "true")
      fetchAllItems()
      toast({
        title: "¡Acceso de administrador concedido!",
        description: "Ahora puedes gestionar todo el contenido de la plataforma",
      })
      setAdminCode("")
    } else {
      toast({
        title: "Código incorrecto",
        description: "El código de administrador no es válido",
        variant: "destructive",
      })
      setAdminCode("")
    }
  }

  // Cargar todos los elementos
  const fetchAllItems = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/media", {
        headers: {
          "x-admin-code": "2269",
        },
      })
      const data = await response.json()
      setItems(data.items || [])
    } catch (error) {
      console.error("Error loading admin items:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los elementos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Eliminar elemento como admin
  const deleteItem = async (id: string) => {
    try {
      const response = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-code": "2269",
        },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        throw new Error("Error al eliminar elemento")
      }

      setItems((prev) => prev.filter((item) => item.id !== id))
      setDeleteConfirm(null)
      toast({
        title: "Elemento eliminado",
        description: "El contenido ha sido eliminado permanentemente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el elemento",
        variant: "destructive",
      })
    }
  }

  // Limpiar toda la base de datos
  const clearAllData = async () => {
    try {
      const response = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-code": "2269",
        },
        body: JSON.stringify({ clearAll: true }),
      })

      if (!response.ok) {
        throw new Error("Error al limpiar base de datos")
      }

      setItems([])
      setDeleteConfirm(null)
      toast({
        title: "Base de datos limpiada",
        description: "Todo el contenido ha sido eliminado",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo limpiar la base de datos",
        variant: "destructive",
      })
    }
  }

  // Cerrar sesión de admin
  const logoutAdmin = () => {
    setIsAdmin(false)
    localStorage.removeItem("admin-status")
    setItems([])
    toast({
      title: "Sesión de administrador cerrada",
      description: "Has salido del panel de administración",
    })
  }

  // Filtrar elementos
  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.uploaderId.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden bg-gray-900/95 border-red-500/30 shadow-2xl">
        <CardHeader className="pb-4 border-b border-red-500/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-red-400 flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Panel de Administración
              {isAdmin && <Crown className="w-5 h-5 text-yellow-400" />}
            </CardTitle>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logoutAdmin}
                  className="border-red-500/50 text-red-400 hover:bg-red-900/30 bg-transparent"
                >
                  Cerrar Sesión
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {!isAdmin ? (
            // Formulario de autenticación
            <div className="max-w-md mx-auto text-center">
              <div className="bg-red-900/20 border border-red-500/30 rounded-full p-6 w-24 h-24 mx-auto mb-6">
                <Shield className="w-12 h-12 text-red-400 mx-auto" />
              </div>

              <h3 className="text-xl font-bold text-red-400 mb-3">Acceso Restringido</h3>
              <p className="text-gray-400 mb-6">Ingresa el código de administrador para continuar</p>

              <div className="space-y-4">
                <Input
                  type="password"
                  placeholder="Código de administrador"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  className="text-center text-lg font-mono bg-gray-800/50 border-red-500/30 text-red-400 placeholder-gray-500 focus:border-red-400"
                  onKeyPress={(e) => e.key === "Enter" && verifyAdminCode()}
                />

                <Button
                  onClick={verifyAdminCode}
                  disabled={!adminCode}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Verificar Código
                </Button>
              </div>

              <Alert className="mt-6 border-yellow-500/30 bg-yellow-900/20">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-400">
                  Solo los administradores autorizados pueden acceder a este panel
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            // Panel de administración
            <div className="space-y-6">
              {/* Header con estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 border-blue-500/30">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400">{items.length}</div>
                    <div className="text-sm text-blue-300">Total Elementos</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 border-purple-500/30">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {items.filter((item) => item.type === "image").length}
                    </div>
                    <div className="text-sm text-purple-300">Imágenes</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-900/50 to-orange-800/50 border-orange-500/30">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-400">
                      {items.filter((item) => item.type === "video").length}
                    </div>
                    <div className="text-sm text-orange-300">Videos</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-900/50 to-green-800/50 border-green-500/30">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {items.reduce((sum, item) => sum + (item.views || 0), 0)}
                    </div>
                    <div className="text-sm text-green-300">Total Visitas</div>
                  </CardContent>
                </Card>
              </div>

              {/* Controles */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar por título, URL o usuario..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-400"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchAllItems}
                    disabled={isLoading}
                    className="border-blue-500/50 text-blue-400 hover:bg-blue-900/30 bg-transparent"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                    Actualizar
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-500/50 text-red-400 hover:bg-red-900/30 bg-transparent"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Limpiar Todo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-red-500/30">
                      <DialogHeader>
                        <DialogTitle className="text-red-400">¿Eliminar todo el contenido?</DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Esta acción eliminará permanentemente todos los elementos de la base de datos. No se puede
                          deshacer.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                          Cancelar
                        </Button>
                        <Button variant="destructive" onClick={clearAllData} className="bg-red-600 hover:bg-red-700">
                          Eliminar Todo
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Lista de elementos */}
              <div className="border border-gray-700 rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  {isLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-400 border-t-transparent mx-auto mb-4"></div>
                      <p className="text-gray-400">Cargando elementos...</p>
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-gray-400">
                        {searchQuery ? "No se encontraron elementos" : "No hay elementos en la base de datos"}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-700">
                      {filteredItems.map((item) => (
                        <div key={item.id} className="p-4 hover:bg-gray-800/50 transition-colors">
                          <div className="flex items-center gap-4">
                            {/* Thumbnail */}
                            <div className="flex-shrink-0 w-16 h-16 bg-gray-800 rounded-lg overflow-hidden">
                              {item.type === "video" ? (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Video className="w-6 h-6 text-orange-400" />
                                </div>
                              ) : (
                                <img
                                  src={item.url || "/placeholder.svg"}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = "none"
                                    target.parentElement!.innerHTML = `
                                      <div class="w-full h-full flex items-center justify-center">
                                        <svg class="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                        </svg>
                                      </div>
                                    `
                                  }}
                                />
                              )}
                            </div>

                            {/* Información */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge
                                  variant="outline"
                                  className={`${
                                    item.type === "video"
                                      ? "border-orange-500/50 text-orange-400"
                                      : "border-purple-500/50 text-purple-400"
                                  }`}
                                >
                                  {item.type === "video" ? (
                                    <Video className="w-3 h-3 mr-1" />
                                  ) : (
                                    <ImageIcon className="w-3 h-3 mr-1" />
                                  )}
                                  {item.type}
                                </Badge>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Eye className="w-3 h-3" />
                                  {item.views || 0}
                                </div>
                              </div>

                              <h4 className="font-medium text-white truncate mb-1">{item.title || "Sin título"}</h4>

                              <div className="flex items-center gap-4 text-xs text-gray-400">
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  <span className="truncate max-w-32">{item.uploaderId}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    {new Date(item.addedAt).toLocaleDateString("es-ES", {
                                      day: "numeric",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </div>

                              <p className="text-xs text-gray-500 truncate mt-1">{item.url}</p>
                            </div>

                            {/* Acciones */}
                            <div className="flex-shrink-0">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-red-500/50 text-red-400 hover:bg-red-900/30 bg-transparent"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-gray-900 border-red-500/30">
                                  <DialogHeader>
                                    <DialogTitle className="text-red-400">¿Eliminar este elemento?</DialogTitle>
                                    <DialogDescription className="text-gray-400">
                                      Esta acción eliminará permanentemente "{item.title || "Sin título"}" de la
                                      plataforma.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button variant="outline">Cancelar</Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => deleteItem(item.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Eliminar
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

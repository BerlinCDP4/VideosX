"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, BarChart3, Eye, ImageIcon, Video, TrendingUp, Users, Globe, Clock } from "lucide-react"

interface Stats {
  totalItems: number
  totalViews: number
  totalImages: number
  totalVideos: number
  trending: Array<{
    id: string
    url: string
    type: "image" | "video"
    title: string
    views: number
    addedAt: string
  }>
}

interface StatsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function StatsModal({ isOpen, onClose }: StatsModalProps) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchStats()
    }
  }, [isOpen])

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/media/stats")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Error loading stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900/95 backdrop-blur-sm rounded-2xl border border-green-500/30 max-w-4xl max-h-[90vh] overflow-y-auto w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-green-400 flex items-center gap-2">
              <BarChart3 className="w-8 h-8" />
              Estadísticas de TusVideosCN
            </h2>
            <Button
              variant="outline"
              size="sm"
              className="bg-black/80 backdrop-blur-sm hover:bg-red-600 border-red-500/50 text-red-400 hover:text-white transition-colors"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-green-400 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-400">Cargando estadísticas...</p>
            </div>
          ) : stats ? (
            <>
              {/* Estadísticas generales */}
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
                    <ImageIcon className="w-8 h-8 text-purple-400 mx-auto mb-2" />
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

              {/* Contenido trending */}
              {stats.trending.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6" />
                    Contenido Trending
                  </h3>
                  <div className="grid gap-4">
                    {stats.trending.map((item, index) => (
                      <Card key={item.id} className="bg-gray-800/50 border-green-500/20">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-500 rounded-full flex items-center justify-center text-black font-bold text-lg">
                              #{index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {item.type === "video" ? (
                                  <Video className="w-4 h-4 text-orange-400" />
                                ) : (
                                  <ImageIcon className="w-4 h-4 text-purple-400" />
                                )}
                                <h4 className="font-semibold text-green-400 truncate">{item.title || "Sin título"}</h4>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  <span>{item.views} visitas</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {new Date(item.addedAt).toLocaleDateString("es-ES", {
                                      day: "numeric",
                                      month: "short",
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Información adicional */}
              <div className="mt-8 pt-6 border-t border-gray-700">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div>
                    <Users className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <div className="text-sm text-gray-400">Usuarios activos</div>
                    <div className="text-lg font-semibold text-green-400">{Math.floor(stats.totalItems / 3) || 1}+</div>
                  </div>
                  <div>
                    <Globe className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <div className="text-sm text-gray-400">Contenido público</div>
                    <div className="text-lg font-semibold text-blue-400">100%</div>
                  </div>
                  <div>
                    <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <div className="text-sm text-gray-400">Crecimiento</div>
                    <div className="text-lg font-semibold text-purple-400">+{stats.totalItems}</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No se pudieron cargar las estadísticas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

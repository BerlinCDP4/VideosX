"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { X, Upload, Link, FileVideo, ImageIcon, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UploadFormProps {
  onClose: () => void
  onSuccess: () => void
}

export function UploadForm({ onClose, onSuccess }: UploadFormProps) {
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [detectedType, setDetectedType] = useState<"image" | "video" | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [validationError, setValidationError] = useState("")
  const { toast } = useToast()

  // Validar URL
  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url)
      return ["http:", "https:"].includes(urlObj.protocol)
    } catch {
      return false
    }
  }

  // Detectar tipo de media
  const detectMediaType = async (url: string): Promise<"image" | "video" | null> => {
    try {
      setIsValidating(true)
      setValidationError("")

      // Primero intentar por extensión
      const extension = url.split(".").pop()?.toLowerCase()
      if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff"].includes(extension || "")) {
        setDetectedType("image")
        return "image"
      }
      if (["mp4", "webm", "mov", "avi", "mkv", "flv", "wmv", "m4v"].includes(extension || "")) {
        setDetectedType("video")
        return "video"
      }

      // Intentar con HEAD request
      const response = await fetch(url, { method: "HEAD" })
      const contentType = response.headers.get("content-type") || ""

      let type: "image" | "video" | null = null
      if (contentType.startsWith("image/")) {
        type = "image"
      } else if (contentType.startsWith("video/")) {
        type = "video"
      }

      setDetectedType(type)
      return type
    } catch (error) {
      setValidationError("No se pudo verificar la URL. Asegúrate de que sea accesible.")
      return null
    } finally {
      setIsValidating(false)
    }
  }

  // Manejar cambio de URL
  const handleUrlChange = async (newUrl: string) => {
    setUrl(newUrl)
    setDetectedType(null)
    setValidationError("")

    if (newUrl.trim() && validateUrl(newUrl.trim())) {
      await detectMediaType(newUrl.trim())
    }
  }

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) {
      setValidationError("Por favor ingresa una URL válida")
      return
    }

    if (!validateUrl(url.trim())) {
      setValidationError("La URL no es válida")
      return
    }

    if (!detectedType) {
      setValidationError("No se pudo detectar si es imagen o video")
      return
    }

    if (detectedType === "video" && !title.trim()) {
      setValidationError("Los videos requieren un título")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Simular progreso de subida
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const uploaderId = localStorage.getItem("uploader-id") || ""
      const response = await fetch("/api/media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-uploader-id": uploaderId,
        },
        body: JSON.stringify({
          url: url.trim(),
          type: detectedType,
          title: detectedType === "video" ? title.trim() : title.trim() || url.split("/").pop() || "Media",
          description: description.trim(),
        }),
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al subir contenido")
      }

      toast({
        title: "¡Contenido subido!",
        description: `${detectedType === "video" ? "Video" : "Imagen"} compartido exitosamente`,
      })

      onSuccess()
      onClose()
    } catch (error) {
      toast({
        title: "Error al subir",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900/95 border-green-500/30 shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-green-400 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Subir Contenido
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* URL Input */}
            <div className="space-y-2">
              <Label htmlFor="url" className="text-sm font-medium text-gray-300">
                URL del contenido *
              </Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="url"
                  type="url"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-400"
                  disabled={isUploading}
                />
                {isValidating && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-400 border-t-transparent"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Tipo detectado */}
            {detectedType && (
              <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                {detectedType === "video" ? (
                  <FileVideo className="w-5 h-5 text-orange-400" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-purple-400" />
                )}
                <span className="text-sm text-green-400 font-medium">
                  {detectedType === "video" ? "Video detectado" : "Imagen detectada"}
                </span>
                <CheckCircle className="w-4 h-4 text-green-400 ml-auto" />
              </div>
            )}

            {/* Título */}
            {detectedType === "video" && (
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-gray-300">
                  Título del video *
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Describe tu video..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-400"
                  disabled={isUploading}
                  maxLength={100}
                />
              </div>
            )}

            {detectedType === "image" && (
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-gray-300">
                  Título (opcional)
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Título de la imagen..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-400"
                  disabled={isUploading}
                  maxLength={100}
                />
              </div>
            )}

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-300">
                Descripción (opcional)
              </Label>
              <Textarea
                id="description"
                placeholder="Agrega una descripción..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-400 resize-none"
                disabled={isUploading}
                rows={3}
                maxLength={500}
              />
              <div className="text-xs text-gray-500 text-right">{description.length}/500</div>
            </div>

            {/* Error */}
            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {/* Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Subiendo contenido...</span>
                  <span className="text-green-400">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isUploading}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!detectedType || isUploading || (detectedType === "video" && !title.trim())}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-black font-semibold"
              >
                {isUploading ? "Subiendo..." : "Subir"}
              </Button>
            </div>
          </form>

          {/* Ayuda */}
          <div className="pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-500 mb-2">💡 Consejos:</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Usa URLs directas a archivos (terminan en .jpg, .mp4, etc.)</li>
              <li>• Asegúrate de que la URL sea pública y accesible</li>
              <li>• Los videos requieren un título descriptivo</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

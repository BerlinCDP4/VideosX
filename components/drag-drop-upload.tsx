"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, FileImage, FileVideo, X, Check, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DragDropUploadProps {
  onUpload: (files: File[]) => Promise<void>
  accept?: Record<string, string[]>
  maxSize?: number
  maxFiles?: number
}

interface FileWithPreview extends File {
  preview?: string
  progress?: number
  status?: "uploading" | "success" | "error"
  error?: string
}

export function DragDropUpload({
  onUpload,
  accept = {
    "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
    "video/*": [".mp4", ".webm", ".mov", ".avi", ".mkv"],
  },
  maxSize = 100 * 1024 * 1024, // 100MB
  maxFiles = 5,
}: DragDropUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        const errors = rejectedFiles.map((file) => file.errors[0]?.message).join(", ")
        toast({
          title: "Archivos rechazados",
          description: errors,
          variant: "destructive",
        })
      }

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
          progress: 0,
          status: "uploading" as const,
        }),
      )

      setFiles((prev) => [...prev, ...newFiles])
    },
    [toast],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
    multiple: true,
  })

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!)
      }
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    try {
      // Simular progreso de subida
      for (let i = 0; i < files.length; i++) {
        setFiles((prev) => {
          const newFiles = [...prev]
          newFiles[i] = { ...newFiles[i], progress: 0, status: "uploading" }
          return newFiles
        })

        // Simular progreso
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          setFiles((prev) => {
            const newFiles = [...prev]
            newFiles[i] = { ...newFiles[i], progress }
            return newFiles
          })
        }

        setFiles((prev) => {
          const newFiles = [...prev]
          newFiles[i] = { ...newFiles[i], status: "success" }
          return newFiles
        })
      }

      await onUpload(files)

      // Limpiar archivos después de subir exitosamente
      setTimeout(() => {
        setFiles([])
      }, 2000)

      toast({
        title: "¡Subida exitosa!",
        description: `${files.length} archivo(s) subido(s) correctamente`,
      })
    } catch (error) {
      setFiles((prev) =>
        prev.map((file) => ({
          ...file,
          status: "error" as const,
          error: "Error al subir archivo",
        })),
      )
      toast({
        title: "Error en la subida",
        description: "Algunos archivos no se pudieron subir",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <Card className="border-2 border-dashed border-green-500/30 bg-gray-900/50 hover:bg-gray-900/70 transition-colors">
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={`text-center cursor-pointer transition-colors ${
              isDragActive ? "text-green-400" : "text-gray-400"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center space-y-4">
              <div
                className={`p-4 rounded-full transition-colors ${
                  isDragActive ? "bg-green-500/20 text-green-400" : "bg-gray-800 text-gray-400"
                }`}
              >
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="text-lg font-semibold mb-2">
                  {isDragActive ? "¡Suelta los archivos aquí!" : "Arrastra archivos aquí"}
                </p>
                <p className="text-sm text-gray-500 mb-4">o haz clic para seleccionar archivos</p>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>
                    Máximo {maxFiles} archivos • Hasta {formatFileSize(maxSize)} cada uno
                  </p>
                  <p>Formatos: JPG, PNG, GIF, WebP, SVG, MP4, WebM, MOV, AVI, MKV</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-green-400">Archivos seleccionados ({files.length})</h3>
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={isUploading || files.every((f) => f.status === "success")}
                className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-black font-semibold"
              >
                {isUploading ? "Subiendo..." : "Subir archivos"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setFiles([])}
                disabled={isUploading}
                className="border-red-500/30 text-red-400 hover:bg-red-900/30"
              >
                Limpiar todo
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {files.map((file, index) => (
              <Card key={index} className="bg-gray-900/50 border-green-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    {/* Preview */}
                    <div className="flex-shrink-0">
                      {file.preview ? (
                        <img
                          src={file.preview || "/placeholder.svg"}
                          alt={file.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center">
                          {file.type.startsWith("video/") ? (
                            <FileVideo className="w-8 h-8 text-orange-400" />
                          ) : (
                            <FileImage className="w-8 h-8 text-purple-400" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-green-400 truncate">{file.name}</p>
                        <div className="flex items-center space-x-2">
                          {file.status === "success" && <Check className="w-4 h-4 text-green-400" />}
                          {file.status === "error" && <AlertCircle className="w-4 h-4 text-red-400" />}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            disabled={isUploading}
                            className="w-6 h-6 p-0 hover:bg-red-900/30"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        {formatFileSize(file.size)} • {file.type}
                      </p>

                      {/* Progress Bar */}
                      {file.status === "uploading" && <Progress value={file.progress} className="h-2" />}

                      {file.status === "error" && <p className="text-xs text-red-400">{file.error}</p>}

                      {file.status === "success" && <p className="text-xs text-green-400">✓ Subido exitosamente</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

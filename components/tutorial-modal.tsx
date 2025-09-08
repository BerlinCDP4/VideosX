"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, HelpCircle, Upload, Link, Heart, Share2, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TutorialModalProps {
  isOpen: boolean
  onClose: () => void
}

const tutorialSteps = [
  {
    title: "¡Bienvenido a TusVideosCN!",
    content: "La plataforma más fácil para compartir imágenes y videos al instante.",
    icon: Upload,
    color: "text-green-400",
  },
  {
    title: "Cómo subir contenido",
    content: "Toca el botón '+' en la navegación inferior, pega la URL de tu imagen o video, y ¡listo!",
    icon: Link,
    color: "text-blue-400",
  },
  {
    title: "Gestos táctiles",
    content: "Desliza ← para favoritos, → para compartir, ↑↓ para navegar entre contenido.",
    icon: Heart,
    color: "text-red-400",
  },
  {
    title: "Servicios recomendados",
    content: "Usa videy.co para videos y catbox.moe para imágenes. ¡Son gratuitos y rápidos!",
    icon: Share2,
    color: "text-purple-400",
  },
]

export function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const { toast } = useToast()

  if (!isOpen) return null

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onClose()
      toast({
        title: "¡Tutorial completado!",
        description: "Ya estás listo para usar TusVideosCN",
      })
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
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

  const step = tutorialSteps[currentStep]

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-gray-900/95 border-green-500/30 shadow-2xl">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-bold text-green-400">Tutorial</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">
                Paso {currentStep + 1} de {tutorialSteps.length}
              </span>
              <Badge variant="outline" className="border-green-500/30 text-green-400">
                {Math.round(((currentStep + 1) / tutorialSteps.length) * 100)}%
              </Badge>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-600 to-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <div className={`inline-flex p-4 rounded-full bg-gray-800/50 mb-4 ${step.color}`}>
              <step.icon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
            <p className="text-gray-300 leading-relaxed">{step.content}</p>

            {/* Contenido específico por paso */}
            {currentStep === 1 && (
              <div className="mt-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                <h4 className="text-sm font-semibold text-green-400 mb-3">Ejemplo de URL válida:</h4>
                <div className="text-xs text-gray-400 font-mono bg-black/50 p-2 rounded border">
                  https://ejemplo.com/imagen.jpg
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-3 bg-red-900/20 rounded-lg border border-red-500/30">
                  <Heart className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <div className="text-xs text-red-400">Desliza ←</div>
                  <div className="text-xs text-gray-400">Favoritos</div>
                </div>
                <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
                  <Share2 className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-xs text-blue-400">Desliza →</div>
                  <div className="text-xs text-gray-400">Compartir</div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
                  <h4 className="text-sm font-semibold text-purple-400 mb-2">📹 Para Videos:</h4>
                  <div className="flex items-center justify-between bg-black/50 p-2 rounded text-xs">
                    <span className="text-gray-300">videy.co</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard("https://videy.co")}
                      className="h-6 px-2 text-purple-400 hover:text-purple-300"
                    >
                      Copiar
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-orange-900/20 rounded-lg border border-orange-500/30">
                  <h4 className="text-sm font-semibold text-orange-400 mb-2">🖼️ Para Imágenes:</h4>
                  <div className="flex items-center justify-between bg-black/50 p-2 rounded text-xs">
                    <span className="text-gray-300">catbox.moe</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard("https://catbox.moe")}
                      className="h-6 px-2 text-orange-400 hover:text-orange-300"
                    >
                      Copiar
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mt-4">
                  💡 Estos servicios te dan URLs directas que funcionan perfectamente con TusVideosCN
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="border-gray-600 text-gray-300 hover:bg-gray-800 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>

            <div className="flex gap-2">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? "bg-green-400" : "bg-gray-600"
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={nextStep}
              className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-black font-semibold"
            >
              {currentStep === tutorialSteps.length - 1 ? "Finalizar" : "Siguiente"}
              {currentStep !== tutorialSteps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Github, Twitter, Mail, Heart, Shield, FileText, HelpCircle, Zap, Users, Globe } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-20 border-t border-green-500/20 bg-black/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-green-600 to-emerald-500 rounded-lg">
                <Zap className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                TusVideosCN
              </h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              La plataforma más rápida y fácil para compartir contenido multimedia. Comparte imágenes y videos al
              instante con la comunidad.
            </p>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Users className="w-4 h-4" />
              <span>Más de 1000+ archivos compartidos</span>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-green-400">Características</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                <span>Subida instantánea</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                <span>Sin límites de almacenamiento</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                <span>Compartir global</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                <span>Estadísticas en tiempo real</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                <span>Interfaz responsive</span>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-green-400">Soporte</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-gray-400 hover:text-green-400">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Centro de ayuda
                </Button>
              </li>
              <li>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-gray-400 hover:text-green-400">
                  <FileText className="w-4 h-4 mr-2" />
                  Términos de servicio
                </Button>
              </li>
              <li>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-gray-400 hover:text-green-400">
                  <Shield className="w-4 h-4 mr-2" />
                  Política de privacidad
                </Button>
              </li>
              <li>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-gray-400 hover:text-green-400">
                  <Mail className="w-4 h-4 mr-2" />
                  Contacto
                </Button>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-green-400">Conecta</h4>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="sm"
                className="w-10 h-10 p-0 border-green-500/30 hover:bg-green-900/30 hover:border-green-400"
              >
                <Github className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-10 h-10 p-0 border-blue-500/30 hover:bg-blue-900/30 hover:border-blue-400"
              >
                <Twitter className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-10 h-10 p-0 border-purple-500/30 hover:bg-purple-900/30 hover:border-purple-400"
              >
                <Mail className="w-4 h-4" />
              </Button>
            </div>

            <Card className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/30">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Globe className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">Estado del servicio</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-400">Todos los sistemas operativos</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-green-500/20">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>© {currentYear} TusVideosCN.</span>
              <span>Hecho con</span>
              <Heart className="w-4 h-4 text-red-400 animate-pulse" />
              <span>para la comunidad</span>
            </div>

            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>Powered by Vercel</span>
              <span>•</span>
              <span>Next.js 15</span>
              <span>•</span>
              <span>v2.1.0</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

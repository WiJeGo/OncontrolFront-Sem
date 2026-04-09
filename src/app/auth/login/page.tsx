"use client"

import type React from "react"

import { useState } from "react"
import { OnControlLogo } from "@/components/oncontrol-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Mail, Lock, Heart, Shield, Users } from "lucide-react"
import Link from "next/link"
import { useAuthContext } from "@/contexts/auth-context"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuthContext()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    if (!email || !password) {
      setError("Por favor ingresa tu email y contraseña")
      setIsSubmitting(false)
      return
    }

    try {
      // El backend determinará automáticamente el rol del usuario
      await login({
        email,
        password,
      })
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Check if it's a network error
        if ('isNetworkError' in error && error.isNetworkError) {
          setError("No se pudo conectar al servidor. Por favor verifica tu conexión a internet y que el servidor esté disponible.")
        } else {
          setError(error.message || "Error al iniciar sesión. Verifica tus credenciales.")
        }
      } else {
        setError("Error al iniciar sesión. Verifica tus credenciales.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Mitad izquierda - Diseño visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-secondary/80 relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Patrón de fondo */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Contenido visual */}
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <svg
                  className="text-4xl text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="2em"
                  height="2em"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <span className="text-4xl font-bold">
                <span className="text-white">ONCO</span>
                <span className="text-white/90">NTROL</span>
              </span>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Bienvenido de vuelta
          </h1>
          <p className="text-xl text-white/90 mb-12">
            Accede a tu plataforma de gestión oncológica
          </p>

          {/* Características */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Heart className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Atención Personalizada</h3>
                <p className="text-white/80">Cuidado integral para cada paciente</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Seguridad Garantizada</h3>
                <p className="text-white/80">Tus datos están protegidos y seguros</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Comunicación Eficiente</h3>
                <p className="text-white/80">Conecta con tu equipo médico</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formas flotantes decorativas */}
        <div className="absolute top-10 right-10 w-32 h-32 border-2 border-white/20 rounded-full"></div>
        <div className="absolute bottom-32 left-16 w-24 h-24 border-2 border-white/20 rounded-full"></div>
        <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-white/10 rounded-full"></div>
      </div>

      {/* Mitad derecha - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Logo móvil */}
          <div className="lg:hidden text-center mb-8">
            <OnControlLogo size="lg" className="justify-center mb-4" />
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Iniciar Sesión</h2>
            <p className="text-muted-foreground">Ingresa tus credenciales para continuar</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 pr-11 h-12"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm cursor-pointer">
                  Recordarme
                </Label>
              </div>
              <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline font-medium">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity text-white" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              ¿No tienes una cuenta?{" "}
              <Link href="/auth/register" className="text-primary hover:underline font-semibold">
                Regístrate aquí
              </Link>
            </p>
          </div>

          <div className="mt-8 text-center text-xs text-muted-foreground">
            <p>Al iniciar sesión, aceptas nuestros</p>
            <div className="space-x-2 mt-1">
              <Link href="#" className="hover:underline">
                Términos de Servicio
              </Link>
              <span>y</span>
              <Link href="#" className="hover:underline">
                Política de Privacidad
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

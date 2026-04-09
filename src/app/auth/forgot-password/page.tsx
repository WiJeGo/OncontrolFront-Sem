"use client"

import type React from "react"

import { useState } from "react"
import { OnControlLogo } from "@/components/oncontrol-logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Mail, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!email) {
      setError("Por favor ingresa tu correo electrónico")
      setIsLoading(false)
      return
    }

    // Simulate password reset request
    setTimeout(() => {
      setIsSuccess(true)
      setIsLoading(false)
    }, 1000)
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <OnControlLogo size="lg" className="justify-center mb-4" />
          </div>

          <Card className="oncontrol-shadow">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Correo enviado</h2>
                <p className="text-muted-foreground">
                  Hemos enviado un enlace de recuperación a <strong>{email}</strong>. Revisa tu bandeja de entrada y
                  sigue las instrucciones.
                </p>
                <div className="space-y-2 pt-4">
                  <Button asChild className="w-full">
                    <Link href="/auth/login">Volver al inicio de sesión</Link>
                  </Button>
                  <Button variant="outline" onClick={() => setIsSuccess(false)} className="w-full">
                    Enviar a otro correo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/auth/login" className="inline-block">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio de sesión
            </Button>
          </Link>
          <OnControlLogo size="lg" className="justify-center mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Recuperar Contraseña</h1>
          <p className="text-muted-foreground">Te enviaremos un enlace para restablecer tu contraseña</p>
        </div>

        <Card className="oncontrol-shadow">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Recuperación de cuenta</CardTitle>
            <CardDescription>Ingresa tu correo electrónico para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full oncontrol-gradient text-white" disabled={isLoading}>
                {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                ¿Recordaste tu contraseña?{" "}
                <Link href="/auth/login" className="text-primary hover:underline font-medium">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
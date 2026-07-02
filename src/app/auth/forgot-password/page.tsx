import { OnControlLogo } from "@/components/oncontrol-logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Building2, Stethoscope, UserRound } from "lucide-react"
import Link from "next/link"

/**
 * OnControl accounts are provisioned by the care team (doctors create patient
 * accounts; organizations create doctor accounts) and there is no self-service
 * email reset. This page explains how to actually recover access instead of
 * pretending to send a reset email (the previous version faked a success
 * message with a setTimeout and no backend call).
 */
export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-chart-2/5 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/auth/login" className="inline-block">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio de sesión
            </Button>
          </Link>
          <OnControlLogo size="lg" className="mb-4 justify-center" />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Recuperar acceso</h1>
        </div>

        <Card className="rounded-2xl border border-border bg-card shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">¿Olvidaste tu contraseña?</CardTitle>
            <CardDescription>
              En OnControl las cuentas las gestiona tu equipo de salud, así que el
              restablecimiento se hace con ellos directamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <UserRound className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">¿Eres paciente?</p>
                <p className="text-sm text-muted-foreground">
                  Contacta a tu médico tratante: él puede restablecer tu acceso.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
              <div className="rounded-lg bg-chart-2/10 p-2">
                <Stethoscope className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">¿Eres médico?</p>
                <p className="text-sm text-muted-foreground">
                  Comunícate con el administrador de tu organización.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
              <div className="rounded-lg bg-chart-5/10 p-2">
                <Building2 className="h-5 w-5 text-chart-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">¿Eres una organización?</p>
                <p className="text-sm text-muted-foreground">
                  Escríbenos a{" "}
                  <a href="mailto:soporte@oncontrol.app" className="font-medium text-primary hover:underline">
                    soporte@oncontrol.app
                  </a>
                  .
                </p>
              </div>
            </div>

            <div className="pt-2 text-center">
              <p className="text-sm text-muted-foreground">
                ¿Recordaste tu contraseña?{" "}
                <Link href="/auth/login" className="font-medium text-primary hover:underline">
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

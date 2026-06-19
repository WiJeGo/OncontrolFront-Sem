"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import { usePatientDashboard } from "@/hooks/use-patients"
import { isPatientUser } from "@/types/organization"
import { 
  Plus, 
  Calendar, 
  Activity, 
  Heart, 
  Clock,
  AlertTriangle,
  Stethoscope,
  Pill,
  CheckCircle
} from "lucide-react"

export default function PacienteDashboard() {
  const { user } = useAuthContext()
  const [patientProfileId, setPatientProfileId] = useState<number | null>(null)
  const [nextMedication, setNextMedication] = useState<{name: string, time: string, timeLeft: string} | null>(null)

  useEffect(() => {
    if (user && isPatientUser(user)) {
      setPatientProfileId(user.profile.id)
    }
  }, [user])

  // Lógica para el contador de medicación
  useEffect(() => {
    const updateCountdown = () => {
      // Datos simulados por ahora, en una app real esto vendría de la API
      const now = new Date()
      const nextTime = new Date()
      nextTime.setHours(now.getHours() + 2, 30, 0) // Simular toma en 2h 30m

      const diff = nextTime.getTime() - now.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      setNextMedication({
        name: "Tamoxifeno 20mg",
        time: nextTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        timeLeft: `${hours}h ${minutes}m`
      })
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 60000)
    return () => clearInterval(timer)
  }, [])

  const { dashboard, isLoading, error, refetch } = usePatientDashboard(patientProfileId)

  if (isLoading) {
    return (
      <AuthGuard requiredRole="PATIENT">
        <DashboardLayout>
          <Loading message="Cargando dashboard..." />
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard requiredRole="PATIENT">
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => refetch()}>
                Reintentar
              </Button>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (!dashboard) {
    return null
  }

  const getSeverityColor = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-critical/15 text-critical border-critical/30'
      case 'SEVERE':
        return 'bg-severe/15 text-severe border-severe/30'
      case 'MODERATE':
        return 'bg-warning/20 text-warning-foreground border-warning/40'
      case 'MILD':
        return 'bg-success/15 text-success border-success/30'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getSeverityText = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return 'Crítico'
      case 'SEVERE':
        return 'Severo'
      case 'MODERATE':
        return 'Moderado'
      case 'MILD':
        return 'Leve'
      default:
        return severity || 'N/A'
    }
  }

  // Severity must not rely on color alone (a11y): pair with an icon + text.
  const SeverityIcon = ({ severity, className }: { severity: string; className?: string }) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
      case 'SEVERE':
        return <AlertTriangle className={className} aria-hidden="true" />
      case 'MODERATE':
        return <Activity className={className} aria-hidden="true" />
      case 'MILD':
        return <CheckCircle className={className} aria-hidden="true" />
      default:
        return <Activity className={className} aria-hidden="true" />
    }
  }

  const criticalSymptoms = dashboard.recentSymptoms.filter(s => s.requiresMedicalAttention)

  return (
    <AuthGuard requiredRole="PATIENT">
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Mi Dashboard
              </h1>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <p className="text-lg font-semibold text-foreground">{dashboard.patientName}</p>
              </div>
              {dashboard.doctorName && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <span>Dr. {dashboard.doctorName}</span>
                  <span>•</span>
                  <span>{dashboard.organizationName}</span>
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors h-11 px-6 shadow-sm">
                <Link href="/dashboard/paciente/sintomas/nuevo">
                  <Plus className="mr-2 h-5 w-5" />
                  Reportar Síntoma
                </Link>
              </Button>
              <Button asChild variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-colors border-2 h-11 px-6">
                <Link href="/dashboard/paciente/citas/nueva">
                  <Calendar className="mr-2 h-5 w-5" />
                  Solicitar Cita
                </Link>
              </Button>
            </div>
          </div>

          {/* Critical Symptoms Alert */}
          {criticalSymptoms.length > 0 && (
            <Card className="border-2 border-destructive shadow-lg bg-gradient-to-br from-destructive/10 to-destructive/5">
              <CardHeader className="border-b border-destructive/30">
                <CardTitle className="text-destructive flex items-center gap-3 text-2xl font-bold">
                  <div className="p-2 rounded-lg bg-destructive/20">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  </div>
                  Atención: Síntomas que requieren atención médica
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {criticalSymptoms.map((symptom) => (
                    <div key={symptom.id} className="flex items-center justify-between p-4 bg-card border-2 border-destructive/20 rounded-xl hover:border-destructive/40 transition-all">
                      <div>
                        <p className="font-bold text-lg">{symptom.symptomName}</p>
                        <p className="text-sm text-muted-foreground font-medium">
                          {new Date(symptom.occurrenceDate).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <Badge className={`${getSeverityColor(symptom.severity)} font-semibold inline-flex items-center gap-1`}>
                        <SeverityIcon severity={symptom.severity} className="h-3.5 w-3.5" />
                        {getSeverityText(symptom.severity)}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button asChild className="w-full mt-6 bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors h-11 shadow-sm">
                  <Link href="/dashboard/paciente/citas/nueva">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Solicitar Cita de Emergencia
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Next Medication Countdown - Redesigned Solid */}
          {nextMedication && (
            <Card className="border-2 border-primary shadow-xl overflow-hidden bg-card">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="p-8 bg-primary text-primary-foreground flex flex-col items-center justify-center min-w-[240px] text-center">
                    <div className="p-3 rounded-full bg-white/20 mb-4">
                      <Clock className="h-10 w-10" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80 mb-1">Próxima toma en</p>
                    <p className="text-5xl font-black tabular-nums">{nextMedication.timeLeft}</p>
                  </div>
                  <div className="p-8 flex-1 flex flex-col md:flex-row items-center justify-between gap-6 bg-card">
                    <div className="flex items-center gap-6">
                      <div className="p-4 rounded-2xl bg-primary/10 text-primary border-2 border-primary/20">
                        <Pill className="h-10 w-10" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-foreground tracking-tight">{nextMedication.name}</h3>
                        <div className="flex items-center gap-2 mt-1 text-muted-foreground font-semibold">
                          <Calendar className="h-4 w-4" />
                          <span>Hoy a las {nextMedication.time}</span>
                        </div>
                      </div>
                    </div>
                    <Button className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md rounded-2xl h-14 px-10 font-bold text-lg">
                      <CheckCircle className="mr-2 h-6 w-6" />
                      Marcar como tomada
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Próximas Citas</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1 tabular-nums">
                  {dashboard.upcomingAppointments}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Citas programadas
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-chart-2/20 hover:border-chart-2/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-chart-2/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Síntomas Recientes</CardTitle>
                <div className="p-2 rounded-lg bg-chart-2/10">
                  <Activity className="h-5 w-5 text-chart-2" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1 tabular-nums">
                  {dashboard.recentSymptoms.length}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-chart-2"></span>
                  Últimos 7 días
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-destructive/20 hover:border-destructive/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Síntomas Severos</CardTitle>
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-destructive mb-1 tabular-nums">
                  {dashboard.criticalSymptoms}
                </div>
                <p className="text-xs text-destructive font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse motion-reduce:animate-none" aria-hidden="true"></span>
                  Requieren atención
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Appointments */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  Próximas Citas
                </CardTitle>
                <CardDescription className="mt-1">
                  {dashboard.upcomingAppointmentsList.length} citas programadas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {dashboard.upcomingAppointmentsList.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">No tienes citas programadas</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Solicita una cita con tu médico para continuar con tu tratamiento
                      </p>
                      <Button asChild variant="outline" className="border-2 hover:bg-primary hover:text-primary-foreground h-11 px-6">
                        <Link href="/dashboard/paciente/citas/nueva">
                          <Calendar className="mr-2 h-5 w-5" />
                          Solicitar Cita
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    dashboard.upcomingAppointmentsList.slice(0, 3).map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between p-4 border-2 rounded-xl hover:border-primary/40 hover:shadow-md transition-all bg-card"
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Stethoscope className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-lg">{appointment.doctorName}</p>
                            <p className="text-sm text-muted-foreground font-medium">
                              {appointment.type} • {appointment.durationMinutes} min
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">
                            {new Date(appointment.appointmentDate).toLocaleDateString('es-ES', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground font-medium">
                            {new Date(appointment.appointmentDate).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {dashboard.upcomingAppointmentsList && dashboard.upcomingAppointmentsList.length > 0 && (
                  <div className="mt-6">
                    <Button asChild variant="outline" className="w-full hover:bg-primary hover:text-primary-foreground transition-colors border-2">
                      <Link href="/dashboard/paciente/citas">
                        Ver Todas las Citas
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Symptoms */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                  <div className="p-2 rounded-lg bg-chart-2/10">
                    <Activity className="h-6 w-6 text-chart-2" />
                  </div>
                  Síntomas Recientes
                </CardTitle>
                <CardDescription className="mt-1">
                  Últimos {dashboard.recentSymptoms.length} síntomas reportados
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {dashboard.recentSymptoms.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <Heart className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">No has reportado síntomas recientemente</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Reporta tus síntomas para ayudar a tu médico a monitorear tu estado
                      </p>
                      <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors h-11 px-6 shadow-sm">
                        <Link href="/dashboard/paciente/sintomas/nuevo">
                          <Plus className="mr-2 h-5 w-5" />
                          Reportar Síntoma
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    dashboard.recentSymptoms.slice(0, 5).map((symptom) => (
                      <div
                        key={symptom.id}
                        className="flex items-center justify-between p-4 border-2 rounded-xl hover:border-primary/40 hover:shadow-md transition-all bg-card"
                      >
                        <div className="flex-1">
                          <p className="font-bold text-lg">{symptom.symptomName}</p>
                          <p className="text-sm text-muted-foreground font-medium">
                            {new Date(symptom.occurrenceDate).toLocaleDateString('es-ES')} •{' '}
                            {symptom.occurrenceTime}
                          </p>
                        </div>
                        <Badge className={`${getSeverityColor(symptom.severity)} font-semibold inline-flex items-center gap-1`}>
                          <SeverityIcon severity={symptom.severity} className="h-3.5 w-3.5" />
                          {getSeverityText(symptom.severity)}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
                {dashboard.recentSymptoms.length > 0 && (
                  <div className="mt-6">
                    <Button asChild variant="outline" className="w-full hover:bg-primary hover:text-primary-foreground transition-colors border-2">
                      <Link href="/dashboard/paciente/sintomas">
                        Ver Todos los Síntomas
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
              <CardTitle className="text-2xl font-bold">Acciones Rápidas</CardTitle>
              <CardDescription className="mt-1">
                Accesos directos a las funciones más utilizadas
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button asChild variant="outline" className="h-24 flex-col hover:bg-primary hover:text-primary-foreground transition-colors border-2 hover:shadow-md">
                  <Link href="/dashboard/paciente/citas">
                    <Calendar className="h-7 w-7 mb-2" />
                    <span className="font-semibold">Mis Citas</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-24 flex-col hover:bg-chart-5 hover:text-white transition-all border-2 hover:shadow-md">
                  <Link href="/dashboard/paciente/sintomas">
                    <Activity className="h-7 w-7 mb-2" />
                    <span className="font-semibold">Mis Síntomas</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-24 flex-col hover:bg-chart-5 hover:text-white transition-colors border-2 hover:shadow-md">
                  <Link href="/dashboard/paciente/historial">
                    <Heart className="h-7 w-7 mb-2" />
                    <span className="font-semibold">Mi Historial</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-24 flex-col hover:bg-primary hover:text-primary-foreground transition-colors border-2 hover:shadow-md">
                  <Link href="/dashboard/paciente/perfil">
                    <Stethoscope className="h-7 w-7 mb-2" />
                    <span className="font-semibold">Mi Perfil</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Patient Info */}
          <Card className="border shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-xl font-semibold tracking-tight">Tu Información Médica</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <dl className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x">
                <div className="px-6 py-4">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Doctor Asignado</dt>
                  <dd className="mt-1 text-base font-medium text-foreground">{dashboard.doctorName || 'No asignado'}</dd>
                </div>
                <div className="px-6 py-4">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo de Sangre</dt>
                  <dd className="mt-1 text-base font-medium text-foreground font-mono tabular-nums">{dashboard.bloodType || 'No especificado'}</dd>
                </div>
                {dashboard.cancerType && (
                  <>
                    <div className="px-6 py-4 border-t sm:border-t-0">
                      <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Diagnóstico</dt>
                      <dd className="mt-1 text-base font-medium text-foreground">{dashboard.cancerType}</dd>
                    </div>
                    <div className="px-6 py-4 border-t sm:border-t-0">
                      <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Etapa</dt>
                      <dd className="mt-1 text-base font-medium text-foreground">{dashboard.cancerStage || 'No especificada'}</dd>
                    </div>
                  </>
                )}
              </dl>
              <div className="border-t px-6 py-4">
                <Button asChild variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Link href="/dashboard/paciente/perfil">
                    Ver Perfil Completo
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

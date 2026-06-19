"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import { useDoctorDashboard } from "@/hooks/use-doctors"
import { isDoctorUser } from "@/types/organization"
import { 
  Plus, 
  Calendar, 
  Users, 
  Activity, 
  Heart, 
  Clock
} from "lucide-react"

export default function MedicoDashboard() {
  const { user } = useAuthContext()
  const [doctorProfileId, setDoctorProfileId] = useState<number | null>(null)

  useEffect(() => {
    if (user && isDoctorUser(user)) {
      setDoctorProfileId(user.profile.id)
    }
  }, [user])

  const { dashboard, isLoading, error, refetch } = useDoctorDashboard(doctorProfileId)

  if (isLoading) {
    return (
      <AuthGuard requiredRole="DOCTOR">
        <DashboardLayout>
          <Loading message="Cargando dashboard..." />
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard requiredRole="DOCTOR">
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

  return (
    <AuthGuard requiredRole="DOCTOR">
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Dashboard Médico
              </h1>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <p className="text-lg font-semibold text-foreground">Dr. {dashboard.doctorName}</p>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <span>{dashboard.specialization}</span>
                <span>•</span>
                <span>{dashboard.organizationName}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors h-11 px-6 shadow-sm">
                <Link href="/dashboard/medico/pacientes/nuevo">
                  <Plus className="mr-2 h-5 w-5" />
                  Nuevo Paciente
                </Link>
              </Button>
              <Button asChild variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-colors border-2 h-11 px-6">
                <Link href="/dashboard/medico/citas/nueva">
                  <Calendar className="mr-2 h-5 w-5" />
                  Nueva Cita
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card className="border border-primary/20 hover:border-primary/40 transition-colors hover:shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" aria-hidden="true"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Total Pacientes</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1 tabular-nums">
                  {dashboard.totalPatients}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 tabular-nums">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true"></span>
                  {dashboard.activePatients} activos
                </p>
              </CardContent>
            </Card>

            <Card className="border border-chart-2/20 hover:border-chart-2/40 transition-colors hover:shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-chart-2/5 rounded-full -mr-16 -mt-16" aria-hidden="true"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Citas Totales</CardTitle>
                <div className="p-2 rounded-lg bg-chart-2/10">
                  <Calendar className="h-5 w-5 text-chart-2" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1 tabular-nums">
                  {dashboard.totalAppointments}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 tabular-nums">
                  <span className="w-1.5 h-1.5 rounded-full bg-chart-2" aria-hidden="true"></span>
                  {dashboard.completedAppointments} completadas
                </p>
              </CardContent>
            </Card>

            <Card className="border border-chart-5/20 hover:border-chart-5/40 transition-colors hover:shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-chart-5/5 rounded-full -mr-16 -mt-16" aria-hidden="true"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Próximas Citas</CardTitle>
                <div className="p-2 rounded-lg bg-chart-5/10">
                  <Clock className="h-5 w-5 text-chart-5" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1 tabular-nums">
                  {dashboard.upcomingAppointments}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-chart-5" aria-hidden="true"></span>
                  Por confirmar
                </p>
              </CardContent>
            </Card>

            <Card className="border border-destructive/20 hover:border-destructive/40 transition-colors hover:shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full -mr-16 -mt-16" aria-hidden="true"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Síntomas</CardTitle>
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Activity className="h-5 w-5 text-destructive" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1 tabular-nums">
                  {dashboard.totalSymptomsReported}
                </div>
                <p className="text-xs text-destructive font-semibold flex items-center gap-1 tabular-nums">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse motion-reduce:animate-none" aria-hidden="true"></span>
                  {dashboard.criticalSymptoms} críticos
                </p>
              </CardContent>
            </Card>

            <Card className="border border-primary/20 hover:border-primary/40 transition-colors hover:shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" aria-hidden="true"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Organización</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-sm font-bold truncate text-foreground mb-1">
                  {dashboard.organizationName || 'Sin organización'}
                </div>
                <p className="text-xs text-muted-foreground tabular-nums">
                  ID: {dashboard.organizationId}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Appointments */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  Próximas Citas
                </CardTitle>
                <CardDescription className="mt-1">
                  {dashboard.upcomingAppointmentsList.length} citas próximas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {dashboard.upcomingAppointmentsList.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium mb-4">
                        No hay citas próximas
                      </p>
                      <Button asChild variant="outline" className="border-2 hover:bg-primary hover:text-primary-foreground">
                        <Link href="/dashboard/medico/citas/nueva">
                          <Calendar className="mr-2 h-4 w-4" />
                          Crear Nueva Cita
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    dashboard.upcomingAppointmentsList.slice(0, 5).map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between p-4 border-2 rounded-xl hover:border-primary/40 hover:shadow-md transition-all bg-card"
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Calendar className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-lg">{appointment.patientName}</p>
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
                {dashboard.upcomingAppointmentsList.length > 0 && (
                  <div className="mt-6">
                    <Button asChild variant="outline" className="w-full hover:bg-primary hover:text-primary-foreground transition-colors border-2">
                      <Link href="/dashboard/medico/citas">
                        Ver Todas las Citas
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Patients */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                  <div className="p-2 rounded-lg bg-chart-2/10">
                    <Users className="h-6 w-6 text-chart-2" />
                  </div>
                  Mis Pacientes
                </CardTitle>
                <CardDescription className="mt-1">
                  {dashboard.patients.length} pacientes registrados
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {dashboard.patients.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">No hay pacientes registrados</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Comienza agregando pacientes para gestionar sus tratamientos y citas
                      </p>
                      <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors h-11 px-6 shadow-sm">
                        <Link href="/dashboard/medico/pacientes/nuevo">
                          <Plus className="mr-2 h-5 w-5" />
                          Agregar Primer Paciente
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    dashboard.patients.slice(0, 5).map((patient) => (
                      <div
                        key={patient.id}
                        className="flex items-center space-x-4 p-4 border-2 rounded-xl hover:border-primary/40 hover:shadow-md transition-all bg-card"
                      >
                        <Avatar className="h-12 w-12 ring-1 ring-primary/20">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {patient.firstName[0]}{patient.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-bold text-lg">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground font-medium">
                            {patient.cancerType || 'Sin diagnóstico'}
                          </p>
                        </div>
                        <Badge variant={patient.isActive ? 'default' : 'secondary'} className="border-2">
                          {patient.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
                {dashboard.patients.length > 0 && (
                  <div className="mt-6">
                    <Button asChild variant="outline" className="w-full hover:bg-primary hover:text-primary-foreground transition-colors border-2">
                      <Link href="/dashboard/medico/pacientes">
                        Ver Todos los Pacientes ({dashboard.patients.length})
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
                  <Link href="/dashboard/medico/pacientes">
                    <Users className="h-7 w-7 mb-2" />
                    <span className="font-semibold">Gestionar Pacientes</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-24 flex-col hover:bg-chart-5 hover:text-white transition-colors border-2 hover:shadow-md">
                  <Link href="/dashboard/medico/citas">
                    <Calendar className="h-7 w-7 mb-2" />
                    <span className="font-semibold">Ver Citas</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-24 flex-col hover:bg-chart-5 hover:text-white transition-colors border-2 hover:shadow-md">
                  <Link href="/dashboard/medico/calendario">
                    <Calendar className="h-7 w-7 mb-2" />
                    <span className="font-semibold">Calendario</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-24 flex-col hover:bg-primary hover:text-primary-foreground transition-colors border-2 hover:shadow-md">
                  <Link href="/dashboard/medico/reportes">
                    <Activity className="h-7 w-7 mb-2" />
                    <span className="font-semibold">Reportes</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Doctor Info */}
          <Card className="border shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-xl font-semibold tracking-tight">Tu Perfil Profesional</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <dl className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x">
                <div className="px-6 py-4">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Especialización</dt>
                  <dd className="mt-1 text-base font-medium text-foreground">{dashboard.specialization}</dd>
                </div>
                <div className="px-6 py-4">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Organización</dt>
                  <dd className="mt-1 text-base font-medium text-foreground">{dashboard.organizationName}</dd>
                </div>
                <div className="px-6 py-4 border-t sm:border-t-0">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pacientes</dt>
                  <dd className="mt-1 text-base font-medium text-foreground tabular-nums">
                    {dashboard.totalPatients || 0} registrados
                  </dd>
                </div>
                <div className="px-6 py-4 border-t sm:border-t-0">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</dt>
                  <dd className="mt-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" aria-hidden="true"></span>
                    <span className="text-base font-medium text-success">Activo</span>
                  </dd>
                </div>
              </dl>
              <div className="border-t px-6 py-4">
                <Button asChild variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Link href="/dashboard/medico/perfil">
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

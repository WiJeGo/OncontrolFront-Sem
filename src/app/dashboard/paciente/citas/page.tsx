"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import { appointments as appointmentsApi } from "@/lib/api"
import type { AppointmentResponse } from "@/lib/api"
import { isPatientUser } from "@/types/organization"
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Pill,
  FileText,
  CheckCircle,
  X,
  AlertTriangle,
  Filter,
} from "lucide-react"
import { format, parseISO, isFuture, isPast } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

export default function CitasPacientePage() {
  const { user } = useAuthContext()
  const [patientProfileId, setPatientProfileId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    if (user && isPatientUser(user)) {
      setPatientProfileId(user.profile.id)
    }
  }, [user])

  useEffect(() => {
    const loadAppointments = async () => {
      if (!patientProfileId) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        const data = await appointmentsApi.getPatientAppointments(patientProfileId)
        // Sort newest first
        const sorted = [...data].sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime())
        setAppointments(sorted)
      } catch (err) {
        console.error('Error loading appointments:', err)
        setError('Error al cargar las citas')
      } finally {
        setIsLoading(false)
      }
    }

    loadAppointments()
  }, [patientProfileId])

  const filteredAppointments = appointments.filter((appointment) => {
    if (statusFilter === "all") return true
    if (statusFilter === "upcoming") {
      return (
        isFuture(parseISO(appointment.appointmentDate)) &&
        (appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED")
      )
    }
    if (statusFilter === "past") {
      return (
        isPast(parseISO(appointment.appointmentDate)) ||
        appointment.status === "COMPLETED" ||
        appointment.status === "CANCELLED"
      )
    }
    return appointment.status === statusFilter
  })

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(appointment => 
      format(parseISO(appointment.appointmentDate), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    )
  }

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
      case "CONFIRMADA":
        return "bg-success/15 text-success border-success/30"
      case "SCHEDULED":
      case "PROGRAMADA":
      case "PENDIENTE":
        return "bg-chart-2/15 text-chart-2 border-chart-2/30"
      case "COMPLETED":
      case "COMPLETADA":
        return "bg-muted text-muted-foreground border-border"
      case "CANCELLED":
      case "CANCELADA":
        return "bg-destructive/15 text-destructive border-destructive/30"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const getStatusText = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
      case "CONFIRMADA": return "Confirmada"
      case "SCHEDULED":
      case "PROGRAMADA":
      case "PENDIENTE": return "Programada"
      case "COMPLETED":
      case "COMPLETADA": return "Completada"
      case "CANCELLED":
      case "CANCELADA": return "Cancelada"
      case "IN_PROGRESS": return "En curso"
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
      case "CONFIRMADA":
      case "COMPLETED":
      case "COMPLETADA":
        return <CheckCircle className="h-4 w-4" />
      case "SCHEDULED":
      case "PROGRAMADA":
      case "PENDIENTE":
        return <Clock className="h-4 w-4" />
      case "CANCELLED":
      case "CANCELADA":
        return <X className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const handleCancelAppointment = async (appointmentId: number) => {
    try {
      await appointmentsApi.updateStatus(appointmentId, "CANCELLED", "Cancelada por el paciente")
      // Refresh appointments
      if (patientProfileId) {
        const data = await appointmentsApi.getPatientAppointments(patientProfileId)
        setAppointments(data)
      }
    } catch (err) {
      console.error("Error canceling appointment:", err)
      setError("Error al cancelar la cita")
    }
  }

  const upcomingAppointments = appointments.filter(
    (apt) =>
      isFuture(parseISO(apt.appointmentDate)) && (apt.status === "SCHEDULED" || apt.status === "CONFIRMED"),
  )

  const completedAppointments = appointments.filter((apt) => apt.status === "COMPLETED")

  if (isLoading) {
    return (
      <AuthGuard requiredRole="PATIENT">
        <DashboardLayout>
          <Loading />
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard requiredRole="PATIENT">
        <DashboardLayout>
          <Alert variant="destructive" role="alert">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredRole="PATIENT">
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Mis Citas
              </h1>
              <p className="text-muted-foreground text-lg">Gestiona tus citas médicas</p>
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors h-11 px-6 shadow-sm" asChild>
              <Link href="/dashboard/paciente/citas/nueva">
                <Calendar className="mr-2 h-5 w-5" />
                Solicitar Nueva Cita
              </Link>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border border-primary/20 hover:border-primary/40 transition-all hover:shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Próximas Citas</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-primary mb-1">{upcomingAppointments.length}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Citas próximas
                </p>
              </CardContent>
            </Card>
            <Card className="border border-chart-2/20 hover:border-chart-2/40 transition-all hover:shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-chart-2/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Pendientes</CardTitle>
                <div className="p-2 rounded-lg bg-chart-2/10">
                  <Clock className="h-5 w-5 text-chart-2" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-chart-2 mb-1">
                  {appointments.filter((apt) => apt.status === "SCHEDULED").length}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-chart-2"></span>
                  Por confirmar
                </p>
              </CardContent>
            </Card>
            <Card className="border border-chart-5/20 hover:border-chart-5/40 transition-all hover:shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-chart-5/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Completadas</CardTitle>
                <div className="p-2 rounded-lg bg-chart-5/10">
                  <CheckCircle className="h-5 w-5 text-chart-5" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-chart-5 mb-1">{completedAppointments.length}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-chart-5"></span>
                  Finalizadas
                </p>
              </CardContent>
            </Card>
            <Card className="border border-destructive/20 hover:border-destructive/40 transition-all hover:shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Canceladas</CardTitle>
                <div className="p-2 rounded-lg bg-destructive/10">
                  <X className="h-5 w-5 text-destructive" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-destructive mb-1">
                  {appointments.filter((apt) => apt.status === "CANCELLED").length}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive"></span>
                  Canceladas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Next Appointment Alert */}
          {upcomingAppointments.length > 0 && (
            <Card className="border border-primary/30 shadow-sm bg-gradient-to-br from-primary/10 to-primary/5">
              <CardHeader className="border-b border-primary/30">
                <CardTitle className="flex items-center gap-3 text-primary text-xl font-bold">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  Próxima Cita
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <AlertDescription className="text-base font-medium">
                  Tu próxima cita es el{" "}
                  <strong className="text-primary">{format(parseISO(upcomingAppointments[0].appointmentDate), "EEEE, d 'de' MMMM", { locale: es })}</strong> a
                  las <strong className="text-primary">{format(parseISO(upcomingAppointments[0].appointmentDate), "HH:mm", { locale: es })}</strong> con{" "}
                  <strong className="text-primary">{upcomingAppointments[0].doctorName}</strong>
                </AlertDescription>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card className="border shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-xl font-bold">Filtros de Búsqueda</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[250px] h-12 border">
                    <Filter className="mr-2 h-5 w-5" />
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las citas</SelectItem>
                    <SelectItem value="upcoming">Próximas</SelectItem>
                    <SelectItem value="past">Pasadas</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmadas</SelectItem>
                    <SelectItem value="SCHEDULED">Pendientes</SelectItem>
                    <SelectItem value="COMPLETED">Completadas</SelectItem>
                    <SelectItem value="CANCELLED">Canceladas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Appointments List */}
          <div className="grid gap-6">
            {filteredAppointments.map((appointment) => (
              <Card key={appointment.id} className="border shadow-sm hover:border-primary/40 hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                        <AvatarFallback className="bg-primary/10 font-bold text-lg">
                          {appointment.doctorName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold">{appointment.type}</h3>
                          <Badge className={`${getStatusColor(appointment.status)} border font-semibold`}>
                            {getStatusIcon(appointment.status)}
                            <span className="ml-1">{getStatusText(appointment.status)}</span>
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2 font-medium">
                            <User className="h-4 w-4 text-primary" />
                            <span className="font-semibold">{appointment.doctorName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span>
                              {format(parseISO(appointment.appointmentDate), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>
                              {format(parseISO(appointment.appointmentDate), "HH:mm", { locale: es })} • {appointment.durationMinutes} minutos
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span>{appointment.location}</span>
                          </div>
                        </div>
                        {appointment.notes && (
                          <p className="text-sm text-muted-foreground mt-4 p-4 bg-muted/50 rounded-xl border border-muted">
                            {appointment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {(appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="text-destructive hover:text-destructive border border-destructive/20 hover:border-destructive hover:bg-destructive/10"
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAppointments.length === 0 && (
            <Card className="border shadow-sm">
              <CardContent className="p-16 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                  <Calendar className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">No hay citas</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  No tienes citas que coincidan con los filtros seleccionados.
                </p>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors h-11 px-6 shadow-sm" asChild>
                  <Link href="/dashboard/paciente/citas/nueva">
                    <Calendar className="mr-2 h-5 w-5" />
                    Solicitar Nueva Cita
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="border shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-2xl font-bold">Acciones Rápidas</CardTitle>
              <CardDescription className="mt-1">Gestiona tus citas médicas</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-24 flex-col hover:bg-primary hover:text-primary-foreground transition-all border hover:shadow-md" asChild>
                  <Link href="/dashboard/paciente/citas/nueva">
                    <Calendar className="h-7 w-7 mb-2" />
                    <span className="font-semibold">Solicitar Nueva Cita</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-24 flex-col hover:bg-chart-2 hover:text-white transition-colors border hover:shadow-md" asChild>
                  <Link href="/dashboard/paciente/medicamentos">
                    <Pill className="h-7 w-7 mb-2" />
                    <span className="font-semibold">Mis Medicamentos</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-24 flex-col hover:bg-chart-5 hover:text-white transition-colors border hover:shadow-md" asChild>
                  <Link href="/dashboard/paciente/historial">
                    <FileText className="h-7 w-7 mb-2" />
                    <span className="font-semibold">Mi Historial</span>
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

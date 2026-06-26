"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import { appointments as appointmentsApi } from "@/lib/api"
import type { AppointmentResponse } from "@/lib/api"
import { isPatientUser } from "@/types/organization"
import { Calendar, Clock, MapPin, User, CheckCircle, X, AlertTriangle, Plus } from "lucide-react"
import { format, parseISO, isFuture, isPast } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

function CountUp({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce || value <= 0) {
      setDisplay(value)
      return
    }
    const duration = 700
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <span className={className}>{display}</span>
}

function statusPill(status?: string) {
  switch ((status || "").toUpperCase()) {
    case "CONFIRMED":
    case "CONFIRMADA":
      return { label: "Confirmada", className: "bg-success/15 text-success", icon: CheckCircle }
    case "SCHEDULED":
    case "PROGRAMADA":
    case "PENDIENTE":
      return { label: "Programada", className: "bg-chart-2/15 text-chart-2", icon: Clock }
    case "COMPLETED":
    case "COMPLETADA":
      return { label: "Completada", className: "bg-muted text-muted-foreground", icon: CheckCircle }
    case "CANCELLED":
    case "CANCELADA":
      return { label: "Cancelada", className: "bg-destructive/15 text-destructive", icon: X }
    case "IN_PROGRESS":
      return { label: "En curso", className: "bg-warning/20 text-warning-foreground", icon: Clock }
    default:
      return { label: status || "N/A", className: "bg-muted text-muted-foreground", icon: AlertTriangle }
  }
}

export default function CitasPacientePage() {
  const { user } = useAuthContext()
  const [patientProfileId, setPatientProfileId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        const sorted = [...data].sort(
          (a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime(),
        )
        setAppointments(sorted)
      } catch (err) {
        console.error("Error loading appointments:", err)
        setError("Error al cargar las citas")
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

  const handleCancelAppointment = async (appointmentId: number) => {
    try {
      await appointmentsApi.updateStatus(appointmentId, "CANCELLED", "Cancelada por el paciente")
      if (patientProfileId) {
        const data = await appointmentsApi.getPatientAppointments(patientProfileId)
        setAppointments(
          [...data].sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()),
        )
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
          <Loading message="Cargando citas..." />
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

  const kpis = [
    { label: "Próximas", value: upcomingAppointments.length, sub: "Programadas", icon: Calendar, tint: "bg-primary/10 text-primary", tile: "bg-primary/[0.06]" },
    { label: "Pendientes", value: appointments.filter((a) => a.status === "SCHEDULED").length, sub: "Por confirmar", icon: Clock, tint: "bg-chart-2/10 text-chart-2", tile: "bg-chart-2/[0.06]" },
    { label: "Completadas", value: completedAppointments.length, sub: "Finalizadas", icon: CheckCircle, tint: "bg-success/10 text-success", tile: "bg-success/[0.06]" },
    { label: "Canceladas", value: appointments.filter((a) => a.status === "CANCELLED").length, sub: "Canceladas", icon: X, tint: "bg-destructive/10 text-destructive", tile: "bg-destructive/[0.06]" },
  ]

  return (
    <AuthGuard requiredRole="PATIENT">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Mis citas</h1>
              <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                {filteredAppointments.length} {filteredAppointments.length === 1 ? "cita" : "citas"}
              </p>
            </div>
            <Button asChild className="h-10 bg-primary px-4 text-primary-foreground shadow-sm hover:bg-primary/90">
              <Link href="/dashboard/paciente/citas/nueva">
                <Plus className="mr-1.5 h-4 w-4" />
                Solicitar cita
              </Link>
            </Button>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:grid-cols-4 lg:divide-y-0">
            {kpis.map((kpi) => (
              <div key={kpi.label} className={`p-5 ${kpi.tile}`}>
                <div className="mb-3 flex items-center gap-2 text-[13px] text-muted-foreground">
                  <span className={`grid h-7 w-7 place-items-center rounded-lg ${kpi.tint}`}>
                    <kpi.icon className="h-4 w-4" />
                  </span>
                  {kpi.label}
                </div>
                <CountUp value={kpi.value} className="font-mono text-3xl font-semibold tabular-nums text-foreground" />
                <div className="mt-1 text-xs text-muted-foreground">{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* Next appointment banner */}
          {upcomingAppointments.length > 0 && (
            <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/[0.05] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Calendar className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">Próxima cita</p>
                  <p className="text-sm text-foreground">
                    <span className="font-medium capitalize">
                      {format(parseISO(upcomingAppointments[0].appointmentDate), "EEEE d 'de' MMMM", { locale: es })}
                    </span>{" "}
                    a las{" "}
                    <span className="font-mono tabular-nums">
                      {format(parseISO(upcomingAppointments[0].appointmentDate), "HH:mm", { locale: es })}
                    </span>{" "}
                    con Dr. {upcomingAppointments[0].doctorName}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Filter toolbar */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-full border-border sm:w-64">
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

          {/* Appointments */}
          {filteredAppointments.length === 0 ? (
            <div className="rounded-xl border border-border bg-card px-5 py-16 text-center shadow-sm">
              <div className="relative mx-auto mb-4 grid h-20 w-20 place-items-center">
                <span className="absolute inset-0 rounded-full bg-primary/5" aria-hidden="true" />
                <span className="absolute inset-[10px] rounded-full bg-primary/10" aria-hidden="true" />
                <Calendar className="relative h-8 w-8 text-primary/70" aria-hidden="true" />
              </div>
              <h3 className="mb-1 font-semibold text-foreground">No hay citas</h3>
              <p className="mx-auto mb-5 max-w-sm text-sm text-muted-foreground">
                No tienes citas que coincidan con los filtros seleccionados.
              </p>
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/dashboard/paciente/citas/nueva">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Solicitar nueva cita
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((appointment) => {
                const date = parseISO(appointment.appointmentDate)
                const pill = statusPill(appointment.status)
                const cancelable = appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED"
                return (
                  <div
                    key={appointment.id}
                    className="rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 shrink-0 rounded-lg border border-border bg-muted/40 py-2 text-center">
                        <div className="font-mono text-lg font-semibold leading-none text-foreground">
                          {format(date, "d")}
                        </div>
                        <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          {format(date, "MMM", { locale: es }).replace(".", "")}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">{appointment.type}</h3>
                          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${pill.className}`}>
                            <pill.icon className="h-3 w-3" aria-hidden="true" />
                            {pill.label}
                          </span>
                        </div>
                        <div className="mt-2 grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
                          <span className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                            Dr. {appointment.doctorName}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                            <span className="font-mono tabular-nums">{format(date, "HH:mm", { locale: es })}</span> ·{" "}
                            <span className="tabular-nums">{appointment.durationMinutes} min</span>
                          </span>
                          {appointment.location && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                              {appointment.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                            <span className="capitalize">{format(date, "EEEE d 'de' MMM", { locale: es })}</span>
                          </span>
                        </div>
                        {appointment.notes && (
                          <p className="mt-3 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                            {appointment.notes}
                          </p>
                        )}
                      </div>
                      {cancelable && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

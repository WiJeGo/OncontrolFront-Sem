"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import { useDoctorDashboard } from "@/hooks/use-doctors"
import { isDoctorUser } from "@/types/organization"
import {
  Plus,
  Calendar,
  CalendarDays,
  Users,
  Activity,
  Clock,
  ArrowRight,
  BarChart3,
} from "lucide-react"

function appointmentStatusPill(status?: string) {
  switch ((status || "").toUpperCase()) {
    case "CONFIRMED":
    case "CONFIRMADA":
      return { label: "Confirmada", className: "bg-success/15 text-success" }
    case "COMPLETED":
    case "COMPLETADA":
      return { label: "Completada", className: "bg-muted text-muted-foreground" }
    case "CANCELLED":
    case "CANCELADA":
      return { label: "Cancelada", className: "bg-destructive/15 text-destructive" }
    default:
      return { label: "Programada", className: "bg-chart-2/15 text-chart-2" }
  }
}

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
              <Button onClick={() => refetch()}>Reintentar</Button>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (!dashboard) {
    return null
  }

  const kpis = [
    {
      label: "Pacientes activos",
      value: dashboard.totalPatients,
      sub: `${dashboard.activePatients} activos`,
      icon: Users,
      tint: "bg-primary/10 text-primary",
      tile: "bg-primary/[0.06]",
    },
    {
      label: "Citas totales",
      value: dashboard.totalAppointments,
      sub: `${dashboard.completedAppointments} completadas`,
      icon: Calendar,
      tint: "bg-chart-2/10 text-chart-2",
      tile: "bg-chart-2/[0.06]",
    },
    {
      label: "Próximas citas",
      value: dashboard.upcomingAppointments,
      sub: "Por confirmar",
      icon: Clock,
      tint: "bg-chart-5/10 text-chart-5",
      tile: "bg-chart-5/[0.06]",
    },
    {
      label: "Síntomas críticos",
      value: dashboard.criticalSymptoms,
      sub: `${dashboard.totalSymptomsReported} reportados`,
      icon: Activity,
      tint: "bg-destructive/10 text-destructive",
      tile: "bg-destructive/[0.06]",
      emphasize: dashboard.criticalSymptoms > 0,
    },
  ]

  const quickActions = [
    { href: "/dashboard/medico/pacientes", label: "Pacientes", icon: Users },
    { href: "/dashboard/medico/citas", label: "Citas", icon: Calendar },
    { href: "/dashboard/medico/calendario", label: "Calendario", icon: CalendarDays },
    { href: "/dashboard/medico/reportes", label: "Reportes", icon: BarChart3 },
  ]

  return (
    <AuthGuard requiredRole="DOCTOR">
      <DashboardLayout>
        <div className="space-y-7">
          {/* Header */}
          <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Panel médico</h1>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Dr. {dashboard.doctorName}</span>
                <span className="text-border">·</span>
                <span>{dashboard.specialization}</span>
                <span className="text-border">·</span>
                <span>{dashboard.organizationName}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild className="h-10 bg-primary px-4 text-primary-foreground hover:bg-primary/90">
                <Link href="/dashboard/medico/pacientes/nuevo">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Nuevo paciente
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-10 border-border px-4 hover:bg-muted/60">
                <Link href="/dashboard/medico/citas/nueva">
                  <Calendar className="mr-1.5 h-4 w-4" />
                  Nueva cita
                </Link>
              </Button>
            </div>
          </div>

          {/* KPI strip — connected hairline tiles */}
          <div className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-xl border border-border bg-card lg:grid-cols-4 lg:divide-y-0">
            {kpis.map((kpi) => (
              <div key={kpi.label} className={`p-5 ${kpi.tile}`}>
                <div className="mb-3 flex items-center gap-2 text-[13px] text-muted-foreground">
                  <span className={`grid h-7 w-7 place-items-center rounded-lg ${kpi.tint}`}>
                    <kpi.icon className="h-4 w-4" />
                  </span>
                  {kpi.label}
                </div>
                <div
                  className={`font-mono text-3xl font-semibold tabular-nums ${
                    kpi.emphasize ? "text-destructive" : "text-foreground"
                  }`}
                >
                  {kpi.value}
                </div>
                <div className="mt-1 text-xs tabular-nums text-muted-foreground">{kpi.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Upcoming appointments */}
            <section className="overflow-hidden rounded-xl border border-border bg-card">
              <header className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  Próximas citas
                </h2>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {dashboard.upcomingAppointmentsList.length} próximas
                </span>
              </header>

              {dashboard.upcomingAppointmentsList.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-muted">
                    <Calendar className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">No hay citas próximas</p>
                  <Button asChild variant="outline" className="border-border hover:bg-muted/60">
                    <Link href="/dashboard/medico/citas/nueva">
                      <Plus className="mr-1.5 h-4 w-4" />
                      Crear nueva cita
                    </Link>
                  </Button>
                </div>
              ) : (
                <div>
                  {dashboard.upcomingAppointmentsList.slice(0, 5).map((appointment) => {
                    const date = new Date(appointment.appointmentDate)
                    const day = date.toLocaleDateString("es-ES", { day: "numeric" })
                    const month = date.toLocaleDateString("es-ES", { month: "short" }).replace(".", "")
                    const time = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                    const pill = appointmentStatusPill((appointment as { status?: string }).status)
                    return (
                      <div
                        key={appointment.id}
                        className="flex items-center gap-4 border-t border-border px-5 py-3.5 transition-colors hover:bg-muted/40"
                      >
                        <div className="w-10 shrink-0 text-center">
                          <div className="font-mono text-lg font-semibold leading-none text-foreground">{day}</div>
                          <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{month}</div>
                        </div>
                        <div className="h-8 w-px shrink-0 bg-border" aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">{appointment.patientName}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {appointment.type} · <span className="tabular-nums">{appointment.durationMinutes} min</span>
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-mono text-sm tabular-nums text-foreground">{time}</span>
                          <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${pill.className}`}>
                            {pill.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  <Link
                    href="/dashboard/medico/citas"
                    className="flex items-center justify-center gap-1.5 border-t border-border px-5 py-3 text-sm font-medium text-primary transition-colors hover:bg-muted/40"
                  >
                    Ver todas las citas
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </section>

            {/* Patients */}
            <section className="overflow-hidden rounded-xl border border-border bg-card">
              <header className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <Users className="h-4 w-4 text-chart-2" />
                  Mis pacientes
                </h2>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {dashboard.patients.length} registrados
                </span>
              </header>

              {dashboard.patients.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary/10">
                    <Users className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="mb-1 font-semibold text-foreground">Aún no hay pacientes</h3>
                  <p className="mx-auto mb-5 max-w-xs text-sm text-muted-foreground">
                    Agrega pacientes para gestionar sus tratamientos y citas.
                  </p>
                  <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/dashboard/medico/pacientes/nuevo">
                      <Plus className="mr-1.5 h-4 w-4" />
                      Agregar primer paciente
                    </Link>
                  </Button>
                </div>
              ) : (
                <div>
                  {dashboard.patients.slice(0, 5).map((patient) => (
                    <div
                      key={patient.id}
                      className="flex items-center gap-3 border-t border-border px-5 py-3.5 transition-colors hover:bg-muted/40"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                          {patient.firstName[0]}
                          {patient.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">
                          {patient.firstName} {patient.lastName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {patient.cancerType || "Sin diagnóstico"}
                        </p>
                      </div>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                          patient.isActive ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {patient.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  ))}
                  <Link
                    href="/dashboard/medico/pacientes"
                    className="flex items-center justify-center gap-1.5 border-t border-border px-5 py-3 text-sm font-medium text-primary transition-colors hover:bg-muted/40"
                  >
                    Ver todos los pacientes
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </section>
          </div>

          {/* Quick actions */}
          <div>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">Accesos rápidos</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <action.icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Professional profile */}
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-foreground">Tu perfil profesional</h2>
              <Button asChild variant="outline" size="sm" className="border-border hover:bg-muted/60">
                <Link href="/dashboard/medico/perfil">Ver perfil</Link>
              </Button>
            </header>
            <dl className="grid grid-cols-1 sm:grid-cols-2">
              <div className="border-b border-border px-5 py-4 sm:border-r">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Especialización</dt>
                <dd className="mt-1 font-medium text-foreground">{dashboard.specialization}</dd>
              </div>
              <div className="border-b border-border px-5 py-4">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Organización</dt>
                <dd className="mt-1 font-medium text-foreground">{dashboard.organizationName}</dd>
              </div>
              <div className="border-b border-border px-5 py-4 sm:border-b-0 sm:border-r">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pacientes</dt>
                <dd className="mt-1 font-medium tabular-nums text-foreground">{dashboard.totalPatients || 0} registrados</dd>
              </div>
              <div className="px-5 py-4">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
                  <span className="font-medium text-success">Activo</span>
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

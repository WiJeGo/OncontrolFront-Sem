"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import { usePatientDashboard } from "@/hooks/use-patients"
import { medications } from "@/lib/api"
import type { UpcomingDoseResponse } from "@/lib/api"
import { isPatientUser } from "@/types/organization"
import { appointmentTypeLabel } from "@/lib/labels"
import {
  Plus,
  Calendar,
  Activity,
  Heart,
  Clock,
  AlertTriangle,
  Stethoscope,
  Pill,
  CheckCircle,
  ArrowRight,
  User,
} from "lucide-react"

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
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(value * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <span className={className}>{display}</span>
}

export default function PacienteDashboard() {
  const { user } = useAuthContext()
  const [patientProfileId, setPatientProfileId] = useState<number | null>(null)
  const [nextDose, setNextDose] = useState<UpcomingDoseResponse | null>(null)
  const [doseCountdown, setDoseCountdown] = useState<string>("")
  const [markingDose, setMarkingDose] = useState(false)

  useEffect(() => {
    if (user && isPatientUser(user)) {
      setPatientProfileId(user.profile.id)
    }
  }, [user])

  const loadNextDose = useCallback(async () => {
    if (!patientProfileId) return
    try {
      const doses = await medications.getUpcomingDoses(patientProfileId, 2)
      const pending = doses
        .filter((d) => !d.taken)
        .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
      setNextDose(pending[0] ?? null)
    } catch {
      setNextDose(null)
    }
  }, [patientProfileId])

  useEffect(() => {
    loadNextDose()
  }, [loadNextDose])

  useEffect(() => {
    if (!nextDose) {
      setDoseCountdown("")
      return
    }
    const tick = () => {
      const diff = new Date(nextDose.scheduledTime).getTime() - Date.now()
      if (diff <= 0) {
        setDoseCountdown("Ahora")
        return
      }
      const hours = Math.floor(diff / 3_600_000)
      const minutes = Math.floor((diff % 3_600_000) / 60_000)
      setDoseCountdown(hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`)
    }
    tick()
    const timer = setInterval(tick, 60_000)
    return () => clearInterval(timer)
  }, [nextDose])

  const handleMarkDoseTaken = async () => {
    if (!nextDose) return
    setMarkingDose(true)
    try {
      await medications.markDoseTaken(nextDose.medicationId, { takenAt: new Date().toISOString() })
      await loadNextDose()
    } catch (err) {
      console.error("Error marking dose as taken:", err)
    } finally {
      setMarkingDose(false)
    }
  }

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

  const severityPill = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
        return "bg-critical/15 text-critical"
      case "SEVERE":
        return "bg-severe/15 text-severe"
      case "MODERATE":
        return "bg-warning/20 text-warning-foreground"
      case "MILD":
        return "bg-success/15 text-success"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const severityText = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
        return "Crítico"
      case "SEVERE":
        return "Severo"
      case "MODERATE":
        return "Moderado"
      case "MILD":
        return "Leve"
      default:
        return severity || "N/A"
    }
  }

  const SeverityIcon = ({ severity, className }: { severity: string; className?: string }) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
      case "SEVERE":
        return <AlertTriangle className={className} aria-hidden="true" />
      case "MILD":
        return <CheckCircle className={className} aria-hidden="true" />
      default:
        return <Activity className={className} aria-hidden="true" />
    }
  }

  const rawDate = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
  const dateLabel = rawDate.charAt(0).toUpperCase() + rawDate.slice(1)

  const criticalSymptoms = dashboard.recentSymptoms.filter((s) => s.requiresMedicalAttention)

  const kpis = [
    {
      label: "Próximas citas",
      value: dashboard.upcomingAppointments,
      sub: "Programadas",
      icon: Calendar,
      tint: "bg-primary/10 text-primary",
      tile: "bg-primary/[0.06]",
    },
    {
      label: "Síntomas recientes",
      value: dashboard.recentSymptoms.length,
      sub: "Últimos 7 días",
      icon: Activity,
      tint: "bg-chart-2/10 text-chart-2",
      tile: "bg-chart-2/[0.06]",
    },
    {
      label: "Síntomas severos",
      value: dashboard.criticalSymptoms,
      sub: "Requieren atención",
      icon: AlertTriangle,
      tint: "bg-destructive/10 text-destructive",
      tile: "bg-destructive/[0.06]",
      emphasize: dashboard.criticalSymptoms > 0,
    },
  ]

  const quickActions = [
    { href: "/dashboard/paciente/citas", label: "Mis citas", icon: Calendar },
    { href: "/dashboard/paciente/sintomas", label: "Mis síntomas", icon: Activity },
    { href: "/dashboard/paciente/historial", label: "Mi historial", icon: Heart },
    { href: "/dashboard/paciente/perfil", label: "Mi perfil", icon: User },
  ]

  return (
    <AuthGuard requiredRole="PATIENT">
      <DashboardLayout>
        <div className="space-y-7">
          {/* Welcome banner */}
          <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary/10 via-card to-chart-2/10 px-5 py-5 shadow-sm duration-500 animate-in fade-in-0 slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6">
            <div
              className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{dateLabel}</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                  Hola, {dashboard.patientName}
                </h1>
                {dashboard.doctorName && (
                  <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
                    <span>Dr. {dashboard.doctorName}</span>
                    <span className="text-border">·</span>
                    <span>{dashboard.organizationName}</span>
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button asChild className="h-10 bg-primary px-4 text-primary-foreground shadow-sm hover:bg-primary/90">
                  <Link href="/dashboard/paciente/sintomas/nuevo">
                    <Plus className="mr-1.5 h-4 w-4" />
                    Reportar síntoma
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-10 border-border bg-background/70 px-4 hover:bg-muted">
                  <Link href="/dashboard/paciente/citas/nueva">
                    <Calendar className="mr-1.5 h-4 w-4" />
                    Solicitar cita
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Critical symptoms alert */}
          {criticalSymptoms.length > 0 && (
            <section
              className="overflow-hidden rounded-xl border border-destructive/40 bg-destructive/[0.04] shadow-sm duration-500 animate-in fade-in-0 slide-in-from-bottom-2 motion-reduce:animate-none"
              style={{ animationDelay: "60ms", animationFillMode: "both" }}
            >
              <header className="flex items-center gap-2 border-b border-destructive/20 px-5 py-4">
                <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
                <h2 className="text-base font-semibold text-destructive">Síntomas que requieren atención médica</h2>
              </header>
              <div>
                {criticalSymptoms.map((symptom) => (
                  <div
                    key={symptom.id}
                    className="flex items-center justify-between gap-3 border-t border-destructive/15 px-5 py-3.5 first:border-t-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{symptom.symptomName}</p>
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {new Date(symptom.occurrenceDate).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${severityPill(
                        symptom.severity,
                      )}`}
                    >
                      <SeverityIcon severity={symptom.severity} className="h-3.5 w-3.5" />
                      {severityText(symptom.severity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-destructive/20 p-3">
                <Button
                  asChild
                  className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  <Link href="/dashboard/paciente/citas/nueva">
                    <AlertTriangle className="mr-1.5 h-4 w-4" />
                    Solicitar cita de emergencia
                  </Link>
                </Button>
              </div>
            </section>
          )}

          {/* Next dose */}
          {nextDose && (
            <div
              className="overflow-hidden rounded-xl border border-primary/30 bg-card shadow-sm duration-500 animate-in fade-in-0 slide-in-from-bottom-2 motion-reduce:animate-none"
              style={{ animationDelay: "100ms", animationFillMode: "both" }}
            >
              <div className="flex flex-col sm:flex-row">
                <div className="flex flex-col items-center justify-center gap-1 bg-primary px-8 py-6 text-primary-foreground sm:min-w-[200px]">
                  <span className="text-[11px] font-medium uppercase tracking-wider opacity-80">Próxima toma en</span>
                  <span className="font-mono text-4xl font-semibold tabular-nums">{doseCountdown || "—"}</span>
                </div>
                <div className="flex flex-1 flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Pill className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-foreground">{nextDose.medicationName}</h3>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                        <span className="font-mono tabular-nums">{nextDose.dosage}</span>
                        <span className="text-border" aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          {new Date(nextDose.scheduledTime).toLocaleString("es-ES", {
                            weekday: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleMarkDoseTaken}
                    disabled={markingDose}
                    className="w-full bg-primary text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 sm:w-auto"
                  >
                    <CheckCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {markingDose ? "Guardando…" : "Marcar como tomada"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* KPI strip */}
          <div
            className="grid grid-cols-1 divide-x divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm duration-500 animate-in fade-in-0 slide-in-from-bottom-2 motion-reduce:animate-none sm:grid-cols-3 sm:divide-y-0"
            style={{ animationDelay: "140ms", animationFillMode: "both" }}
          >
            {kpis.map((kpi) => (
              <div key={kpi.label} className={`p-5 ${kpi.tile}`}>
                <div className="mb-3 flex items-center gap-2 text-[13px] text-muted-foreground">
                  <span className={`grid h-7 w-7 place-items-center rounded-lg ${kpi.tint}`}>
                    <kpi.icon className="h-4 w-4" />
                  </span>
                  {kpi.label}
                </div>
                <CountUp
                  value={kpi.value}
                  className={`font-mono text-3xl font-semibold tabular-nums ${
                    kpi.emphasize ? "text-destructive" : "text-foreground"
                  }`}
                />
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  {kpi.emphasize && (
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive motion-safe:animate-pulse" aria-hidden="true" />
                  )}
                  {kpi.sub}
                </div>
              </div>
            ))}
          </div>

          <div
            className="grid grid-cols-1 gap-5 duration-500 animate-in fade-in-0 slide-in-from-bottom-2 motion-reduce:animate-none lg:grid-cols-2"
            style={{ animationDelay: "200ms", animationFillMode: "both" }}
          >
            {/* Upcoming appointments */}
            <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <header className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  Próximas citas
                </h2>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {dashboard.upcomingAppointmentsList.length} programadas
                </span>
              </header>

              {dashboard.upcomingAppointmentsList.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <div className="relative mx-auto mb-4 grid h-20 w-20 place-items-center">
                    <span className="absolute inset-0 rounded-full bg-primary/5" aria-hidden="true" />
                    <span className="absolute inset-[10px] rounded-full bg-primary/10" aria-hidden="true" />
                    <Calendar className="relative h-8 w-8 text-primary/70" aria-hidden="true" />
                  </div>
                  <h3 className="mb-1 font-semibold text-foreground">No tienes citas programadas</h3>
                  <p className="mx-auto mb-5 max-w-xs text-sm text-muted-foreground">
                    Solicita una cita con tu médico para continuar tu tratamiento.
                  </p>
                  <Button asChild variant="outline" className="border-border hover:bg-muted/60">
                    <Link href="/dashboard/paciente/citas/nueva">
                      <Calendar className="mr-1.5 h-4 w-4" />
                      Solicitar cita
                    </Link>
                  </Button>
                </div>
              ) : (
                <div>
                  {dashboard.upcomingAppointmentsList.slice(0, 4).map((appointment) => {
                    const date = new Date(appointment.appointmentDate)
                    const day = date.toLocaleDateString("es-ES", { day: "numeric" })
                    const month = date.toLocaleDateString("es-ES", { month: "short" }).replace(".", "")
                    const time = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
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
                          <p className="truncate font-medium text-foreground">Dr. {appointment.doctorName}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {appointmentTypeLabel(appointment.type)} ·{" "}
                            <span className="tabular-nums">{appointment.durationMinutes} min</span>
                          </p>
                        </div>
                        <span className="font-mono text-sm tabular-nums text-foreground">{time}</span>
                      </div>
                    )
                  })}
                  <Link
                    href="/dashboard/paciente/citas"
                    className="flex items-center justify-center gap-1.5 border-t border-border px-5 py-3 text-sm font-medium text-primary transition-colors hover:bg-muted/40"
                  >
                    Ver todas las citas
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </section>

            {/* Recent symptoms */}
            <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <header className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <Activity className="h-4 w-4 text-chart-2" />
                  Síntomas recientes
                </h2>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {dashboard.recentSymptoms.length} reportados
                </span>
              </header>

              {dashboard.recentSymptoms.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <div className="relative mx-auto mb-4 grid h-20 w-20 place-items-center">
                    <span className="absolute inset-0 rounded-full bg-chart-2/5" aria-hidden="true" />
                    <span className="absolute inset-[10px] rounded-full bg-chart-2/10" aria-hidden="true" />
                    <Heart className="relative h-8 w-8 text-chart-2/70" aria-hidden="true" />
                  </div>
                  <h3 className="mb-1 font-semibold text-foreground">Sin síntomas recientes</h3>
                  <p className="mx-auto mb-5 max-w-xs text-sm text-muted-foreground">
                    Reporta tus síntomas para que tu médico monitoree tu estado.
                  </p>
                  <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/dashboard/paciente/sintomas/nuevo">
                      <Plus className="mr-1.5 h-4 w-4" />
                      Reportar síntoma
                    </Link>
                  </Button>
                </div>
              ) : (
                <div>
                  {dashboard.recentSymptoms.slice(0, 5).map((symptom) => (
                    <div
                      key={symptom.id}
                      className="flex items-center justify-between gap-3 border-t border-border px-5 py-3.5 transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{symptom.symptomName}</p>
                        <p className="truncate text-xs tabular-nums text-muted-foreground">
                          {new Date(symptom.occurrenceDate).toLocaleDateString("es-ES")} · {symptom.occurrenceTime}
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${severityPill(
                          symptom.severity,
                        )}`}
                      >
                        <SeverityIcon severity={symptom.severity} className="h-3.5 w-3.5" />
                        {severityText(symptom.severity)}
                      </span>
                    </div>
                  ))}
                  <Link
                    href="/dashboard/paciente/sintomas"
                    className="flex items-center justify-center gap-1.5 border-t border-border px-5 py-3 text-sm font-medium text-primary transition-colors hover:bg-muted/40"
                  >
                    Ver todos los síntomas
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </section>
          </div>

          {/* Quick actions */}
          <div
            className="duration-500 animate-in fade-in-0 slide-in-from-bottom-2 motion-reduce:animate-none"
            style={{ animationDelay: "260ms", animationFillMode: "both" }}
          >
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">Accesos rápidos</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <action.icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Patient info */}
          <section
            className="overflow-hidden rounded-xl border border-border bg-card shadow-sm duration-500 animate-in fade-in-0 slide-in-from-bottom-2 motion-reduce:animate-none"
            style={{ animationDelay: "320ms", animationFillMode: "both" }}
          >
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-foreground">Tu información médica</h2>
              <Button asChild variant="outline" size="sm" className="border-border hover:bg-muted/60">
                <Link href="/dashboard/paciente/perfil">Ver perfil</Link>
              </Button>
            </header>
            <dl className="grid grid-cols-1 sm:grid-cols-2">
              <div className="border-b border-border px-5 py-4 sm:border-r">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Doctor asignado</dt>
                <dd className="mt-1 font-medium text-foreground">{dashboard.doctorName || "No asignado"}</dd>
              </div>
              <div className="border-b border-border px-5 py-4">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tipo de sangre</dt>
                <dd className="mt-1 font-mono font-medium tabular-nums text-foreground">
                  {dashboard.bloodType || "No especificado"}
                </dd>
              </div>
              {dashboard.cancerType && (
                <>
                  <div className="border-b border-border px-5 py-4 sm:border-r sm:border-b-0">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Diagnóstico</dt>
                    <dd className="mt-1 font-medium text-foreground">{dashboard.cancerType}</dd>
                  </div>
                  <div className="px-5 py-4">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Etapa</dt>
                    <dd className="mt-1 font-medium text-foreground">{dashboard.cancerStage || "No especificada"}</dd>
                  </div>
                </>
              )}
            </dl>
          </section>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useAuthContext } from "@/contexts/auth-context"
import { useOrganizationDashboard } from "@/hooks/use-organizations"
import { isOrganizationUser } from "@/types/organization"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Loading } from "@/components/loading"
import { Users, Stethoscope, Calendar, Plus, UserPlus, Activity, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0)

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

export default function OrganizationDashboardPage() {
  const { user, isLoading: authLoading } = useAuthContext()
  const router = useRouter()

  const organizationId = user && isOrganizationUser(user) ? user.id : null
  const { dashboard, isLoading, error, refetch } = useOrganizationDashboard(organizationId)

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/")
    } else if (!authLoading && user && !isOrganizationUser(user)) {
      router.replace("/dashboard")
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return <Loading message="Verificando autenticación..." />
  }
  if (!user || !isOrganizationUser(user)) {
    return null
  }

  const rawDate = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
  const dateLabel = rawDate.charAt(0).toUpperCase() + rawDate.slice(1)

  const kpis = dashboard
    ? [
        {
          label: "Médicos",
          value: dashboard.totalDoctors,
          sub: `${dashboard.activeDoctors} activos`,
          icon: Stethoscope,
          tint: "bg-primary/10 text-primary",
          tile: "bg-primary/[0.06]",
          pct: pct(dashboard.activeDoctors, dashboard.totalDoctors),
          bar: "bg-primary",
          chip: "bg-primary/10 text-primary",
        },
        {
          label: "Pacientes",
          value: dashboard.totalPatients,
          sub: `${dashboard.activePatients} activos`,
          icon: Users,
          tint: "bg-chart-2/10 text-chart-2",
          tile: "bg-chart-2/[0.06]",
          pct: pct(dashboard.activePatients, dashboard.totalPatients),
          bar: "bg-chart-2",
          chip: "bg-chart-2/10 text-chart-2",
        },
        {
          label: "Citas",
          value: dashboard.totalAppointments,
          sub: `${dashboard.upcomingAppointments} próximas`,
          icon: Calendar,
          tint: "bg-chart-5/10 text-chart-5",
          tile: "bg-chart-5/[0.06]",
          pct: pct(dashboard.upcomingAppointments, dashboard.totalAppointments),
          bar: "bg-chart-5",
          chip: "bg-chart-5/10 text-chart-5",
        },
        {
          label: "Pacientes / médico",
          value: dashboard.totalDoctors > 0 ? Math.round(dashboard.totalPatients / dashboard.totalDoctors) : 0,
          sub: "Promedio por médico",
          icon: Activity,
          tint: "bg-primary/10 text-primary",
          tile: "bg-primary/[0.06]",
          pct: undefined as number | undefined,
          bar: "bg-primary",
          chip: "bg-primary/10 text-primary",
        },
      ]
    : []

  return (
    <DashboardLayout>
      {(authLoading || isLoading) && <Loading message="Cargando dashboard..." />}

      {error && !authLoading && !isLoading && (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-destructive">{error}</p>
            <Button onClick={() => refetch()}>Intentar de nuevo</Button>
          </div>
        </div>
      )}

      {!authLoading && !isLoading && !error && dashboard && (
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
                  {dashboard.organizationName}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {dashboard.city}
                  {dashboard.country ? `, ${dashboard.country}` : ""}
                </p>
              </div>
              <Button asChild className="h-10 bg-primary px-4 text-primary-foreground shadow-sm hover:bg-primary/90">
                <Link href="/dashboard/organizacion/doctores/nuevo">
                  <UserPlus className="mr-1.5 h-4 w-4" />
                  Agregar médico
                </Link>
              </Button>
            </div>
          </div>

          {/* KPI strip */}
          <div
            className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm duration-500 animate-in fade-in-0 slide-in-from-bottom-2 motion-reduce:animate-none lg:grid-cols-4 lg:divide-y-0"
            style={{ animationDelay: "80ms", animationFillMode: "both" }}
          >
            {kpis.map((kpi) => (
              <div key={kpi.label} className={`p-5 ${kpi.tile}`}>
                <div className="mb-3 flex items-center gap-2 text-[13px] text-muted-foreground">
                  <span className={`grid h-7 w-7 place-items-center rounded-lg ${kpi.tint}`}>
                    <kpi.icon className="h-4 w-4" />
                  </span>
                  {kpi.label}
                </div>
                <div className="flex items-end justify-between gap-2">
                  <CountUp value={kpi.value} className="font-mono text-3xl font-semibold tabular-nums text-foreground" />
                  {kpi.pct !== undefined && (
                    <span className={`mb-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums ${kpi.chip}`}>
                      {kpi.pct}%
                    </span>
                  )}
                </div>
                {kpi.pct !== undefined ? (
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${kpi.bar}`} style={{ width: `${kpi.pct}%` }} aria-hidden="true" />
                  </div>
                ) : (
                  <div className="mt-2.5 h-1.5" aria-hidden="true" />
                )}
                <div className="mt-1.5 text-xs tabular-nums text-muted-foreground">{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* Doctors */}
          <section
            className="overflow-hidden rounded-xl border border-border bg-card shadow-sm duration-500 animate-in fade-in-0 slide-in-from-bottom-2 motion-reduce:animate-none"
            style={{ animationDelay: "160ms", animationFillMode: "both" }}
          >
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Stethoscope className="h-4 w-4 text-primary" />
                Equipo médico
              </h2>
              <span className="text-xs tabular-nums text-muted-foreground">{dashboard.doctors.length} médicos</span>
            </header>

            {dashboard.doctors.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <div className="relative mx-auto mb-4 grid h-20 w-20 place-items-center">
                  <span className="absolute inset-0 rounded-full bg-primary/5" aria-hidden="true" />
                  <span className="absolute inset-[10px] rounded-full bg-primary/10" aria-hidden="true" />
                  <Stethoscope className="relative h-8 w-8 text-primary/70" aria-hidden="true" />
                </div>
                <h3 className="mb-1 font-semibold text-foreground">Aún no hay médicos</h3>
                <p className="mx-auto mb-5 max-w-xs text-sm text-muted-foreground">
                  Agrega médicos a tu organización para gestionar pacientes y citas.
                </p>
                <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href="/dashboard/organizacion/doctores/nuevo">
                    <Plus className="mr-1.5 h-4 w-4" />
                    Agregar primer médico
                  </Link>
                </Button>
              </div>
            ) : (
              <div>
                {dashboard.doctors.slice(0, 5).map((doctor) => (
                  <div
                    key={doctor.id}
                    className="flex items-center gap-3 border-t border-border px-5 py-3.5 transition-colors hover:bg-muted/40"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                        {doctor.firstName?.[0]}
                        {doctor.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        Dr. {doctor.firstName} {doctor.lastName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {doctor.specialization} · {doctor.email}
                      </p>
                    </div>
                    <span
                      className={`hidden shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium sm:inline ${
                        doctor.isAvailable ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {doctor.isAvailable ? "Disponible" : "No disp."}
                    </span>
                    <Button asChild variant="outline" size="sm" className="border-border hover:bg-muted/60">
                      <Link href={`/dashboard/organizacion/doctores/${doctor.id}`}>Ver</Link>
                    </Button>
                  </div>
                ))}
                <Link
                  href="/dashboard/organizacion/doctores"
                  className="flex items-center justify-center gap-1.5 border-t border-border px-5 py-3 text-sm font-medium text-primary transition-colors hover:bg-muted/40"
                >
                  Ver todos los médicos
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </section>
        </div>
      )}
    </DashboardLayout>
  )
}

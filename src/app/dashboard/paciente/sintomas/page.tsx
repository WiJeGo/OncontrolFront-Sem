"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import { symptoms } from "@/lib/api"
import type { SymptomResponse } from "@/lib/api"
import { isPatientUser } from "@/types/organization"
import { Search, Plus, Activity, AlertTriangle, Clock, Calendar, CheckCircle } from "lucide-react"

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

const SEVERITY_CANON: Record<string, string> = {
  LEVE: "MILD", MILD: "MILD",
  MODERADA: "MODERATE", MODERATE: "MODERATE",
  SEVERA: "SEVERE", SEVERE: "SEVERE",
  CRITICA: "CRITICAL", "CRÍTICA": "CRITICAL", CRITICAL: "CRITICAL",
}
const canonSeverity = (s?: string) => SEVERITY_CANON[(s || "").toUpperCase()] || (s || "").toUpperCase()

export default function SymptomsPage() {
  const { user } = useAuthContext()
  const [patientProfileId, setPatientProfileId] = useState<number | null>(null)
  const [symptomsList, setSymptomsList] = useState<SymptomResponse[]>([])
  const [filteredSymptoms, setFilteredSymptoms] = useState<SymptomResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")

  useEffect(() => {
    if (user && isPatientUser(user)) {
      setPatientProfileId(user.profile.id)
    }
  }, [user])

  useEffect(() => {
    const loadSymptoms = async () => {
      if (!patientProfileId) return
      try {
        setIsLoading(true)
        setError(null)
        const data = await symptoms.getAll(patientProfileId)
        data.sort((a, b) => new Date(b.occurrenceDate).getTime() - new Date(a.occurrenceDate).getTime())
        setSymptomsList(data)
        setFilteredSymptoms(data)
      } catch (err) {
        console.error("Error loading symptoms:", err)
        setError("Error al cargar los síntomas")
      } finally {
        setIsLoading(false)
      }
    }
    loadSymptoms()
  }, [patientProfileId])

  useEffect(() => {
    let filtered = symptomsList
    if (searchTerm) {
      filtered = filtered.filter(
        (symptom) =>
          symptom.symptomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          symptom.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          symptom.triggers?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
    if (severityFilter !== "all") {
      // The API returns severity in Spanish (MODERADA…) while the filter options
      // are the English enum (MODERATE…); normalize both before comparing.
      filtered = filtered.filter((symptom) => canonSeverity(symptom.severity) === severityFilter)
    }
    if (dateFilter !== "all") {
      const today = new Date()
      filtered = filtered.filter((symptom) => {
        const symptomDate = new Date(symptom.occurrenceDate)
        switch (dateFilter) {
          case "today":
            return symptomDate.toDateString() === today.toDateString()
          case "yesterday": {
            const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
            return symptomDate.toDateString() === yesterday.toDateString()
          }
          case "thisWeek": {
            const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
            return symptomDate >= weekStart && symptomDate <= today
          }
          case "thisMonth": {
            const monthStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
            return symptomDate >= monthStart && symptomDate <= today
          }
          default:
            return true
        }
      })
    }
    setFilteredSymptoms(filtered)
  }, [symptomsList, searchTerm, severityFilter, dateFilter])

  const severityPill = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
      case "CRÍTICO":
      case "CRITICO":
        return "bg-critical/15 text-critical"
      case "SEVERE":
      case "SEVERO":
        return "bg-severe/15 text-severe"
      case "MODERATE":
      case "MODERADO":
        return "bg-warning/20 text-warning-foreground"
      case "MILD":
      case "LEVE":
        return "bg-success/15 text-success"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const severityText = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
      case "CRÍTICO":
      case "CRITICO":
        return "Crítico"
      case "SEVERE":
      case "SEVERO":
        return "Severo"
      case "MODERATE":
      case "MODERADO":
        return "Moderado"
      case "MILD":
      case "LEVE":
        return "Leve"
      default:
        return severity || "N/A"
    }
  }

  const SeverityIcon = ({ severity, className }: { severity: string; className?: string }) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
      case "CRÍTICO":
      case "CRITICO":
      case "SEVERE":
      case "SEVERO":
        return <AlertTriangle className={className} aria-hidden="true" />
      case "MILD":
      case "LEVE":
        return <CheckCircle className={className} aria-hidden="true" />
      default:
        return <Activity className={className} aria-hidden="true" />
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("es-ES", { weekday: "short", month: "short", day: "numeric" })
  const formatTime = (timeString: string) =>
    new Date(`2000-01-01T${timeString}`).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })

  const criticalSymptoms = filteredSymptoms.filter((s) => s.requiresMedicalAttention)
  const reportedToDoctor = filteredSymptoms.filter((s) => s.reportedToDoctor)

  if (isLoading) {
    return (
      <AuthGuard requiredRole="PATIENT">
        <DashboardLayout>
          <Loading message="Cargando síntomas..." />
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard requiredRole="PATIENT">
        <DashboardLayout>
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <p className="mb-4 text-destructive">{error}</p>
              <Button onClick={() => window.location.reload()}>Reintentar</Button>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  const thisWeekCount = symptomsList.filter(
    (s) => new Date(s.occurrenceDate) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  ).length

  const kpis = [
    { label: "Total síntomas", value: symptomsList.length, sub: "Reportados", icon: Activity, tint: "bg-primary/10 text-primary", tile: "bg-primary/[0.06]", emphasize: false },
    { label: "Críticos", value: criticalSymptoms.length, sub: "Requieren atención", icon: AlertTriangle, tint: "bg-destructive/10 text-destructive", tile: "bg-destructive/[0.06]", emphasize: true },
    { label: "Notificados", value: reportedToDoctor.length, sub: "Al médico", icon: CheckCircle, tint: "bg-chart-2/10 text-chart-2", tile: "bg-chart-2/[0.06]", emphasize: false },
    { label: "Esta semana", value: thisWeekCount, sub: "Últimos 7 días", icon: Calendar, tint: "bg-chart-5/10 text-chart-5", tile: "bg-chart-5/[0.06]", emphasize: false },
  ]

  return (
    <AuthGuard requiredRole="PATIENT">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Mis síntomas</h1>
              <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                {filteredSymptoms.length} {filteredSymptoms.length === 1 ? "síntoma" : "síntomas"}
              </p>
            </div>
            <Button asChild className="h-10 bg-primary px-4 text-primary-foreground shadow-sm hover:bg-primary/90">
              <Link href="/dashboard/paciente/sintomas/nuevo">
                <Plus className="mr-1.5 h-4 w-4" />
                Reportar síntoma
              </Link>
            </Button>
          </div>

          {/* Critical alert */}
          {criticalSymptoms.length > 0 && (
            <section className="overflow-hidden rounded-xl border border-destructive/40 bg-destructive/[0.04] shadow-sm">
              <header className="flex items-center gap-2 border-b border-destructive/20 px-5 py-4">
                <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
                <h2 className="text-base font-semibold text-destructive">
                  {criticalSymptoms.length} síntoma(s) requieren atención médica
                </h2>
              </header>
              <div>
                {criticalSymptoms.slice(0, 3).map((symptom) => (
                  <div
                    key={symptom.id}
                    className="flex items-center justify-between gap-3 border-t border-destructive/15 px-5 py-3.5 first:border-t-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{symptom.symptomName}</p>
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {formatDate(symptom.occurrenceDate)} · {formatTime(symptom.occurrenceTime)}
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
            </section>
          )}

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
                <CountUp
                  value={kpi.value}
                  className={`font-mono text-3xl font-semibold tabular-nums ${kpi.emphasize ? "text-destructive" : "text-foreground"}`}
                />
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  {kpi.emphasize && kpi.value > 0 && (
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive motion-safe:animate-pulse" aria-hidden="true" />
                  )}
                  {kpi.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Table panel */}
          <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, notas o desencadenantes…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 border-border pl-9"
                  aria-label="Buscar síntomas"
                />
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="h-10 w-full border-border sm:w-44">
                  <SelectValue placeholder="Severidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="MILD">Leve</SelectItem>
                  <SelectItem value="MODERATE">Moderado</SelectItem>
                  <SelectItem value="SEVERE">Severo</SelectItem>
                  <SelectItem value="CRITICAL">Crítico</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-10 w-full border-border sm:w-40">
                  <SelectValue placeholder="Fecha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las fechas</SelectItem>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="yesterday">Ayer</SelectItem>
                  <SelectItem value="thisWeek">Esta semana</SelectItem>
                  <SelectItem value="thisMonth">Este mes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredSymptoms.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <div className="relative mx-auto mb-4 grid h-20 w-20 place-items-center">
                  <span className="absolute inset-0 rounded-full bg-primary/5" aria-hidden="true" />
                  <span className="absolute inset-[10px] rounded-full bg-primary/10" aria-hidden="true" />
                  <Activity className="relative h-8 w-8 text-primary/70" aria-hidden="true" />
                </div>
                <h3 className="mb-1 font-semibold text-foreground">
                  {searchTerm || severityFilter !== "all" || dateFilter !== "all"
                    ? "Sin resultados"
                    : "Aún no has reportado síntomas"}
                </h3>
                <p className="mx-auto mb-5 max-w-sm text-sm text-muted-foreground">
                  {searchTerm || severityFilter !== "all" || dateFilter !== "all"
                    ? "Prueba cambiando los filtros."
                    : "Reporta tus síntomas para ayudar a tu médico a monitorearte."}
                </p>
                {!searchTerm && severityFilter === "all" && dateFilter === "all" && (
                  <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/dashboard/paciente/sintomas/nuevo">
                      <Plus className="mr-1.5 h-4 w-4" />
                      Reportar primer síntoma
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Síntoma</TableHead>
                      <TableHead>Severidad</TableHead>
                      <TableHead>Fecha y hora</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Atención</TableHead>
                      <TableHead>Reportado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSymptoms.map((symptom) => (
                      <TableRow key={symptom.id}>
                        <TableCell>
                          <p className="font-medium text-foreground">{symptom.symptomName}</p>
                          {symptom.notes && (
                            <p className="max-w-[220px] truncate text-xs text-muted-foreground">{symptom.notes}</p>
                          )}
                          {symptom.triggers && (
                            <p className="text-xs text-muted-foreground">Desencadenantes: {symptom.triggers}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${severityPill(
                              symptom.severity,
                            )}`}
                          >
                            <SeverityIcon severity={symptom.severity} className="h-3.5 w-3.5" />
                            {severityText(symptom.severity)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-foreground">{formatDate(symptom.occurrenceDate)}</p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            <span className="font-mono tabular-nums">{formatTime(symptom.occurrenceTime)}</span>
                          </p>
                        </TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {symptom.durationHours ? `${symptom.durationHours}h` : "—"}
                        </TableCell>
                        <TableCell>
                          {symptom.requiresMedicalAttention ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-destructive/15 px-2 py-0.5 text-[11px] font-medium text-destructive">
                              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                              Sí
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">No</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {symptom.reportedToDoctor ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">
                              <CheckCircle className="h-3 w-3" aria-hidden="true" />
                              Sí
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">No</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

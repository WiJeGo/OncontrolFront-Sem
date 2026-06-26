"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Pill, Activity, Plus, Search, Eye, Edit } from "lucide-react"
import Link from "next/link"
import { useAuthContext } from "@/contexts/auth-context"
import { treatments } from "@/lib/api"
import type { TreatmentResponse } from "@/lib/api"
import { isDoctorUser } from "@/types/organization"
import { Loading } from "@/components/loading"

const estadoColors = {
  ACTIVE: "bg-success/15 text-success",
  PAUSED: "bg-warning/20 text-warning-foreground",
  COMPLETED: "bg-muted text-muted-foreground",
  SUSPENDED: "bg-destructive/15 text-destructive",
}

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

const tipoNames: Record<string, string> = {
  CHEMOTHERAPY: "Quimioterapia",
  RADIOTHERAPY: "Radioterapia",
  IMMUNOTHERAPY: "Inmunoterapia",
  SURGERY: "Cirugía",
  HORMONE_THERAPY: "Terapia Hormonal",
  TARGETED_THERAPY: "Terapia Dirigida"
}

const estadoNames: Record<string, string> = {
  ACTIVE: "Activo",
  PAUSED: "Pausado",
  COMPLETED: "Completado",
  SUSPENDED: "Suspendido"
}

export default function TratamientosPage() {
  const { user } = useAuthContext()
  const [doctorProfileId, setDoctorProfileId] = useState<number | null>(null)
  const [tratamientosList, setTratamientosList] = useState<TreatmentResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [filtroTipo, setFiltroTipo] = useState("todos")

  useEffect(() => {
    if (user && isDoctorUser(user)) {
      setDoctorProfileId(user.profile.id)
    }
  }, [user])

  useEffect(() => {
    const loadTreatments = async () => {
      if (!doctorProfileId) return

      try {
        setIsLoading(true)
        setError(null)
        const data = await treatments.getDoctorTreatments(doctorProfileId)
        setTratamientosList(data)
      } catch (err) {
        console.error('Error loading treatments:', err)
        setError('Error al cargar los tratamientos')
      } finally {
        setIsLoading(false)
      }
    }

    loadTreatments()
  }, [doctorProfileId])

  const tratamientosFiltrados = tratamientosList.filter((tratamiento) => {
    const matchesSearch =
      tratamiento.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tipoNames[tratamiento.type]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tratamiento.protocol.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEstado = filtroEstado === "todos" || tratamiento.status === filtroEstado
    const matchesTipo = filtroTipo === "todos" || tratamiento.type === filtroTipo

    return matchesSearch && matchesEstado && matchesTipo
  })

  // Calculate stats
  const stats = {
    total: tratamientosList.length,
    activos: tratamientosList.filter(t => t.status === 'ACTIVE').length,
    pausados: tratamientosList.filter(t => t.status === 'PAUSED').length,
    completados: tratamientosList.filter(t => t.status === 'COMPLETED').length,
  }

  if (isLoading) {
    return (
      <AuthGuard requiredRole="DOCTOR">
        <DashboardLayout>
          <Loading message="Cargando tratamientos..." />
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
              <Button onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
      <AuthGuard requiredRole="DOCTOR">
      <DashboardLayout>
        <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tratamientos</h1>
          <p className="mt-1 text-sm tabular-nums text-muted-foreground">
            {tratamientosFiltrados.length} {tratamientosFiltrados.length === 1 ? "tratamiento" : "tratamientos"}
          </p>
        </div>
        <Button className="h-10 bg-primary px-4 text-primary-foreground shadow-sm hover:bg-primary/90" asChild>
          <Link href="/dashboard/medico/tratamientos/nuevo">
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo tratamiento
          </Link>
        </Button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:grid-cols-4 lg:divide-y-0">
        {[
          { label: "Total", value: stats.total, sub: "Registrados", icon: Activity, tint: "bg-primary/10 text-primary", tile: "bg-primary/[0.06]" },
          { label: "Activos", value: stats.activos, sub: "En curso", icon: Pill, tint: "bg-success/10 text-success", tile: "bg-success/[0.06]" },
          { label: "Pausados", value: stats.pausados, sub: "Temporalmente", icon: Clock, tint: "bg-warning/15 text-warning-foreground", tile: "bg-warning/[0.06]" },
          { label: "Completados", value: stats.completados, sub: "Finalizados", icon: Activity, tint: "bg-muted text-muted-foreground", tile: "" },
        ].map((kpi) => (
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

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por paciente, tipo o protocolo…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 border-border pl-9"
            aria-label="Buscar tratamientos"
          />
        </div>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="h-10 w-full border-border sm:w-44">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="ACTIVE">Activos</SelectItem>
            <SelectItem value="PAUSED">Pausados</SelectItem>
            <SelectItem value="COMPLETED">Completados</SelectItem>
            <SelectItem value="SUSPENDED">Suspendidos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="h-10 w-full border-border sm:w-44">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            <SelectItem value="CHEMOTHERAPY">Quimioterapia</SelectItem>
            <SelectItem value="RADIOTHERAPY">Radioterapia</SelectItem>
            <SelectItem value="IMMUNOTHERAPY">Inmunoterapia</SelectItem>
            <SelectItem value="SURGERY">Cirugía</SelectItem>
            <SelectItem value="HORMONE_THERAPY">Terapia Hormonal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Tratamientos */}
      <div className="grid grid-cols-1 gap-6">
        {tratamientosFiltrados.length === 0 ? (
          <Card className="border shadow-sm">
            <CardContent className="p-16 text-center">
              <div className="relative mx-auto mb-4 grid h-20 w-20 place-items-center">
                <span className="absolute inset-0 rounded-full bg-primary/5" aria-hidden="true" />
                <span className="absolute inset-[10px] rounded-full bg-primary/10" aria-hidden="true" />
                <Activity className="relative h-8 w-8 text-primary/70" aria-hidden="true" />
              </div>
              <h3 className="mb-1 font-semibold text-foreground">
                {searchTerm || filtroEstado !== "todos" || filtroTipo !== "todos"
                  ? "Sin resultados"
                  : "No hay tratamientos registrados"}
              </h3>
              <p className="mx-auto mb-5 max-w-sm text-sm text-muted-foreground">
                {searchTerm || filtroEstado !== "todos" || filtroTipo !== "todos"
                  ? "Prueba cambiando los filtros."
                  : "Crea tratamientos para tus pacientes."}
              </p>
              {!searchTerm && filtroEstado === "todos" && filtroTipo === "todos" && (
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors h-11 px-6 shadow-sm" asChild>
                  <Link href="/dashboard/medico/tratamientos/nuevo">
                    <Plus className="w-5 h-5 mr-2" />
                    Crear Primer Tratamiento
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          tratamientosFiltrados.map((tratamiento) => (
            <Card key={tratamiento.id} className="border shadow-sm hover:border-primary/40 hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-foreground">{tratamiento.patientName}</h3>
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${estadoColors[tratamiento.status as keyof typeof estadoColors]}`}>
                        {estadoNames[tratamiento.status] || tratamiento.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="flex items-center gap-2 font-medium text-muted-foreground">
                        <Pill className="w-4 h-4 text-primary" />
                        {tipoNames[tratamiento.type] || tratamiento.type}
                      </span>
                      <span className="flex items-center gap-2 font-medium text-muted-foreground">
                        <Activity className="w-4 h-4 text-primary" />
                        Protocolo: {tratamiento.protocol}
                      </span>
                      <span className="flex items-center gap-2 font-medium text-muted-foreground">
                        <Clock className="w-4 h-4 text-primary" />
                        Ciclo {tratamiento.currentCycle}/{tratamiento.totalCycles}
                      </span>
                    </div>

                    {tratamiento.nextSession && (
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <Clock className="w-4 h-4" />
                        Próxima sesión: {new Date(tratamiento.nextSession).toLocaleDateString('es-ES')}
                      </div>
                    )}

                    {tratamiento.notes && (
                      <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg border border-muted">{tratamiento.notes}</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="border hover:bg-primary hover:text-primary-foreground" asChild>
                      <Link href={`/dashboard/medico/tratamientos/${tratamiento.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="border hover:bg-chart-2 hover:text-white" asChild>
                      <Link href={`/dashboard/medico/tratamientos/${tratamiento.id}/editar`}>
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6 pt-6 border-t border-border/50">
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-muted-foreground">Progreso del tratamiento</span>
                    <span className="text-foreground">{tratamiento.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 border border-border/50 overflow-hidden">
                    <div
                      className="bg-primary h-3 rounded-full transition-all duration-300 shadow-sm"
                      style={{ width: `${Math.min(tratamiento.progressPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

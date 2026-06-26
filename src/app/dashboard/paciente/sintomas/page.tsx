"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import { symptoms } from "@/lib/api"
import type { SymptomResponse } from "@/lib/api"
import { isPatientUser } from "@/types/organization"
import { Search, Plus, Activity, AlertTriangle, Clock, Calendar, CheckCircle } from "lucide-react"

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
        
        // Sort by occurrence date (most recent first)
        data.sort((a, b) => new Date(b.occurrenceDate).getTime() - new Date(a.occurrenceDate).getTime())
        
        setSymptomsList(data)
        setFilteredSymptoms(data)
      } catch (err) {
        console.error('Error loading symptoms:', err)
        setError('Error al cargar los síntomas')
      } finally {
        setIsLoading(false)
      }
    }

    loadSymptoms()
  }, [patientProfileId])

  useEffect(() => {
    let filtered = symptomsList

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(symptom =>
        symptom.symptomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        symptom.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        symptom.triggers?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by severity
    if (severityFilter !== "all") {
      filtered = filtered.filter(symptom => symptom.severity === severityFilter)
    }

    // Filter by date
    if (dateFilter !== "all") {
      const today = new Date()
      filtered = filtered.filter(symptom => {
        const symptomDate = new Date(symptom.occurrenceDate)
        switch (dateFilter) {
          case "today":
            return symptomDate.toDateString() === today.toDateString()
          case "yesterday":
            const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
            return symptomDate.toDateString() === yesterday.toDateString()
          case "thisWeek":
            const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
            return symptomDate >= weekStart && symptomDate <= today
          case "thisMonth":
            const monthStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
            return symptomDate >= monthStart && symptomDate <= today
          default:
            return true
        }
      })
    }

    setFilteredSymptoms(filtered)
  }, [symptomsList, searchTerm, severityFilter, dateFilter])

  // Backend severity enum (MILD/MODERATE/SEVERE/CRITICAL) mapped to clinical tokens.
  // Also accept Spanish strings for forward compatibility.
  const getSeverityColor = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
      case 'CRÍTICO':
      case 'CRITICO':
        return 'bg-critical/15 text-critical border-critical/30'
      case 'SEVERE':
      case 'SEVERO':
        return 'bg-severe/15 text-severe border-severe/30'
      case 'MODERATE':
      case 'MODERADO':
        return 'bg-warning/20 text-warning-foreground border-warning/40'
      case 'MILD':
      case 'LEVE':
        return 'bg-success/15 text-success border-success/30'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getSeverityText = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
      case 'CRÍTICO':
      case 'CRITICO':
        return 'Crítico'
      case 'SEVERE':
      case 'SEVERO':
        return 'Severo'
      case 'MODERATE':
      case 'MODERADO':
        return 'Moderado'
      case 'MILD':
      case 'LEVE':
        return 'Leve'
      default:
        return severity || 'N/A'
    }
  }

  const SeverityIcon = ({ severity, className }: { severity: string; className?: string }) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
      case 'CRÍTICO':
      case 'CRITICO':
      case 'SEVERE':
      case 'SEVERO':
        return <AlertTriangle className={className} aria-hidden="true" />
      case 'MODERATE':
      case 'MODERADO':
        return <Activity className={className} aria-hidden="true" />
      case 'MILD':
      case 'LEVE':
        return <CheckCircle className={className} aria-hidden="true" />
      default:
        return <Activity className={className} aria-hidden="true" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    const time = new Date(`2000-01-01T${timeString}`)
    return time.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const criticalSymptoms = filteredSymptoms.filter(s => s.requiresMedicalAttention)
  const reportedToDoctor = filteredSymptoms.filter(s => s.reportedToDoctor)

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
    <AuthGuard requiredRole="PATIENT">
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Mis Síntomas
              </h1>
              <p className="text-muted-foreground">
                Registro y seguimiento de síntomas (<span className="tabular-nums">{filteredSymptoms.length}</span> {filteredSymptoms.length === 1 ? 'síntoma' : 'síntomas'})
              </p>
            </div>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors h-11 px-6 shadow-sm">
              <Link href="/dashboard/paciente/sintomas/nuevo">
                <Plus className="mr-2 h-5 w-5" />
                Reportar Síntoma
              </Link>
            </Button>
          </div>

          {/* Critical Alerts */}
          {criticalSymptoms.length > 0 && (
            <Card className="border border-destructive shadow-sm bg-gradient-to-br from-destructive/10 to-destructive/5">
              <CardHeader className="border-b border-destructive/30">
                <CardTitle className="flex items-center gap-3 text-destructive text-2xl font-bold">
                  <div className="p-2 rounded-lg bg-destructive/20">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  </div>
                  Atención Médica Requerida
                </CardTitle>
                <CardDescription className="text-destructive font-semibold text-base mt-1">
                  Tienes {criticalSymptoms.length} síntoma(s) que requieren atención médica inmediata
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {criticalSymptoms.slice(0, 3).map((symptom) => (
                    <div key={symptom.id} className="flex items-center justify-between p-4 bg-card border border-destructive/20 rounded-xl hover:border-destructive/40 transition-all">
                      <div>
                        <p className="font-bold text-lg">{symptom.symptomName}</p>
                        <p className="text-sm text-muted-foreground font-medium">
                          {formatDate(symptom.occurrenceDate)} a las {formatTime(symptom.occurrenceTime)}
                        </p>
                      </div>
                      <Badge className={`${getSeverityColor(symptom.severity)} font-semibold inline-flex items-center gap-1`}>
                        <SeverityIcon severity={symptom.severity} className="h-3.5 w-3.5" />
                        {getSeverityText(symptom.severity)}
                      </Badge>
                    </div>
                  ))}
                </div>
                {criticalSymptoms.length > 3 && (
                  <p className="text-sm text-destructive font-semibold mt-4">
                    Y {criticalSymptoms.length - 3} más...
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border border-primary/20 hover:border-primary/40 transition-colors hover:shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" aria-hidden="true"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Total Síntomas</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1 tabular-nums">{symptomsList.length}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true"></span>
                  Síntomas reportados
                </p>
              </CardContent>
            </Card>
            <Card className="border border-destructive/20 hover:border-destructive/40 transition-colors hover:shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full -mr-16 -mt-16" aria-hidden="true"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Críticos</CardTitle>
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-destructive mb-1 tabular-nums">{criticalSymptoms.length}</div>
                <p className="text-xs text-destructive font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse motion-reduce:animate-none" aria-hidden="true"></span>
                  Requieren atención
                </p>
              </CardContent>
            </Card>
            <Card className="border border-chart-2/20 hover:border-chart-2/40 transition-colors hover:shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-chart-2/5 rounded-full -mr-16 -mt-16" aria-hidden="true"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Reportados al Doctor</CardTitle>
                <div className="p-2 rounded-lg bg-chart-2/10">
                  <Activity className="h-5 w-5 text-chart-2" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1 tabular-nums">{reportedToDoctor.length}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-chart-2" aria-hidden="true"></span>
                  Notificados
                </p>
              </CardContent>
            </Card>
            <Card className="border border-chart-5/20 hover:border-chart-5/40 transition-colors hover:shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-chart-5/5 rounded-full -mr-16 -mt-16" aria-hidden="true"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Esta Semana</CardTitle>
                <div className="p-2 rounded-lg bg-chart-5/10">
                  <Calendar className="h-5 w-5 text-chart-5" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1 tabular-nums">
                  {symptomsList.filter(s => {
                    const symptomDate = new Date(s.occurrenceDate)
                    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    return symptomDate >= weekStart
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-chart-5" aria-hidden="true"></span>
                  Últimos 7 días
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="border shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-xl font-bold">Filtros de Búsqueda</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, notas o desencadenantes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 text-base border focus:border-primary"
                  />
                </div>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-full sm:w-[200px] h-12 border">
                    <SelectValue placeholder="Filtrar por severidad" />
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
                  <SelectTrigger className="w-full sm:w-[200px] h-12 border">
                    <SelectValue placeholder="Filtrar por fecha" />
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
            </CardContent>
          </Card>

          {/* Symptoms Table */}
          <Card className="border shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-2xl font-bold">Registro de Síntomas</CardTitle>
              <CardDescription className="mt-1">
                {filteredSymptoms.length} {filteredSymptoms.length === 1 ? 'síntoma encontrado' : 'síntomas encontrados'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {filteredSymptoms.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                    <Activity className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    {searchTerm || severityFilter !== "all" || dateFilter !== "all"
                      ? "No se encontraron síntomas" 
                      : "No has reportado síntomas aún"}
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {searchTerm || severityFilter !== "all" || dateFilter !== "all"
                      ? "Intenta cambiar los filtros de búsqueda" 
                      : "Comienza reportando tus síntomas para ayudar a tu médico"}
                  </p>
                  {!searchTerm && severityFilter === "all" && dateFilter === "all" && (
                    <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors h-11 px-6 shadow-sm">
                      <Link href="/dashboard/paciente/sintomas/nuevo">
                        <Plus className="mr-2 h-5 w-5" />
                        Reportar Primer Síntoma
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Síntoma</TableHead>
                      <TableHead>Severidad</TableHead>
                      <TableHead>Fecha y Hora</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Requiere Atención</TableHead>
                      <TableHead>Reportado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSymptoms.map((symptom) => (
                      <TableRow key={symptom.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{symptom.symptomName}</p>
                            {symptom.notes && (
                              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {symptom.notes}
                              </p>
                            )}
                            {symptom.triggers && (
                              <p className="text-xs text-muted-foreground">
                                Desencadenantes: {symptom.triggers}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getSeverityColor(symptom.severity)} font-semibold inline-flex items-center gap-1`}>
                            <SeverityIcon severity={symptom.severity} className="h-3.5 w-3.5" />
                            {getSeverityText(symptom.severity)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{formatDate(symptom.occurrenceDate)}</p>
                            <p className="text-sm text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTime(symptom.occurrenceTime)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {symptom.durationHours ? `${symptom.durationHours}h` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {symptom.requiresMedicalAttention ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/15 text-destructive border border-destructive/30">
                              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                              Sí
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                              No
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {symptom.reportedToDoctor ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/30">
                              <CheckCircle className="h-3 w-3" aria-hidden="true" />
                              Sí
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                              No
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
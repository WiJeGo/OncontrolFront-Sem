"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import { treatments, doctors } from "@/lib/api"
import type { TreatmentResponse, TreatmentSessionResponse, PatientProfileResponse } from "@/lib/api"
import { isDoctorUser } from "@/types/organization"
import { treatmentTypeLabel } from "@/lib/labels"
import {
  ArrowLeft,
  Activity, 
  Calendar, 
  Clock,
  Heart,
  Pill,
  FileText,
  CheckCircle,
  AlertTriangle,
  User,
  MapPin,
  Edit,
  PlayCircle,
  PauseCircle
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function TreatmentDetailsPage() {
  const { user } = useAuthContext()
  const params = useParams()
  const treatmentId = params.id as string
  
  const [doctorProfileId, setDoctorProfileId] = useState<number | null>(null)
  const [treatment, setTreatment] = useState<TreatmentResponse | null>(null)
  const [sessions, setSessions] = useState<TreatmentSessionResponse[]>([])
  const [patient, setPatient] = useState<PatientProfileResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (user && isDoctorUser(user)) {
      setDoctorProfileId(user.profile.id)
    }
  }, [user])

  useEffect(() => {
    const loadTreatmentData = async () => {
      if (!doctorProfileId) return
      
      setIsLoading(true)
      setError("")
      
      try {
        // Get treatment by ID from doctor's treatments
        const allTreatments = await treatments.getDoctorTreatments(doctorProfileId)
        const treatmentData = allTreatments.find(t => t.id.toString() === treatmentId)
        
        if (!treatmentData) {
          setError("Tratamiento no encontrado")
          setIsLoading(false)
          return
        }
        
        setTreatment(treatmentData)
        
        // Load related data
        const [sessionsData, allPatients] = await Promise.all([
          treatments.getSessions(treatmentData.id).catch(() => []),
          doctors.getPatients(doctorProfileId).catch(() => [])
        ])
        
        setSessions(sessionsData)
        
        // Find patient
        const patientData = allPatients.find(p => p.id === Number(treatmentData.patientProfileId))
        if (patientData) {
          setPatient(patientData)
        }
        
      } catch (err) {
        console.error("Error loading treatment data:", err)
        setError("Error al cargar los datos del tratamiento")
      } finally {
        setIsLoading(false)
      }
    }

    loadTreatmentData()
  }, [doctorProfileId, treatmentId])

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No especificado"
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: es })
    } catch {
      return "Fecha inválida"
    }
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "No especificado"
    try {
      return format(new Date(dateString), "dd MMM yyyy HH:mm", { locale: es })
    } catch {
      return "Fecha inválida"
    }
  }

  const statusPill = (status: string) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
      case "ACTIVO":
        return { label: "Activo", cls: "bg-success/15 text-success" }
      case "COMPLETED":
      case "COMPLETADO":
        return { label: "Completado", cls: "bg-muted text-muted-foreground" }
      case "CANCELLED":
      case "CANCELADO":
        return { label: "Cancelado", cls: "bg-destructive/15 text-destructive" }
      case "SUSPENDED":
      case "PAUSED":
      case "PAUSADO":
        return { label: "Suspendido", cls: "bg-warning/20 text-warning-foreground" }
      case "FOLLOW_UP":
        return { label: "Seguimiento", cls: "bg-chart-2/15 text-chart-2" }
      default:
        return { label: status || "—", cls: "bg-muted text-muted-foreground" }
    }
  }

  const sessionStatusLabel = (status: string) => {
    switch (status?.toUpperCase()) {
      case "SCHEDULED":
      case "PROGRAMADA": return "Programada"
      case "COMPLETED":
      case "COMPLETADA": return "Completada"
      case "CANCELLED":
      case "CANCELADA": return "Cancelada"
      case "IN_PROGRESS":
      case "EN_PROGRESO": return "En curso"
      default: return status
    }
  }

  const getSessionStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "SCHEDULED":
      case "PROGRAMADA":
        return "bg-chart-2/10 text-chart-2"
      case "COMPLETED":
      case "COMPLETADA":
        return "bg-success/10 text-success"
      case "CANCELLED":
      case "CANCELADA":
        return "bg-destructive/10 text-destructive"
      case "IN_PROGRESS":
      case "EN_PROGRESO":
        return "bg-warning/15 text-warning-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const completionPercentage = treatment 
    ? treatment.progressPercentage
    : 0

  if (isLoading) {
    return (
      <AuthGuard requiredRole="DOCTOR">
        <DashboardLayout>
          <Loading />
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (error || !treatment) {
    return (
      <AuthGuard requiredRole="DOCTOR">
        <DashboardLayout>
          <div className="max-w-7xl mx-auto space-y-6">
            <Link href="/dashboard/medico/tratamientos">
              <Button variant="outline" className="border hover:bg-primary hover:text-primary-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a tratamientos
              </Button>
            </Link>
            <Alert variant="destructive" className="border" role="alert">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="font-semibold">
                {error || "Tratamiento no encontrado"}
              </AlertDescription>
            </Alert>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredRole="DOCTOR">
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <Link href="/dashboard/medico/tratamientos">
              <Button variant="outline" className="mb-4 border hover:bg-primary hover:text-primary-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a tratamientos
              </Button>
            </Link>
            
            {/* Treatment Header Card */}
            <Card className="border shadow-sm ">
              <CardHeader className="border-b">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <CardTitle className="flex items-center gap-3 text-xl font-semibold tracking-tight">
                      <div className="rounded-lg bg-primary/10 p-2.5">
                        <Activity className="h-6 w-6 text-primary" />
                      </div>
                      {treatmentTypeLabel(treatment.type)}
                    </CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-3">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${statusPill(treatment.status).cls}`}>
                        {statusPill(treatment.status).label}
                      </span>
                      <span className="text-sm text-muted-foreground">Protocolo: <span className="font-medium text-foreground">{treatment.protocol}</span></span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/medico/tratamientos/${treatment.id}/editar`}>
                      <Button variant="outline" size="sm" className="border hover:bg-primary hover:text-primary-foreground">
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {patient && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border/50">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <Link 
                        href={`/dashboard/medico/pacientes/${patient.id}`}
                        className="text-sm font-semibold hover:text-primary transition-colors"
                      >
                        {patient.firstName} {patient.lastName}
                      </Link>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border/50">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground font-semibold block">Inicio:</span>
                      <span className="text-sm font-semibold">{formatDate(treatment.startDate)}</span>
                    </div>
                  </div>
                  {treatment.endDate && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border/50">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground font-semibold block">Fin:</span>
                        <span className="text-sm font-semibold">{formatDate(treatment.endDate)}</span>
                      </div>
                    </div>
                  )}
                  {treatment.location && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border/50">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm font-semibold">{treatment.location}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Stats — connected KPI strip */}
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border shadow-sm md:grid-cols-3">
            <div className="bg-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <span className="rounded-md bg-primary/10 p-1.5 text-primary"><Activity className="h-4 w-4" /></span>
                  Progreso
                </div>
                <span className="font-mono text-2xl font-semibold tabular-nums text-primary">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="mt-3 h-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                Ciclo <span className="font-mono tabular-nums">{treatment.currentCycle}</span> de{" "}
                <span className="font-mono tabular-nums">{treatment.totalCycles}</span>
              </p>
            </div>
            <div className="bg-card p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className="rounded-md bg-chart-2/10 p-1.5 text-chart-2"><Calendar className="h-4 w-4" /></span>
                Sesiones programadas
              </div>
              <div className="mt-2 font-mono text-3xl font-semibold tabular-nums text-foreground">
                {sessions.filter(s => s.status === 'SCHEDULED' || s.status === 'PROGRAMADA').length}
              </div>
            </div>
            <div className="bg-card p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className="rounded-md bg-chart-5/10 p-1.5 text-chart-5"><CheckCircle className="h-4 w-4" /></span>
                Sesiones completadas
              </div>
              <div className="mt-2 font-mono text-3xl font-semibold tabular-nums text-foreground">
                {sessions.filter(s => s.status === 'COMPLETED' || s.status === 'COMPLETADA').length}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="details" className="space-y-4">
            <TabsList>
              <TabsTrigger value="details">Detalles</TabsTrigger>
              <TabsTrigger value="sessions">Sesiones ({sessions.length})</TabsTrigger>
              <TabsTrigger value="medications">Medicamentos</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Treatment Information */}
                <Card className="border shadow-sm">
                  <CardHeader className="border-b">
                    <CardTitle className="text-base font-semibold flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Heart className="h-6 w-6 text-primary" />
                      </div>
                      Información del Tratamiento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Tipo de Tratamiento</p>
                      <p className="font-semibold">{treatmentTypeLabel(treatment.type)}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Protocolo</p>
                      <p className="font-semibold">{treatment.protocol}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Estado</p>
                      <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${statusPill(treatment.status).cls}`}>
                        {statusPill(treatment.status).label}
                      </span>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Ciclos</p>
                      <p className="font-semibold">
                        {treatment.currentCycle} / {treatment.totalCycles}
                      </p>
                    </div>
                    {treatment.sessionDurationMinutes && (
                      <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
                        <p className="text-sm font-semibold text-muted-foreground mb-1">Duración por Sesión</p>
                        <p className="font-semibold">{treatment.sessionDurationMinutes} minutos</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Dates and Location */}
                <Card className="border shadow-sm">
                  <CardHeader className="border-b">
                    <CardTitle className="text-base font-semibold flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-chart-2/10">
                        <Calendar className="h-6 w-6 text-chart-2" />
                      </div>
                      Fechas y Ubicación
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Fecha de Inicio</p>
                      <p className="font-semibold">{formatDate(treatment.startDate)}</p>
                    </div>
                    {treatment.endDate && (
                      <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
                        <p className="text-sm font-semibold text-muted-foreground mb-1">Fecha de Finalización</p>
                        <p className="font-semibold">{formatDate(treatment.endDate)}</p>
                      </div>
                    )}
                    {treatment.nextSession && (
                      <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
                        <p className="text-sm font-semibold text-muted-foreground mb-1">Próxima Sesión</p>
                        <p className="font-semibold">{formatDate(treatment.nextSession)}</p>
                      </div>
                    )}
                    {treatment.location && (
                      <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
                        <p className="text-sm font-semibold text-muted-foreground mb-1">Ubicación</p>
                        <p className="font-semibold">{treatment.location}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Notes */}
                {treatment.notes && (
                  <Card className="lg:col-span-2 border shadow-sm">
                    <CardHeader className="border-b">
                      <CardTitle className="text-base font-semibold flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-chart-5/10">
                          <FileText className="h-6 w-6 text-chart-5" />
                        </div>
                        Notas del Tratamiento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <p className="text-base leading-relaxed">{treatment.notes}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Preparation Instructions */}
                {treatment.preparationInstructions && (
                  <Card className="lg:col-span-2 border shadow-sm border-primary/20">
                    <CardHeader className="border-b ">
                      <CardTitle className="text-base font-semibold flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/20">
                          <AlertTriangle className="h-6 w-6 text-primary" />
                        </div>
                        Instrucciones de Preparación
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <p className="text-base leading-relaxed">{treatment.preparationInstructions}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Patient Information */}
                {patient && (
                  <Card className="lg:col-span-2 border shadow-sm">
                    <CardHeader className="border-b">
                      <CardTitle className="text-base font-semibold flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-chart-2/10">
                          <User className="h-6 w-6 text-chart-2" />
                        </div>
                        Información del Paciente
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
                          <p className="text-sm font-semibold text-muted-foreground mb-1">Nombre</p>
                          <Link 
                            href={`/dashboard/medico/pacientes/${patient.id}`}
                            className="font-semibold hover:text-primary transition-colors"
                          >
                            {patient.firstName} {patient.lastName}
                          </Link>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
                          <p className="text-sm font-semibold text-muted-foreground mb-1">ID</p>
                          <code className="text-sm bg-background px-3 py-1.5 rounded-lg border font-semibold">
                            {patient.profileId}
                          </code>
                        </div>
                        {patient.cancerType && (
                          <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
                            <p className="text-sm font-semibold text-muted-foreground mb-1">Tipo de Cáncer</p>
                            <p className="font-semibold">{patient.cancerType}</p>
                          </div>
                        )}
                        {patient.cancerStage && (
                          <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
                            <p className="text-sm font-semibold text-muted-foreground mb-1">Etapa</p>
                            <p className="font-semibold">{patient.cancerStage}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Sessions Tab */}
            <TabsContent value="sessions" className="space-y-6">
              <Card className="border shadow-sm">
                <CardHeader className="border-b">
                  <CardTitle className="text-base font-semibold flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    Sesiones del Tratamiento
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {sessions.length === 0 ? (
                    <div className="py-12 text-center">
                      <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-semibold text-muted-foreground">No hay sesiones registradas</p>
                      <p className="text-sm text-muted-foreground mt-2">Las sesiones de este tratamiento aparecerán aquí</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sessions
                        .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
                        .map((session) => (
                          <Card key={session.id} className="border hover:border-primary/40 hover:shadow-md transition-all">
                            <CardContent className="p-6">
                              <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-3">
                                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${getSessionStatusColor(session.status)}`}>
                                        {sessionStatusLabel(session.status)}
                                      </span>
                                      <span className="font-semibold">
                                        Sesión #{session.sessionNumber}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        <span className="font-medium">{formatDateTime(session.sessionDate)}</span>
                                      </div>
                                      {session.durationMinutes && (
                                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                                          <Clock className="h-4 w-4 text-primary" />
                                          <span className="font-medium">{session.durationMinutes} min</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="p-2 rounded-lg bg-muted/50">
                                    {session.status === 'COMPLETED' || session.status === 'COMPLETADA' ? (
                                      <CheckCircle className="h-6 w-6 text-success" />
                                    ) : session.status === 'IN_PROGRESS' || session.status === 'EN_PROGRESO' ? (
                                      <PlayCircle className="h-6 w-6 text-warning-foreground" />
                                    ) : session.status === 'CANCELLED' || session.status === 'CANCELADA' ? (
                                      <AlertTriangle className="h-6 w-6 text-destructive" />
                                    ) : (
                                      <PauseCircle className="h-6 w-6 text-chart-2" />
                                    )}
                                  </div>
                                </div>
                                
                                {session.notes && (
                                  <div className="p-4 bg-muted/50 rounded-xl border border-border/50">
                                    <p className="text-xs font-semibold text-muted-foreground mb-2">Notas:</p>
                                    <p className="text-sm font-medium">{session.notes}</p>
                                  </div>
                                )}
                                
                                {session.sideEffects && session.sideEffects.length > 0 && (
                                  <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/20">
                                    <p className="text-xs font-semibold text-destructive mb-2">Efectos Secundarios:</p>
                                    <p className="text-sm font-medium text-destructive">{session.sideEffects.join(', ')}</p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Medications Tab */}
            <TabsContent value="medications" className="space-y-6">
              <Card className="border shadow-sm">
                <CardHeader className="border-b">
                  <CardTitle className="text-base font-semibold flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Pill className="h-6 w-6 text-primary" />
                    </div>
                    Medicamentos del Tratamiento
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {treatment.medications && treatment.medications.length > 0 ? (
                    <div className="space-y-3">
                      {treatment.medications.map((medication, index) => (
                        <div 
                          key={index}
                          className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-border/50 hover:border-primary/40 transition-all"
                        >
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Pill className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-semibold">{medication}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <Pill className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-semibold text-muted-foreground">No hay medicamentos registrados</p>
                      <p className="text-sm text-muted-foreground mt-2">Los medicamentos de este tratamiento aparecerán aquí</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}


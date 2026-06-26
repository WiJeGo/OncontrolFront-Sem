"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import { medicalHistory } from "@/lib/api"
import type { HistoryEntryResponse, AllergyResponse } from "@/lib/api"
import { isPatientUser } from "@/types/organization"
import { 
  FileText, 
  Heart, 
  Activity, 
  Stethoscope,
  AlertTriangle,
  Calendar
} from "lucide-react"

// Matches the backend MedicalHistoryType enum.
const typeNames: Record<string, string> = {
  DIAGNOSIS: "Diagnóstico",
  CONSULTATION: "Consulta",
  TREATMENT: "Tratamiento",
  TEST_RESULT: "Resultado de examen",
  HOSPITALIZATION: "Hospitalización",
  SURGERY: "Cirugía",
  EMERGENCY: "Emergencia",
  FOLLOW_UP: "Seguimiento",
  REFERRAL: "Derivación",
  PRESCRIPTION: "Receta",
  VACCINATION: "Vacunación",
  ALLERGY: "Alergia",
  OTHER: "Otro",
}

// Allergy severity comes from the backend as LOW/MEDIUM/HIGH/CRITICAL; older
// values (MILD/…/LIFE_THREATENING) kept for safety.
const severityNames: Record<string, string> = {
  LOW: "Leve",
  MEDIUM: "Moderada",
  HIGH: "Alta",
  CRITICAL: "Crítica",
  MILD: "Leve",
  MODERATE: "Moderada",
  SEVERE: "Severa",
  LIFE_THREATENING: "Riesgo de vida",
}

const allergySeverityPill = (s?: string) => {
  switch ((s || "").toUpperCase()) {
    case "CRITICAL":
    case "LIFE_THREATENING":
      return "bg-destructive/15 text-destructive"
    case "HIGH":
    case "SEVERE":
      return "bg-severe/15 text-severe"
    case "MEDIUM":
    case "MODERATE":
      return "bg-warning/20 text-warning-foreground"
    case "LOW":
    case "MILD":
      return "bg-success/15 text-success"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export default function HistorialPage() {
  const { user } = useAuthContext()
  const [patientProfileId, setPatientProfileId] = useState<number | null>(null)
  const [historyEntries, setHistoryEntries] = useState<HistoryEntryResponse[]>([])
  const [allergies, setAllergies] = useState<AllergyResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("historial")
  const [filtroTipo, setFiltroTipo] = useState<string>("todos")

  useEffect(() => {
    if (user && isPatientUser(user)) {
      setPatientProfileId(user.profile.id)
    }
  }, [user])

  useEffect(() => {
    const loadHistory = async () => {
      if (!patientProfileId) return

      try {
        setIsLoading(true)
        setError(null)

        const [history, allergyData] = await Promise.all([
          medicalHistory.getHistory(patientProfileId),
          medicalHistory.getAllergies(patientProfileId)
        ])

        setHistoryEntries(history)
        setAllergies(allergyData)
      } catch (err) {
        console.error('Error loading medical history:', err)
        setError('Error al cargar el historial médico')
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [patientProfileId])

  if (isLoading) {
    return (
      <AuthGuard requiredRole="PATIENT">
        <DashboardLayout>
          <Loading message="Cargando historial médico..." />
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

  const filteredHistory = filtroTipo === "todos" 
    ? historyEntries 
    : historyEntries.filter((entry) => entry.type === filtroTipo)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "DIAGNOSIS":
      case "CONSULTATION":
        return <Stethoscope className="w-4 h-4" />
      case "TREATMENT":
        return <Heart className="w-4 h-4" />
      case "TEST_RESULT":
        return <FileText className="w-4 h-4" />
      case "SURGERY":
      case "EMERGENCY":
        return <Activity className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "DIAGNOSIS":
      case "CONSULTATION":
        return "bg-chart-2/15 text-chart-2"
      case "TREATMENT":
        return "bg-primary/15 text-primary"
      case "TEST_RESULT":
        return "bg-success/15 text-success"
      case "SURGERY":
      case "EMERGENCY":
        return "bg-destructive/15 text-destructive"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <AuthGuard requiredRole="PATIENT">
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Historial médico</h1>
            <p className="text-sm text-muted-foreground">Registro completo de tu atención médica</p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="historial">Historial</TabsTrigger>
              <TabsTrigger value="alergias">
                Alergias ({allergies.length})
              </TabsTrigger>
            </TabsList>

            {/* Medical History Tab */}
            <TabsContent value="historial" className="space-y-4">
              {/* Filter chips */}
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "todos", label: "Todos" },
                  { value: "DIAGNOSIS", label: "Diagnósticos" },
                  { value: "CONSULTATION", label: "Consultas" },
                  { value: "TREATMENT", label: "Tratamientos" },
                  { value: "TEST_RESULT", label: "Exámenes" },
                  { value: "SURGERY", label: "Cirugías" },
                ].map((opt) => {
                  const count =
                    opt.value === "todos"
                      ? historyEntries.length
                      : historyEntries.filter((e) => e.type === opt.value).length
                  const active = filtroTipo === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setFiltroTipo(opt.value)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                        active
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {opt.label} <span className="tabular-nums opacity-70">{count}</span>
                    </button>
                  )
                })}
              </div>

              {/* History Entries */}
              {filteredHistory.length === 0 ? (
                <Card className="border shadow-sm">
                  <CardContent className="py-16 text-center">
                    <div className="relative mx-auto mb-4 grid h-20 w-20 place-items-center">
                      <span className="absolute inset-0 rounded-full bg-primary/5" aria-hidden="true" />
                      <span className="absolute inset-[10px] rounded-full bg-primary/10" aria-hidden="true" />
                      <FileText className="relative h-8 w-8 text-primary/70" aria-hidden="true" />
                    </div>
                    <h3 className="mb-1 font-semibold text-foreground">Sin registros en tu historial</h3>
                    <p className="text-sm text-muted-foreground">Las entradas aparecerán aquí cuando tengas registros médicos.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {filteredHistory.map((entry) => (
                    <Card key={entry.id} className="border shadow-sm hover:border-primary/40 hover:shadow-md transition-all">
                      <CardHeader className="border-b">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${getTypeColor(entry.type)}`}>
                              {getTypeIcon(entry.type)}
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-base font-semibold">{entry.title}</CardTitle>
                              <CardDescription className="text-sm">{entry.doctorName}</CardDescription>
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <Badge className={`${getTypeColor(entry.type)} border font-semibold`}>
                              {typeNames[entry.type] || entry.type}
                            </Badge>
                            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1 justify-end">
                              <Calendar className="w-4 h-4 text-primary" />
                              {new Date(entry.date).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        {/* Description */}
                        {entry.description && (
                          <Alert className="border bg-card">
                            <FileText className="h-5 w-5 text-primary" />
                            <AlertDescription className="font-medium">{entry.description}</AlertDescription>
                          </Alert>
                        )}

                        {/* Documents */}
                        {entry.documents.length > 0 && (
                          <div className="p-4 bg-muted/50 rounded-xl border border-border/50">
                            <p className="text-sm font-bold mb-3 text-foreground">Documentos adjuntos:</p>
                            <div className="flex flex-wrap gap-2">
                              {entry.documents.map((doc, index) => (
                                <Badge key={index} variant="outline" className="border font-semibold">
                                  <FileText className="w-3 h-3 mr-1" />
                                  {doc}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Allergies Tab */}
            <TabsContent value="alergias" className="space-y-6">
              {allergies.length === 0 ? (
                <Card className="border shadow-sm">
                  <CardContent className="py-16 text-center">
                    <div className="relative mx-auto mb-4 grid h-20 w-20 place-items-center">
                      <span className="absolute inset-0 rounded-full bg-success/5" aria-hidden="true" />
                      <span className="absolute inset-[10px] rounded-full bg-success/10" aria-hidden="true" />
                      <AlertTriangle className="relative h-8 w-8 text-success/70" aria-hidden="true" />
                    </div>
                    <h3 className="mb-1 font-semibold text-foreground">Sin alergias registradas</h3>
                    <p className="text-sm text-muted-foreground">Las alergias aparecerán aquí cuando estén registradas.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {allergies.map((allergy) => (
                    <Card key={allergy.id} className="border shadow-sm hover:border-destructive/40 hover:shadow-md transition-all">
                      <CardHeader className="border-b">
                        <div className="flex items-start justify-between gap-4">
                          <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-destructive/10">
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            </span>
                            {allergy.allergen}
                          </CardTitle>
                          <span
                            className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium ${allergySeverityPill(allergy.severity)}`}
                          >
                            {severityNames[allergy.severity] || allergy.severity}
                          </span>
                        </div>
                        <CardDescription className="mt-1 font-medium text-base">{allergy.type}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        {allergy.reaction && (
                          <div className="mb-4 p-4 bg-muted/50 rounded-xl border border-border/50">
                            <p className="text-sm font-bold mb-2 text-foreground">Reacción:</p>
                            <p className="text-sm text-muted-foreground font-medium">{allergy.reaction}</p>
                          </div>
                        )}
                        {allergy.diagnosedDate && (
                          <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            Diagnosticada: {new Date(allergy.diagnosedDate).toLocaleDateString('es-ES')}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

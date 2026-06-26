"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import { medications } from "@/lib/api"
import type { MedicationResponse, UpcomingDoseResponse } from "@/lib/api"
import { isPatientUser } from "@/types/organization"
import { Pill, Clock, CheckCircle, Info, Calendar } from "lucide-react"

const routeNames: Record<string, string> = {
  ORAL: "Oral",
  INTRAVENOUS: "Intravenosa",
  INTRAMUSCULAR: "Intramuscular",
  SUBCUTANEOUS: "Subcutánea",
  TOPICAL: "Tópica"
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

export default function MedicamentosPage() {
  const { user } = useAuthContext()
  const [patientProfileId, setPatientProfileId] = useState<number | null>(null)
  const [medicationsList, setMedicationsList] = useState<MedicationResponse[]>([])
  const [upcomingDoses, setUpcomingDoses] = useState<UpcomingDoseResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && isPatientUser(user)) {
      setPatientProfileId(user.profile.id)
    }
  }, [user])

  useEffect(() => {
    const loadMedications = async () => {
      if (!patientProfileId) return

      try {
        setIsLoading(true)
        setError(null)

        const [activeMeds, doses] = await Promise.all([
          medications.getPatientActive(patientProfileId),
          medications.getUpcomingDoses(patientProfileId, 1) // Next 24 hours
        ])

        setMedicationsList(activeMeds)
        setUpcomingDoses(doses)
      } catch (err) {
        console.error('Error loading medications:', err)
        setError('Error al cargar los medicamentos')
      } finally {
        setIsLoading(false)
      }
    }

    loadMedications()
  }, [patientProfileId])

  const handleMarkDoseTaken = async (medicationId: number) => {
    if (!patientProfileId) return

    try {
      await medications.markDoseTaken(medicationId, {
        takenAt: new Date().toISOString(),
        notes: 'Dosis tomada'
      })

      // Reload doses
      const doses = await medications.getUpcomingDoses(patientProfileId, 1)
      setUpcomingDoses(doses)
    } catch (err) {
      console.error('Error marking dose as taken:', err)
    }
  }

  if (isLoading) {
    return (
      <AuthGuard requiredRole="PATIENT">
        <DashboardLayout>
          <Loading message="Cargando medicamentos..." />
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
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Mis medicamentos</h1>
            <p className="text-sm text-muted-foreground">Gestiona tus medicamentos y recordatorios</p>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-3 divide-x divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {[
              { label: "Activos", value: medicationsList.length, sub: "Medicamentos", icon: Pill, tint: "bg-primary/10 text-primary", tile: "bg-primary/[0.06]" },
              { label: "Próximas 24h", value: upcomingDoses.length, sub: "Dosis", icon: Clock, tint: "bg-chart-2/10 text-chart-2", tile: "bg-chart-2/[0.06]" },
              { label: "Pendientes", value: upcomingDoses.filter((d) => !d.taken).length, sub: "Por tomar", icon: CheckCircle, tint: "bg-warning/15 text-warning-foreground", tile: "bg-warning/[0.06]" },
            ].map((kpi) => (
              <div key={kpi.label} className={`p-5 ${kpi.tile}`}>
                <div className="mb-3 flex items-center gap-2 text-[13px] text-muted-foreground">
                  <span className={`grid h-7 w-7 place-items-center rounded-lg ${kpi.tint}`}>
                    <kpi.icon className="h-4 w-4" />
                  </span>
                  <span className="hidden sm:inline">{kpi.label}</span>
                </div>
                <CountUp value={kpi.value} className="font-mono text-3xl font-semibold tabular-nums text-foreground" />
                <div className="mt-1 text-xs text-muted-foreground">{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* Upcoming Doses */}
          {upcomingDoses.length > 0 && (
            <Card className="border shadow-sm">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Clock className="h-4 w-4 text-primary" />
                  Próximas dosis
                </CardTitle>
                <CardDescription className="mt-0.5">Medicamentos a tomar en las próximas 24 horas</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {upcomingDoses.map((dose) => (
                    <div
                      key={`${dose.medicationId}-${dose.scheduledTime}`}
                      className={`flex items-center justify-between p-5 border rounded-xl transition-colors ${
                        dose.taken ? 'bg-muted/50 border-border' : 'bg-card border-border hover:border-primary/40 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${dose.taken ? 'bg-success/15' : 'bg-warning/15'}`}>
                          {dose.taken ? (
                            <CheckCircle className="w-6 h-6 text-success" aria-hidden="true" />
                          ) : (
                            <Clock className="w-6 h-6 text-warning-foreground" aria-hidden="true" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-lg text-foreground">{dose.medicationName}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium mt-1">
                            <span className="font-mono tabular-nums">{dose.dosage}</span>
                            <span aria-hidden="true">•</span>
                            <span className="tabular-nums">{new Date(dose.scheduledTime).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                        </div>
                      </div>
                      {!dose.taken && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkDoseTaken(dose.medicationId)}
                          className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all h-10 px-5 shadow-sm"
                        >
                          Marcar como Tomada
                        </Button>
                      )}
                      {dose.taken && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/30">
                          <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                          Tomada
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Medications */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Pill className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Medicamentos activos</h2>
            </div>

            {medicationsList.length === 0 ? (
              <Card className="border shadow-sm">
                <CardContent className="py-16 text-center">
                  <div className="relative mx-auto mb-4 grid h-20 w-20 place-items-center">
                    <span className="absolute inset-0 rounded-full bg-primary/5" aria-hidden="true" />
                    <span className="absolute inset-[10px] rounded-full bg-primary/10" aria-hidden="true" />
                    <Pill className="relative h-8 w-8 text-primary/70" aria-hidden="true" />
                  </div>
                  <h3 className="mb-1 font-semibold text-foreground">Sin medicamentos activos</h3>
                  <p className="text-sm text-muted-foreground">Aparecerán aquí cuando tu médico te los prescriba.</p>
                </CardContent>
              </Card>
            ) : (
              medicationsList.map((medication) => (
                <Card key={medication.id} className="border shadow-sm hover:border-primary/30 transition-colors">
                  <CardHeader className="border-b bg-muted/30">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-3 text-xl font-semibold mb-1">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Pill className="w-5 h-5 text-primary" />
                          </div>
                          {medication.name}
                        </CardTitle>
                        <CardDescription>
                          Prescrito por {medication.doctorName}
                        </CardDescription>
                      </div>
                      {medication.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-success" aria-hidden="true" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                          {medication.status}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Dosage Information */}
                    <dl className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                      <div className="px-6 py-4">
                        <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dosis</dt>
                        <dd className="mt-1 text-lg font-semibold text-foreground font-mono tabular-nums">{medication.dosage}</dd>
                      </div>
                      <div className="px-6 py-4 border-t md:border-t-0">
                        <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Frecuencia</dt>
                        <dd className="mt-1 text-lg font-semibold text-foreground">{medication.frequency}</dd>
                      </div>
                      <div className="px-6 py-4 border-t md:border-t-0">
                        <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vía</dt>
                        <dd className="mt-1 text-lg font-semibold text-foreground">
                          {medication.route ? (routeNames[medication.route] || medication.route) : 'No especificada'}
                        </dd>
                      </div>
                    </dl>

                    <div className="px-6 py-4 border-t space-y-4">
                      {/* Date Information */}
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                        <div className="inline-flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                          <span className="text-muted-foreground">Inicio:</span>
                          <span className="font-medium text-foreground tabular-nums">
                            {new Date(medication.startDate).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                        {medication.endDate && (
                          <div className="inline-flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                            <span className="text-muted-foreground">Fin:</span>
                            <span className="font-medium text-foreground tabular-nums">
                              {new Date(medication.endDate).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Instructions */}
                      {medication.instructions && (
                        <Alert>
                          <Info className="h-4 w-4 text-primary" />
                          <AlertDescription>
                            <span className="font-semibold">Instrucciones: </span>
                            {medication.instructions}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Side Effects */}
                      {medication.sideEffects && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Posibles efectos secundarios</p>
                          <p className="text-sm text-foreground">{medication.sideEffects}</p>
                        </div>
                      )}

                      {/* Next Refill */}
                      {medication.nextRefillDate && (
                        <div className="pt-3 border-t flex items-baseline gap-2">
                          <span className="text-sm text-muted-foreground">Próximo resurtido:</span>
                          <span className="font-semibold text-primary tabular-nums">
                            {new Date(medication.nextRefillDate).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      )}
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

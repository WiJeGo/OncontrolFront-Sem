"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import { appointments } from "@/lib/api"
import type { AppointmentResponse } from "@/lib/api"
import { isDoctorUser } from "@/types/organization"
import { Search, Plus, MoreHorizontal, Eye, Calendar, Clock, MapPin, Check, CheckCircle, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
      return { label: "Confirmada", className: "bg-success/15 text-success" }
    case "SCHEDULED":
    case "PROGRAMADA":
    case "PENDIENTE":
      return { label: "Programada", className: "bg-chart-2/15 text-chart-2" }
    case "COMPLETED":
    case "COMPLETADA":
      return { label: "Completada", className: "bg-muted text-muted-foreground" }
    case "CANCELLED":
    case "CANCELADA":
      return { label: "Cancelada", className: "bg-destructive/15 text-destructive" }
    case "IN_PROGRESS":
      return { label: "En curso", className: "bg-warning/20 text-warning-foreground" }
    default:
      return { label: status || "N/A", className: "bg-muted text-muted-foreground" }
  }
}

export default function AppointmentsPage() {
  const { user } = useAuthContext()
  const { toast } = useToast()
  const [doctorProfileId, setDoctorProfileId] = useState<number | null>(null)
  const [appointmentsList, setAppointmentsList] = useState<AppointmentResponse[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<AppointmentResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")

  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [rescheduleTime, setRescheduleTime] = useState("")
  const [rescheduleReason, setRescheduleReason] = useState("")
  const [isRescheduling, setIsRescheduling] = useState(false)

  useEffect(() => {
    if (user && isDoctorUser(user)) {
      setDoctorProfileId(user.profile.id)
    }
  }, [user])

  useEffect(() => {
    const loadAppointments = async () => {
      if (!doctorProfileId) return
      try {
        setIsLoading(true)
        setError(null)
        const data = await appointments.getDoctorAppointments(doctorProfileId)
        setAppointmentsList(data)
        setFilteredAppointments(data)
      } catch (err) {
        console.error("Error loading appointments:", err)
        setError("Error al cargar las citas")
      } finally {
        setIsLoading(false)
      }
    }
    loadAppointments()
  }, [doctorProfileId])

  useEffect(() => {
    let filtered = appointmentsList
    if (searchTerm) {
      filtered = filtered.filter(
        (appointment) =>
          appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          appointment.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          appointment.notes?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((appointment) => appointment.status === statusFilter)
    }
    if (dateFilter !== "all") {
      const today = new Date()
      filtered = filtered.filter((appointment) => {
        const appointmentDate = new Date(appointment.appointmentDate)
        switch (dateFilter) {
          case "today":
            return appointmentDate.toDateString() === today.toDateString()
          case "tomorrow": {
            const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
            return appointmentDate.toDateString() === tomorrow.toDateString()
          }
          case "thisWeek": {
            const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
            return appointmentDate >= today && appointmentDate <= weekEnd
          }
          default:
            return true
        }
      })
    }
    filtered = [...filtered].sort(
      (a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime(),
    )
    setFilteredAppointments(filtered)
  }, [appointmentsList, searchTerm, statusFilter, dateFilter])

  const refreshList = async () => {
    if (!doctorProfileId) return
    const updatedList = await appointments.getDoctorAppointments(doctorProfileId)
    setAppointmentsList(updatedList)
  }

  const handleConfirmAppointment = async (id: number) => {
    try {
      await appointments.updateStatus(id, "CONFIRMED")
      await refreshList()
      toast({ title: "Cita confirmada", description: "La cita ha sido confirmada exitosamente" })
    } catch {
      toast({ title: "Error", description: "No se pudo confirmar la cita", variant: "destructive" })
    }
  }

  const handleCompleteAppointment = async (id: number) => {
    try {
      await appointments.updateStatus(id, "COMPLETED")
      await refreshList()
      toast({ title: "Cita completada", description: "La cita ha sido marcada como completada" })
    } catch {
      toast({ title: "Error", description: "No se pudo completar la cita", variant: "destructive" })
    }
  }

  const handleCancelAppointment = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas cancelar esta cita?")) return
    try {
      await appointments.updateStatus(id, "CANCELLED")
      await refreshList()
      toast({ title: "Cita cancelada", description: "La cita ha sido cancelada" })
    } catch {
      toast({ title: "Error", description: "No se pudo cancelar la cita", variant: "destructive" })
    }
  }

  const handleRescheduleAppointment = (id: number) => {
    setSelectedAppointmentId(id)
    setRescheduleDialogOpen(true)
  }

  const handleRescheduleSubmit = async () => {
    if (!selectedAppointmentId || !rescheduleDate || !rescheduleTime) {
      toast({ title: "Error", description: "Por favor completa la fecha y hora", variant: "destructive" })
      return
    }
    setIsRescheduling(true)
    try {
      const [hours, minutes] = rescheduleTime.split(":")
      const newDateTime = new Date(rescheduleDate)
      newDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      await appointments.reschedule(selectedAppointmentId, newDateTime.toISOString(), rescheduleReason)
      await refreshList()
      toast({ title: "Cita reprogramada", description: "La cita ha sido reprogramada exitosamente" })
      setRescheduleDialogOpen(false)
      setSelectedAppointmentId(null)
      setRescheduleDate("")
      setRescheduleTime("")
      setRescheduleReason("")
    } catch {
      toast({ title: "Error", description: "No se pudo reprogramar la cita", variant: "destructive" })
    } finally {
      setIsRescheduling(false)
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("es-ES", { weekday: "short", month: "short", day: "numeric" })
  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })

  if (isLoading) {
    return (
      <AuthGuard requiredRole="DOCTOR">
        <DashboardLayout>
          <Loading message="Cargando citas..." />
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard requiredRole="DOCTOR">
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

  const today = new Date()
  const kpis = [
    {
      label: "Total citas",
      value: appointmentsList.length,
      sub: "Registradas",
      icon: Calendar,
      tint: "bg-primary/10 text-primary",
      tile: "bg-primary/[0.06]",
    },
    {
      label: "Hoy",
      value: appointmentsList.filter((a) => new Date(a.appointmentDate).toDateString() === today.toDateString()).length,
      sub: "Citas de hoy",
      icon: Clock,
      tint: "bg-chart-2/10 text-chart-2",
      tile: "bg-chart-2/[0.06]",
    },
    {
      label: "Confirmadas",
      value: appointmentsList.filter((a) => a.status === "CONFIRMED").length,
      sub: "Listas",
      icon: CheckCircle,
      tint: "bg-success/10 text-success",
      tile: "bg-success/[0.06]",
    },
    {
      label: "Pendientes",
      value: appointmentsList.filter((a) => a.status === "SCHEDULED").length,
      sub: "Por confirmar",
      icon: Clock,
      tint: "bg-warning/15 text-warning-foreground",
      tile: "bg-warning/[0.06]",
    },
  ]

  return (
    <AuthGuard requiredRole="DOCTOR">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Citas</h1>
              <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                {filteredAppointments.length} {filteredAppointments.length === 1 ? "cita" : "citas"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="h-10 border-border px-4 hover:bg-muted">
                <Link href="/dashboard/medico/calendario">
                  <Calendar className="mr-1.5 h-4 w-4" />
                  Calendario
                </Link>
              </Button>
              <Button asChild className="h-10 bg-primary px-4 text-primary-foreground shadow-sm hover:bg-primary/90">
                <Link href="/dashboard/medico/citas/nueva">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Nueva cita
                </Link>
              </Button>
            </div>
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

          {/* Table panel */}
          <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por paciente, tipo o notas…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 border-border pl-9"
                  aria-label="Buscar citas"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 w-full border-border sm:w-44">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="SCHEDULED">Programadas</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmadas</SelectItem>
                  <SelectItem value="COMPLETED">Completadas</SelectItem>
                  <SelectItem value="CANCELLED">Canceladas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-10 w-full border-border sm:w-40">
                  <SelectValue placeholder="Fecha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las fechas</SelectItem>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="tomorrow">Mañana</SelectItem>
                  <SelectItem value="thisWeek">Esta semana</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredAppointments.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <div className="relative mx-auto mb-4 grid h-20 w-20 place-items-center">
                  <span className="absolute inset-0 rounded-full bg-primary/5" aria-hidden="true" />
                  <span className="absolute inset-[10px] rounded-full bg-primary/10" aria-hidden="true" />
                  <Calendar className="relative h-8 w-8 text-primary/70" aria-hidden="true" />
                </div>
                <h3 className="mb-1 font-semibold text-foreground">
                  {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                    ? "Sin resultados"
                    : "No hay citas programadas"}
                </h3>
                <p className="mx-auto mb-5 max-w-sm text-sm text-muted-foreground">
                  {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                    ? "Prueba cambiando los filtros de búsqueda."
                    : "Programa una cita para tus pacientes."}
                </p>
                {!searchTerm && statusFilter === "all" && dateFilter === "all" && (
                  <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/dashboard/medico/citas/nueva">
                      <Plus className="mr-1.5 h-4 w-4" />
                      Programar primera cita
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Paciente</TableHead>
                      <TableHead>Fecha y hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.map((appointment) => {
                      const pill = statusPill(appointment.status)
                      return (
                        <TableRow key={appointment.id}>
                          <TableCell>
                            <p className="font-medium text-foreground">{appointment.patientName}</p>
                            {appointment.notes && (
                              <p className="max-w-[200px] truncate text-xs text-muted-foreground">{appointment.notes}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-foreground">{formatDate(appointment.appointmentDate)}</p>
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              <span className="font-mono tabular-nums">{formatTime(appointment.appointmentDate)}</span>
                            </p>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-foreground">{appointment.type}</span>
                          </TableCell>
                          <TableCell className="tabular-nums text-muted-foreground">
                            {appointment.durationMinutes} min
                          </TableCell>
                          <TableCell>
                            {appointment.location ? (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                                <span className="max-w-[150px] truncate">{appointment.location}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${pill.className}`}>
                              {pill.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Acciones</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl">
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/medico/citas/${appointment.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Ver detalles
                                  </Link>
                                </DropdownMenuItem>
                                {appointment.status === "SCHEDULED" && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleConfirmAppointment(appointment.id)}>
                                      <Check className="mr-2 h-4 w-4" />
                                      Confirmar cita
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleRescheduleAppointment(appointment.id)}>
                                      <Calendar className="mr-2 h-4 w-4" />
                                      Reprogramar
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {appointment.status === "CONFIRMED" && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleCompleteAppointment(appointment.id)}>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Marcar completada
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleRescheduleAppointment(appointment.id)}>
                                      <Calendar className="mr-2 h-4 w-4" />
                                      Reprogramar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => handleCancelAppointment(appointment.id)}
                                    >
                                      <X className="mr-2 h-4 w-4" />
                                      Cancelar cita
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          {/* Reschedule dialog */}
          <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reprogramar cita</DialogTitle>
                <DialogDescription>Selecciona la nueva fecha y hora para la cita.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="reschedule-date">Nueva fecha</Label>
                  <Input
                    id="reschedule-date"
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reschedule-time">Nueva hora</Label>
                  <Input
                    id="reschedule-time"
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reschedule-reason">Razón (opcional)</Label>
                  <Textarea
                    id="reschedule-reason"
                    placeholder="Motivo de la reprogramación…"
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setRescheduleDialogOpen(false)
                    setRescheduleDate("")
                    setRescheduleTime("")
                    setRescheduleReason("")
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleRescheduleSubmit}
                  disabled={isRescheduling || !rescheduleDate || !rescheduleTime}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isRescheduling ? "Reprogramando…" : "Reprogramar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

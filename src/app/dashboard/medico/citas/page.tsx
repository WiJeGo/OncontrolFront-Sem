"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  
  // Reschedule dialog state
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
        console.error('Error loading appointments:', err)
        setError('Error al cargar las citas')
      } finally {
        setIsLoading(false)
      }
    }

    loadAppointments()
  }, [doctorProfileId])

  useEffect(() => {
    let filtered = appointmentsList

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(appointment =>
        appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(appointment => appointment.status === statusFilter)
    }

    // Filter by date
    if (dateFilter !== "all") {
      const today = new Date()
      filtered = filtered.filter(appointment => {
        const appointmentDate = new Date(appointment.appointmentDate)
        switch (dateFilter) {
          case "today":
            return appointmentDate.toDateString() === today.toDateString()
          case "tomorrow":
            const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
            return appointmentDate.toDateString() === tomorrow.toDateString()
          case "thisWeek":
            const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
            return appointmentDate >= today && appointmentDate <= weekEnd
          default:
            return true
        }
      })
    }

    // Sort by appointment date
    filtered.sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())

    setFilteredAppointments(filtered)
  }, [appointmentsList, searchTerm, statusFilter, dateFilter])

  const handleConfirmAppointment = async (id: number) => {
    try {
      await appointments.updateStatus(id, 'CONFIRMED')
      const updatedList = await appointments.getDoctorAppointments(doctorProfileId!)
      setAppointmentsList(updatedList)
      toast({
        title: "Cita confirmada",
        description: "La cita ha sido confirmada exitosamente",
      })
    } catch (err) {
      console.error('Error confirming appointment:', err)
      toast({
        title: "Error",
        description: "No se pudo confirmar la cita",
        variant: "destructive",
      })
    }
  }

  const handleCompleteAppointment = async (id: number) => {
    try {
      await appointments.updateStatus(id, 'COMPLETED')
      const updatedList = await appointments.getDoctorAppointments(doctorProfileId!)
      setAppointmentsList(updatedList)
      toast({
        title: "Cita completada",
        description: "La cita ha sido marcada como completada",
      })
    } catch (err) {
      console.error('Error completing appointment:', err)
      toast({
        title: "Error",
        description: "No se pudo completar la cita",
        variant: "destructive",
      })
    }
  }

  const handleCancelAppointment = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) return
    
    try {
      await appointments.updateStatus(id, 'CANCELLED')
      const updatedList = await appointments.getDoctorAppointments(doctorProfileId!)
      setAppointmentsList(updatedList)
      toast({
        title: "Cita cancelada",
        description: "La cita ha sido cancelada",
      })
    } catch (err) {
      console.error('Error cancelling appointment:', err)
      toast({
        title: "Error",
        description: "No se pudo cancelar la cita",
        variant: "destructive",
      })
    }
  }

  const handleRescheduleAppointment = (id: number) => {
    setSelectedAppointmentId(id)
    setRescheduleDialogOpen(true)
  }

  const handleRescheduleSubmit = async () => {
    if (!selectedAppointmentId || !rescheduleDate || !rescheduleTime) {
      toast({
        title: "Error",
        description: "Por favor completa la fecha y hora",
        variant: "destructive",
      })
      return
    }

    setIsRescheduling(true)
    try {
      const [hours, minutes] = rescheduleTime.split(':')
      const newDateTime = new Date(rescheduleDate)
      newDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      await appointments.reschedule(selectedAppointmentId, newDateTime.toISOString(), rescheduleReason)
      const updatedList = await appointments.getDoctorAppointments(doctorProfileId!)
      setAppointmentsList(updatedList)
      
      toast({
        title: "Cita reprogramada",
        description: "La cita ha sido reprogramada exitosamente",
      })
      
      setRescheduleDialogOpen(false)
      setSelectedAppointmentId(null)
      setRescheduleDate("")
      setRescheduleTime("")
      setRescheduleReason("")
    } catch (err) {
      console.error('Error rescheduling appointment:', err)
      toast({
        title: "Error",
        description: "No se pudo reprogramar la cita",
        variant: "destructive",
      })
    } finally {
      setIsRescheduling(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmada':
        return 'bg-primary/20 text-primary-foreground border-primary/30'
      case 'programada':
        return 'bg-primary/10 text-primary-foreground border-primary/20'
      case 'completada':
        return 'bg-muted text-muted-foreground border-muted'
      case 'cancelada':
        return 'bg-muted text-muted-foreground border-border'
      default:
        return 'bg-muted text-muted-foreground border-muted'
    }
  }

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmada':
        return 'Confirmada'
      case 'programada':
        return 'Programada'
      case 'completada':
        return 'Completada'
      case 'cancelada':
        return 'Cancelada'
      default:
        return status || 'N/A'
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Gestión de Citas
              </h1>
              <p className="text-muted-foreground text-lg">
                Administra tus citas médicas ({filteredAppointments.length} {filteredAppointments.length === 1 ? 'cita' : 'citas'})
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-11 px-6 shadow-lg hover:shadow-xl">
                <Link href="/dashboard/medico/citas/nueva">
                  <Plus className="mr-2 h-5 w-5" />
                  Nueva Cita
                </Link>
              </Button>
              <Button asChild variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-colors border-2 h-11 px-6">
                <Link href="/dashboard/medico/calendario">
                  <Calendar className="mr-2 h-5 w-5" />
                  Ver Calendario
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Total Citas</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1">{appointmentsList.length}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Citas totales
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-secondary/20 hover:border-secondary/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Hoy</CardTitle>
                <div className="p-2 rounded-lg bg-secondary/10">
                  <Clock className="h-5 w-5 text-secondary" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1">
                  {appointmentsList.filter(apt => {
                    const aptDate = new Date(apt.appointmentDate)
                    const today = new Date()
                    return aptDate.toDateString() === today.toDateString()
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Citas hoy
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-accent/20 hover:border-accent/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Confirmadas</CardTitle>
                <div className="p-2 rounded-lg bg-accent/10">
                  <CheckCircle className="h-5 w-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1">
                  {appointmentsList.filter(apt => apt.status === 'CONFIRMED').length}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                  Confirmadas
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-destructive/20 hover:border-destructive/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Pendientes</CardTitle>
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Clock className="h-5 w-5 text-destructive" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1">
                  {appointmentsList.filter(apt => apt.status === 'SCHEDULED').length}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive"></span>
                  Pendientes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
              <CardTitle className="text-xl font-bold">Filtros de Búsqueda</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por paciente, tipo o notas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 text-base border-2 focus:border-primary"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[200px] h-12 border-2">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="SCHEDULED">Programadas</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmadas</SelectItem>
                    <SelectItem value="COMPLETED">Completadas</SelectItem>
                    <SelectItem value="CANCELLED">Canceladas</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full sm:w-[200px] h-12 border-2">
                    <SelectValue placeholder="Filtrar por fecha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las fechas</SelectItem>
                    <SelectItem value="today">Hoy</SelectItem>
                    <SelectItem value="tomorrow">Mañana</SelectItem>
                    <SelectItem value="thisWeek">Esta semana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Appointments Table */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
              <CardTitle className="text-2xl font-bold">Lista de Citas</CardTitle>
              <CardDescription className="mt-1">
                {filteredAppointments.length} {filteredAppointments.length === 1 ? 'cita encontrada' : 'citas encontradas'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                    <Calendar className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                      ? "No se encontraron citas" 
                      : "No hay citas programadas"}
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                      ? "Intenta cambiar los filtros de búsqueda" 
                      : "Comienza programando citas para tus pacientes"}
                  </p>
                  {!searchTerm && statusFilter === "all" && dateFilter === "all" && (
                    <Button asChild className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-11 px-6 shadow-lg">
                      <Link href="/dashboard/medico/citas/nueva">
                        <Plus className="mr-2 h-5 w-5" />
                        Programar Primera Cita
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Fecha y Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{appointment.patientName}</p>
                            {appointment.notes && (
                              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {appointment.notes}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{formatDate(appointment.appointmentDate)}</p>
                            <p className="text-sm text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTime(appointment.appointmentDate)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-2 font-semibold">{appointment.type}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{appointment.durationMinutes} min</TableCell>
                        <TableCell>
                          {appointment.location ? (
                            <div className="flex items-center text-sm text-muted-foreground font-medium">
                              <MapPin className="h-4 w-4 mr-1 text-primary" />
                              <span className="truncate max-w-[150px]">{appointment.location}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground font-medium">No especificada</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(appointment.status)} border-2 font-semibold`}>
                            {getStatusText(appointment.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/medico/citas/${appointment.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver Detalles
                                </Link>
                              </DropdownMenuItem>
                              {appointment.status === 'SCHEDULED' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleConfirmAppointment(appointment.id)}>
                                    <Check className="mr-2 h-4 w-4" />
                                    Confirmar Cita
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleRescheduleAppointment(appointment.id)}>
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Reprogramar
                                  </DropdownMenuItem>
                                </>
                              )}
                              {appointment.status === 'CONFIRMED' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleCompleteAppointment(appointment.id)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Marcar como Completada
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleRescheduleAppointment(appointment.id)}>
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Reprogramar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive hover:text-destructive" onClick={() => handleCancelAppointment(appointment.id)}>
                                    <X className="mr-2 h-4 w-4" />
                                    Cancelar Cita
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Reschedule Dialog */}
          <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reprogramar Cita</DialogTitle>
                <DialogDescription>
                  Selecciona la nueva fecha y hora para la cita
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="reschedule-date">Nueva Fecha</Label>
                  <Input
                    id="reschedule-date"
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reschedule-time">Nueva Hora</Label>
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
                    placeholder="Explica el motivo de la reprogramación..."
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
                  className="bg-gradient-to-r from-primary to-secondary text-white"
                >
                  {isRescheduling ? "Reprogramando..." : "Reprogramar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

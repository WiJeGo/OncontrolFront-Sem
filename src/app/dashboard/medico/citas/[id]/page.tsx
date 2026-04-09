"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import { appointments } from "@/lib/api"
import type { AppointmentResponse } from "@/lib/api"
import { isDoctorUser } from "@/types/organization"
import { 
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Edit,
  Trash2
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function AppointmentDetailsPage() {
  const { user } = useAuthContext()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const appointmentId = params.id as string
  
  const [doctorProfileId, setDoctorProfileId] = useState<number | null>(null)
  const [appointment, setAppointment] = useState<AppointmentResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Reschedule dialog state
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)
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
    const loadAppointment = async () => {
      if (!appointmentId) return
      
      try {
        setIsLoading(true)
        setError(null)
        const data = await appointments.getById(Number(appointmentId))
        setAppointment(data)
      } catch (err) {
        console.error('Error loading appointment:', err)
        setError('Error al cargar la cita')
      } finally {
        setIsLoading(false)
      }
    }

    loadAppointment()
  }, [appointmentId])

  const handleConfirmAppointment = async () => {
    if (!appointment) return
    
    try {
      await appointments.updateStatus(appointment.id, 'CONFIRMED')
      const updated = await appointments.getById(appointment.id)
      setAppointment(updated)
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

  const handleCompleteAppointment = async () => {
    if (!appointment) return
    
    try {
      await appointments.updateStatus(appointment.id, 'COMPLETED')
      const updated = await appointments.getById(appointment.id)
      setAppointment(updated)
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

  const handleCancelAppointment = async () => {
    if (!appointment || !confirm('¿Estás seguro de que deseas cancelar esta cita?')) return
    
    try {
      await appointments.updateStatus(appointment.id, 'CANCELLED')
      toast({
        title: "Cita cancelada",
        description: "La cita ha sido cancelada",
      })
      setTimeout(() => {
        router.push('/dashboard/medico/citas')
      }, 1500)
    } catch (err) {
      console.error('Error cancelling appointment:', err)
      toast({
        title: "Error",
        description: "No se pudo cancelar la cita",
        variant: "destructive",
      })
    }
  }

  const handleRescheduleSubmit = async () => {
    if (!appointment || !rescheduleDate || !rescheduleTime) {
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

      await appointments.reschedule(appointment.id, newDateTime.toISOString(), rescheduleReason)
      const updated = await appointments.getById(appointment.id)
      setAppointment(updated)
      
      toast({
        title: "Cita reprogramada",
        description: "La cita ha sido reprogramada exitosamente",
      })
      
      setRescheduleDialogOpen(false)
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
      case 'confirmed':
        return 'bg-primary/20 text-primary-foreground border-primary/30'
      case 'programada':
      case 'scheduled':
        return 'bg-secondary/10 text-secondary-foreground border-secondary/20'
      case 'completada':
      case 'completed':
        return 'bg-accent/10 text-accent-foreground border-accent/20'
      case 'cancelada':
      case 'cancelled':
        return 'bg-destructive/10 text-destructive-foreground border-destructive/20'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'Confirmada'
      case 'scheduled':
        return 'Programada'
      case 'completed':
        return 'Completada'
      case 'cancelled':
        return 'Cancelada'
      default:
        return status || 'N/A'
    }
  }

  if (isLoading) {
    return (
      <AuthGuard requiredRole="DOCTOR">
        <DashboardLayout>
          <Loading message="Cargando cita..." />
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (error || !appointment) {
    return (
      <AuthGuard requiredRole="DOCTOR">
        <DashboardLayout>
          <div className="max-w-2xl mx-auto py-12">
            <Card className="border-2 shadow-lg">
              <CardContent className="p-12 text-center">
                <h3 className="text-xl font-bold text-destructive mb-4">{error || 'Cita no encontrada'}</h3>
                <Button asChild>
                  <Link href="/dashboard/medico/citas">Volver a Citas</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredRole="DOCTOR">
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <Link href="/dashboard/medico/citas">
              <Button variant="outline" className="border-2 hover:bg-primary hover:text-primary-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Citas
              </Button>
            </Link>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Detalles de Cita
                </h1>
                <p className="text-muted-foreground text-lg">Información completa de la cita médica</p>
              </div>
              <Badge className={`${getStatusColor(appointment.status)} border-2 text-lg px-4 py-2 font-semibold`}>
                {getStatusText(appointment.status)}
              </Badge>
            </div>
          </div>

          {/* Patient Info */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                Información del Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Paciente</p>
                  <p className="text-xl font-bold text-foreground">{appointment.patientName}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appointment Details */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <Calendar className="h-6 w-6 text-secondary" />
                </div>
                Detalles de la Cita
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <p className="text-sm font-semibold text-muted-foreground">Fecha</p>
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {new Date(appointment.appointmentDate).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <p className="text-sm font-semibold text-muted-foreground">Hora</p>
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {new Date(appointment.appointmentDate).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <p className="text-sm font-semibold text-muted-foreground">Tipo</p>
                  </div>
                  <p className="text-lg font-bold text-foreground">{appointment.type}</p>
                </div>

                <div className="p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <p className="text-sm font-semibold text-muted-foreground">Duración</p>
                  </div>
                  <p className="text-lg font-bold text-foreground">{appointment.durationMinutes} minutos</p>
                </div>

                {appointment.location && (
                  <div className="p-4 bg-muted/50 rounded-xl border-2 border-border/50 md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <p className="text-sm font-semibold text-muted-foreground">Ubicación</p>
                    </div>
                    <p className="text-lg font-bold text-foreground">{appointment.location}</p>
                  </div>
                )}
              </div>

              {appointment.notes && (
                <div className="p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Notas</p>
                  <p className="text-base text-foreground">{appointment.notes}</p>
                </div>
              )}

              {appointment.preparationInstructions && (
                <div className="p-4 bg-accent/10 rounded-xl border-2 border-accent/20">
                  <p className="text-sm font-semibold text-accent mb-2">Instrucciones de Preparación</p>
                  <p className="text-base text-foreground">{appointment.preparationInstructions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
              <CardTitle className="text-xl font-bold">Acciones</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-3">
                {appointment.status === 'SCHEDULED' && (
                  <>
                    <Button 
                      onClick={handleConfirmAppointment}
                      className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Confirmar Cita
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setRescheduleDialogOpen(true)}
                      className="border-2 hover:bg-primary hover:text-primary-foreground"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Reprogramar
                    </Button>
                  </>
                )}
                
                {appointment.status === 'CONFIRMED' && (
                  <>
                    <Button 
                      onClick={handleCompleteAppointment}
                      className="bg-gradient-to-r from-accent to-primary text-white hover:opacity-90"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Marcar como Completada
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setRescheduleDialogOpen(true)}
                      className="border-2 hover:bg-primary hover:text-primary-foreground"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Reprogramar
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleCancelAppointment}
                      className="border-2 border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Cancelar Cita
                    </Button>
                  </>
                )}

                {appointment.status === 'COMPLETED' && (
                  <div className="text-center w-full py-4">
                    <div className="inline-flex items-center gap-2 text-accent font-semibold">
                      <CheckCircle className="h-5 w-5" />
                      <span>Esta cita ha sido completada</span>
                    </div>
                  </div>
                )}

                {appointment.status === 'CANCELLED' && (
                  <div className="text-center w-full py-4">
                    <div className="inline-flex items-center gap-2 text-destructive font-semibold">
                      <XCircle className="h-5 w-5" />
                      <span>Esta cita ha sido cancelada</span>
                    </div>
                  </div>
                )}
              </div>
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


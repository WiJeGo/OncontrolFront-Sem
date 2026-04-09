"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import type { PatientProfileResponse } from "@/lib/api"
import { isPatientUser } from "@/types/organization"
import { 
  User, 
  Mail, 
  Heart, 
  Settings,
  Save,
  Edit,
  Activity
} from "lucide-react"

export default function PacientePerfilPage() {
  const { user } = useAuthContext()
  const [patientData, setPatientData] = useState<PatientProfileResponse | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const loadPatientProfile = async () => {
      if (!user || !isPatientUser(user)) return

      try {
        setIsLoading(true)
        // Use the patient profile from auth context
        setPatientData(user.profile as PatientProfileResponse)
      } catch (err) {
        console.error('Error loading patient profile:', err)
        setError('Error al cargar el perfil')
      } finally {
        setIsLoading(false)
      }
    }

    loadPatientProfile()
  }, [user])

  const handleSave = async () => {
    if (!patientData || !user || !isPatientUser(user)) return

    setIsSaving(true)
    setError("")
    setSuccess("")

    try {
      // API call to update patient profile would go here
      // For now, we'll just show success message
      setSuccess("Perfil actualizado correctamente")
      setIsEditing(false)
    } catch (err) {
      console.error('Error updating profile:', err)
      setError("Error al actualizar el perfil")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <AuthGuard requiredRole="PATIENT">
        <DashboardLayout>
          <Loading message="Cargando perfil..." />
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (!patientData) {
    return (
      <AuthGuard requiredRole="PATIENT">
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">No se pudo cargar el perfil</p>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  return (
    <AuthGuard requiredRole="PATIENT">
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Mi Perfil
              </h1>
              <p className="text-muted-foreground text-lg">Gestiona tu información personal</p>
            </div>
            <Button
              variant={isEditing ? "outline" : "default"}
              onClick={() => {
                if (isEditing) {
                  setSuccess("")
                  setError("")
                }
                setIsEditing(!isEditing)
              }}
              className={isEditing ? "border-2 hover:bg-muted hover:border-muted-foreground h-11 px-6" : "bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-11 px-6 shadow-lg hover:shadow-xl"}
            >
              {isEditing ? (
                <>Cancelar</>
              ) : (
                <>
                  <Edit className="w-5 h-5 mr-2" />
                  Editar Perfil
                </>
              )}
            </Button>
          </div>

          {/* Alerts */}
          {error && (
            <Alert variant="destructive" className="border-2">
              <AlertDescription className="font-semibold">{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="border-2 border-primary/30 bg-primary/10">
              <AlertDescription className="text-primary font-semibold">{success}</AlertDescription>
            </Alert>
          )}

          {/* Profile Header Card */}
          <Card className="border-2 shadow-lg bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/10">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <Avatar className="h-28 w-28 ring-4 ring-primary/20 shadow-lg">
                  <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary/30 to-secondary/30 text-primary">
                    {patientData.firstName.charAt(0)}{patientData.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center md:text-left space-y-3">
                  <h2 className="text-3xl font-bold text-foreground">
                    {patientData.firstName} {patientData.lastName}
                  </h2>
                  <p className="text-xl text-muted-foreground font-semibold">
                    {patientData.birthDate ? calculateAge(patientData.birthDate) : 'N/A'} años
                  </p>
                  <p className="text-sm text-muted-foreground font-medium">
                    ID: {patientData.profileId}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
                    <Badge variant="outline" className="border-2 font-semibold px-4 py-2">{patientData.isActive ? 'Activo' : 'Inactivo'}</Badge>
                    {patientData.doctorName && (
                      <span className="text-sm text-muted-foreground font-semibold px-4 py-2 bg-muted/50 rounded-xl border-2 border-border/50">
                        Médico tratante: {patientData.doctorName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  Información Personal
                </CardTitle>
                <CardDescription className="mt-1 text-base">Información básica de identificación</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-base font-semibold">Nombre</Label>
                  <Input
                    id="firstName"
                    value={patientData.firstName}
                    disabled={true}
                    className="h-12 text-base border-2 bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-base font-semibold">Apellido</Label>
                  <Input
                    id="lastName"
                    value={patientData.lastName}
                    disabled={true}
                    className="h-12 text-base border-2 bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-semibold flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={patientData.email}
                    disabled={true}
                    className="h-12 text-base border-2 bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-base font-semibold">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={patientData.phone}
                    onChange={(e) => setPatientData({ ...patientData, phone: e.target.value })}
                    disabled={!isEditing}
                    className="h-12 text-base border-2 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-base font-semibold">Fecha de Nacimiento</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={patientData.birthDate || ''}
                    disabled={true}
                    className="h-12 text-base border-2 bg-muted/50"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Medical Information */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <Heart className="w-5 h-5 text-secondary" />
                  </div>
                  Información Médica
                </CardTitle>
                <CardDescription className="mt-1 text-base">Detalles de tu condición y tratamiento</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {patientData.cancerType && (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Tipo de Cáncer</Label>
                    <Input
                      value={patientData.cancerType}
                      disabled={true}
                      className="h-12 text-base border-2 bg-muted/50"
                    />
                  </div>
                )}

                {patientData.cancerStage && (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Estadio</Label>
                    <Input
                      value={patientData.cancerStage}
                      disabled={true}
                      className="h-12 text-base border-2 bg-muted/50"
                    />
                  </div>
                )}

                {patientData.diagnosisDate && (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Fecha de Diagnóstico</Label>
                    <Input
                      type="date"
                      value={patientData.diagnosisDate}
                      disabled={true}
                      className="h-12 text-base border-2 bg-muted/50"
                    />
                  </div>
                )}

                {patientData.doctorName && (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Médico Tratante</Label>
                    <Input
                      value={patientData.doctorName}
                      disabled={true}
                      className="h-12 text-base border-2 bg-muted/50"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-base font-semibold">Estado</Label>
                  <Input
                    value={patientData.isActive ? 'Activo' : 'Inactivo'}
                    disabled={true}
                    className="h-12 text-base border-2 bg-muted/50"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Address */}
          {patientData.address && (
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Settings className="w-5 h-5 text-accent" />
                  </div>
                  Dirección
                </CardTitle>
                <CardDescription className="mt-1 text-base">Tu dirección de residencia</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-base font-semibold">Dirección Completa</Label>
                  <Input
                    id="address"
                    value={patientData.address}
                    onChange={(e) => setPatientData({ ...patientData, address: e.target.value })}
                    disabled={!isEditing}
                    className="h-12 text-base border-2 focus:border-primary"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
              <CardTitle className="flex items-center gap-3 text-xl font-bold">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                Estadísticas
              </CardTitle>
              <CardDescription className="mt-1 text-base">Tu actividad en la plataforma</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-6 border-2 border-primary/20 rounded-xl bg-muted/50 hover:border-primary/40 hover:shadow-md transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12"></div>
                  <p className="text-4xl font-bold text-primary mb-2 relative z-10">{patientData.activeTreatments}</p>
                  <p className="text-sm text-muted-foreground font-semibold relative z-10">Tratamientos Activos</p>
                </div>
                <div className="text-center p-6 border-2 border-secondary/20 rounded-xl bg-muted/50 hover:border-secondary/40 hover:shadow-md transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full -mr-12 -mt-12"></div>
                  <p className="text-4xl font-bold text-secondary mb-2 relative z-10">{patientData.upcomingAppointments}</p>
                  <p className="text-sm text-muted-foreground font-semibold relative z-10">Citas Próximas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          {isEditing && (
            <div className="flex justify-end gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  setError("")
                  setSuccess("")
                }}
                disabled={isSaving}
                className="h-12 px-8 text-lg font-semibold border-2 hover:bg-muted hover:border-muted-foreground"
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-12 px-8 text-lg font-semibold shadow-lg hover:shadow-xl disabled:opacity-50">
                <Save className="w-5 h-5 mr-2" />
                {isSaving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

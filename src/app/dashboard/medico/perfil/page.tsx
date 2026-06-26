"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import { doctors } from "@/lib/api"
import type { DoctorProfileResponse, UpdateDoctorRequest } from "@/lib/api"
import { isDoctorUser } from "@/types/organization"
import { 
  User, 
  Mail, 
  GraduationCap, 
  Award, 
  Settings,
  Save,
  Edit,
  Briefcase
} from "lucide-react"

export default function MedicoPerfilPage() {
  const { user } = useAuthContext()
  const [doctorData, setDoctorData] = useState<DoctorProfileResponse | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (!user || !isDoctorUser(user)) return

    // Use the profile data from the authenticated user
    setDoctorData(user.profile as DoctorProfileResponse)
    setIsLoading(false)
  }, [user])

  const handleSave = async () => {
    if (!doctorData || !user || !isDoctorUser(user)) return

    setIsSaving(true)
    setError("")
    setSuccess("")

    try {
      const payload: UpdateDoctorRequest = {
        phone: doctorData.phone,
        specialization: doctorData.specialization,
        licenseNumber: doctorData.licenseNumber,
        bio: doctorData.bio || undefined,
        address: doctorData.address || undefined,
      }

      const updated = await doctors.updateProfile(doctorData.id, payload)
      setDoctorData(updated)

      // The auth state is hydrated from localStorage 'userData' on navigation,
      // so sync the refreshed profile back into it (best-effort).
      try {
        const stored = localStorage.getItem("userData")
        if (stored) {
          const parsed = JSON.parse(stored)
          parsed.profile = updated
          localStorage.setItem("userData", JSON.stringify(parsed))
        }
      } catch {
        /* non-fatal: localStorage sync is best-effort */
      }

      setSuccess("Perfil actualizado correctamente")
      setIsEditing(false)
    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err instanceof Error ? err.message : "Error al actualizar el perfil")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <AuthGuard requiredRole="DOCTOR">
        <DashboardLayout>
          <Loading message="Cargando perfil..." />
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (!doctorData) {
    return (
      <AuthGuard requiredRole="DOCTOR">
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">No se pudo cargar el perfil</p>
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
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Mi Perfil
              </h1>
              <p className="text-muted-foreground text-lg">Gestiona tu información profesional</p>
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
              className={isEditing ? "border hover:bg-muted hover:border-muted-foreground h-11 px-6" : "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors h-11 px-6 shadow-sm"}
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
            <Alert variant="destructive" className="border" role="alert">
              <AlertDescription className="font-semibold">{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="border border-primary/30 bg-primary/10">
              <AlertDescription className="text-primary font-semibold">{success}</AlertDescription>
            </Alert>
          )}

          {/* Profile Header Card */}
          <Card className="border shadow-sm ">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <Avatar className="h-28 w-28 ring-4 ring-primary/20 shadow-sm">
                  <AvatarFallback className="text-3xl font-bold bg-primary/15 text-primary">
                    {doctorData.firstName.charAt(0)}{doctorData.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center md:text-left space-y-3">
                  <h2 className="text-3xl font-bold text-foreground">
                    Dr. {doctorData.firstName} {doctorData.lastName}
                  </h2>
                  <p className="text-xl text-muted-foreground font-semibold">{doctorData.specialization}</p>
                  <p className="text-sm text-muted-foreground font-medium">
                    ID: {doctorData.profileId}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
                    {doctorData.organizationName && (
                      <span className="flex items-center gap-2 text-sm text-muted-foreground font-semibold px-4 py-2 bg-muted/50 rounded-xl border border-border/50">
                        <Briefcase className="w-4 h-4 text-primary" />
                        {doctorData.organizationName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card className="border shadow-sm">
              <CardHeader className="border-b">
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
                    value={doctorData.firstName}
                    disabled={true}
                    className="h-12 text-base border bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-base font-semibold">Apellido</Label>
                  <Input
                    id="lastName"
                    value={doctorData.lastName}
                    disabled={true}
                    className="h-12 text-base border bg-muted/50"
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
                    value={doctorData.email}
                    disabled={true}
                    className="h-12 text-base border bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-base font-semibold">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={doctorData.phone}
                    onChange={(e) => setDoctorData({ ...doctorData, phone: e.target.value })}
                    disabled={!isEditing}
                    className="h-12 text-base border focus:border-primary"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card className="border shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2 rounded-lg bg-chart-2/10">
                    <GraduationCap className="w-5 h-5 text-chart-2" />
                  </div>
                  Información Profesional
                </CardTitle>
                <CardDescription className="mt-1 text-base">Credenciales y especialización</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="specialty" className="text-base font-semibold">Especialidad</Label>
                  <Input
                    id="specialty"
                    value={doctorData.specialization}
                    onChange={(e) => setDoctorData({ ...doctorData, specialization: e.target.value })}
                    disabled={!isEditing}
                    className="h-12 text-base border focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="licenseNumber" className="text-base font-semibold flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Número de Colegiatura
                  </Label>
                  <Input
                    id="licenseNumber"
                    value={doctorData.licenseNumber}
                    onChange={(e) => setDoctorData({ ...doctorData, licenseNumber: e.target.value })}
                    disabled={!isEditing}
                    className="h-12 text-base border focus:border-primary"
                  />
                </div>

                {doctorData.organizationName && (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Organización</Label>
                    <Input
                      value={doctorData.organizationName}
                      disabled={true}
                      className="h-12 text-base border bg-muted/50"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-base font-semibold">Disponibilidad</Label>
                  <Input
                    id="status"
                    value={doctorData.isAvailable ? 'Disponible' : 'No disponible'}
                    disabled={true}
                    className="h-12 text-base border bg-muted/50"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Biography */}
          <Card className="border shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-3 text-xl font-bold">
                <div className="p-2 rounded-lg bg-chart-5/10">
                  <Settings className="w-5 h-5 text-chart-5" />
                </div>
                Biografía Profesional
              </CardTitle>
              <CardDescription className="mt-1 text-base">Información adicional sobre tu práctica médica</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-base font-semibold">Biografía</Label>
                <Textarea
                  id="bio"
                  value={doctorData.bio || ""}
                  onChange={(e) => setDoctorData({ ...doctorData, bio: e.target.value })}
                  disabled={!isEditing}
                  rows={6}
                  placeholder="Describe tu experiencia, especialización y enfoque médico..."
                  className="text-base border focus:border-primary min-h-[150px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="officeAddress" className="text-base font-semibold">Dirección del Consultorio</Label>
                <Textarea
                  id="officeAddress"
                  value={doctorData.address || ""}
                  onChange={(e) => setDoctorData({ ...doctorData, address: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                  placeholder="Dirección completa de tu consultorio..."
                  className="text-base border focus:border-primary min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Statistics - TODO: Add when statistics endpoint is implemented */}
          {/* 
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Estadísticas
              </CardTitle>
              <CardDescription>Tu actividad en la plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-primary">0</p>
                  <p className="text-sm text-muted-foreground">Pacientes Activos</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-primary">0</p>
                  <p className="text-sm text-muted-foreground">Total de Pacientes</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-primary">0</p>
                  <p className="text-sm text-muted-foreground">Tratamientos Administrados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          */}

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
                className="h-12 px-8 text-lg font-semibold border hover:bg-muted hover:border-muted-foreground"
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors h-12 px-8 text-lg font-semibold shadow-sm hover:shadow-md disabled:opacity-50">
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

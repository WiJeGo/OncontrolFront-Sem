"use client"

import { useParams } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import { useOrganizationDoctor } from "@/hooks/use-organizations"
import { isOrganizationUser } from "@/types/organization"
import { 
  ArrowLeft,
  Stethoscope,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  GraduationCap,
  Building2,
  Users,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle2
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function DoctorDetailsPage() {
  const { user } = useAuthContext()
  const params = useParams()
  const doctorId = params.id ? parseInt(params.id as string) : null
  const organizationId = user && isOrganizationUser(user) ? user.id : null

  const { doctor, isLoading, error } = useOrganizationDoctor(organizationId, doctorId)

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return "N/A"
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No especificado"
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: es })
    } catch {
      return "Fecha inválida"
    }
  }

  if (isLoading) {
    return (
      <AuthGuard requiredRole="ORGANIZATION">
        <DashboardLayout>
          <Loading />
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (error || !doctor) {
    return (
      <AuthGuard requiredRole="ORGANIZATION">
        <DashboardLayout>
          <div className="max-w-7xl mx-auto space-y-6">
            <Link href="/dashboard/organizacion/doctores">
              <Button variant="outline" className="border-2 hover:bg-primary hover:text-primary-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a doctores
              </Button>
            </Link>
            <Alert variant="destructive" className="border-2">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="font-semibold">
                {error || "Doctor no encontrado"}
              </AlertDescription>
            </Alert>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredRole="ORGANIZATION">
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <Link href="/dashboard/organizacion/doctores">
              <Button variant="outline" className="mb-4 border-2 hover:bg-primary hover:text-primary-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a doctores
              </Button>
            </Link>
            
            {/* Doctor Header Card */}
            <Card className="border-2 shadow-lg bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/10">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-6 flex-1">
                    <Avatar className="h-20 w-20 ring-4 ring-primary/20 shadow-lg">
                      <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary/30 to-secondary/30 text-primary">
                        {doctor.firstName[0]}{doctor.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2 flex-1">
                      <CardTitle className="text-3xl font-bold">
                        Dr. {doctor.firstName} {doctor.lastName}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-3 text-base">
                        <code className="text-sm bg-muted px-3 py-1.5 rounded-lg border-2 font-semibold">
                          {doctor.profileId}
                        </code>
                        <Badge variant={doctor.isActive ? "default" : "secondary"} className="border-2 font-semibold">
                          {doctor.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                        {doctor.isAvailable !== undefined && (
                          <Badge variant={doctor.isAvailable ? "default" : "outline"} className="border-2 font-semibold">
                            {doctor.isAvailable ? "Disponible" : "No disponible"}
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm font-bold">{doctor.email}</span>
                  </div>
                  {doctor.phone && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm font-bold">{doctor.phone}</span>
                    </div>
                  )}
                  {doctor.city && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm font-bold">{doctor.city}</span>
                    </div>
                  )}
                  {doctor.birthDate && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground font-semibold block">Edad:</span>
                        <span className="text-sm font-bold">{calculateAge(doctor.birthDate)} años</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
              <CardContent className="pt-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Especialización</p>
                    <p className="text-xl font-bold text-foreground mt-1">{doctor.specialization}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Stethoscope className="h-8 w-8 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {doctor.rating !== undefined && (
              <Card className="border-2 border-secondary/20 hover:border-secondary/40 transition-all hover:shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16"></div>
                <CardContent className="pt-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Calificación</p>
                      <p className="text-3xl font-bold text-foreground">{doctor.rating.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground font-medium mt-1">
                        {doctor.totalReviews || 0} {doctor.totalReviews === 1 ? 'reseña' : 'reseñas'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/10">
                      <Award className="h-8 w-8 text-secondary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {doctor.yearsOfExperience !== undefined && (
              <Card className="border-2 border-accent/20 hover:border-accent/40 transition-all hover:shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16"></div>
                <CardContent className="pt-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Años de Experiencia</p>
                      <p className="text-3xl font-bold text-foreground">{doctor.yearsOfExperience}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent/10">
                      <GraduationCap className="h-8 w-8 text-accent" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Information Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Professional Information */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Stethoscope className="h-6 w-6 text-primary" />
                  </div>
                  Información Profesional
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Especialización</p>
                  <p className="text-base font-bold">{doctor.specialization}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Número de Licencia</p>
                  <p className="text-base font-bold">{doctor.licenseNumber}</p>
                </div>
                {doctor.yearsOfExperience !== undefined && (
                  <div className="p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Años de Experiencia</p>
                    <p className="text-base font-bold">{doctor.yearsOfExperience} años</p>
                  </div>
                )}
                {doctor.hospitalAffiliation && (
                  <div className="p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Afiliación Hospitalaria</p>
                    <p className="text-base font-bold">{doctor.hospitalAffiliation}</p>
                  </div>
                )}
                {doctor.consultationFee && (
                  <div className="p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Tarifa de Consulta</p>
                    <p className="text-base font-bold">${parseFloat(doctor.consultationFee).toFixed(2)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <Users className="h-6 w-6 text-secondary" />
                  </div>
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Email</p>
                  <p className="text-base font-bold">{doctor.email}</p>
                </div>
                {doctor.phone && (
                  <div className="p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Teléfono</p>
                    <p className="text-base font-bold">{doctor.phone}</p>
                  </div>
                )}
                {doctor.birthDate && (
                  <div className="p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Fecha de Nacimiento</p>
                    <p className="text-base font-bold">{formatDate(doctor.birthDate)} ({calculateAge(doctor.birthDate)} años)</p>
                  </div>
                )}
                {doctor.city && (
                  <div className="p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Ciudad</p>
                    <p className="text-base font-bold">{doctor.city}</p>
                  </div>
                )}
                {doctor.address && (
                  <div className="p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Dirección</p>
                    <p className="text-base font-bold">{doctor.address}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Organization Information */}
            {doctor.organizationName && (
              <Card className="border-2 shadow-lg lg:col-span-2">
                <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                  <CardTitle className="text-xl font-bold flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Building2 className="h-6 w-6 text-accent" />
                    </div>
                    Información de la Organización
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                    <p className="text-base font-bold">{doctor.organizationName}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bio */}
            {doctor.bio && (
              <Card className="border-2 shadow-lg lg:col-span-2">
                <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                  <CardTitle className="text-xl font-bold flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Activity className="h-6 w-6 text-primary" />
                    </div>
                    Biografía Profesional
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-base leading-relaxed">{doctor.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Status Information */}
            <Card className="border-2 shadow-lg lg:col-span-2">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <Activity className="h-6 w-6 text-secondary" />
                  </div>
                  Estado y Calificación
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Estado</p>
                    <div className="flex items-center gap-2">
                      {doctor.isActive ? (
                        <Badge className="border-2 font-semibold bg-green-500/10 text-green-600 border-green-500/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge className="border-2 font-semibold bg-red-500/10 text-red-600 border-red-500/20">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Inactivo
                        </Badge>
                      )}
                    </div>
                  </div>
                  {doctor.isAvailable !== undefined && (
                    <div className="p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                      <p className="text-sm font-semibold text-muted-foreground mb-2">Disponibilidad</p>
                      <div className="flex items-center gap-2">
                        {doctor.isAvailable ? (
                          <Badge className="border-2 font-semibold bg-primary/10 text-primary border-primary/20">
                            <Clock className="h-3 w-3 mr-1" />
                            Disponible
                          </Badge>
                        ) : (
                          <Badge className="border-2 font-semibold bg-muted text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            No disponible
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {doctor.rating !== undefined && (
                    <div className="p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                      <p className="text-sm font-semibold text-muted-foreground mb-2">Calificación</p>
                      <p className="text-2xl font-bold">{doctor.rating.toFixed(1)} / 5.0</p>
                      {doctor.totalReviews !== undefined && (
                        <p className="text-xs text-muted-foreground font-medium mt-1">
                          Basado en {doctor.totalReviews} {doctor.totalReviews === 1 ? 'reseña' : 'reseñas'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}


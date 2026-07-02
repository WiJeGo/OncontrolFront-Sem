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
              <Button variant="outline" className="border hover:bg-primary hover:text-primary-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a doctores
              </Button>
            </Link>
            <Alert variant="destructive" className="border" role="alert">
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
              <Button variant="outline" className="mb-4 border hover:bg-primary hover:text-primary-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a doctores
              </Button>
            </Link>
            
            {/* Doctor Header Card */}
            <Card className="border shadow-sm ">
              <CardHeader className="border-b">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-6 flex-1">
                    <Avatar className="h-20 w-20 ring-4 ring-primary/20 shadow-sm">
                      <AvatarFallback className="text-lg font-semibold bg-primary/15 text-primary">
                        {doctor.firstName[0]}{doctor.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2 flex-1">
                      <CardTitle className="text-xl font-semibold tracking-tight">
                        Dr. {doctor.firstName} {doctor.lastName}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-3 text-base">
                        <code className="text-sm bg-muted px-3 py-1.5 rounded-lg border font-semibold">
                          {doctor.profileId}
                        </code>
                        <Badge className={`border px-2.5 py-0.5 text-xs font-medium ${doctor.isActive ? "bg-success/15 text-success border-success/30" : "bg-muted text-muted-foreground"}`}>
                          {doctor.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                        {doctor.isAvailable !== undefined && (
                          <Badge className={`border px-2.5 py-0.5 text-xs font-medium ${doctor.isAvailable ? "bg-chart-2/15 text-chart-2 border-chart-2/30" : "bg-muted text-muted-foreground"}`}>
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
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border/50">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm font-semibold">{doctor.email}</span>
                  </div>
                  {doctor.phone && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border/50">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm font-semibold">{doctor.phone}</span>
                    </div>
                  )}
                  {doctor.city && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border/50">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm font-semibold">{doctor.city}</span>
                    </div>
                  )}
                  {doctor.birthDate && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border/50">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground font-semibold block">Edad:</span>
                        <span className="text-sm font-semibold">{calculateAge(doctor.birthDate)} años</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats — connected KPI strip */}
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border shadow-sm md:grid-cols-3">
            <div className="bg-card p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className="rounded-md bg-primary/10 p-1.5 text-primary"><Stethoscope className="h-4 w-4" /></span>
                Especialización
              </div>
              <p className="mt-2 font-semibold text-foreground">{doctor.specialization}</p>
            </div>
            <div className="bg-card p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className="rounded-md bg-chart-2/10 p-1.5 text-chart-2"><Award className="h-4 w-4" /></span>
                Calificación
              </div>
              <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-foreground">
                {doctor.rating !== undefined ? doctor.rating.toFixed(1) : "—"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {doctor.totalReviews || 0} {doctor.totalReviews === 1 ? "reseña" : "reseñas"}
              </p>
            </div>
            <div className="bg-card p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className="rounded-md bg-chart-5/10 p-1.5 text-chart-5"><GraduationCap className="h-4 w-4" /></span>
                Experiencia
              </div>
              <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-foreground">
                {doctor.yearsOfExperience ?? "—"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">años</p>
            </div>
          </div>

          {/* Information Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Professional Information */}
            <Card className="border shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-base font-semibold flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Stethoscope className="h-6 w-6 text-primary" />
                  </div>
                  Información Profesional
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Especialización</p>
                  <p className="font-semibold">{doctor.specialization}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Número de Licencia</p>
                  <p className="font-semibold">{doctor.licenseNumber}</p>
                </div>
                {doctor.yearsOfExperience !== undefined && (
                  <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Años de Experiencia</p>
                    <p className="font-semibold">{doctor.yearsOfExperience} años</p>
                  </div>
                )}
                {doctor.hospitalAffiliation && (
                  <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Afiliación Hospitalaria</p>
                    <p className="font-semibold">{doctor.hospitalAffiliation}</p>
                  </div>
                )}
                {doctor.consultationFee && (
                  <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Tarifa de Consulta</p>
                    <p className="font-semibold">${parseFloat(doctor.consultationFee).toFixed(2)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card className="border shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-base font-semibold flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-chart-2/10">
                    <Users className="h-6 w-6 text-chart-2" />
                  </div>
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Email</p>
                  <p className="font-semibold">{doctor.email}</p>
                </div>
                {doctor.phone && (
                  <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Teléfono</p>
                    <p className="font-semibold">{doctor.phone}</p>
                  </div>
                )}
                {doctor.birthDate && (
                  <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Fecha de Nacimiento</p>
                    <p className="font-semibold">{formatDate(doctor.birthDate)} ({calculateAge(doctor.birthDate)} años)</p>
                  </div>
                )}
                {doctor.city && (
                  <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Ciudad</p>
                    <p className="font-semibold">{doctor.city}</p>
                  </div>
                )}
                {doctor.address && (
                  <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Dirección</p>
                    <p className="font-semibold">{doctor.address}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Organization Information */}
            {doctor.organizationName && (
              <Card className="border shadow-sm lg:col-span-2">
                <CardHeader className="border-b">
                  <CardTitle className="text-base font-semibold flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-chart-5/10">
                      <Building2 className="h-6 w-6 text-chart-5" />
                    </div>
                    Información de la Organización
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="p-4 bg-muted/50 rounded-xl border border-border/50">
                    <p className="font-semibold">{doctor.organizationName}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bio */}
            {doctor.bio && (
              <Card className="border shadow-sm lg:col-span-2">
                <CardHeader className="border-b">
                  <CardTitle className="text-base font-semibold flex items-center gap-3">
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
            <Card className="border shadow-sm lg:col-span-2">
              <CardHeader className="border-b">
                <CardTitle className="text-base font-semibold flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-chart-2/10">
                    <Activity className="h-6 w-6 text-chart-2" />
                  </div>
                  Estado y Calificación
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-xl border border-border/50">
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Estado</p>
                    <div className="flex items-center gap-2">
                      {doctor.isActive ? (
                        <Badge className="border font-semibold bg-success/10 text-success border-success/30/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge className="border font-semibold bg-destructive/10 text-destructive border-destructive/30/20">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Inactivo
                        </Badge>
                      )}
                    </div>
                  </div>
                  {doctor.isAvailable !== undefined && (
                    <div className="p-4 bg-muted/50 rounded-xl border border-border/50">
                      <p className="text-sm font-semibold text-muted-foreground mb-2">Disponibilidad</p>
                      <div className="flex items-center gap-2">
                        {doctor.isAvailable ? (
                          <Badge className="border font-semibold bg-primary/10 text-primary border-primary/20">
                            <Clock className="h-3 w-3 mr-1" />
                            Disponible
                          </Badge>
                        ) : (
                          <Badge className="border font-semibold bg-muted text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            No disponible
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {doctor.rating !== undefined && (
                    <div className="p-4 bg-muted/50 rounded-xl border border-border/50">
                      <p className="text-sm font-semibold text-muted-foreground mb-2">Calificación</p>
                      <p className="text-lg font-semibold">{doctor.rating.toFixed(1)} / 5.0</p>
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


"use client"

import { useEffect } from 'react'
import { useAuthContext } from '@/contexts/auth-context'
import { useOrganizationDashboard } from '@/hooks/use-organizations'
import { isOrganizationUser } from '@/types/organization'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Loading } from '@/components/loading'
import { Users, Stethoscope, Calendar, Plus, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function OrganizationDashboardPage() {
  const { user, isLoading: authLoading } = useAuthContext()
  const router = useRouter()
  
  // Get organization ID directly from user
  const organizationId = user && isOrganizationUser(user) ? user.id : null
  
  const { dashboard, isLoading, error, refetch } = useOrganizationDashboard(organizationId)

  useEffect(() => {
    if (!authLoading && !user) {
      // Redirect to login if no user
      router.push('/auth/login')
    } else if (!authLoading && user && !isOrganizationUser(user)) {
      // Redirect if not an organization
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  // Early return after all hooks are called
  if (authLoading) {
    return <Loading message="Verificando autenticación..." />
  }

  if (!user) {
    return null
  }

  if (!isOrganizationUser(user)) {
    return null
  }

  return (
    <DashboardLayout>
      {(authLoading || isLoading) && <Loading message="Cargando dashboard..." />}
      
      {error && !authLoading && !isLoading && (
        <div className="flex items-center justify-center h-64">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => refetch()}>Intentar de nuevo</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {!authLoading && !isLoading && !error && dashboard && (
      <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard de Organización
          </h1>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <p className="text-lg font-semibold text-foreground">{dashboard.organizationName}</p>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <span>{dashboard.city}, {dashboard.country}</span>
          </p>
        </div>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors h-11 px-6 shadow-sm">
          <Link href="/dashboard/organizacion/doctores/nuevo">
            <UserPlus className="mr-2 h-5 w-5" />
            Agregar Doctor
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-primary/20 hover:border-primary/40 transition-colors hover:shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" aria-hidden="true"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total de Doctores</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-foreground mb-1 tabular-nums">{dashboard.totalDoctors}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 tabular-nums">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true"></span>
              {dashboard.activeDoctors} activos
            </p>
          </CardContent>
        </Card>

        <Card className="border border-chart-2/20 hover:border-chart-2/40 transition-colors hover:shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-chart-2/5 rounded-full -mr-16 -mt-16" aria-hidden="true"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total de Pacientes</CardTitle>
            <div className="p-2 rounded-lg bg-chart-2/10">
              <Users className="h-5 w-5 text-chart-2" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-foreground mb-1 tabular-nums">{dashboard.totalPatients}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 tabular-nums">
              <span className="w-1.5 h-1.5 rounded-full bg-chart-2" aria-hidden="true"></span>
              {dashboard.activePatients} activos
            </p>
          </CardContent>
        </Card>

        <Card className="border border-chart-5/20 hover:border-chart-5/40 transition-colors hover:shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-chart-5/5 rounded-full -mr-16 -mt-16" aria-hidden="true"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total de Citas</CardTitle>
            <div className="p-2 rounded-lg bg-chart-5/10">
              <Calendar className="h-5 w-5 text-chart-5" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-foreground mb-1 tabular-nums">{dashboard.totalAppointments}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 tabular-nums">
              <span className="w-1.5 h-1.5 rounded-full bg-chart-5" aria-hidden="true"></span>
              {dashboard.upcomingAppointments} próximas
            </p>
          </CardContent>
        </Card>

        <Card className="border border-primary/20 hover:border-primary/40 transition-colors hover:shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" aria-hidden="true"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Promedio Pacientes/Doctor</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-foreground mb-1 tabular-nums">
              {dashboard.totalDoctors > 0
                ? Math.round(dashboard.totalPatients / dashboard.totalDoctors)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Distribución promedio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Doctors List */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold">Doctores</CardTitle>
              <CardDescription className="mt-1">Lista de médicos en tu organización</CardDescription>
            </div>
            <Button asChild variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-colors border-2">
              <Link href="/dashboard/organizacion/doctores">Ver todos</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {dashboard.doctors.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                <Stethoscope className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">No hay doctores registrados</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Comienza agregando doctores a tu organización para gestionar pacientes y citas
              </p>
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors h-11 px-6 shadow-sm">
                <Link href="/dashboard/organizacion/doctores/nuevo">
                  <Plus className="mr-2 h-5 w-5" />
                  Agregar Primer Doctor
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboard.doctors.slice(0, 5).map((doctor) => (
                <div
                  key={doctor.id}
                  className="flex items-center justify-between p-5 border-2 rounded-xl hover:border-primary/40 hover:shadow-md transition-all bg-card"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                      <Stethoscope className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg">
                        Dr. {doctor.firstName} {doctor.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground font-medium">{doctor.specialization}</p>
                      <p className="text-xs text-muted-foreground mt-1">{doctor.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {doctor.isAvailable ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-success" aria-hidden="true" />
                            Disponible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" aria-hidden="true" />
                            No disponible
                          </span>
                        )}
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground transition-colors border-2">
                      <Link href={`/dashboard/organizacion/doctores/${doctor.id}`}>Ver detalles</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
      )}
    </DashboardLayout>
  )
}


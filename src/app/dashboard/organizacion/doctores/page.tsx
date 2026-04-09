"use client"

import { useEffect, useState } from 'react'
import { useAuthContext } from '@/contexts/auth-context'
import { useOrganizationDoctors } from '@/hooks/use-organizations'
import { isOrganizationUser } from '@/types/organization'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Loading } from '@/components/loading'
import { BackButton } from '@/components/ui/back-button'
import { Stethoscope, Search, UserPlus, Mail, Phone, Award, Activity } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DoctorsListPage() {
  const { user, isLoading: authLoading } = useAuthContext()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  
  // Get organization ID directly from user
  const organizationId = user && isOrganizationUser(user) ? user.id : null

  useEffect(() => {
    if (!authLoading && user && !isOrganizationUser(user)) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  const { doctors, isLoading, error, refetch } = useOrganizationDoctors(organizationId)

  const filteredDoctors = doctors.filter((doctor) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      doctor.firstName.toLowerCase().includes(searchLower) ||
      doctor.lastName.toLowerCase().includes(searchLower) ||
      doctor.email.toLowerCase().includes(searchLower) ||
      doctor.specialization.toLowerCase().includes(searchLower)
    )
  })

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <Loading message="Cargando doctores..." />
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
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
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <BackButton fallbackUrl="/dashboard/organizacion" label="Volver al dashboard" />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Doctores
            </h1>
            <p className="text-muted-foreground text-lg">Gestiona los médicos de tu organización</p>
          </div>
          <Button asChild className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-11 px-6 shadow-lg hover:shadow-xl">
            <Link href="/dashboard/organizacion/doctores/nuevo">
              <UserPlus className="mr-2 h-5 w-5" />
              Agregar Doctor
            </Link>
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="border-2 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o especialización..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-base border-2 focus:border-primary"
                />
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Doctors Grid */}
      {filteredDoctors.length === 0 && searchTerm && (
        <Card className="border-2 shadow-lg">
          <CardContent className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No se encontraron resultados</h3>
            <p className="text-muted-foreground">
              Intenta con otros términos de búsqueda
            </p>
          </CardContent>
        </Card>
      )}

      {filteredDoctors.length === 0 && !searchTerm && (
        <Card className="border-2 shadow-lg">
          <CardContent className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <Stethoscope className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">No hay doctores registrados</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Comienza agregando doctores a tu organización para gestionar pacientes y citas
            </p>
            <Button asChild className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-11 px-6 shadow-lg">
              <Link href="/dashboard/organizacion/doctores/nuevo">
                <UserPlus className="mr-2 h-5 w-5" />
                Agregar Primer Doctor
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {filteredDoctors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => (
            <Card key={doctor.id} className="border-2 hover:border-primary/40 hover:shadow-xl transition-all overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors"></div>
              <CardHeader className="relative z-10">
                <div className="flex items-center space-x-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-2 border-primary/30 group-hover:scale-110 transition-transform">
                    <Stethoscope className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-bold truncate">
                      Dr. {doctor.firstName} {doctor.lastName}
                    </CardTitle>
                    <CardDescription className="truncate">{doctor.specialization}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <div className="flex items-center space-x-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground truncate">{doctor.email}</span>
                </div>
                
                {doctor.phone && (
                  <div className="flex items-center space-x-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">{doctor.phone}</span>
                  </div>
                )}

                {doctor.licenseNumber && (
                  <div className="flex items-center space-x-3 text-sm">
                    <Award className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">{doctor.licenseNumber}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2">
                    {doctor.isAvailable ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        Disponible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                        No disponible
                      </span>
                    )}
                  </div>
                  {doctor.rating && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <Activity className="h-3.5 w-3.5" />
                      <span>{doctor.rating.toFixed(1)} ({doctor.totalReviews || 0})</span>
                    </div>
                  )}
                </div>

                <Button asChild variant="outline" className="w-full hover:bg-primary hover:text-primary-foreground transition-colors border-2 mt-2">
                  <Link href={`/dashboard/organizacion/doctores/${doctor.id}`}>
                    Ver Dashboard
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats Footer */}
      {doctors.length > 0 && (
        <Card className="border-2 bg-gradient-to-r from-muted/50 to-background">
          <CardContent className="py-5">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-foreground">
                Mostrando <span className="font-bold">{filteredDoctors.length}</span> de <span className="font-bold">{doctors.length}</span> doctores
              </span>
              <span className="text-muted-foreground">
                <span className="font-bold text-primary">{doctors.filter(d => d.isAvailable).length}</span> disponibles
              </span>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </DashboardLayout>
  )
}


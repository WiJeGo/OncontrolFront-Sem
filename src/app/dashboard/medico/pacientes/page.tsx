"use client"

import { useState } from "react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { BackButton } from "@/components/ui/back-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import { useDoctorPatients } from "@/hooks/use-doctors"
import { isDoctorUser } from "@/types/organization"
import { Search, Plus, MoreHorizontal, Eye, Calendar, Phone, Mail, Activity, Users } from "lucide-react"

export default function PatientsPage() {
  const { user } = useAuthContext()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Get doctor profile ID directly from user
  const doctorProfileId = user && isDoctorUser(user) ? user.profile.id : null

  const { patients: patientsList, isLoading, error, refetch } = useDoctorPatients(doctorProfileId)

  const filteredPatients = (patientsList || []).filter(patient => {
    // Filter by search term
    const searchMatch = searchTerm === "" || 
      patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.profileId && patient.profileId.toLowerCase().includes(searchTerm.toLowerCase()))

    // Filter by status
    const statusMatch = statusFilter === "all" ||
      (statusFilter === "active" && patient.isActive) ||
      (statusFilter === "inactive" && !patient.isActive)

    return searchMatch && statusMatch
  })

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

  if (isLoading) {
    return (
      <AuthGuard requiredRole="DOCTOR">
        <DashboardLayout>
          <Loading message="Cargando pacientes..." />
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
              <Button onClick={() => refetch()}>
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
        <BackButton fallbackUrl="/dashboard/medico" label="Volver al dashboard" />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Gestión de Pacientes
            </h1>
            <p className="text-muted-foreground text-lg">
              Administra y supervisa a tus pacientes ({filteredPatients.length} {filteredPatients.length === 1 ? 'paciente' : 'pacientes'})
            </p>
          </div>
          <Button asChild className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-11 px-6 shadow-lg hover:shadow-xl">
            <Link href="/dashboard/medico/pacientes/nuevo">
              <Plus className="mr-2 h-5 w-5" />
              Nuevo Paciente
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Total Pacientes</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-foreground mb-1">{patientsList.length}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                Pacientes registrados
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 border-secondary/20 hover:border-secondary/40 transition-all hover:shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Pacientes Activos</CardTitle>
              <div className="p-2 rounded-lg bg-secondary/10">
                <Users className="h-5 w-5 text-secondary" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-foreground mb-1">
                {patientsList.filter(p => p.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                En tratamiento
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 border-muted/20 hover:border-muted/40 transition-all hover:shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-muted/5 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Pacientes Inactivos</CardTitle>
              <div className="p-2 rounded-lg bg-muted/10">
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-foreground mb-1">
                {patientsList.filter(p => !p.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                Inactivos
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
                  placeholder="Buscar por nombre, email o ID de paciente..."
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
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Patients Table */}
        <Card className="border-2 shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
            <CardTitle className="text-2xl font-bold">Lista de Pacientes</CardTitle>
            <CardDescription className="mt-1">
              {filteredPatients.length} {filteredPatients.length === 1 ? 'paciente encontrado' : 'pacientes encontrados'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {searchTerm || statusFilter !== "all" 
                    ? "No se encontraron pacientes" 
                    : "No hay pacientes registrados"}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {searchTerm || statusFilter !== "all" 
                    ? "Intenta cambiar los filtros de búsqueda" 
                    : "Comienza agregando pacientes para gestionar sus tratamientos"}
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Button asChild className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-11 px-6 shadow-lg">
                    <Link href="/dashboard/medico/pacientes/nuevo">
                      <Plus className="mr-2 h-5 w-5" />
                      Agregar Primer Paciente
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Edad</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Diagnóstico</TableHead>
                    <TableHead>Tipo Sangre</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 font-bold">
                              {patient.firstName[0]}{patient.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {patient.firstName} {patient.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {patient.city || "Ciudad no especificada"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-3 py-1.5 rounded-lg border-2 font-semibold">
                          {patient.profileId}
                        </code>
                      </TableCell>
                      <TableCell>
                        {calculateAge(patient.birthDate)} años
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="truncate max-w-[200px]">{patient.email}</span>
                          </div>
                          {patient.phone && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Phone className="h-3 w-3 mr-1" />
                              <span>{patient.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {patient.cancerType && (
                            <Badge variant="outline" className="block w-fit border-2 font-semibold">
                              {patient.cancerType}
                            </Badge>
                          )}
                          {patient.cancerStage && (
                            <span className="text-xs text-muted-foreground">
                              Etapa {patient.cancerStage}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-2">
                          {patient.bloodType || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={patient.isActive ? "default" : "secondary"} className="border-2">
                          {patient.isActive ? "Activo" : "Inactivo"}
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
                              <Link href={`/dashboard/medico/pacientes/${patient.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalles
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/medico/citas/nueva?patientId=${patient.id}`}>
                                <Calendar className="mr-2 h-4 w-4" />
                                Nueva Cita
                              </Link>
                            </DropdownMenuItem>
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

        {/* Emergency Contacts Info */}
        {filteredPatients.some(p => p.emergencyContactName) && (
          <Card className="border-2 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
              <CardTitle className="text-2xl font-bold">Contactos de Emergencia</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPatients
                  .filter(p => p.emergencyContactName)
                  .map((patient) => (
                    <div key={patient.id} className="p-4 border-2 rounded-xl hover:border-primary/40 hover:shadow-md transition-all bg-card">
                      <p className="font-bold text-lg mb-2">{patient.firstName} {patient.lastName}</p>
                      <p className="text-sm text-muted-foreground font-medium mb-1">
                        {patient.emergencyContactName} ({patient.emergencyContactRelationship})
                      </p>
                      <p className="text-sm font-semibold">{patient.emergencyContactPhone}</p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
    </AuthGuard>
  )
}

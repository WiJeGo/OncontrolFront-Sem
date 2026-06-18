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
import { Search, Plus, MoreHorizontal, Eye, Calendar, Phone, Mail, Activity, Users, Download, UserX } from "lucide-react"

export default function PatientsPage() {
  const { user } = useAuthContext()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Get doctor profile ID directly from user
  const doctorProfileId = user && isDoctorUser(user) ? user.profile.id : null

  const { patients: patientsList, isLoading, error, refetch } = useDoctorPatients(doctorProfileId)

  const exportToCSV = () => {
    if (!filteredPatients || filteredPatients.length === 0) return

    const headers = ["Nombre", "Apellido", "Email", "Teléfono", "ID Paciente", "Tipo Cáncer", "Etapa", "Estado"]
    const csvRows = [
      headers.join(","),
      ...filteredPatients.map(p => [
        p.firstName,
        p.lastName,
        p.email,
        p.phone || "N/A",
        p.profileId || "N/A",
        p.cancerType || "N/A",
        p.cancerStage || "N/A",
        p.isActive ? "Activo" : "Inactivo"
      ].map(field => `"${field}"`).join(","))
    ]

    const csvString = csvRows.join("\n")
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `pacientes_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

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
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Gestión de Pacientes
            </h1>
            <p className="text-muted-foreground">
              Administra y supervisa a tus pacientes (<span className="tabular-nums">{filteredPatients.length}</span> {filteredPatients.length === 1 ? 'paciente' : 'pacientes'})
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={exportToCSV}
              disabled={filteredPatients.length === 0}
              className="border-2 h-11 px-4 shadow-sm hover:shadow-md transition-all"
            >
              <Download className="mr-2 h-5 w-5" />
              Exportar CSV
            </Button>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors h-11 px-6 shadow-sm">
              <Link href="/dashboard/medico/pacientes/nuevo">
                <Plus className="mr-2 h-5 w-5" />
                Nuevo Paciente
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border border-primary/20 hover:border-primary/40 transition-colors hover:shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" aria-hidden="true"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Total Pacientes</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-foreground mb-1 tabular-nums">{patientsList.length}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true"></span>
                Pacientes registrados
              </p>
            </CardContent>
          </Card>
          <Card className="border border-success/20 hover:border-success/40 transition-colors hover:shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full -mr-16 -mt-16" aria-hidden="true"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Pacientes Activos</CardTitle>
              <div className="p-2 rounded-lg bg-success/10">
                <Activity className="h-5 w-5 text-success" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-foreground mb-1 tabular-nums">
                {patientsList.filter(p => p.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success" aria-hidden="true"></span>
                En tratamiento
              </p>
            </CardContent>
          </Card>
          <Card className="border border-muted hover:border-border transition-colors hover:shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-muted/40 rounded-full -mr-16 -mt-16" aria-hidden="true"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Pacientes Inactivos</CardTitle>
              <div className="p-2 rounded-lg bg-muted">
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-foreground mb-1 tabular-nums">
                {patientsList.filter(p => !p.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" aria-hidden="true"></span>
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
              <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-border">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                  <UserX className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  {searchTerm || statusFilter !== "all" 
                    ? "No se encontraron resultados" 
                    : "Tu lista de pacientes está vacía"}
                </h3>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto text-lg leading-relaxed">
                  {searchTerm || statusFilter !== "all" 
                    ? "Hemos buscado por todos lados, pero no encontramos coincidencias con esos filtros." 
                    : "Parece que aún no has registrado pacientes. Comienza agregando uno para gestionar su atención."}
                </p>
                {searchTerm || statusFilter !== "all" ? (
                  <Button 
                    variant="outline" 
                    onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}
                    className="h-11 px-6 border-2 hover:bg-muted transition-all"
                  >
                    Limpiar todos los filtros
                  </Button>
                ) : (
                  <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors h-11 px-8 shadow-sm">
                    <Link href="/dashboard/medico/pacientes/nuevo">
                      <Plus className="mr-2 h-5 w-5" />
                      Registrar Primer Paciente
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
                          <Avatar className="h-12 w-12 ring-1 ring-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
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
                      <TableCell className="tabular-nums">
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
                        <Badge variant="outline" className="font-mono tabular-nums">
                          {patient.bloodType || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {patient.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-success" aria-hidden="true" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" aria-hidden="true" />
                            Inactivo
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild variant="outline" size="sm" className="border-2 hover:bg-primary hover:text-primary-foreground transition-all">
                            <Link href={`/dashboard/medico/pacientes/${patient.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Detalles
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-primary/10">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="dynamic-island rounded-xl border-border/50">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/medico/pacientes/${patient.id}/editar`}>
                                  <Users className="mr-2 h-4 w-4" />
                                  Editar Paciente
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
                        </div>
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

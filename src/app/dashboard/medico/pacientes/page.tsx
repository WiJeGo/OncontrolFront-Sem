"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { BackButton } from "@/components/ui/back-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import { useDoctorPatients } from "@/hooks/use-doctors"
import { isDoctorUser } from "@/types/organization"
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Calendar,
  Phone,
  Mail,
  Activity,
  Users,
  Download,
  UserX,
  Pencil,
  ScanLine,
} from "lucide-react"

function CountUp({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce || value <= 0) {
      setDisplay(value)
      return
    }
    const duration = 700
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <span className={className}>{display}</span>
}

export default function PatientsPage() {
  const { user } = useAuthContext()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const doctorProfileId = user && isDoctorUser(user) ? user.profile.id : null
  const { patients: patientsList, isLoading, error, refetch } = useDoctorPatients(doctorProfileId)

  const filteredPatients = (patientsList || []).filter((patient) => {
    const searchMatch =
      searchTerm === "" ||
      patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.profileId && patient.profileId.toLowerCase().includes(searchTerm.toLowerCase()))
    const statusMatch =
      statusFilter === "all" ||
      (statusFilter === "active" && patient.isActive) ||
      (statusFilter === "inactive" && !patient.isActive)
    return searchMatch && statusMatch
  })

  const exportToCSV = () => {
    if (!filteredPatients || filteredPatients.length === 0) return
    const headers = ["Nombre", "Apellido", "Email", "Teléfono", "ID Paciente", "Tipo Cáncer", "Etapa", "Estado"]
    const csvRows = [
      headers.join(","),
      ...filteredPatients.map((p) =>
        [
          p.firstName,
          p.lastName,
          p.email,
          p.phone || "N/A",
          p.profileId || "N/A",
          p.cancerType || "N/A",
          p.cancerStage || "N/A",
          p.isActive ? "Activo" : "Inactivo",
        ]
          .map((field) => `"${field}"`)
          .join(","),
      ),
    ]
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `pacientes_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return "N/A"
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
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
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <p className="mb-4 text-destructive">{error}</p>
              <Button onClick={() => refetch()}>Reintentar</Button>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  const activeCount = patientsList.filter((p) => p.isActive).length
  const kpis = [
    { label: "Total pacientes", value: patientsList.length, sub: "Registrados", icon: Users, tint: "bg-primary/10 text-primary", tile: "bg-primary/[0.06]" },
    { label: "Activos", value: activeCount, sub: "En tratamiento", icon: Activity, tint: "bg-success/10 text-success", tile: "bg-success/[0.06]" },
    { label: "Inactivos", value: patientsList.length - activeCount, sub: "Sin actividad", icon: UserX, tint: "bg-muted text-muted-foreground", tile: "" },
  ]

  return (
    <AuthGuard requiredRole="DOCTOR">
      <DashboardLayout>
        <div className="space-y-6">
          <BackButton fallbackUrl="/dashboard/medico" label="Volver al dashboard" />

          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Pacientes</h1>
              <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                {filteredPatients.length} {filteredPatients.length === 1 ? "paciente" : "pacientes"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={exportToCSV}
                disabled={filteredPatients.length === 0}
                className="h-10 border-border px-4 hover:bg-muted"
              >
                <Download className="mr-1.5 h-4 w-4" />
                Exportar
              </Button>
              <Button asChild className="h-10 bg-primary px-4 text-primary-foreground shadow-sm hover:bg-primary/90">
                <Link href="/dashboard/medico/pacientes/nuevo">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Nuevo paciente
                </Link>
              </Button>
            </div>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-3 divide-x divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {kpis.map((kpi) => (
              <div key={kpi.label} className={`p-5 ${kpi.tile}`}>
                <div className="mb-3 flex items-center gap-2 text-[13px] text-muted-foreground">
                  <span className={`grid h-7 w-7 place-items-center rounded-lg ${kpi.tint}`}>
                    <kpi.icon className="h-4 w-4" />
                  </span>
                  <span className="hidden sm:inline">{kpi.label}</span>
                </div>
                <CountUp value={kpi.value} className="font-mono text-3xl font-semibold tabular-nums text-foreground" />
                <div className="mt-1 text-xs text-muted-foreground">{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* Table panel */}
          <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o ID…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 border-border pl-9"
                  aria-label="Buscar pacientes"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 w-full border-border sm:w-44">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredPatients.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <div className="relative mx-auto mb-4 grid h-20 w-20 place-items-center">
                  <span className="absolute inset-0 rounded-full bg-primary/5" aria-hidden="true" />
                  <span className="absolute inset-[10px] rounded-full bg-primary/10" aria-hidden="true" />
                  <UserX className="relative h-8 w-8 text-primary/70" aria-hidden="true" />
                </div>
                <h3 className="mb-1 font-semibold text-foreground">
                  {searchTerm || statusFilter !== "all" ? "Sin resultados" : "Tu lista de pacientes está vacía"}
                </h3>
                <p className="mx-auto mb-5 max-w-sm text-sm text-muted-foreground">
                  {searchTerm || statusFilter !== "all"
                    ? "No encontramos pacientes con esos filtros."
                    : "Registra un paciente para empezar a gestionar su atención."}
                </p>
                {searchTerm || statusFilter !== "all" ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setStatusFilter("all")
                    }}
                    className="border-border hover:bg-muted"
                  >
                    Limpiar filtros
                  </Button>
                ) : (
                  <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/dashboard/medico/pacientes/nuevo">
                      <Plus className="mr-1.5 h-4 w-4" />
                      Registrar primer paciente
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Paciente</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Edad</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Diagnóstico</TableHead>
                      <TableHead>Sangre</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                                {patient.firstName[0]}
                                {patient.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">
                                {patient.firstName} {patient.lastName}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {patient.city || "Ciudad no especificada"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-muted-foreground">{patient.profileId}</span>
                        </TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {calculateAge(patient.birthDate)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-xs">
                              <Mail className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
                              <span className="max-w-[180px] truncate">{patient.email}</span>
                            </div>
                            {patient.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3 shrink-0" aria-hidden="true" />
                                <span className="tabular-nums">{patient.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {patient.cancerType ? (
                            <div>
                              <p className="text-sm text-foreground">{patient.cancerType}</p>
                              {patient.cancerStage && (
                                <p className="text-xs text-muted-foreground">Etapa {patient.cancerStage}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm tabular-nums">{patient.bloodType || "—"}</span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium ${
                              patient.isActive ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${patient.isActive ? "bg-success" : "bg-muted-foreground"}`}
                              aria-hidden="true"
                            />
                            {patient.isActive ? "Activo" : "Inactivo"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              asChild
                              size="sm"
                              className="border border-primary/30 bg-primary/10 text-primary shadow-sm hover:bg-primary/20"
                            >
                              <Link href={`/dashboard/medico/pacientes/${patient.id}?tab=imaging`}>
                                <ScanLine className="mr-1.5 h-4 w-4" />
                                TC 3D
                              </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm" className="border-border hover:bg-muted">
                              <Link href={`/dashboard/medico/pacientes/${patient.id}`}>
                                <Eye className="mr-1.5 h-4 w-4" />
                                Ver
                              </Link>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Más acciones</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl">
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/medico/pacientes/${patient.id}/editar`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar paciente
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/medico/citas/nueva?patientId=${patient.id}`}>
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Nueva cita
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
              </div>
            )}
          </section>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

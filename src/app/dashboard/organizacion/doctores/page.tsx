"use client"

import { useEffect, useState } from "react"
import { useAuthContext } from "@/contexts/auth-context"
import { useOrganizationDoctors } from "@/hooks/use-organizations"
import { isOrganizationUser } from "@/types/organization"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Loading } from "@/components/loading"
import { BackButton } from "@/components/ui/back-button"
import { Stethoscope, Search, UserPlus, Mail, Phone, Award, Star } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function DoctorsListPage() {
  const { user, isLoading: authLoading } = useAuthContext()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

  const organizationId = user && isOrganizationUser(user) ? user.id : null

  useEffect(() => {
    if (!authLoading && user && !isOrganizationUser(user)) {
      router.replace("/dashboard")
    }
  }, [user, authLoading, router])

  const { doctors, isLoading, error, refetch } = useOrganizationDoctors(organizationId)

  const filteredDoctors = doctors.filter((doctor) => {
    const s = searchTerm.toLowerCase()
    return (
      doctor.firstName.toLowerCase().includes(s) ||
      doctor.lastName.toLowerCase().includes(s) ||
      doctor.email.toLowerCase().includes(s) ||
      doctor.specialization.toLowerCase().includes(s)
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
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-destructive">{error}</p>
            <Button onClick={() => refetch()}>Intentar de nuevo</Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton fallbackUrl="/dashboard/organizacion" label="Volver al dashboard" />

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Médicos</h1>
            <p className="mt-1 text-sm tabular-nums text-muted-foreground">
              {filteredDoctors.length} de {doctors.length} ·{" "}
              <span className="text-success">{doctors.filter((d) => d.isAvailable).length} disponibles</span>
            </p>
          </div>
          <Button asChild className="h-10 bg-primary px-4 text-primary-foreground shadow-sm hover:bg-primary/90">
            <Link href="/dashboard/organizacion/doctores/nuevo">
              <UserPlus className="mr-1.5 h-4 w-4" />
              Agregar médico
            </Link>
          </Button>
        </div>

        {/* Toolbar */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o especialización…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 border-border pl-9"
              aria-label="Buscar médicos"
            />
          </div>
        </div>

        {/* Empty states */}
        {filteredDoctors.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-5 py-16 text-center shadow-sm">
            <div className="relative mx-auto mb-4 grid h-20 w-20 place-items-center">
              <span className="absolute inset-0 rounded-full bg-primary/5" aria-hidden="true" />
              <span className="absolute inset-[10px] rounded-full bg-primary/10" aria-hidden="true" />
              <Stethoscope className="relative h-8 w-8 text-primary/70" aria-hidden="true" />
            </div>
            <h3 className="mb-1 font-semibold text-foreground">
              {searchTerm ? "Sin resultados" : "Aún no hay médicos"}
            </h3>
            <p className="mx-auto mb-5 max-w-sm text-sm text-muted-foreground">
              {searchTerm
                ? "Prueba con otros términos de búsqueda."
                : "Agrega médicos a tu organización para gestionar pacientes y citas."}
            </p>
            {!searchTerm && (
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/dashboard/organizacion/doctores/nuevo">
                  <UserPlus className="mr-1.5 h-4 w-4" />
                  Agregar primer médico
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                      {doctor.firstName?.[0]}
                      {doctor.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">
                      Dr. {doctor.firstName} {doctor.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{doctor.specialization}</p>
                  </div>
                </div>

                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{doctor.email}</span>
                  </div>
                  {doctor.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="tabular-nums">{doctor.phone}</span>
                    </div>
                  )}
                  {doctor.licenseNumber && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Award className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="font-mono text-xs">{doctor.licenseNumber}</span>
                    </div>
                  )}
                </dl>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium ${
                      doctor.isAvailable ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${doctor.isAvailable ? "bg-success" : "bg-muted-foreground"}`}
                      aria-hidden="true"
                    />
                    {doctor.isAvailable ? "Disponible" : "No disponible"}
                  </span>
                  {doctor.rating ? (
                    <span className="flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
                      <Star className="h-3.5 w-3.5 text-warning-foreground" aria-hidden="true" />
                      {doctor.rating.toFixed(1)} ({doctor.totalReviews || 0})
                    </span>
                  ) : null}
                </div>

                <Button asChild variant="outline" className="mt-4 w-full border-border hover:bg-muted">
                  <Link href={`/dashboard/organizacion/doctores/${doctor.id}`}>Ver perfil</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

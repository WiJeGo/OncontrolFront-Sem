"use client"

import type React from "react"

import { useState, memo, useMemo, useCallback, useEffect } from "react"
import { OnControlLogo } from "./oncontrol-logo"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import {
  Users,
  Calendar,
  CalendarDays,
  Heart,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Stethoscope,
  Activity,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuthContext } from "@/contexts/auth-context"
import { Loading } from "./loading"
import { ModeToggle } from "./mode-toggle"

interface DashboardLayoutProps {
  children: React.ReactNode
}

const ROLE_LABEL: Record<string, string> = {
  organizacion: "Organización",
  medico: "Médico",
  paciente: "Paciente",
}

export const DashboardLayout = memo(function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, isLoading, isAuthenticated } = useAuthContext()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const userType =
    user?.type === "ORGANIZATION" ? "organizacion" : user?.type === "DOCTOR" ? "medico" : "paciente"

  const handleLogout = useCallback(async () => {
    await logout()
  }, [logout])

  const organizacionNavItems = useMemo(
    () => [
      { href: "/dashboard/organizacion", icon: Home, label: "Dashboard" },
      { href: "/dashboard/organizacion/doctores", icon: Stethoscope, label: "Doctores" },
    ],
    [],
  )

  const medicoNavItems = useMemo(
    () => [
      { href: "/dashboard/medico", icon: Home, label: "Dashboard" },
      { href: "/dashboard/medico/pacientes", icon: Users, label: "Pacientes" },
      { href: "/dashboard/medico/citas", icon: Calendar, label: "Citas" },
      { href: "/dashboard/medico/calendario", icon: CalendarDays, label: "Calendario" },
      { href: "/dashboard/medico/tratamientos", icon: Heart, label: "Tratamientos" },
      { href: "/dashboard/medico/reportes", icon: BarChart3, label: "Reportes" },
    ],
    [],
  )

  const pacienteNavItems = useMemo(
    () => [
      { href: "/dashboard/paciente", icon: Home, label: "Dashboard" },
      { href: "/dashboard/paciente/tratamiento", icon: Heart, label: "Mi tratamiento" },
      { href: "/dashboard/paciente/citas", icon: Calendar, label: "Mis citas" },
      { href: "/dashboard/paciente/sintomas", icon: Activity, label: "Síntomas" },
      { href: "/dashboard/paciente/medicamentos", icon: Stethoscope, label: "Medicamentos" },
      { href: "/dashboard/paciente/historial", icon: FileText, label: "Historial" },
    ],
    [],
  )

  const navItems = useMemo(() => {
    if (userType === "organizacion") return organizacionNavItems
    if (userType === "medico") return medicoNavItems
    return pacienteNavItems
  }, [userType, organizacionNavItems, medicoNavItems, pacienteNavItems])

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      router.push("/auth/login")
    }
  }, [isLoading, isAuthenticated, user, router])

  if (isLoading) {
    return <Loading message="Verificando autenticación..." />
  }

  if (!isAuthenticated || !user) {
    return null
  }

  if (!isMounted) {
    return <Loading message="Cargando..." />
  }

  const base = `/dashboard/${userType}`
  const currentSection =
    navItems.find((item) => pathname === item.href || (item.href !== base && pathname.startsWith(item.href + "/")))
      ?.label ??
    (userType === "organizacion" ? "Organización" : userType === "medico" ? "Médico" : "Paciente")
  const displayName =
    user.type === "ORGANIZATION" && "organizationName" in user
      ? user.organizationName || "Organización"
      : user.type === "DOCTOR" && "profile" in user
        ? `Dr. ${user.profile.firstName} ${user.profile.lastName}`
        : user.type === "PATIENT" && "profile" in user
          ? `${user.profile.firstName} ${user.profile.lastName}`
          : "Usuario"
  const email =
    user.type === "ORGANIZATION" && "email" in user
      ? user.email
      : "profile" in user
        ? user.profile.email
        : ""
  const initials =
    user.type === "ORGANIZATION" && "organizationName" in user
      ? user.organizationName?.[0] || "O"
      : "profile" in user
        ? `${user.profile.firstName?.[0] || ""}${user.profile.lastName?.[0] || ""}`
        : "U"

  const NavLink = ({
    href,
    icon: Icon,
    label,
    collapsed,
  }: {
    href: string
    icon: React.ComponentType<{ className?: string }>
    label: string
    collapsed?: boolean
  }) => {
    const isActive = pathname === href || (href !== base && pathname.startsWith(href + "/"))
    return (
      <Link
        href={href}
        onClick={() => setSidebarOpen(false)}
        title={collapsed ? label : undefined}
        aria-current={isActive ? "page" : undefined}
        className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          collapsed ? "justify-center" : ""
        } ${
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        {isActive && (
          <span
            className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary"
            aria-hidden="true"
          />
        )}
        <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-primary" : ""}`} />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    )
  }

  const AccountMenu = ({ collapsed }: { collapsed?: boolean }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex w-full items-center gap-3 rounded-lg border border-border bg-card p-2 text-left transition-colors hover:bg-muted ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src="/hombre-62-a-os-profesional.jpg" alt="" />
            <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{ROLE_LABEL[userType]}</p>
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60 rounded-xl" align="start" side="top" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-0.5">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userType !== "organizacion" && (
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/${userType}/perfil`}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configuración</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const SidebarInner = ({ collapsed }: { collapsed?: boolean }) => (
    <div className="flex h-full flex-col">
      {/* Brand + collapse */}
      <div
        className={`flex h-16 items-center border-b border-border px-4 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {collapsed ? (
          <Link href={base} aria-label="OnControl">
            <OnControlLogo size="sm" hideText />
          </Link>
        ) : (
          <Link href={base} aria-label="OnControl">
            <OnControlLogo size="md" />
          </Link>
        )}
        {!collapsed && (
          <>
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="hidden h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted lg:flex"
              aria-label="Colapsar menú"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted lg:hidden"
              aria-label="Cerrar menú"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {!collapsed && (
          <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Menú
          </p>
        )}
        {collapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Expandir menú"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
        {navItems.map((item) => (
          <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} collapsed={collapsed} />
        ))}
      </nav>

      {/* Account */}
      <div className="border-t border-border p-3">
        <AccountMenu collapsed={collapsed} />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-sidebar shadow-xl">
            <SidebarInner />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:flex-col border-r border-border bg-sidebar transition-[width] duration-300 ease-out ${
          sidebarCollapsed ? "lg:w-16" : "lg:w-64"
        }`}
      >
        <SidebarInner collapsed={sidebarCollapsed} />
      </aside>

      {/* Main column */}
      <div className={`transition-[padding] duration-300 ease-out ${sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="hidden text-muted-foreground sm:inline">{ROLE_LABEL[userType]}</span>
              <span className="hidden text-border sm:inline">/</span>
              <span className="font-medium text-foreground">{currentSection}</span>
            </div>
          </div>
          <ModeToggle />
        </header>

        {/* Page content */}
        <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-4 pb-10 pt-6 lg:px-8">{children}</main>

        {/* Footer */}
        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row lg:px-8">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>OnControl 3D · Gestión oncológica</span>
            </div>
            <p className="text-xs">© {new Date().getFullYear()} OnControl. Todos los derechos reservados.</p>
          </div>
        </footer>
      </div>
    </div>
  )
})

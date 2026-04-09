"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthContext } from '@/contexts/auth-context'
import { isOrganizationUser, isDoctorUser, isPatientUser } from '@/types/organization'
import { Loading } from './loading'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'ORGANIZATION' | 'DOCTOR' | 'PATIENT' | 'ADMIN'
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuthContext()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated || !user) {
      // Redirect to login if not authenticated
      router.push('/auth/login')
      return
    }

    // Check role match
    if (requiredRole) {
      const hasPermission = 
        (requiredRole === 'ORGANIZATION' && isOrganizationUser(user)) ||
        (requiredRole === 'DOCTOR' && isDoctorUser(user)) ||
        (requiredRole === 'PATIENT' && isPatientUser(user))

      if (!hasPermission) {
        // Redirect to appropriate dashboard based on user type
        if (isOrganizationUser(user)) {
          router.push('/dashboard/organizacion')
        } else if (isDoctorUser(user)) {
          router.push('/dashboard/medico')
        } else if (isPatientUser(user)) {
          router.push('/dashboard/paciente')
        } else {
          router.push('/dashboard')
        }
        return
      }
    }

    // Check if user is trying to access wrong dashboard
    if (isDoctorUser(user) && (pathname.startsWith('/dashboard/paciente') || pathname.startsWith('/dashboard/organizacion'))) {
      router.push('/dashboard/medico')
      return
    }

    if (isPatientUser(user) && (pathname.startsWith('/dashboard/medico') || pathname.startsWith('/dashboard/organizacion'))) {
      router.push('/dashboard/paciente')
      return
    }

    if (isOrganizationUser(user) && (pathname.startsWith('/dashboard/medico') || pathname.startsWith('/dashboard/paciente'))) {
      router.push('/dashboard/organizacion')
      return
    }
  }, [isAuthenticated, user, isLoading, router, pathname, requiredRole])

  if (isLoading) {
    return <Loading message="Verificando autenticación..." />
  }

  if (!isAuthenticated || !user) {
    return null
  }

  if (requiredRole) {
    const hasPermission = 
      (requiredRole === 'ORGANIZATION' && isOrganizationUser(user)) ||
      (requiredRole === 'DOCTOR' && isDoctorUser(user)) ||
      (requiredRole === 'PATIENT' && isPatientUser(user))

    if (!hasPermission) {
      return null
    }
  }

  return <>{children}</>
}

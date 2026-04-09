"use client"

import React, { createContext, useContext, ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import type { 
  LoginRequest, 
  LoginResponse,
  RegisterOrganizationRequest,
  OrganizationLoginResponse
} from '@/lib/api'
import type { User } from '@/types/organization'
import { isOrganizationUser } from '@/types/organization'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<LoginResponse>
  registerOrganization: (data: RegisterOrganizationRequest) => Promise<OrganizationLoginResponse>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

// Helper function to get user ID from different user types
export function getUserId(user: User): number {
  if (isOrganizationUser(user)) {
    return user.id // OrganizationUser
  }
  // For DoctorUser and PatientUser
  return user.profile.id
}
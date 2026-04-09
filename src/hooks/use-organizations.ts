"use client"

import { useState, useEffect } from 'react';
import { dashboard, organizations } from '@/lib/api';
import type {
  DoctorProfileResponse,
  OrganizationDashboardResponse,
  CreateDoctorRequest
} from '@/lib/api';

// Tipo temporal para organizaciones (debe coincidir con el tipo del backend)
export interface Organization {
  id: number;
  name: string;
  address: string;
  phone: string;
  email?: string;
  city?: string;
  country?: string;
  isActive: boolean;
  totalDoctors?: number;
  createdAt: string;
}

interface OrganizationsFilters {
  search?: string;
  isActive?: boolean;
}

/**
 * Hook para obtener todas las organizaciones (para admin)
 * NOTA: Este endpoint aún no está implementado en el backend
 */
export function useOrganizations(filters?: OrganizationsFilters) {
  const [organizationsData, setOrganizationsData] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrganizations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // TODO: Implementar endpoint en el backend para listar organizaciones
      // const data = await apiClient.getOrganizations(filters);
      // setOrganizationsData(data);
      
      // Por ahora retornamos un array vacío
      setOrganizationsData([]);
      console.warn('useOrganizations: Endpoint no implementado en el backend');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar organizaciones');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, [filters?.search, filters?.isActive]);

  return {
    organizations: organizationsData,
    isLoading,
    error,
    refetch: loadOrganizations
  };
}

/**
 * Hook para obtener el dashboard de una organización (usa nuevo endpoint de dashboard)
 */
export function useOrganizationDashboard(organizationId: number | null, doctorIdFilter?: number) {
  const [dashboardData, setDashboardData] = useState<OrganizationDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    if (!organizationId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await dashboard.getOrganizationDashboard(organizationId, doctorIdFilter);
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, doctorIdFilter]);

  return {
    dashboard: dashboardData,
    isLoading,
    error,
    refetch: loadDashboard
  };
}

/**
 * Hook para obtener los doctores de una organización
 */
export function useOrganizationDoctors(organizationId: number | null) {
  const [doctors, setDoctors] = useState<DoctorProfileResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDoctors = async () => {
    if (!organizationId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await organizations.getDoctors(organizationId);
      setDoctors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar doctores');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  return {
    doctors,
    isLoading,
    error,
    refetch: loadDoctors
  };
}

/**
 * Hook para obtener un doctor específico de una organización
 */
export function useOrganizationDoctor(organizationId: number | null, doctorId: number | null) {
  const [doctor, setDoctor] = useState<DoctorProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDoctor = async () => {
    if (!organizationId || !doctorId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await organizations.getDoctor(organizationId, doctorId);
      setDoctor(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar doctor');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, doctorId]);

  return {
    doctor,
    isLoading,
    error,
    refetch: loadDoctor
  };
}

/**
 * Hook para acciones de organización (crear doctores, crear organizaciones, etc)
 */
export function useOrganizationActions(organizationId: number | null = null) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDoctor = async (data: CreateDoctorRequest): Promise<DoctorProfileResponse | null> => {
    if (!organizationId) {
      setError('ID de organización no disponible');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await organizations.createDoctor(organizationId, data);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear doctor');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const createOrganization = async (_data: Partial<Organization>): Promise<Organization | null> => {
    try {
      setIsLoading(true);
      setError(null);
      // TODO: Implementar endpoint en el backend para crear organizaciones
      // const result = await apiClient.createOrganization(_data);
      // return result;
      
      console.warn('createOrganization: Endpoint no implementado en el backend');
      setError('Funcionalidad no implementada');
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear organización');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createDoctor,
    createOrganization,
    isLoading,
    error
  };
}

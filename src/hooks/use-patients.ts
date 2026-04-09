"use client"

import { useState, useEffect } from 'react';
import { dashboard } from '@/lib/api';
import type {
  PatientDashboardResponse
} from '@/lib/api';

/**
 * Hook para obtener el dashboard de un paciente (usa nuevo endpoint de dashboard)
 */
export function usePatientDashboard(patientProfileId: number | null) {
  const [dashboardData, setDashboardData] = useState<PatientDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    if (!patientProfileId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await dashboard.getPatientDashboard(patientProfileId);
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
  }, [patientProfileId]);

  return {
    dashboard: dashboardData,
    isLoading,
    error,
    refetch: loadDashboard
  };
}

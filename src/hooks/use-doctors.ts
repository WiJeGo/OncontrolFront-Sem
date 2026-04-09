"use client"

import { useState, useEffect } from 'react';
import { dashboard, doctors } from '@/lib/api';
import type {
  PatientProfileResponse,
  DoctorDashboardResponse,
  CreatePatientRequest,
  SymptomResponse
} from '@/lib/api';

/**
 * Hook para obtener el dashboard de un doctor (usa nuevo endpoint de dashboard)
 */
export function useDoctorDashboard(doctorProfileId: number | null, patientIdFilter?: number) {
  const [dashboardData, setDashboardData] = useState<DoctorDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    if (!doctorProfileId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await dashboard.getDoctorDashboard(doctorProfileId, patientIdFilter);
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
  }, [doctorProfileId, patientIdFilter]);

  return {
    dashboard: dashboardData,
    isLoading,
    error,
    refetch: loadDashboard
  };
}

/**
 * Hook para obtener los pacientes de un doctor
 */
export function useDoctorPatients(doctorProfileId: number | null) {
  const [patients, setPatients] = useState<PatientProfileResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPatients = async () => {
    if (!doctorProfileId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await doctors.getPatients(doctorProfileId);
      setPatients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pacientes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorProfileId]);

  return {
    patients,
    isLoading,
    error,
    refetch: loadPatients
  };
}

/**
 * Hook para obtener un paciente específico del doctor
 */
export function useDoctorPatient(doctorProfileId: number | null, patientId: number | null) {
  const [patient, setPatient] = useState<PatientProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPatient = async () => {
    if (!doctorProfileId || !patientId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await doctors.getPatient(doctorProfileId, patientId);
      setPatient(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar paciente');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorProfileId, patientId]);

  return {
    patient,
    isLoading,
    error,
    refetch: loadPatient
  };
}

/**
 * Hook para obtener los síntomas de un paciente (vista del doctor)
 */
export function useDoctorPatientSymptoms(
  doctorProfileId: number | null,
  patientId: number | null
) {
  const [symptoms, setSymptoms] = useState<SymptomResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSymptoms = async () => {
    if (!doctorProfileId || !patientId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await doctors.getPatientSymptoms(doctorProfileId, patientId);
      setSymptoms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar síntomas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSymptoms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorProfileId, patientId]);

  return {
    symptoms,
    isLoading,
    error,
    refetch: loadSymptoms
  };
}

/**
 * Hook para acciones del doctor (crear pacientes, etc)
 */
export function useDoctorActions(doctorProfileId: number | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPatient = async (data: CreatePatientRequest): Promise<PatientProfileResponse | null> => {
    if (!doctorProfileId) {
      setError('ID de doctor no disponible');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await doctors.createPatient(doctorProfileId, data);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear paciente');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createPatient,
    isLoading,
    error
  };
}

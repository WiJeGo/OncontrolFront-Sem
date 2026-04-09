"use client"

import { useState, useCallback } from 'react'
import { appointments, type CreateAppointmentRequest, type AppointmentResponse } from '@/lib/api'

export function useAppointments() {
  const [appointmentsList, setAppointmentsList] = useState<AppointmentResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAppointments = useCallback(async (doctorProfileId: number) => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await appointments.getDoctorAppointments(doctorProfileId)
      setAppointmentsList(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar las citas')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadPatientAppointments = useCallback(async (patientProfileId: number) => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await appointments.getPatientAppointments(patientProfileId)
      setAppointmentsList(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar las citas')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createAppointment = useCallback(async (doctorProfileId: number, patientProfileId: number, appointmentData: CreateAppointmentRequest) => {
    try {
      setIsLoading(true)
      setError(null)
      const newAppointment = await appointments.create(doctorProfileId, patientProfileId, appointmentData)
      setAppointmentsList(prev => [...prev, newAppointment])
      return newAppointment
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la cita')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateAppointmentStatus = useCallback(async (id: number, status: AppointmentResponse['status'], reason?: string) => {
    try {
      setIsLoading(true)
      setError(null)
      const updatedAppointment = await appointments.updateStatus(id, status, reason)
      setAppointmentsList(prev => 
        prev.map(appointment => 
          appointment.id === id ? updatedAppointment : appointment
        )
      )
      return updatedAppointment
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la cita')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getAppointmentById = useCallback(async (id: number) => {
    try {
      setIsLoading(true)
      setError(null)
      const appointment = await appointments.getById(id)
      return appointment
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al obtener la cita')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    appointmentsList,
    isLoading,
    error,
    loadAppointments,
    loadPatientAppointments,
    createAppointment,
    updateAppointmentStatus,
    getAppointmentById,
  }
}

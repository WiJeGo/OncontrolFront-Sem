"use client"

import { useState, useCallback } from 'react'
import { symptoms, type CreateSymptomRequest, type SymptomResponse } from '@/lib/api'

export function useSymptoms() {
  const [symptomsList, setSymptomsList] = useState<SymptomResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSymptoms = useCallback(async (patientProfileId: number) => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await symptoms.getAll(patientProfileId)
      setSymptomsList(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar los síntomas')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadRecentSymptoms = useCallback(async (patientProfileId: number, days?: number) => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await symptoms.getRecent(patientProfileId, days)
      setSymptomsList(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar los síntomas recientes')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createSymptom = useCallback(async (patientProfileId: number, symptomData: CreateSymptomRequest) => {
    try {
      setIsLoading(true)
      setError(null)
      const newSymptom = await symptoms.create(patientProfileId, symptomData)
      setSymptomsList(prev => [...prev, newSymptom])
      return newSymptom
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar el síntoma')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getSymptomStats = useCallback(async (patientProfileId: number) => {
    try {
      setIsLoading(true)
      setError(null)
      const stats = await symptoms.getStats(patientProfileId)
      return stats
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar las estadísticas')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    symptomsList,
    isLoading,
    error,
    loadSymptoms,
    loadRecentSymptoms,
    createSymptom,
    getSymptomStats,
  }
}

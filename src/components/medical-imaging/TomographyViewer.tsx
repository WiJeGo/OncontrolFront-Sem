"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  AlertTriangle,
  ExternalLink,
  FileSearch,
  ImageIcon,
  Info,
  ScanLine,
  ShieldCheck,
  Upload,
} from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { imagingStudies, type ImagingStudyResponse } from "@/lib/api"

type TomographyViewerProps = {
  patientId: string | number
  patientName?: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ""
const ORTHANC_WEB_URL =
  process.env.NEXT_PUBLIC_ORTHANC_WEB_URL ?? "/orthanc"

function formatModality(modality?: string) {
  switch (modality) {
    case "CT":
      return "Tomografía"
    case "MR":
      return "Resonancia"
    case "PT":
      return "PET"
    case "US":
      return "Ecografía"
    default:
      return "Imagen médica"
  }
}

export function TomographyViewer({
  patientId,
  patientName,
}: TomographyViewerProps) {
  const [studies, setStudies] = useState<ImagingStudyResponse[]>([])
  const [selectedStudyId, setSelectedStudyId] = useState<number | null>(null)
  const [viewerUrl, setViewerUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Studies now come from the DB (imaging_studies) via the backend, keyed by
  // patient_profile_id — no more hardcoded mapping.
  const loadStudies = useCallback(async () => {
    try {
      const data = await imagingStudies.getByPatient(Number(patientId))
      setStudies(data)
      setSelectedStudyId((current) => current ?? (data[0]?.id ?? null))
      return data
    } catch {
      setStudies([])
      return [] as ImagingStudyResponse[]
    }
  }, [patientId])

  useEffect(() => {
    loadStudies()
  }, [loadStudies])

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = "" // allow re-selecting the same file
    if (!file) return

    try {
      setIsUploading(true)
      setError(null)
      const created = await imagingStudies.upload(Number(patientId), file)
      await loadStudies()
      setSelectedStudyId(created.id)
      setViewerUrl(null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo subir la tomografía."
      )
    } finally {
      setIsUploading(false)
    }
  }

  const uploadControls = (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".dcm,.zip,application/dicom,application/zip"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        <Upload className="mr-2 h-4 w-4" />
        {isUploading ? "Subiendo tomografía..." : "Subir tomografía"}
      </Button>
    </>
  )

  const selectedStudy =
    studies.find((study) => study.id === selectedStudyId) ?? studies[0]

  async function handleGenerateLungSegmentation() {
    if (!selectedStudy?.orthancStudyId) return

    try {
      setIsProcessing(true)
      setError(null)
      setViewerUrl(null)

      const token =
        typeof window !== "undefined" ? localStorage.getItem("auth_token") : null

        if (!token) {
        throw new Error("No hay token de autenticación. Vuelve a iniciar sesión.")
        }

        const response = await fetch(
        `${API_URL}/api/imaging/studies/${selectedStudy.orthancStudyId}/segment-lungs?thresholdHu=-400&borderErosionRadius=1&force=false`,
        {
            method: "POST",
            headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            },
        }
        )

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || "No se pudo generar la segmentación pulmonar.")
      }

      const data = await response.json()

      if (!data.volviewUrl) {
        throw new Error("El backend no devolvió la URL de VolView.")
      }

      setViewerUrl(data.volviewUrl)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error desconocido generando segmentación pulmonar."
      )
    } finally {
      setIsProcessing(false)
    }
  }

  if (studies.length === 0) {
    return (
      <Card className="border shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-3 text-base font-semibold">
            <div className="rounded-lg bg-primary/10 p-2">
              <ScanLine className="h-6 w-6 text-primary" />
            </div>
            Imágenes médicas
          </CardTitle>
          <CardDescription>
            No hay estudios configurados para este paciente.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          <Alert className="border-yellow-300 bg-yellow-50 text-yellow-900">
            <Info className="h-5 w-5" />
            <AlertDescription className="font-medium">
              Este paciente no tiene estudios de imagen vinculados. Sube la
              tomografía a Orthanc y asóciala al paciente mediante{" "}
              <code>POST /api/imaging/patients/{"{"}id{"}"}/studies</code>.
            </AlertDescription>
          </Alert>

          <div className="rounded-xl border border-dashed p-8 text-center">
            <FileSearch className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-base font-semibold text-muted-foreground">
              Sin tomografías asociadas
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Paciente: {patientName || patientId}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {uploadControls}
              <Button asChild variant="ghost">
                <a href={ORTHANC_WEB_URL} target="_blank" rel="noreferrer">
                  Abrir Orthanc
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>

            {error && (
              <p className="mt-3 text-sm font-medium text-destructive">{error}</p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Alert className="border-yellow-300 bg-yellow-50 text-yellow-900">
        <AlertTriangle className="h-5 w-5" />
        <AlertDescription className="font-medium">
          Visualización referencial. No usar como único medio para diagnóstico
          clínico sin validación médica, control de calidad y trazabilidad.
        </AlertDescription>
      </Alert>

      <Card className="border shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-base font-semibold">
                <div className="rounded-lg bg-primary/10 p-2">
                  <ScanLine className="h-6 w-6 text-primary" />
                </div>
                Reconstrucción pulmonar 3D
              </CardTitle>
              <CardDescription>
                Estudios asociados a {patientName || `paciente ${patientId}`}
              </CardDescription>
            </div>

          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          {selectedStudy && (
            <>
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-xl border bg-muted/50 p-3">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">
                    Modalidad
                  </p>
                  <Badge variant="outline" className="font-semibold">
                    {formatModality(selectedStudy.modality)}
                  </Badge>
                </div>

                <div className="rounded-xl border bg-muted/50 p-3">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">
                    Región
                  </p>
                  <p className="text-sm font-bold">
                    {selectedStudy.bodyPart || "No especificado"}
                  </p>
                </div>

                <div className="rounded-xl border bg-muted/50 p-3">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">
                    Fecha
                  </p>
                  <p className="text-sm font-bold">
                    {selectedStudy.acquisitionDate || "No especificada"}
                  </p>
                </div>

                <div className="rounded-xl border bg-muted/50 p-3">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">
                    Fuente
                  </p>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Orthanc / VolView
                  </div>
                </div>
              </div>

              {selectedStudy.description && (
                <div className="rounded-xl border bg-muted/50 p-4">
                  <p className="text-sm font-medium">
                    {selectedStudy.description}
                  </p>
                </div>
              )}

              <div className="rounded-xl border bg-muted/50 p-4">
                <p className="mb-2 text-sm font-semibold">
                  Estudio seleccionado
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  Orthanc Study ID: {selectedStudy.orthancStudyId}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  onClick={handleGenerateLungSegmentation}
                  disabled={isProcessing || !selectedStudy.orthancStudyId}
                >
                  {isProcessing
                    ? "Procesando pulmones..."
                    : "Generar reconstrucción pulmonar 3D"}
                </Button>

                {uploadControls}

                <Button asChild variant="ghost">
                  <a href={ORTHANC_WEB_URL} target="_blank" rel="noreferrer">
                    Abrir Orthanc
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <AlertDescription className="font-medium">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {viewerUrl && (
                <div className="overflow-hidden rounded-xl border bg-background">
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">
                        Reconstrucción pulmonar 3D
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Generada por el microservicio de imágenes.
                      </p>
                    </div>

                    <Button asChild variant="outline" size="sm">
                      <a href={viewerUrl} target="_blank" rel="noreferrer">
                        Abrir en nueva pestaña
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>

                  <iframe
                    src={viewerUrl}
                    title="Reconstrucción pulmonar 3D"
                    className="h-[720px] w-full bg-black"
                    allowFullScreen
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
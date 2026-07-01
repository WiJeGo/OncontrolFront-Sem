export type ImagingStudy = {
  id: string
  patientId: string
  label: string
  modality: "CT" | "MR" | "PT" | "US" | "OT"
  orthancStudyId: string
  description?: string
  bodyPart?: string
  acquisitionDate?: string
}

export const IMAGING_STUDIES: ImagingStudy[] = [
  {
    id: "ct-lung-001",
    // patient_profile_id of the demo patient (Juan Pérez). This is the value
    // passed to <TomographyViewer patientId={patient.id} />. Mapping is still
    // static — the proper fix is an `imaging_studies` table keyed by
    // patient_profile_id + a backend endpoint (see plan, Track B).
    patientId: "22",
    label: "Reconstrucción pulmonar 3D",
    modality: "CT",
    orthancStudyId: "1d907417-899bad5c-c0c54a1a-b77214c5-aa0d857e",
    description: "Segmentación pulmonar derivada desde tomografía de tórax.",
    bodyPart: "Pulmones",
    acquisitionDate: "2026-06-30",
  },
]

export function getImagingStudiesByPatientId(patientId: string | number) {
  return IMAGING_STUDIES.filter(
    (study) => String(study.patientId) === String(patientId)
  )
}
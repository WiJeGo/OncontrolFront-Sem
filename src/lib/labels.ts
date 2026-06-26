// Shared human-readable labels for backend enum values.

const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  PRIMERA_CONSULTA: "Primera consulta",
  CONSULTA_SEGUIMIENTO: "Consulta de seguimiento",
  REVISION_TRATAMIENTO: "Revisión de tratamiento",
  REVISION_EXAMENES: "Revisión de exámenes",
  CONSULTA_URGENCIA: "Consulta de urgencia",
  CONSULTA_POST_OPERATORIA: "Consulta post-operatoria",
  SESION_QUIMIOTERAPIA: "Sesión de quimioterapia",
  EXAMENES_LABORATORIO: "Exámenes de laboratorio",
  CONSULTA_NUTRICION: "Consulta nutricional",
  CONSULTA_PSICOLOGICA: "Consulta psicológica",
  CONSULTA_DOLOR: "Manejo del dolor",
  CONSULTA_GENERAL: "Consulta general",
  OTRO: "Otro",
}

/** Maps an appointment type enum (e.g. PRIMERA_CONSULTA) to a readable Spanish label. */
export function appointmentTypeLabel(type?: string): string {
  if (!type) return "Cita"
  return APPOINTMENT_TYPE_LABELS[type] || type.replace(/_/g, " ").toLowerCase()
}

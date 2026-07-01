"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import { isDoctorUser } from "@/types/organization"
import { doctors, patients } from "@/lib/api"
import type { PatientProfileResponse, UpdatePatientRequest } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, User, HeartPulse, Phone } from "lucide-react"

const tiposSangre = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
const tiposCancer = [
  "Cáncer de pulmón", "Cáncer de mama", "Cáncer de próstata", "Cáncer colorrectal",
  "Cáncer de piel (melanoma)", "Cáncer de tiroides", "Cáncer de riñón",
  "Cáncer de páncreas", "Cáncer de hígado", "Cáncer de estómago",
  "Cáncer de vejiga", "Cáncer de ovario", "Cáncer de útero", "Cáncer de esófago",
  "Cáncer de cerebro", "Otro",
]
const etapas = ["Estadio 0 (in situ)", "Estadio I", "Estadio II", "Estadio III", "Estadio IV"]
const estadosTratamiento = [
  "Recién diagnosticado", "En tratamiento activo", "En seguimiento",
  "En remisión", "Tratamiento completado", "Cuidados paliativos", "Desconocido",
]

const clean = (v: string) => (v.trim() === "" ? undefined : v.trim())

export default function EditarPacientePage() {
  const { user } = useAuthContext()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const patientId = params.id as string

  const [doctorProfileId, setDoctorProfileId] = useState<number | null>(null)
  const [patient, setPatient] = useState<PatientProfileResponse | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "", birthDate: "", city: "", address: "",
    cancerType: "", cancerStage: "", diagnosisDate: "", treatmentStatus: "",
    bloodType: "", allergies: "",
    emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelationship: "",
  })

  const set = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  useEffect(() => {
    if (user && isDoctorUser(user)) setDoctorProfileId(user.profile.id)
  }, [user])

  useEffect(() => {
    const load = async () => {
      if (!doctorProfileId) return
      try {
        setIsLoadingData(true)
        const list = await doctors.getPatients(doctorProfileId)
        const p = list.find((it) => it.id.toString() === patientId)
        if (!p) {
          setError("Paciente no encontrado")
          return
        }
        setPatient(p)
        setForm({
          firstName: p.firstName ?? "",
          lastName: p.lastName ?? "",
          phone: p.phone ?? "",
          birthDate: p.birthDate?.slice(0, 10) ?? "",
          city: p.city ?? "",
          address: p.address ?? "",
          cancerType: p.cancerType ?? "",
          cancerStage: p.cancerStage ?? "",
          diagnosisDate: p.diagnosisDate?.slice(0, 10) ?? "",
          treatmentStatus: p.treatmentStatus ?? "",
          bloodType: p.bloodType ?? "",
          allergies: p.allergies ?? "",
          emergencyContactName: p.emergencyContactName ?? "",
          emergencyContactPhone: p.emergencyContactPhone ?? "",
          emergencyContactRelationship: p.emergencyContactRelationship ?? "",
        })
      } catch (err) {
        console.error(err)
        setError("Error al cargar el paciente")
      } finally {
        setIsLoadingData(false)
      }
    }
    load()
  }, [doctorProfileId, patientId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patient) return
    setIsSaving(true)
    setError("")
    try {
      const payload: UpdatePatientRequest = {
        firstName: clean(form.firstName),
        lastName: clean(form.lastName),
        phone: clean(form.phone),
        birthDate: clean(form.birthDate),
        city: clean(form.city),
        address: clean(form.address),
        cancerType: clean(form.cancerType),
        cancerStage: clean(form.cancerStage),
        diagnosisDate: clean(form.diagnosisDate),
        treatmentStatus: clean(form.treatmentStatus),
        bloodType: clean(form.bloodType),
        allergies: clean(form.allergies),
        emergencyContactName: clean(form.emergencyContactName),
        emergencyContactPhone: clean(form.emergencyContactPhone),
        emergencyContactRelationship: clean(form.emergencyContactRelationship),
      }
      await patients.updateProfile(patient.id, payload)
      toast({ title: "Paciente actualizado", description: "Los cambios se guardaron correctamente." })
      router.push(`/dashboard/medico/pacientes/${patient.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el paciente")
      toast({ title: "Error", description: "No se pudo actualizar el paciente", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoadingData) {
    return (
      <AuthGuard requiredRole="DOCTOR">
        <DashboardLayout><Loading message="Cargando paciente..." /></DashboardLayout>
      </AuthGuard>
    )
  }

  if (error && !patient) {
    return (
      <AuthGuard requiredRole="DOCTOR">
        <DashboardLayout>
          <div className="mx-auto max-w-2xl py-12">
            <Card className="border shadow-sm">
              <CardContent className="p-12 text-center">
                <h3 className="mb-4 text-base font-semibold text-destructive">{error}</h3>
                <Button asChild><Link href="/dashboard/medico/pacientes">Volver a pacientes</Link></Button>
              </CardContent>
            </Card>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredRole="DOCTOR">
      <DashboardLayout>
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="space-y-3">
            <Link href={`/dashboard/medico/pacientes/${patientId}`}>
              <Button variant="outline" size="sm" className="border">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la ficha
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Editar paciente</h1>
              <p className="text-sm text-muted-foreground">
                {patient?.firstName} {patient?.lastName}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border">
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
            )}

            {/* Datos personales */}
            <Card className="border shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-3 text-base font-semibold">
                  <div className="rounded-lg bg-primary/10 p-2"><User className="h-5 w-5 text-primary" /></div>
                  Datos personales
                </CardTitle>
                <CardDescription className="mt-0.5">Contacto y demografía del paciente</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">Nombre</Label>
                  <Input id="firstName" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">Apellido</Label>
                  <Input id="lastName" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Teléfono</Label>
                  <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-sm font-medium">Fecha de nacimiento</Label>
                  <Input id="birthDate" type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">Ciudad</Label>
                  <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">Dirección</Label>
                  <Input id="address" value={form.address} onChange={(e) => set("address", e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* Datos clínicos */}
            <Card className="border shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-3 text-base font-semibold">
                  <div className="rounded-lg bg-chart-2/10 p-2"><HeartPulse className="h-5 w-5 text-chart-2" /></div>
                  Datos clínicos
                </CardTitle>
                <CardDescription className="mt-0.5">Gestionados por el médico</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tipo de cáncer</Label>
                  <Select value={form.cancerType} onValueChange={(v) => set("cancerType", v)}>
                    <SelectTrigger className="border"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {tiposCancer.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Etapa</Label>
                  <Select value={form.cancerStage} onValueChange={(v) => set("cancerStage", v)}>
                    <SelectTrigger className="border"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {etapas.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diagnosisDate" className="text-sm font-medium">Fecha de diagnóstico</Label>
                  <Input id="diagnosisDate" type="date" value={form.diagnosisDate} onChange={(e) => set("diagnosisDate", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Estado del tratamiento</Label>
                  <Select value={form.treatmentStatus} onValueChange={(v) => set("treatmentStatus", v)}>
                    <SelectTrigger className="border"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {estadosTratamiento.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tipo de sangre</Label>
                  <Select value={form.bloodType} onValueChange={(v) => set("bloodType", v)}>
                    <SelectTrigger className="border"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {tiposSangre.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="allergies" className="text-sm font-medium">Alergias</Label>
                  <Textarea id="allergies" value={form.allergies} onChange={(e) => set("allergies", e.target.value)} rows={2} />
                </div>
              </CardContent>
            </Card>

            {/* Contacto de emergencia */}
            <Card className="border shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-3 text-base font-semibold">
                  <div className="rounded-lg bg-destructive/10 p-2"><Phone className="h-5 w-5 text-destructive" /></div>
                  Contacto de emergencia
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="ecName" className="text-sm font-medium">Nombre</Label>
                  <Input id="ecName" value={form.emergencyContactName} onChange={(e) => set("emergencyContactName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ecPhone" className="text-sm font-medium">Teléfono</Label>
                  <Input id="ecPhone" value={form.emergencyContactPhone} onChange={(e) => set("emergencyContactPhone", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ecRel" className="text-sm font-medium">Parentesco</Label>
                  <Input id="ecRel" value={form.emergencyContactRelationship} onChange={(e) => set("emergencyContactRelationship", e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" className="border" asChild>
                <Link href={`/dashboard/medico/pacientes/${patientId}`}>Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

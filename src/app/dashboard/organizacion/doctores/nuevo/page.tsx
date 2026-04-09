"use client"

import { useEffect, useState } from 'react'
import { useAuthContext } from '@/contexts/auth-context'
import { useOrganizationActions } from '@/hooks/use-organizations'
import { isOrganizationUser } from '@/types/organization'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BackButton } from '@/components/ui/back-button'
import { UserPlus, Eye, EyeOff, Activity, Award } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import type { CreateDoctorRequest } from '@/lib/api'

const SPECIALIZATIONS = [
  'Oncología Médica',
  'Oncología Quirúrgica',
  'Radioterapia',
  'Radio-Oncología',
  'Hematología',
  'Hematología Oncológica',
  'Cirugía Oncológica',
  'Medicina Interna',
  'Ginecología Oncológica',
  'Urología Oncológica',
  'Dermatología Oncológica',
  'Neumología Oncológica',
  'Gastroenterología Oncológica',
  'Neurocirugía Oncológica',
  'Oncología Pediátrica',
  'Patología Oncológica',
  'Cuidados Paliativos',
  'Oncología General',
  'Otra'
]

export default function NewDoctorPage() {
  const { user, isLoading: authLoading } = useAuthContext()
  const router = useRouter()
  
  // Get organization ID directly from user
  const organizationId = user && isOrganizationUser(user) ? user.id : null
  const { createDoctor, isLoading, error: actionError } = useOrganizationActions(organizationId)
  
  const [showPassword, setShowPassword] = useState(false)
  const [licenseDigits, setLicenseDigits] = useState('')
  const [formData, setFormData] = useState<CreateDoctorRequest>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: '',
    city: '',
    address: '',
    specialization: '',
    licenseNumber: '',
    yearsOfExperience: undefined,
    hospitalAffiliation: '',
    consultationFee: '',
    bio: '',
    isAvailable: true,
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!authLoading && user && !isOrganizationUser(user)) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  const handleInputChange = (field: keyof CreateDoctorRequest, value: string | number | boolean | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Validaciones
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (!formData.specialization) {
      setError('La especialización es requerida')
      return
    }

    if (!licenseDigits || licenseDigits.length !== 4) {
      setError('El número de licencia debe tener 4 dígitos')
      return
    }

    try {
      // Formatear el número de licencia con el prefijo MED-
      const formattedData = {
        ...formData,
        licenseNumber: `MED-${licenseDigits}`
      }
      
      const result = await createDoctor(formattedData)
      
      if (result) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/dashboard/organizacion/doctores')
        }, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el doctor')
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <BackButton 
            fallbackUrl="/dashboard/organizacion/doctores"
            label="Volver a doctores"
            className="mb-2"
          />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Agregar Nuevo Doctor
          </h1>
          <p className="text-muted-foreground text-lg">Registra un médico en tu organización</p>
        </div>

      <Card className="border-2 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
          <CardTitle className="text-2xl font-bold">Información del Doctor</CardTitle>
          <CardDescription className="mt-1">Completa todos los campos requeridos (*)</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {actionError && (
              <Alert variant="destructive">
                <AlertDescription>{actionError}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-primary/10 border-primary/30">
                <AlertDescription className="text-primary-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Doctor creado exitosamente. Redirigiendo...
                </AlertDescription>
              </Alert>
            )}

            {/* Información Personal */}
            <div className="space-y-5 border-b pb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Información Personal</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="font-semibold">Nombre *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="h-11 border-2"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="font-semibold">Apellido *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="h-11 border-2"
                      required
                    />
                  </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="h-11 border-2"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-semibold">Contraseña *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="pr-11 h-11 border-2"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-semibold">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="h-11 border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="font-semibold">Fecha de Nacimiento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                    className="h-11 border-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="font-semibold">Ciudad</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="h-11 border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="font-semibold">Dirección</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="h-11 border-2"
                  />
                </div>
              </div>
            </div>

            {/* Información Profesional */}
            <div className="space-y-5 pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Award className="h-5 w-5 text-secondary" />
                </div>
                <h3 className="text-xl font-bold">Información Profesional</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specialization" className="font-semibold">Especialización *</Label>
                  <Select
                    value={formData.specialization}
                    onValueChange={(value) => handleInputChange('specialization', value)}
                  >
                    <SelectTrigger id="specialization" className="h-11 border-2">
                      <SelectValue placeholder="Selecciona una especialización" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALIZATIONS.map((spec) => (
                        <SelectItem key={spec} value={spec}>
                          {spec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber" className="font-semibold">Número de Licencia *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap px-3 py-2 bg-muted rounded-lg border-2">MED-</span>
                    <Input
                      id="licenseNumber"
                      type="text"
                      value={licenseDigits}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setLicenseDigits(value);
                      }}
                      placeholder="0000"
                      maxLength={4}
                      className="flex-1 h-11 border-2"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Ingresa 4 dígitos</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospitalAffiliation" className="font-semibold">Afiliación Hospitalaria</Label>
                <Input
                  id="hospitalAffiliation"
                  value={formData.hospitalAffiliation}
                  onChange={(e) => handleInputChange('hospitalAffiliation', e.target.value)}
                  placeholder="Hospital o institución afiliada"
                  className="h-11 border-2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="font-semibold">Biografía</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Breve descripción profesional..."
                  rows={4}
                  className="border-2 resize-none"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onCheckedChange={(checked) => handleInputChange('isAvailable', checked as boolean)}
                />
                <Label htmlFor="isAvailable" className="font-normal">
                  Marcar como disponible
                </Label>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button
                type="submit"
                className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-11 px-6 shadow-lg disabled:opacity-50"
                disabled={isLoading || success}
              >
                {isLoading ? (
                  <>
                    <Activity className="mr-2 h-5 w-5 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-5 w-5" />
                    Crear Doctor
                  </>
                )}
              </Button>
              <Link href="/dashboard/organizacion/doctores">
                <Button 
                  type="button" 
                  variant="outline"
                  className="hover:bg-accent hover:text-accent-foreground transition-colors border-2 h-11 px-6"
                >
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  )
}


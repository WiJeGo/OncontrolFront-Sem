'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { PatientRegistrationFormData } from '@/types/organization';

interface PatientRegistrationFormProps {
  onSubmit: (data: PatientRegistrationFormData) => Promise<void>;
  isLoading?: boolean;
  submitText?: string;
  showDoctorAssignment?: boolean;
  assignedDoctorId?: number;
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CANCER_TYPES = [
  'Cáncer de Mama',
  'Cáncer de Pulmón',
  'Cáncer de Colon',
  'Cáncer de Próstata',
  'Cáncer de Cuello Uterino',
  'Leucemia',
  'Linfoma',
  'Melanoma',
  'Cáncer de Páncreas',
  'Cáncer de Hígado',
  'Otro'
];
const CANCER_STAGES = ['I', 'II', 'III', 'IV'];

export function PatientRegistrationForm({
  onSubmit,
  isLoading = false,
  submitText = 'Registrar Paciente',
  showDoctorAssignment = false,
  assignedDoctorId
}: PatientRegistrationFormProps) {
  const [formData, setFormData] = useState<PatientRegistrationFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    birthDate: '',
    bloodType: '',
    allergies: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    medicalHistory: '',
    currentMedications: '',
    insuranceProvider: '',
    insuranceNumber: '',
    cancerType: '',
    cancerStage: '',
    diagnosisDate: ''
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validación básica
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    // Validación de contraseña
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el formulario');
    }
  };

  const handleInputChange = (field: keyof PatientRegistrationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Registro de Paciente</CardTitle>
        {showDoctorAssignment && assignedDoctorId && (
          <p className="text-sm text-muted-foreground">
            Paciente será asignado automáticamente al doctor actual
          </p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Información Personal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información Personal</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre *</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Ej: María"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido *</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Ej: González"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Ej: maria.gonzalez@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  El paciente usará esta contraseña para iniciar sesión
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Ej: +57 1 234 5678"
                />
              </div>

              <div></div> {/* Empty div for grid alignment */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate || ''}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodType">Tipo de Sangre</Label>
                <select
                  id="bloodType"
                  value={formData.bloodType || ''}
                  onChange={(e) => handleInputChange('bloodType', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecciona tipo de sangre</option>
                  {BLOOD_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">Alergias</Label>
              <Textarea
                id="allergies"
                value={formData.allergies || ''}
                onChange={(e) => handleInputChange('allergies', e.target.value)}
                placeholder="Lista las alergias conocidas..."
                rows={2}
              />
            </div>
          </div>

          {/* Contacto de Emergencia */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contacto de Emergencia</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Nombre</Label>
                <Input
                  id="emergencyContactName"
                  type="text"
                  value={formData.emergencyContactName || ''}
                  onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                  placeholder="Ej: Juan González"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContactPhone">Teléfono</Label>
                <Input
                  id="emergencyContactPhone"
                  type="tel"
                  value={formData.emergencyContactPhone || ''}
                  onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                  placeholder="Ej: +57 1 234 5678"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContactRelationship">Parentesco</Label>
                <Input
                  id="emergencyContactRelationship"
                  type="text"
                  value={formData.emergencyContactRelationship || ''}
                  onChange={(e) => handleInputChange('emergencyContactRelationship', e.target.value)}
                  placeholder="Ej: Esposo, Hijo, Hermano"
                />
              </div>
            </div>
          </div>

          {/* Información Médica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información Médica</h3>
            
            <div className="space-y-2">
              <Label htmlFor="medicalHistory">Historial Médico</Label>
              <Textarea
                id="medicalHistory"
                value={formData.medicalHistory || ''}
                onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                placeholder="Describe condiciones médicas previas, cirugías, etc..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentMedications">Medicamentos Actuales</Label>
              <Textarea
                id="currentMedications"
                value={formData.currentMedications || ''}
                onChange={(e) => handleInputChange('currentMedications', e.target.value)}
                placeholder="Lista los medicamentos que toma actualmente..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insuranceProvider">Aseguradora</Label>
                <Input
                  id="insuranceProvider"
                  type="text"
                  value={formData.insuranceProvider || ''}
                  onChange={(e) => handleInputChange('insuranceProvider', e.target.value)}
                  placeholder="Ej: EPS Sanitas"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="insuranceNumber">Número de Póliza</Label>
                <Input
                  id="insuranceNumber"
                  type="text"
                  value={formData.insuranceNumber || ''}
                  onChange={(e) => handleInputChange('insuranceNumber', e.target.value)}
                  placeholder="Ej: 123456789"
                />
              </div>
            </div>
          </div>

          {/* Información Oncológica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información Oncológica</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cancerType">Tipo de Cáncer</Label>
                <select
                  id="cancerType"
                  value={formData.cancerType || ''}
                  onChange={(e) => handleInputChange('cancerType', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecciona tipo de cáncer</option>
                  {CANCER_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancerStage">Estadio</Label>
                <select
                  id="cancerStage"
                  value={formData.cancerStage || ''}
                  onChange={(e) => handleInputChange('cancerStage', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecciona estadio</option>
                  {CANCER_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      Estadio {stage}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosisDate">Fecha de Diagnóstico</Label>
                <Input
                  id="diagnosisDate"
                  type="date"
                  value={formData.diagnosisDate || ''}
                  onChange={(e) => handleInputChange('diagnosisDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Registrando...' : submitText}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

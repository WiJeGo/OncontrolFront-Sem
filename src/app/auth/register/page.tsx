'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OnControlLogo } from '@/components/oncontrol-logo';
import { Building2, MapPin, Mail, Lock, Globe, Phone, FileText, CheckCircle2, Users, Shield } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/lib/api';
import type { RegisterOrganizationRequest } from '@/lib/api';

// Lista de países disponibles
const COUNTRIES = [
  'Argentina', 'Bolivia', 'Chile', 'Colombia', 'Costa Rica', 'Ecuador', 
  'El Salvador', 'España', 'Guatemala', 'Honduras', 'México', 'Nicaragua', 
  'Panamá', 'Paraguay', 'Perú', 'Puerto Rico', 'República Dominicana', 
  'Uruguay', 'Venezuela'
];

// Ciudades principales por país
const CITIES_BY_COUNTRY: Record<string, string[]> = {
  'Colombia': ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Cúcuta', 'Pereira'],
  'México': ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Cancún'],
  'Argentina': ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'San Miguel de Tucumán'],
  'Chile': ['Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta', 'Temuco'],
  'Perú': ['Lima', 'Arequipa', 'Cusco', 'Trujillo', 'Chiclayo', 'Piura'],
  'España': ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza', 'Málaga', 'Bilbao'],
};

export default function RegisterPage() {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState("");
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    organizationName: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    city: "",
    phone: "",
    address: "",
  });
  
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setFormData(prev => ({ ...prev, country, city: "" }));
    setAvailableCities(CITIES_BY_COUNTRY[country] || []);
    setError("");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      setIsSubmitting(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setIsSubmitting(false);
      return;
    }

    try {
      const registerData: RegisterOrganizationRequest = {
        email: formData.email,
        password: formData.password,
        organizationName: formData.organizationName,
        country: formData.country,
        city: formData.city,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
      };

      await auth.registerOrganization(registerData);
      
      // Redirigir al login después del registro exitoso
      router.push('/auth/login?registered=true');
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al registrar la organización. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Mitad izquierda - Diseño visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary via-secondary/90 to-primary/80 relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Patrón de fondo */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-register" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-register)" />
          </svg>
        </div>

        {/* Contenido visual */}
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <svg
                  className="text-4xl text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="2em"
                  height="2em"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <span className="text-4xl font-bold">
                <span className="text-white">ONCO</span>
                <span className="text-white/90">NTROL</span>
              </span>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Únete a OnControl
          </h1>
          <p className="text-xl text-white/90 mb-12">
            Registra tu organización y comienza a gestionar tratamientos oncológicos
          </p>

          {/* Características */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Gestión Integral</h3>
                <p className="text-white/80">Administra pacientes, citas y tratamientos</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Equipo Colaborativo</h3>
                <p className="text-white/80">Conecta con médicos y especialistas</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Seguro y Confiable</h3>
                <p className="text-white/80">Protección de datos médicos garantizada</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Fácil de Usar</h3>
                <p className="text-white/80">Interfaz intuitiva y moderna</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formas flotantes decorativas */}
        <div className="absolute top-10 right-10 w-32 h-32 border-2 border-white/20 rounded-full"></div>
        <div className="absolute bottom-32 left-16 w-24 h-24 border-2 border-white/20 rounded-full"></div>
        <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-white/10 rounded-full"></div>
      </div>

      {/* Mitad derecha - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-background overflow-y-auto">
        <div className="w-full max-w-2xl">
          {/* Logo móvil */}
          <div className="lg:hidden text-center mb-8">
            <OnControlLogo size="lg" className="justify-center mb-4" />
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Registrar Organización</h2>
            <p className="text-muted-foreground">Completa el formulario para registrar tu organización médica</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Nombre de la Organización */}
            <div className="space-y-2">
              <Label htmlFor="organizationName">Nombre de la Organización *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="organizationName"
                  placeholder="Hospital General, Clínica Oncológica..."
                  value={formData.organizationName}
                  onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
                  className="pl-11 h-12"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="contacto@hospital.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="pl-11 h-12"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-11 h-12"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirma tu contraseña"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="pl-11 h-12"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Country and City */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">País *</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-5 w-5 text-muted-foreground z-10" />
                  <select
                    id="country"
                    className="flex h-12 w-full rounded-md border border-input bg-background pl-11 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    required
                  >
                    <option value="">Selecciona un país</option>
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground z-10" />
                  <select
                    id="city"
                    className="flex h-12 w-full rounded-md border border-input bg-background pl-11 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    disabled={!selectedCountry}
                    required
                  >
                    <option value="">Selecciona una ciudad</option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Optional fields */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium text-sm text-muted-foreground mb-4">Información Adicional (Opcional)</h3>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+57 300 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="pl-11 h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="address"
                    placeholder="Calle, número, barrio..."
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="pl-11 h-12"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-secondary to-primary hover:opacity-90 transition-opacity text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registrando...' : 'Crear Cuenta de Organización'}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/auth/login" className="text-primary hover:underline font-semibold">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

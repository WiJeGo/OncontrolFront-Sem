'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Stethoscope } from 'lucide-react';

export default function DoctorRegisterPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <Stethoscope className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Registro de Doctores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              El registro de doctores se realiza a través de las organizaciones. 
              Si eres un doctor, contacta con tu organización para que te den de alta en el sistema.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Button 
              onClick={() => router.push('/auth/login')}
              className="w-full"
            >
              Iniciar Sesión
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/auth/register')}
              className="w-full"
            >
              Registrarse como Paciente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

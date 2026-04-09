import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import { Suspense } from "react"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
})

export const metadata: Metadata = {
  title: "OnControl - Apoyo integral para pacientes oncológicos",
  description:
    "OnControl facilita la gestión del tratamiento oncológico, mejorando la comunicación entre médicos y pacientes para una atención más efectiva y personalizada en Perú.",
  keywords: "oncología, cáncer, tratamiento, citas, médico, paciente, recordatorio, calendario, chat médico, Perú",
  authors: [{ name: "OnControl Team" }],
  openGraph: {
    title: "OnControl - Apoyo integral para pacientes oncológicos",
    description: "Plataforma integral para la gestión de tratamientos oncológicos en Perú",
    type: "website",
    locale: "es_PE",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={poppins.variable} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AuthProvider>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}

"use client"

import { useRouter } from 'next/navigation'
import { Button } from './button'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
  fallbackUrl?: string
  label?: string
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function BackButton({ 
  fallbackUrl, 
  label = "Volver", 
  variant = "ghost",
  size = "sm",
  className 
}: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    // Try to go back in history first
    if (window.history.length > 1) {
      router.back()
    } else if (fallbackUrl) {
      // If no history, use fallback URL
      router.push(fallbackUrl)
    } else {
      // Default fallback to dashboard
      router.push('/dashboard')
    }
  }

  return (
    <Button 
      variant={variant} 
      size={size}
      onClick={handleBack}
      className={className}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      {label}
    </Button>
  )
}


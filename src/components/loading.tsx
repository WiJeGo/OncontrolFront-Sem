"use client"

import { memo } from "react"
import { OnControlLogo } from "./oncontrol-logo"

interface LoadingProps {
  message?: string
  size?: "sm" | "md" | "lg"
}

export const Loading = memo(function Loading({ 
  message = "Cargando...", 
  size = "md" 
}: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <OnControlLogo size={size} className="justify-center" />
        <div className={`animate-spin rounded-full border-b-2 border-primary mx-auto ${sizeClasses[size]}`}></div>
        <p className="text-muted-foreground" suppressHydrationWarning>{message}</p>
      </div>
    </div>
  )
})

export const LoadingSpinner = memo(function LoadingSpinner({ 
  size = "md",
  className = ""
}: { 
  size?: "sm" | "md" | "lg"
  className?: string 
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  }

  return (
    <div className={`animate-spin rounded-full border-b-2 border-primary ${sizeClasses[size]} ${className}`}></div>
  )
})

export const LoadingCard = memo(function LoadingCard() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded"></div>
          <div className="h-3 bg-muted rounded w-5/6"></div>
          <div className="h-3 bg-muted rounded w-4/6"></div>
        </div>
      </div>
    </div>
  )
})

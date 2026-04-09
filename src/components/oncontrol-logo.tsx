interface OnControlLogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function OnControlLogo({ className = "", size = "md" }: OnControlLogoProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        {/* Heart/ribbon icon representing cancer awareness */}
        <svg
          className={`${sizeClasses[size]} text-destructive`}
          viewBox="0 0 24 24"
          fill="currentColor"
          width="1em"
          height="1em"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>
      <span className={`font-bold ${sizeClasses[size]}`}>
        <span className="text-accent">ONCO</span>
        <span className="text-primary">NTROL</span>
      </span>
    </div>
  )
}

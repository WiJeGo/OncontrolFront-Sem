interface OnControlLogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  hideText?: boolean
  /** Force the wordmark color (e.g. on dark brand panels). Defaults to themed tokens. */
  onDark?: boolean
}

const MARK_PX = { sm: 24, md: 30, lg: 44 } as const
const TEXT_CLASS = { sm: "text-base", md: "text-xl", lg: "text-2xl" } as const

export function OnControlLogo({ className = "", size = "md", hideText = false, onDark = false }: OnControlLogoProps) {
  const px = MARK_PX[size]

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/favicon.ico"
        alt="OnControl 3D"
        width={px}
        height={px}
        className="shrink-0 rounded-md"
        style={{ width: px, height: px }}
      />
      {!hideText && (
        <span className={`font-bold tracking-tight ${TEXT_CLASS[size]}`}>
          <span className={onDark ? "text-white" : "text-foreground"}>OnControl</span>
          <span className={onDark ? "text-white/80" : "text-primary"}> 3D</span>
        </span>
      )}
    </div>
  )
}

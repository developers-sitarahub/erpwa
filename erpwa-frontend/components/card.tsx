import type React from "react"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`bg-card text-card-foreground border border-border rounded-lg p-6 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className = "", children, ...props }: CardProps) {
  return (
    <div className={`mb-4 pb-4 border-b border-border ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className = "", children, ...props }: CardProps) {
  return (
    <h2 className={`text-2xl font-bold text-foreground ${className}`} {...props}>
      {children}
    </h2>
  )
}

export function CardDescription({ className = "", children, ...props }: CardProps) {
  return (
    <p className={`text-sm text-muted-foreground ${className}`} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ className = "", children, ...props }: CardProps) {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  )
}

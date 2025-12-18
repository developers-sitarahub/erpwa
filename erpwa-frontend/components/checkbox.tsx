"use client"

import type React from "react"

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Checkbox({ className = "", ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={`w-5 h-5 rounded border-2 border-border bg-input text-primary cursor-pointer accent-primary focus:ring-2 focus:ring-ring transition-all ${className}`}
      {...props}
    />
  )
}

"use client"

import type React from "react"
import { motion, type HTMLMotionProps } from "framer-motion"

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer"

  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70",
    outline: "border-2 border-border text-foreground hover:bg-secondary/50 active:bg-secondary",
    ghost: "text-foreground hover:bg-muted active:bg-muted/80",
    danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80",
  }

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  )
}

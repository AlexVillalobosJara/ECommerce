"use client"

import { useTenant } from "@/contexts/TenantContext"

export function TenantStyleProvider() {
  const { tenant, loading } = useTenant()

  if (loading || !tenant) {
    return null
  }

  const primary = tenant.primary_color
  const secondary = tenant.secondary_color

  if (!primary && !secondary) {
    return null
  }

  // Helper to calculate contrast color (black or white) based on hex background
  const getContrastColor = (hexColor: string) => {
    // Remove hash if present
    const hex = hexColor.replace('#', '')

    // Parse r, g, b
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)

    // Calculate luminance (standard standard formula)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

    // Return black for light backgrounds, white for dark backgrounds
    // Using slightly off-black/white to match shadcn themes (oklch-ish) if wanted, but standard hex is safer for overrides
    return luminance > 0.5 ? '#000000' : '#ffffff'
  }

  const primaryForeground = primary ? getContrastColor(primary) : null
  const secondaryForeground = secondary ? getContrastColor(secondary) : null

  return (
    <style jsx global>{`
      :root {
        ${primary ? `--primary: ${primary};` : ""}
        ${primary ? `--ring: ${primary};` : ""}
        ${primaryForeground ? `--primary-foreground: ${primaryForeground};` : ""}
        
        ${secondary ? `--secondary: ${secondary};` : ""}
        ${secondaryForeground ? `--secondary-foreground: ${secondaryForeground};` : ""}
      }
      .dark {
        ${primary ? `--primary: ${primary};` : ""}
        ${primary ? `--ring: ${primary};` : ""}
        ${primaryForeground ? `--primary-foreground: ${primaryForeground};` : ""}
        
        ${secondary ? `--secondary: ${secondary};` : ""}
        ${secondaryForeground ? `--secondary-foreground: ${secondaryForeground};` : ""}
      }
    `}</style>
  )
}

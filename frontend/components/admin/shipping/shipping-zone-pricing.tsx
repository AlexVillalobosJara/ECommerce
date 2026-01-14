"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DollarSign } from "lucide-react"
import { useTenant } from "@/contexts/TenantContext"
import { useState } from "react"
import { formatPrice } from "@/lib/format-price"

interface ShippingZonePricingProps {
  data: {
    base_cost: number
    cost_per_kg: number
    free_shipping_threshold: number | null
  }
  onChange: (updates: Partial<ShippingZonePricingProps["data"]>) => void
}

export function ShippingZonePricing({ data, onChange }: ShippingZonePricingProps) {
  const { tenant } = useTenant()

  const formatLocalizedValue = (val: any) => {
    if (val === undefined || val === null || val === '') return ''
    const num = typeof val === 'string' ? parseFloat(val) : val
    if (isNaN(num)) return ''

    const decimalPlaces = tenant?.decimal_places ?? 0
    const thousandsSeparator = tenant?.thousands_separator || "."
    const decimalSeparator = tenant?.decimal_separator || ","

    const parts = num.toFixed(decimalPlaces).split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator)

    if (decimalPlaces > 0 && parts.length > 1) {
      return parts.join(decimalSeparator)
    }
    return parts[0]
  }

  const parseLocalizedValue = (val: string) => {
    if (!val) return null
    const thousandsSeparator = tenant?.thousands_separator || "."
    const decimalSeparator = tenant?.decimal_separator || ","

    const cleaned = val
      .split(thousandsSeparator).join('')
      .replace(decimalSeparator, '.')

    const num = parseFloat(cleaned)
    return isNaN(num) ? null : num
  }


  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Configuración de Precios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="base_cost">
              Costo Base <span className="text-destructive">*</span>
            </Label>
            <Input
              id="base_cost"
              type="text"
              placeholder="0"
              value={formatLocalizedValue(data.base_cost)}
              onChange={(e) => onChange({ base_cost: parseLocalizedValue(e.target.value) || 0 })}
            />
            <p className="text-xs text-muted-foreground">Costo fijo de envío en CLP</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost_per_kg">Costo por Kg</Label>
            <Input
              id="cost_per_kg"
              type="text"
              placeholder="0"
              value={formatLocalizedValue(data.cost_per_kg)}
              onChange={(e) => onChange({ cost_per_kg: parseLocalizedValue(e.target.value) || 0 })}
            />
            <p className="text-xs text-muted-foreground">Costo adicional por kilogramo</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="free_shipping_threshold">Envío Gratis desde</Label>
          <Input
            id="free_shipping_threshold"
            type="text"
            placeholder="Dejar vacío para no aplicar"
            value={formatLocalizedValue(data.free_shipping_threshold)}
            onChange={(e) => onChange({ free_shipping_threshold: parseLocalizedValue(e.target.value) })}
          />
          <p className="text-xs text-muted-foreground">
            Monto mínimo de compra para envío gratis. Dejar vacío si no aplica.
          </p>
        </div>

        {/* Preview Calculation */}
        <div className="rounded-lg bg-muted/30 p-4 space-y-2 border border-border">
          <p className="text-xs font-medium text-muted-foreground">EJEMPLO DE CÁLCULO</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Envío de 5 kg:</span>
              <span className="font-medium">
                {formatPrice(data.base_cost + data.cost_per_kg * 5, tenant)}
              </span>
            </div>
            {data.free_shipping_threshold && (
              <div className="flex justify-between text-primary pt-2 border-t border-border">
                <span>Envío gratis desde:</span>
                <span className="font-medium">
                  {formatPrice(data.free_shipping_threshold, tenant)}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

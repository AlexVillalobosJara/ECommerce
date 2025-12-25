"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Settings } from "lucide-react"

interface ShippingZoneSettingsProps {
  data: {
    estimated_days: number
    allows_store_pickup: boolean
    is_active: boolean
  }
  onChange: (updates: Partial<ShippingZoneSettingsProps["data"]>) => void
}

export function ShippingZoneSettings({ data, onChange }: ShippingZoneSettingsProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="w-4 h-4" />
          Configuración
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="estimated_days">Tiempo de Entrega Estimado (días)</Label>
          <Input
            id="estimated_days"
            type="number"
            min="1"
            value={data.estimated_days}
            onChange={(e) => onChange({ estimated_days: Number(e.target.value) })}
          />
        </div>

        <div className="space-y-4 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allows_store_pickup" className="text-sm font-medium">
                Permitir Retiro en Tienda
              </Label>
              <p className="text-xs text-muted-foreground">Los clientes pueden retirar sus pedidos</p>
            </div>
            <Switch
              id="allows_store_pickup"
              checked={data.allows_store_pickup}
              onCheckedChange={(checked) => onChange({ allows_store_pickup: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_active" className="text-sm font-medium">
                Zona Activa
              </Label>
              <p className="text-xs text-muted-foreground">Disponible para los clientes</p>
            </div>
            <Switch
              id="is_active"
              checked={data.is_active}
              onCheckedChange={(checked) => onChange({ is_active: checked })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

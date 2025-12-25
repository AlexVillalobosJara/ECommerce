"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ShippingZoneBasicInfoProps {
  data: {
    name: string
    description: string
  }
  onChange: (updates: Partial<ShippingZoneBasicInfoProps["data"]>) => void
}

export function ShippingZoneBasicInfo({ data, onChange }: ShippingZoneBasicInfoProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Información Básica</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">
            Nombre de la Zona <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Ej: Santiago Centro"
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">Nombre descriptivo para identificar la zona de reparto</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            placeholder="Describe brevemente el área de cobertura de esta zona"
            value={data.description}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  )
}

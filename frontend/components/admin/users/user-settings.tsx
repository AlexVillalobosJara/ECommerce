"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface UserSettingsProps {
  data: {
    is_active: boolean
  }
  onChange: (updates: Partial<UserSettingsProps["data"]>) => void
}

export function UserSettings({ data, onChange }: UserSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración</CardTitle>
        <CardDescription>Ajustes generales del usuario</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="is_active">Usuario Activo</Label>
            <p className="text-sm text-muted-foreground">Desactiva para bloquear el acceso sin eliminar la cuenta</p>
          </div>
          <Switch
            id="is_active"
            checked={data.is_active}
            onCheckedChange={(checked) => onChange({ is_active: checked })}
          />
        </div>
      </CardContent>
    </Card>
  )
}

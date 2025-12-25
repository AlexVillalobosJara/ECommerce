"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"

interface CategorySettingsProps {
    data: {
        sort_order: number
        is_active: boolean
    }
    onChange: (data: Partial<CategorySettingsProps["data"]>) => void
}

export function CategorySettings({ data, onChange }: CategorySettingsProps) {
    return (
        <Card className="shadow-sm">
            <CardContent className="pt-6">
                <div className="space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold">Configuración</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="is_active">Categoría Activa</Label>
                                <p className="text-xs text-muted-foreground">Visible en la tienda</p>
                            </div>
                            <Switch
                                id="is_active"
                                checked={data.is_active}
                                onCheckedChange={(checked) => onChange({ is_active: checked })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sort_order">Orden de Clasificación</Label>
                            <Input
                                id="sort_order"
                                type="number"
                                min="0"
                                value={data.sort_order}
                                onChange={(e) => onChange({ sort_order: Number(e.target.value) })}
                            />
                            <p className="text-xs text-muted-foreground">Menor número = mayor prioridad</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

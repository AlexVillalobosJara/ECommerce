"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProductSettingsProps {
    data: any
    onChange: (updates: any) => void
}

export function ProductSettings({ data, onChange }: ProductSettingsProps) {
    return (
        <Card className="shadow-sm">
            <CardContent className="pt-6">
                <div className="space-y-6">
                    <h2 className="text-lg font-semibold">Configuración</h2>

                    <div className="space-y-2">
                        <Label htmlFor="status">Estado de Publicación</Label>
                        <Select value={data.status} onValueChange={(value) => onChange({ status: value })}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Draft">Borrador</SelectItem>
                                <SelectItem value="Published">Publicado</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Los borradores no son visibles en la tienda</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="min_shipping_days">Días mínimos para envío</Label>
                        <div className="flex items-center gap-2">
                            <input
                                id="min_shipping_days"
                                type="number"
                                min="0"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={data.min_shipping_days || 0}
                                onChange={(e) => onChange({ min_shipping_days: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Tiempo de preparación requerido para este producto</p>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                        <div className="flex-1">
                            <Label htmlFor="is_featured" className="font-medium cursor-pointer">
                                Producto Destacado
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">Mostrar en la página principal</p>
                        </div>
                        <Switch
                            id="is_featured"
                            checked={data.is_featured}
                            onCheckedChange={(checked) => onChange({ is_featured: checked })}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

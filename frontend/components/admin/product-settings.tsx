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

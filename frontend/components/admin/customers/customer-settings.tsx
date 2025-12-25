"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CustomerSettingsProps {
    data: {
        price_list_type: "Retail" | "Wholesale" | "VIP"
        is_active: boolean
        is_verified: boolean
    }
    onChange: (data: Partial<CustomerSettingsProps["data"]>) => void
}

export function CustomerSettings({ data, onChange }: CustomerSettingsProps) {
    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>Configuración</CardTitle>
                <CardDescription>Ajustes del cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="price_list_type">Lista de Precios</Label>
                    <Select value={data.price_list_type} onValueChange={(value) => onChange({ price_list_type: value as any })}>
                        <SelectTrigger id="price_list_type">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Retail">Retail (Precio regular)</SelectItem>
                            <SelectItem value="Wholesale">Mayorista (Descuento)</SelectItem>
                            <SelectItem value="VIP">VIP (Descuento especial)</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Tipo de precio que verá el cliente</p>
                </div>

                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="is_active">Cliente Activo</Label>
                        <p className="text-xs text-muted-foreground">Permite que el cliente realice pedidos</p>
                    </div>
                    <Switch
                        id="is_active"
                        checked={data.is_active}
                        onCheckedChange={(checked) => onChange({ is_active: checked })}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="is_verified">Email Verificado</Label>
                        <p className="text-xs text-muted-foreground">Cliente confirmó su email</p>
                    </div>
                    <Switch
                        id="is_verified"
                        checked={data.is_verified}
                        onCheckedChange={(checked) => onChange({ is_verified: checked })}
                    />
                </div>
            </CardContent>
        </Card>
    )
}

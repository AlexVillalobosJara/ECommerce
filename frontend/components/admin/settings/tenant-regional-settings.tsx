"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TenantRegionalSettingsProps {
    data: any
    onChange: (updates: any) => void
}

export function TenantRegionalSettings({ data, onChange }: TenantRegionalSettingsProps) {

    const handleDecimalSeparatorChange = (value: string) => {
        const thousands = value === ',' ? '.' : ','
        onChange({
            decimal_separator: value,
            thousands_separator: thousands
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Configuración Regional</CardTitle>
                <CardDescription>
                    Define los formatos de moneda e impuestos para tu tienda.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="country">País</Label>
                        <Input
                            id="country"
                            value={data.country || 'Chile'}
                            onChange={(e) => onChange({ country: e.target.value })}
                            placeholder="Ej: Chile"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tax_rate">Impuesto General (%)</Label>
                        <Input
                            id="tax_rate"
                            type="number"
                            step="0.01"
                            value={data.tax_rate ?? 19}
                            onChange={(e) => onChange({ tax_rate: parseFloat(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground">
                            Porcentaje de IVA o impuesto aplicable (Ej: 19 para 19%)
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Separador Decimal</Label>
                        <Select
                            value={data.decimal_separator || '.'}
                            onValueChange={handleDecimalSeparatorChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value=".">Punto (.)</SelectItem>
                                <SelectItem value=",">Coma (,)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Separador de Miles</Label>
                        <Input
                            value={data.thousands_separator || ','}
                            disabled
                            className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                            Calculado automáticamente
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="decimal_places">Decimales</Label>
                        <Input
                            id="decimal_places"
                            type="number"
                            min="0"
                            max="4"
                            value={data.decimal_places ?? 0}
                            onChange={(e) => onChange({ decimal_places: parseInt(e.target.value) })}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

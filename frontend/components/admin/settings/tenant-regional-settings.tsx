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

    const formatPreview = (value: number) => {
        const dps = data.decimal_places ?? 0
        const ds = data.decimal_separator || '.'
        const ts = data.thousands_separator || ','

        const parts = value.toFixed(dps).split('.')
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ts)

        if (dps > 0 && parts[1]) {
            return `$${parts[0]}${ds}${parts[1]}`
        }
        return `$${parts[0]}`
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
                            type="text"
                            value={data.tax_rate ?? 19}
                            onChange={(e) => {
                                const val = e.target.value.replace(',', '.')
                                if (!isNaN(parseFloat(val)) || val === '') {
                                    onChange({ tax_rate: val === '' ? 0 : parseFloat(val) })
                                }
                            }}
                        />
                        <p className="text-xs text-muted-foreground">
                            Porcentaje de IVA o impuesto aplicable (Ej: 19 para 19%)
                        </p>
                    </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/20">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Vista Previa</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Normal</span>
                            <p className="text-xl font-bold font-mono text-primary">{formatPreview(125000)}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Con Decimales</span>
                            <p className="text-xl font-bold font-mono text-primary">{formatPreview(1250.50)}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Millones</span>
                            <p className="text-xl font-bold font-mono text-primary">{formatPreview(1250000)}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Cero</span>
                            <p className="text-xl font-bold font-mono text-primary">{formatPreview(0)}</p>
                        </div>
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
                                <SelectItem value=".">Punto (.) - Ej: 1,250.00 (US/Intl)</SelectItem>
                                <SelectItem value=",">Coma (,) - Ej: 1.250,00 (Chile/Latam)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Separador de Miles</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                value={data.thousands_separator === ',' ? 'Coma (,)' : 'Punto (.)'}
                                disabled
                                className="bg-muted"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Calculado automáticamente (opuesto al decimal)
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

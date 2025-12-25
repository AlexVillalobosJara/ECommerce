"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CustomerBusinessInfoProps {
    data: {
        legal_representative: string
        business_sector: string
        credit_limit: number
        payment_terms_days: number
        discount_percentage: number
    }
    onChange: (data: Partial<CustomerBusinessInfoProps["data"]>) => void
}

export function CustomerBusinessInfo({ data, onChange }: CustomerBusinessInfoProps) {
    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>Información Corporativa</CardTitle>
                <CardDescription>Detalles adicionales para clientes B2B</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="legal_representative">Representante Legal</Label>
                    <Input
                        id="legal_representative"
                        value={data.legal_representative || ""}
                        onChange={(e) => onChange({ legal_representative: e.target.value })}
                        placeholder="Roberto Silva"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="business_sector">Sector / Rubro</Label>
                    <Input
                        id="business_sector"
                        value={data.business_sector || ""}
                        onChange={(e) => onChange({ business_sector: e.target.value })}
                        placeholder="Tecnología"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="credit_limit">Límite de Crédito (CLP)</Label>
                        <Input
                            id="credit_limit"
                            type="number"
                            value={data.credit_limit}
                            onChange={(e) => onChange({ credit_limit: Number(e.target.value) })}
                            placeholder="5000000"
                        />
                        <p className="text-xs text-muted-foreground">Monto máximo de crédito disponible</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="payment_terms_days">Días de Crédito</Label>
                        <Input
                            id="payment_terms_days"
                            type="number"
                            value={data.payment_terms_days}
                            onChange={(e) => onChange({ payment_terms_days: Number(e.target.value) })}
                            placeholder="30"
                        />
                        <p className="text-xs text-muted-foreground">Plazo de pago en días</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="discount_percentage">Descuento Corporativo (%)</Label>
                    <Input
                        id="discount_percentage"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={data.discount_percentage}
                        onChange={(e) => onChange({ discount_percentage: Number(e.target.value) })}
                        placeholder="15"
                    />
                    <p className="text-xs text-muted-foreground">Descuento aplicado en todos los pedidos</p>
                </div>
            </CardContent>
        </Card>
    )
}

"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface TenantLegalInfoProps {
    data: any
    onChange: (data: any) => void
}

export function TenantLegalInfo({ data, onChange }: TenantLegalInfoProps) {
    return (
        <Card className="shadow-sm">
            <CardContent className="pt-6 space-y-6">
                <div>
                    <h3 className="text-lg font-semibold mb-1">Información Legal</h3>
                    <p className="text-sm text-muted-foreground">
                        Datos legales de tu empresa que aparecerán en facturas y documentos
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="legal_name">Razón Social</Label>
                    <Input
                        id="legal_name"
                        value={data.legal_name || ""}
                        onChange={(e) => onChange({ legal_name: e.target.value })}
                        placeholder="Mi Empresa SpA"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="tax_id">RUT</Label>
                        <Input
                            id="tax_id"
                            value={data.tax_id || ""}
                            onChange={(e) => onChange({ tax_id: e.target.value })}
                            placeholder="12.345.678-9"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input
                            id="phone"
                            value={data.phone || ""}
                            onChange={(e) => onChange({ phone: e.target.value })}
                            placeholder="+56 9 1234 5678"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email de Contacto</Label>
                    <Input
                        id="email"
                        type="email"
                        value={data.email || ""}
                        onChange={(e) => onChange({ email: e.target.value })}
                        placeholder="contacto@mitienda.com"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Textarea
                        id="address"
                        value={data.address || ""}
                        onChange={(e) => onChange({ address: e.target.value })}
                        placeholder="Av. Principal 123, Santiago, Chile"
                        rows={3}
                    />
                </div>
            </CardContent>
        </Card>
    )
}

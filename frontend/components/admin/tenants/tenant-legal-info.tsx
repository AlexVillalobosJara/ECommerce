"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Building2 } from "lucide-react"

interface TenantLegalInfoProps {
    data: any
    onChange: (data: any) => void
}

export function TenantLegalInfo({ data, onChange }: TenantLegalInfoProps) {
    return (
        <Card className="shadow-sm">
            <CardContent className="pt-6 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Información Legal y Comercial</h3>
                        <p className="text-sm text-muted-foreground">
                            Datos legales que aparecerán en facturas y documentos oficiales
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="legal_name">
                        Razón Social <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="legal_name"
                        value={data.legal_name || ""}
                        onChange={(e) => onChange({ legal_name: e.target.value })}
                        placeholder="Razón Social SpA"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="tax_id">
                            RUT/Tax ID <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="tax_id"
                            value={data.tax_id || ""}
                            onChange={(e) => onChange({ tax_id: e.target.value })}
                            placeholder="76.123.456-7"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono de Contacto</Label>
                        <Input
                            id="phone"
                            value={data.phone || ""}
                            onChange={(e) => onChange({ phone: e.target.value })}
                            placeholder="+56 9 1234 5678"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email de Contacto Público</Label>
                    <Input
                        id="email"
                        type="email"
                        value={data.email || ""}
                        onChange={(e) => onChange({ email: e.target.value })}
                        placeholder="contacto@tienda.cl"
                    />
                    <p className="text-xs text-muted-foreground">Este email aparecerá en el pie de página de la tienda</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="address">Dirección Física</Label>
                    <Textarea
                        id="address"
                        value={data.address || ""}
                        onChange={(e) => onChange({ address: e.target.value })}
                        placeholder="Dirección, Ciudad, País"
                        rows={3}
                    />
                </div>
            </CardContent>
        </Card>
    )
}

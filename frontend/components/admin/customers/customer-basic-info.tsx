"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CustomerBasicInfoProps {
    data: {
        customer_type: "Individual" | "Corporate"
        email: string
        first_name: string
        last_name: string
        phone: string
        company_name: string
        tax_id: string
    }
    onChange: (data: Partial<CustomerBasicInfoProps["data"]>) => void
}

export function CustomerBasicInfo({ data, onChange }: CustomerBasicInfoProps) {
    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>Información Básica</CardTitle>
                <CardDescription>Datos principales del cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Customer Type */}
                <div className="space-y-2">
                    <Label htmlFor="customer_type">Tipo de Cliente</Label>
                    <Select value={data.customer_type} onValueChange={(value) => onChange({ customer_type: value as any })}>
                        <SelectTrigger id="customer_type">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Individual">Individual (B2C)</SelectItem>
                            <SelectItem value="Corporate">Corporativo (B2B)</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        {data.customer_type === "Individual"
                            ? "Cliente particular para ventas al detalle"
                            : "Empresa u organización para ventas corporativas"}
                    </p>
                </div>

                {/* Individual Fields */}
                {data.customer_type === "Individual" && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name">Nombre *</Label>
                            <Input
                                id="first_name"
                                value={data.first_name || ""}
                                onChange={(e) => onChange({ first_name: e.target.value })}
                                placeholder="Juan"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last_name">Apellido *</Label>
                            <Input
                                id="last_name"
                                value={data.last_name || ""}
                                onChange={(e) => onChange({ last_name: e.target.value })}
                                placeholder="Pérez"
                            />
                        </div>
                    </div>
                )}

                {/* Corporate Fields */}
                {data.customer_type === "Corporate" && (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="company_name">Razón Social *</Label>
                            <Input
                                id="company_name"
                                value={data.company_name || ""}
                                onChange={(e) => onChange({ company_name: e.target.value })}
                                placeholder="TechInnovate SpA"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tax_id">RUT Empresa</Label>
                            <Input
                                id="tax_id"
                                value={data.tax_id || ""}
                                onChange={(e) => onChange({ tax_id: e.target.value })}
                                placeholder="76.543.210-K"
                            />
                            <p className="text-xs text-muted-foreground">Formato: 12.345.678-9</p>
                        </div>
                    </>
                )}

                {/* Common Fields */}
                <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                        id="email"
                        type="email"
                        value={data.email || ""}
                        onChange={(e) => onChange({ email: e.target.value })}
                        placeholder="cliente@email.com"
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
            </CardContent>
        </Card>
    )
}

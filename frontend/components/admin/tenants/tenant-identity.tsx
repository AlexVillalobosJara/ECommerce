"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Store } from "lucide-react"

interface TenantIdentityProps {
    data: any
    onChange: (data: any) => void
}

export function TenantIdentity({ data, onChange }: TenantIdentityProps) {
    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^\w-]/g, "")
    }

    const handleNameChange = (name: string) => {
        onChange({
            name,
            // Auto-generate slug if it hasn't been manually edited
            slug: data.slug === "" || data.slug === generateSlug(data.name) ? generateSlug(name) : data.slug,
        })
    }

    return (
        <Card className="shadow-sm">
            <CardContent className="pt-6 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Store className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Datos de Identidad</h3>
                        <p className="text-sm text-muted-foreground">Información básica del tenant</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Nombre de la Empresa <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="Tech Store Chile"
                        />
                        <p className="text-xs text-muted-foreground">Nombre visible de la tienda</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">
                            Slug (Subdominio) <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="slug"
                            value={data.slug}
                            onChange={(e) => onChange({ slug: e.target.value.toLowerCase() })}
                            placeholder="tech-store"
                        />
                        <p className="text-xs text-muted-foreground">URL: {data.slug || "tech-store"}.zumi.app</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">
                            Estado <span className="text-destructive">*</span>
                        </Label>
                        <Select value={data.status} onValueChange={(value) => onChange({ status: value })}>
                            <SelectTrigger id="status">
                                <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Trial">Prueba (Trial)</SelectItem>
                                <SelectItem value="Active">Activo</SelectItem>
                                <SelectItem value="Suspended">Suspendido</SelectItem>
                                <SelectItem value="Cancelled">Cancelado</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Estado actual del tenant</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface ProductPricingProps {
    data: any
    onChange: (updates: any) => void
}

export function ProductPricing({ data, onChange }: ProductPricingProps) {
    return (
        <Card className="shadow-sm">
            <CardContent className="pt-6">
                <div className="space-y-6">
                    <h2 className="text-lg font-semibold">Precio e Inventario</h2>

                    {/* Quote Only Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                        <div className="flex-1">
                            <Label htmlFor="is_quote_only" className="font-medium cursor-pointer">
                                Solo Cotización
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                                El producto no tiene precio fijo y requiere cotización
                            </p>
                        </div>
                        <Switch
                            id="is_quote_only"
                            checked={data.is_quote_only}
                            onCheckedChange={(checked) => onChange({ is_quote_only: checked })}
                        />
                    </div>

                    {/* Manage Stock Toggle - always visible */}
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                        <div className="flex-1">
                            <Label htmlFor="manage_stock" className="font-medium cursor-pointer">
                                Gestionar Inventario
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                                Controlar el stock automáticamente con cada venta
                            </p>
                        </div>
                        <Switch
                            id="manage_stock"
                            checked={data.manage_stock}
                            onCheckedChange={(checked) => onChange({ manage_stock: checked })}
                        />
                    </div>

                    {!data.is_quote_only && (
                        <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
                            <p className="text-sm text-blue-900">
                                💡 <strong>Nota:</strong> El precio y stock se configuran en la sección "Variantes del Producto" más abajo.
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

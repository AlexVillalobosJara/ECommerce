"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Info } from "lucide-react"

interface TenantDeliverySettingsProps {
    data: any
    onChange: (data: any) => void
}

export function TenantDeliverySettings({ data, onChange }: TenantDeliverySettingsProps) {
    return (
        <Card className="shadow-sm">
            <CardContent className="pt-6 space-y-8">
                <div>
                    <h3 className="text-lg font-semibold mb-1">Configuración de Envíos</h3>
                    <p className="text-sm text-muted-foreground">Define cómo funcionarán los envíos en tu tienda</p>
                </div>

                {/* Use Shipping Zones */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border">
                    <div className="flex-1 space-y-1">
                        <Label htmlFor="use_shipping_zones" className="text-base font-semibold cursor-pointer">
                            Zonas de Reparto
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Usa las zonas de reparto configuradas para calcular costos de envío por comuna
                        </p>
                    </div>
                    <Switch
                        id="use_shipping_zones"
                        checked={data.use_shipping_zones}
                        onCheckedChange={(checked) => onChange({ use_shipping_zones: checked })}
                    />
                </div>

                {/* Use External Delivery */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border">
                    <div className="flex-1 space-y-1">
                        <Label htmlFor="use_external_delivery" className="text-base font-semibold cursor-pointer">
                            Empresas de Delivery
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Integra con empresas de delivery como Starken, Chilexpress, Blue Express, etc.
                        </p>
                    </div>
                    <Switch
                        id="use_external_delivery"
                        checked={data.use_external_delivery}
                        onCheckedChange={(checked) => onChange({ use_external_delivery: checked })}
                    />
                </div>

                {/* Delivery Strategy */}
                {data.use_shipping_zones && data.use_external_delivery && (
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                        <div className="flex gap-3">
                            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="space-y-2 flex-1">
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Estrategia de envío</p>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    Cuando ambos métodos están activos, el sistema priorizará las zonas de reparto. Si no existe una zona
                                    para la comuna del cliente, se usará automáticamente la empresa de delivery configurada.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Default Delivery Provider */}
                {data.use_external_delivery && (
                    <div className="space-y-4">
                        <div>
                            <Label className="text-base font-semibold">Empresa de Delivery Predeterminada</Label>
                            <p className="text-sm text-muted-foreground mt-1">
                                Selecciona la empresa que se usará para envíos fuera de tus zonas de reparto
                            </p>
                        </div>

                        <RadioGroup
                            value={data.default_delivery_provider || "starken"}
                            onValueChange={(value) => onChange({ default_delivery_provider: value })}
                        >
                            <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                                <RadioGroupItem value="starken" id="starken" />
                                <Label htmlFor="starken" className="flex-1 cursor-pointer">
                                    <span className="font-medium">Starken</span>
                                    <p className="text-sm text-muted-foreground">Envíos a todo Chile</p>
                                </Label>
                            </div>

                            <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                                <RadioGroupItem value="chilexpress" id="chilexpress" />
                                <Label htmlFor="chilexpress" className="flex-1 cursor-pointer">
                                    <span className="font-medium">Chilexpress</span>
                                    <p className="text-sm text-muted-foreground">Envíos rápidos y seguros</p>
                                </Label>
                            </div>

                            <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                                <RadioGroupItem value="bluexpress" id="bluexpress" />
                                <Label htmlFor="bluexpress" className="flex-1 cursor-pointer">
                                    <span className="font-medium">Blue Express</span>
                                    <p className="text-sm text-muted-foreground">Cobertura nacional</p>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

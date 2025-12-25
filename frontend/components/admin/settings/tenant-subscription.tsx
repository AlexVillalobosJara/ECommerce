"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, Zap } from "lucide-react"

interface TenantSubscriptionProps {
    data: any
}

export function TenantSubscription({ data }: TenantSubscriptionProps) {
    return (
        <div className="space-y-6">
            {/* Current Plan */}
            <Card className="shadow-sm border-l-4 border-l-primary">
                <CardContent className="pt-6 space-y-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold">Plan Actual</h3>
                                <Badge variant="default" className="bg-primary">
                                    {data.subscription_plan || "Free"}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Tu suscripción vence el{" "}
                                {data.subscription_expires_at ? new Date(data.subscription_expires_at).toLocaleDateString("es-CL", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                }) : "Nunca"}
                            </p>
                        </div>
                        <Button variant="outline" size="sm">
                            Cambiar Plan
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-muted/50 border border-border">
                            <p className="text-sm text-muted-foreground mb-1">Estado</p>
                            <Badge variant={data.status === "Active" ? "default" : "secondary"}>{data.status || "Unknown"}</Badge>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 border border-border">
                            <p className="text-sm text-muted-foreground mb-1">Productos</p>
                            <p className="text-xl font-semibold">{(data.max_products || 0).toLocaleString()}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 border border-border">
                            <p className="text-sm text-muted-foreground mb-1">Pedidos/Mes</p>
                            <p className="text-xl font-semibold">{(data.max_orders_per_month || 0).toLocaleString()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Plan Features */}
            <Card className="shadow-sm">
                <CardContent className="pt-6 space-y-6">
                    <h3 className="text-lg font-semibold">Características del Plan {data.subscription_plan}</h3>

                    <div className="space-y-3">
                        {[
                            "Productos ilimitados",
                            "Pedidos ilimitados",
                            "Zonas de reparto personalizadas",
                            "Integración con pasarelas de pago",
                            "Envío de emails automáticos",
                            "Soporte prioritario 24/7",
                            "Análisis y reportes avanzados",
                            "Dominio personalizado",
                        ].map((feature, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Check className="w-3 h-3 text-primary" />
                                </div>
                                <span className="text-sm">{feature}</span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-border">
                        <Button className="w-full gap-2" size="lg">
                            <Zap className="w-4 h-4" />
                            Actualizar a Enterprise
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

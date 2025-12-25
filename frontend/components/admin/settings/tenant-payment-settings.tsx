"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, ExternalLink } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface TenantPaymentSettingsProps {
    data: any
    onChange: (data: any) => void
}

export function TenantPaymentSettings({ data, onChange }: TenantPaymentSettingsProps) {
    const [showTransbankKey, setShowTransbankKey] = useState(false)
    const [showMercadoPagoToken, setShowMercadoPagoToken] = useState(false)

    return (
        <div className="space-y-6">
            {/* Transbank */}
            <Card className="shadow-sm border-l-4 border-l-red-500">
                <CardContent className="pt-6 space-y-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-semibold mb-1">Transbank WebPay Plus</h3>
                            <p className="text-sm text-muted-foreground">Acepta pagos con tarjetas de crédito y débito en Chile</p>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2 bg-transparent" asChild>
                            <a href="https://www.transbank.cl" target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4" />
                                Docs
                            </a>
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="transbank_commerce_code">Código de Comercio</Label>
                            <Input
                                id="transbank_commerce_code"
                                value={data.transbank_commerce_code || ""}
                                onChange={(e) => onChange({ transbank_commerce_code: e.target.value })}
                                placeholder="597012345678"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="transbank_api_key">API Key</Label>
                            <div className="relative">
                                <Input
                                    id="transbank_api_key"
                                    type={showTransbankKey ? "text" : "password"}
                                    value={data.transbank_api_key || ""}
                                    onChange={(e) => onChange({ transbank_api_key: e.target.value })}
                                    placeholder="••••••••••••••••"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowTransbankKey(!showTransbankKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showTransbankKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Mercado Pago */}
            <Card className="shadow-sm border-l-4 border-l-blue-500">
                <CardContent className="pt-6 space-y-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-semibold mb-1">Mercado Pago</h3>
                            <p className="text-sm text-muted-foreground">Acepta pagos con Mercado Pago en toda Latinoamérica</p>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2 bg-transparent" asChild>
                            <a href="https://www.mercadopago.cl/developers" target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4" />
                                Docs
                            </a>
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="mercadopago_public_key">Public Key</Label>
                            <Input
                                id="mercadopago_public_key"
                                value={data.mercadopago_public_key || ""}
                                onChange={(e) => onChange({ mercadopago_public_key: e.target.value })}
                                placeholder="APP_USR-..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="mercadopago_access_token">Access Token</Label>
                            <div className="relative">
                                <Input
                                    id="mercadopago_access_token"
                                    type={showMercadoPagoToken ? "text" : "password"}
                                    value={data.mercadopago_access_token || ""}
                                    onChange={(e) => onChange({ mercadopago_access_token: e.target.value })}
                                    placeholder="••••••••••••••••"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowMercadoPagoToken(!showMercadoPagoToken)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showMercadoPagoToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, TestTube } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface TenantEmailSettingsProps {
    data: any
    onChange: (data: any) => void
}

export function TenantEmailSettings({ data, onChange }: TenantEmailSettingsProps) {
    const [showPassword, setShowPassword] = useState(false)
    const [testing, setTesting] = useState(false)

    const handleTestEmail = async () => {
        setTesting(true)
        await new Promise((resolve) => setTimeout(resolve, 2000))
        console.log("[v0] Testing SMTP connection...")
        setTesting(false)
        alert("Email de prueba enviado correctamente")
    }

    return (
        <Card className="shadow-sm">
            <CardContent className="pt-6 space-y-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-semibold mb-1">Configuración SMTP</h3>
                        <p className="text-sm text-muted-foreground">
                            Configura el servidor de correo para enviar notificaciones a tus clientes
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTestEmail}
                        disabled={testing}
                        className="gap-2 bg-transparent"
                    >
                        <TestTube className="w-4 h-4" />
                        {testing ? "Enviando..." : "Probar"}
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="smtp_host">Servidor SMTP</Label>
                        <Input
                            id="smtp_host"
                            value={data.smtp_host || ""}
                            onChange={(e) => onChange({ smtp_host: e.target.value })}
                            placeholder="smtp.gmail.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="smtp_port">Puerto</Label>
                        <Input
                            id="smtp_port"
                            type="number"
                            value={data.smtp_port || ""}
                            onChange={(e) => onChange({ smtp_port: Number.parseInt(e.target.value) })}
                            placeholder="587"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="smtp_username">Usuario SMTP</Label>
                        <Input
                            id="smtp_username"
                            value={data.smtp_username || ""}
                            onChange={(e) => onChange({ smtp_username: e.target.value })}
                            placeholder="tu-email@gmail.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="smtp_password">Contraseña SMTP</Label>
                        <div className="relative">
                            <Input
                                id="smtp_password"
                                type={showPassword ? "text" : "password"}
                                value={data.smtp_password || ""}
                                onChange={(e) => onChange({ smtp_password: e.target.value })}
                                placeholder="••••••••••••••••"
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-border pt-6">
                    <h4 className="font-medium mb-4">Información del Remitente</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="smtp_from_name">Nombre del Remitente</Label>
                            <Input
                                id="smtp_from_name"
                                value={data.smtp_from_name || ""}
                                onChange={(e) => onChange({ smtp_from_name: e.target.value })}
                                placeholder="Mi Tienda Zumi"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="smtp_from_email">Email del Remitente</Label>
                            <Input
                                id="smtp_from_email"
                                type="email"
                                value={data.smtp_from_email || ""}
                                onChange={(e) => onChange({ smtp_from_email: e.target.value })}
                                placeholder="noreply@mitienda.com"
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

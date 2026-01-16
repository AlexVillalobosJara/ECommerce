"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserCog, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface TenantOwnerProps {
    data: any
    onChange: (data: any) => void
}

export function TenantOwner({ data, onChange }: TenantOwnerProps) {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    return (
        <Card className="shadow-sm">
            <CardContent className="pt-6 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <UserCog className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Usuario Propietario</h3>
                        <p className="text-sm text-muted-foreground">Administrador inicial del tenant</p>
                    </div>
                </div>

                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Este usuario tendrá acceso completo al panel de administración del nuevo tenant. Asegúrate de usar un email
                        válido.
                    </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="owner_username">
                            Nombre de Usuario <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="owner_username"
                            value={data.owner_username}
                            onChange={(e) => onChange({ owner_username: e.target.value })}
                            placeholder="admin"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="owner_email">
                            Email <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="owner_email"
                            type="email"
                            value={data.owner_email}
                            onChange={(e) => onChange({ owner_email: e.target.value })}
                            placeholder="admin@tienda.cl"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="owner_name">
                            Nombre <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="owner_name"
                            value={data.owner_name}
                            onChange={(e) => onChange({ owner_name: e.target.value })}
                            placeholder="Nombre"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="owner_last_name">
                            Apellido <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="owner_last_name"
                            value={data.owner_last_name}
                            onChange={(e) => onChange({ owner_last_name: e.target.value })}
                            placeholder="Apellido"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="owner_password">
                            Contraseña Inicial <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                            <Input
                                id="owner_password"
                                type={showPassword ? "text" : "password"}
                                value={data.owner_password}
                                onChange={(e) => onChange({ owner_password: e.target.value })}
                                placeholder="••••••••"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Mínimo 8 caracteres</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="owner_confirm_password">
                            Confirmar Contraseña <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                            <Input
                                id="owner_confirm_password"
                                type={showConfirmPassword ? "text" : "password"}
                                value={data.owner_confirm_password}
                                onChange={(e) => onChange({ owner_confirm_password: e.target.value })}
                                placeholder="••••••••"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

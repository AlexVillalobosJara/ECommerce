"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Mail } from "lucide-react"
import { useAdminAuth } from "@/contexts/AdminAuthContext"
import { toast } from "sonner"

export default function AdminLoginPage() {
    const router = useRouter()
    const { login } = useAdminAuth()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            await login(username, password)
            toast.success("Sesión iniciada correctamente")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al iniciar sesión")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-primary mb-2">Zumi</h1>
                    <p className="text-sm text-muted-foreground">Panel de administración</p>
                </div>

                {/* Login Card */}
                <Card className="border-border shadow-lg">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold">Iniciar sesión</CardTitle>
                        <CardDescription>Ingresa tus credenciales para acceder al panel</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Usuario</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder="admin"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Contraseña</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                            </Button>

                            <div className="text-center">
                                <button type="button" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-xs text-muted-foreground mt-8">
                    Al iniciar sesión, aceptas nuestros términos de servicio y política de privacidad
                </p>
            </div>
        </div>
    )
}

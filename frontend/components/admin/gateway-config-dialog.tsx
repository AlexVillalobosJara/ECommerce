"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ShieldCheck, ShieldAlert, Loader2, Save, XCircle, CheckCircle2 } from "lucide-react"
import { adminApi } from "@/services/admin-api"
import { useToast } from "@/hooks/use-toast"

interface GatewayConfigDialogProps {
    gateway: {
        id: string | null
        gateway: string
        is_active: boolean
        is_sandbox: boolean
        credentials: any
    }
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: () => void
}

export function GatewayConfigDialog({
    gateway,
    open,
    onOpenChange,
    onSave
}: GatewayConfigDialogProps) {
    const [formData, setFormData] = useState({
        api_key: "",
        secret_key: "",
        commerce_code: "",
        public_key: "",
        is_sandbox: gateway.is_sandbox,
        is_active: gateway.is_active
    })
    const [loading, setLoading] = useState(false)
    const [testing, setTesting] = useState(false)
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
    const { toast } = useToast()

    const handleTest = async () => {
        setTesting(true)
        setTestResult(null)

        try {
            const result = await adminApi.testPaymentGateway(gateway.gateway, {
                api_key: formData.api_key,
                secret_key: formData.secret_key,
                commerce_code: formData.commerce_code,
                is_sandbox: formData.is_sandbox
            })

            setTestResult(result)

            if (result.success) {
                toast({
                    title: "Conexión exitosa",
                    description: result.message
                })
            }
        } catch (error: any) {
            setTestResult({
                success: false,
                message: error.message || "Error al probar la conexión"
            })

            toast({
                title: "Error",
                description: "No se pudo conectar con la pasarela",
                variant: "destructive"
            })
        } finally {
            setTesting(false)
        }
    }

    const handleSave = async () => {
        setLoading(true)

        try {
            await adminApi.configurePaymentGateway(gateway.gateway, formData)

            toast({
                title: "Éxito",
                description: "Pasarela configurada correctamente"
            })

            onSave()
            onOpenChange(false)
        } catch (error: any) {
            console.error("Error saving gateway:", error)
            toast({
                title: "Error",
                description: error.message || "No se pudo guardar la configuración",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const renderFields = () => {
        switch (gateway.gateway) {
            case "Flow":
                return (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="api_key">API Key *</Label>
                            <Input
                                id="api_key"
                                type="password"
                                placeholder={gateway.credentials?.api_key || "Ingresa tu API Key"}
                                value={formData.api_key}
                                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="secret_key">Secret Key *</Label>
                            <Input
                                id="secret_key"
                                type="password"
                                placeholder={gateway.credentials?.secret_key || "Ingresa tu Secret Key"}
                                value={formData.secret_key}
                                onChange={(e) => setFormData({ ...formData, secret_key: e.target.value })}
                            />
                        </div>
                    </>
                )

            case "Transbank":
                return (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="commerce_code">Commerce Code *</Label>
                            <Input
                                id="commerce_code"
                                type="text"
                                placeholder={gateway.credentials?.commerce_code || "Código de comercio"}
                                value={formData.commerce_code}
                                onChange={(e) => setFormData({ ...formData, commerce_code: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="api_key">API Key *</Label>
                            <Input
                                id="api_key"
                                type="password"
                                placeholder={gateway.credentials?.api_key || "Ingresa tu API Key"}
                                value={formData.api_key}
                                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                            />
                        </div>
                    </>
                )

            case "MercadoPago":
                return (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="public_key">Public Key *</Label>
                            <Input
                                id="public_key"
                                type="text"
                                placeholder={gateway.credentials?.public_key || "Public Key"}
                                value={formData.public_key}
                                onChange={(e) => setFormData({ ...formData, public_key: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="api_key">Access Token *</Label>
                            <Input
                                id="api_key"
                                type="password"
                                placeholder={gateway.credentials?.api_key || "Access Token"}
                                value={formData.api_key}
                                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                            />
                        </div>
                    </>
                )

            default:
                return null
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Configurar {gateway.gateway}</DialogTitle>
                    <DialogDescription>
                        Ingresa las credenciales de tu cuenta de {gateway.gateway}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {renderFields()}

                    <div className="space-y-4 rounded-lg border p-4">
                        <h4 className="text-sm font-medium">Configuración Avanzada</h4>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="is_sandbox" className="cursor-pointer">
                                Modo Sandbox (Pruebas)
                            </Label>
                            <Switch
                                id="is_sandbox"
                                checked={formData.is_sandbox}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_sandbox: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="is_active" className="cursor-pointer">
                                Activar pasarela
                            </Label>
                            <Switch
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                            />
                        </div>
                    </div>

                    {testResult && (
                        <div className={`rounded-lg border p-3 ${testResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                            <div className="flex items-center gap-2">
                                {testResult.success ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                <p className={`text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                                    {testResult.message}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleTest}
                        disabled={testing || loading}
                    >
                        {testing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Probando...
                            </>
                        ) : (
                            "Probar Conexión"
                        )}
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={loading || testing}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            "Guardar"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

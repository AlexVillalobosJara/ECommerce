"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    CreditCard,
    CheckCircle2,
    AlertCircle,
    Save,
    Eye,
    EyeOff,
    Loader2,
    XCircle,
    Copy,
    ExternalLink
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { adminApi } from "@/services/admin-api"
import { useToast } from "@/hooks/use-toast"

interface PaymentGateway {
    id: string | null
    gateway: string
    is_active: boolean
    is_sandbox: boolean
    credentials: {
        api_key?: string
        secret_key?: string
        commerce_code?: string
        public_key?: string
    } | null
    created_at: string | null
    updated_at: string | null
}

interface GatewayFormData {
    api_key: string
    secret_key: string
    commerce_code: string
    public_key: string
    access_token: string
    is_sandbox: boolean
}

const GATEWAY_INFO = {
    Flow: {
        name: "Flow",
        description: "Acepta pagos con tarjetas de crédito, débito y transferencias en Chile",
        color: "from-blue-500 to-blue-600",
        docsUrl: "https://www.flow.cl/app/web/merchant",
        fields: ["api_key", "secret_key"]
    },
    Transbank: {
        name: "Transbank WebPay Plus",
        description: "Plataforma de pagos más usada en Chile para tarjetas de crédito y débito",
        color: "from-red-500 to-red-600",
        docsUrl: "https://www.transbankdevelopers.cl",
        fields: ["commerce_code", "api_key"]
    },
    Khipu: {
        name: "Khipu",
        description: "Pagos simplificados mediante transferencias bancarias",
        color: "from-violet-500 to-indigo-600",
        docsUrl: "https://khipu.com/page/api-referencia-v2",
        fields: ["api_key", "secret_key"]
    },
    MercadoPago: {
        name: "Mercado Pago",
        description: "Acepta pagos en toda Latinoamérica con múltiples métodos de pago",
        color: "from-cyan-500 to-blue-600",
        docsUrl: "https://www.mercadopago.cl/developers",
        fields: ["public_key", "access_token"]
    }
}

export function PaymentSettings() {
    const [gateways, setGateways] = useState<PaymentGateway[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
    const [formData, setFormData] = useState<Record<string, GatewayFormData>>({})
    const { toast } = useToast()
    const [certificationResult, setCertificationResult] = useState<{ token: string; url: string; amount: number } | null>(null)
    const [showCertificationDialog, setShowCertificationDialog] = useState(false)

    useEffect(() => {
        loadGateways(true)
    }, [])

    // ... imports need to be updated first, doing it in separate call if easier, but let's try to add the function logic first

    const handleCertifyTransbank = async () => {
        setSaving(true)
        try {
            const returnUrl = window.location.href
            const response = await adminApi.certifyTransbank(returnUrl)
            if (response.success) {
                setCertificationResult({
                    token: response.token,
                    url: response.url,
                    amount: response.amount
                })
                setShowCertificationDialog(true)
                toast({
                    title: "Certificación Iniciada",
                    description: "Se ha generado el token de prueba correctamente"
                })
            } else {
                throw new Error(response.error || "Error desconocido")
            }
        } catch (error) {
            console.error("Error initiating certification:", error)
            toast({
                title: "Error",
                description: "No se pudo iniciar la certificación",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    // ... (rest of the component)

    const loadGateways = async (showLoadingSpinner = false) => {
        try {
            if (showLoadingSpinner) setLoading(true)
            setError(null)
            console.log("Loading gateways...")

            // Failsafe timeout
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Timeout loading gateways")), 10000)
            )

            const data = await Promise.race([
                adminApi.listPaymentGateways(),
                timeoutPromise
            ])

            console.log("Gateways loaded:", data)
            setGateways(data)

            // Initialize form data with current gateway settings
            const initialFormData: Record<string, GatewayFormData> = {}
            if (Array.isArray(data)) {
                data.forEach((gateway: PaymentGateway) => {
                    initialFormData[gateway.gateway] = {
                        api_key: "",
                        secret_key: "",
                        commerce_code: "",
                        public_key: "",
                        access_token: "",
                        is_sandbox: gateway.is_sandbox
                    }
                })
            }
            setFormData(initialFormData)
        } catch (error: any) {
            console.error("Error loading gateways:", error)
            const errorMessage = error?.message || "No se pudieron cargar las pasarelas de pago"
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleActive = async (gateway: PaymentGateway) => {
        if (!gateway.id) {
            toast({
                title: "Error",
                description: "Debes configurar la pasarela primero",
                variant: "destructive"
            })
            return
        }

        try {
            await adminApi.configurePaymentGateway(gateway.gateway, {
                is_active: !gateway.is_active
            })

            toast({
                title: "Éxito",
                description: `Pasarela ${gateway.is_active ? 'desactivada' : 'activada'} correctamente`
            })

            await loadGateways()
        } catch (error) {
            console.error("Error toggling gateway:", error)
            toast({
                title: "Error",
                description: "No se pudo actualizar la pasarela",
                variant: "destructive"
            })
        }
    }

    const handleSaveGateway = async (gatewayName: string) => {
        setSaving(true)
        try {
            const data = formData[gatewayName]
            const currentGateway = gateways.find(g => g.gateway === gatewayName)

            await adminApi.configurePaymentGateway(gatewayName, {
                api_key: data.api_key || undefined,
                secret_key: data.secret_key || undefined,
                commerce_code: data.commerce_code || undefined,
                public_key: data.public_key || undefined,
                is_sandbox: data.is_sandbox,
                is_active: currentGateway?.is_active ?? false // Preserve current active state
            })

            toast({
                title: "Éxito",
                description: `Configuración de ${gatewayName} guardada correctamente`
            })

            await loadGateways()

            // Clear sensitive form fields but keep is_sandbox
            setFormData(prev => ({
                ...prev,
                [gatewayName]: {
                    api_key: "",
                    secret_key: "",
                    commerce_code: "",
                    public_key: "",
                    access_token: "",
                    is_sandbox: data.is_sandbox
                }
            }))
        } catch (error) {
            console.error("Error saving gateway:", error)
            toast({
                title: "Error",
                description: "No se pudo guardar la configuración",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    const updateFormData = (gatewayName: string, field: string, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            [gatewayName]: {
                ...prev[gatewayName],
                [field]: value
            }
        }))
    }

    const toggleSecret = (key: string) => {
        setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Pasarelas de Pago</h1>
                    <p className="text-muted-foreground mt-1">Configura los métodos de pago para tu tienda</p>
                </div>
                <Card className="p-6 border-destructive">
                    <div className="flex items-center gap-3">
                        <XCircle className="h-5 w-5 text-destructive" />
                        <div>
                            <p className="font-medium text-destructive">Error al cargar pasarelas</p>
                            <p className="text-sm text-muted-foreground mt-1">{error}</p>
                            <Button onClick={() => loadGateways(true)} variant="outline" size="sm" className="mt-3">
                                Reintentar
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-semibold tracking-tight">Pasarelas de Pago</h1>
                <p className="text-muted-foreground mt-1">Configura los métodos de pago para tu tienda</p>
            </div>

            {/* Alert */}
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    Las credenciales se almacenan de forma segura y encriptada. Nunca compartas tus claves secretas con terceros.
                </AlertDescription>
            </Alert>

            {/* Gateway Cards */}
            <div className="grid gap-6">
                {gateways.map((gateway) => {
                    const info = GATEWAY_INFO[gateway.gateway as keyof typeof GATEWAY_INFO]

                    // Defensive check: if gateway is not in our known list, skip it to prevent crash
                    if (!info) {
                        console.warn(`Unknown gateway: ${gateway.gateway}`)
                        return null
                    }

                    const isConfigured = gateway.id !== null
                    const form = formData[gateway.gateway] || {}

                    return (
                        <Card key={gateway.gateway} className="overflow-hidden">
                            <div className="p-6 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${info.color} flex items-center justify-center`}>
                                            <CreditCard className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-semibold">{info.name}</h3>
                                                {isConfigured ? (
                                                    <Badge variant="outline" className="gap-1 border-green-600/20 bg-green-600/10 text-green-700">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Configurado
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="gap-1 border-amber-600/20 bg-amber-600/10 text-amber-700">
                                                        <AlertCircle className="w-3 h-3" />
                                                        Pendiente
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {info.description}
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={gateway.is_active}
                                        onCheckedChange={() => handleToggleActive(gateway)}
                                        disabled={!isConfigured}
                                    />
                                </div>

                                <div className="space-y-4 pt-4 border-t">
                                    <Tabs
                                        value={formData[gateway.gateway]?.is_sandbox ? "sandbox" : "production"}
                                        onValueChange={(value) => {
                                            updateFormData(gateway.gateway, "is_sandbox", value === "sandbox")
                                        }}
                                    >
                                        <TabsList className="grid w-full max-w-md grid-cols-2">
                                            <TabsTrigger value="sandbox">Modo Prueba</TabsTrigger>
                                            <TabsTrigger value="production">Modo Producción</TabsTrigger>
                                        </TabsList>
                                    </Tabs>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        {gateway.gateway === "Flow" && (
                                            <>
                                                <div className="space-y-2">
                                                    <Label htmlFor={`${gateway.gateway}-api-key`}>API Key</Label>
                                                    <Input
                                                        id={`${gateway.gateway}-api-key`}
                                                        type="text"
                                                        autoComplete="off"
                                                        placeholder={gateway.credentials?.api_key || "Ingresa tu API Key de Flow"}
                                                        value={form.api_key || ""}
                                                        onChange={(e) => updateFormData(gateway.gateway, "api_key", e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor={`${gateway.gateway}-secret-key`}>Secret Key</Label>
                                                    <div className="relative">
                                                        <Input
                                                            id={`${gateway.gateway}-secret-key`}
                                                            type={showSecrets[`${gateway.gateway}-secret`] ? "text" : "password"}
                                                            autoComplete="new-password"
                                                            placeholder={gateway.credentials?.secret_key || "Ingresa tu Secret Key de Flow"}
                                                            value={form.secret_key || ""}
                                                            onChange={(e) => updateFormData(gateway.gateway, "secret_key", e.target.value)}
                                                            className="pr-10"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleSecret(`${gateway.gateway}-secret`)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                        >
                                                            {showSecrets[`${gateway.gateway}-secret`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {gateway.gateway === "Transbank" && (
                                            <>
                                                <div className="space-y-2">
                                                    <Label htmlFor={`${gateway.gateway}-commerce-code`}>Código de Comercio</Label>
                                                    <Input
                                                        id={`${gateway.gateway}-commerce-code`}
                                                        type="text"
                                                        autoComplete="off"
                                                        placeholder={gateway.credentials?.commerce_code || "Ej: 597055555532"}
                                                        value={form.commerce_code || ""}
                                                        onChange={(e) => updateFormData(gateway.gateway, "commerce_code", e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor={`${gateway.gateway}-api-key`}>API Key</Label>
                                                    <div className="relative">
                                                        <Input
                                                            id={`${gateway.gateway}-api-key`}
                                                            type={showSecrets[`${gateway.gateway}-secret`] ? "text" : "password"}
                                                            autoComplete="new-password"
                                                            placeholder={gateway.credentials?.api_key || "Ingresa tu API Key de Transbank"}
                                                            value={form.api_key || ""}
                                                            onChange={(e) => updateFormData(gateway.gateway, "api_key", e.target.value)}
                                                            className="pr-10"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleSecret(`${gateway.gateway}-secret`)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                        >
                                                            {showSecrets[`${gateway.gateway}-secret`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {gateway.gateway === "Khipu" && (
                                            <>
                                                <div className="space-y-2">
                                                    <Label htmlFor={`${gateway.gateway}-api-key`}>Receiver ID</Label>
                                                    <Input
                                                        id={`${gateway.gateway}-api-key`}
                                                        type="text"
                                                        autoComplete="off"
                                                        placeholder={gateway.credentials?.api_key || "Ej: 12345"}
                                                        value={form.api_key || ""}
                                                        onChange={(e) => updateFormData(gateway.gateway, "api_key", e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor={`${gateway.gateway}-secret-key`}>Secret Key</Label>
                                                    <div className="relative">
                                                        <Input
                                                            id={`${gateway.gateway}-secret-key`}
                                                            type={showSecrets[`${gateway.gateway}-secret`] ? "text" : "password"}
                                                            autoComplete="new-password"
                                                            placeholder={gateway.credentials?.secret_key || "Ingresa tu Secret Key de Khipu"}
                                                            value={form.secret_key || ""}
                                                            onChange={(e) => updateFormData(gateway.gateway, "secret_key", e.target.value)}
                                                            className="pr-10"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleSecret(`${gateway.gateway}-secret`)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                        >
                                                            {showSecrets[`${gateway.gateway}-secret`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {gateway.gateway === "MercadoPago" && (
                                            <>
                                                <div className="space-y-2">
                                                    <Label htmlFor={`${gateway.gateway}-public-key`}>Public Key</Label>
                                                    <Input
                                                        id={`${gateway.gateway}-public-key`}
                                                        type="text"
                                                        autoComplete="off"
                                                        placeholder={gateway.credentials?.public_key || "APP_USR-xxxxxx-xxxxxx"}
                                                        value={form.public_key || ""}
                                                        onChange={(e) => updateFormData(gateway.gateway, "public_key", e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor={`${gateway.gateway}-access-token`}>Access Token</Label>
                                                    <div className="relative">
                                                        <Input
                                                            id={`${gateway.gateway}-access-token`}
                                                            type={showSecrets[`${gateway.gateway}-secret`] ? "text" : "password"}
                                                            autoComplete="new-password"
                                                            placeholder="APP_USR-xxxxxx-xxxxxx"
                                                            value={form.access_token || ""}
                                                            onChange={(e) => updateFormData(gateway.gateway, "access_token", e.target.value)}
                                                            className="pr-10"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleSecret(`${gateway.gateway}-secret`)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                        >
                                                            {showSecrets[`${gateway.gateway}-secret`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="bg-muted/50 rounded-lg p-4 flex-1">
                                            <p className="text-sm text-muted-foreground">
                                                Obtén tus credenciales en{" "}
                                                <a
                                                    href={info.docsUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline"
                                                >
                                                    {info.docsUrl.replace("https://", "")}
                                                </a>
                                            </p>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            {gateway.gateway === 'Transbank' && isConfigured && (
                                                <Button
                                                    onClick={handleCertifyTransbank}
                                                    disabled={saving}
                                                    variant="outline"
                                                    className="gap-2"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Iniciar Certificación
                                                </Button>
                                            )}
                                            <Button
                                                onClick={() => handleSaveGateway(gateway.gateway)}
                                                disabled={saving}
                                                className="gap-2"
                                            >
                                                <Save className="w-4 h-4" />
                                                {saving ? "Guardando..." : "Guardar"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )
                })}
            </div>

            <Dialog open={showCertificationDialog} onOpenChange={setShowCertificationDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Certificación Transbank</DialogTitle>
                        <DialogDescription>
                            Sigue estos pasos para completar el proceso de certificación.
                        </DialogDescription>
                    </DialogHeader>

                    {certificationResult && (
                        <div className="space-y-6 py-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>1. Copia el Token generado</Label>
                                    <div className="flex gap-2">
                                        <Input readOnly value={certificationResult.token} className="font-mono bg-muted" />
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            onClick={() => {
                                                navigator.clipboard.writeText(certificationResult.token)
                                                toast({ description: "Token copiado al portapapeles" })
                                            }}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Debes enviar este token por correo a <strong>soporte@transbank.cl</strong> indicando que es para certificación.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>2. Realiza la transacción de prueba</Label>
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            IMPORTANTE: Al realizar el pago, selecciona <strong>Tarjeta de Crédito</strong> y elige <strong>Sin Cuotas</strong> (o 1 cuota) para que la certificación sea aprobada.
                                        </AlertDescription>
                                    </Alert>
                                    <div className="pt-2 flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="w-full gap-2"
                                            onClick={() => window.open(certificationResult.url, '_blank')}
                                        >
                                            Ir a Webpay y Pagar ${certificationResult.amount}
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            className="w-full gap-2"
                                            onClick={async () => {
                                                try {
                                                    setSaving(true)
                                                    const res = await adminApi.confirmTransbankCertification(certificationResult.token)
                                                    if (res.success) {
                                                        toast({ title: "¡Transacción Confirmada!", description: "Estado: " + res.status })
                                                    } else {
                                                        toast({ title: "Error Confirmación", description: "Estado: " + res.status, variant: "destructive" })
                                                    }
                                                } catch (e) {
                                                    toast({ title: "Error", description: "Falló la confirmación", variant: "destructive" })
                                                } finally {
                                                    setSaving(false)
                                                }
                                            }}
                                            disabled={saving}
                                        >
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                            Confirmar Pago
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCertificationDialog(false)}>
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

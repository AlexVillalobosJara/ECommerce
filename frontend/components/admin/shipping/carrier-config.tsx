"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { adminApi } from "@/services/admin-api"
import { useToast } from "@/hooks/use-toast"
import { Truck, AlertCircle, Save } from "lucide-react"

interface CarrierConfig {
    id: string
    carrier_name: string
    is_active: boolean
    api_key?: string
    api_secret?: string
    account_number?: string
    has_api_key?: boolean
    has_api_secret?: boolean
    extra_settings?: any
}

const AVAILABLE_CARRIERS = [
    { name: "Starken", label: "Starken" },
    { name: "Chilexpress", label: "Chilexpress" },
    { name: "BlueExpress", label: "Blue Express" },
]

export function CarrierConfigList() {
    const [configs, setConfigs] = useState<CarrierConfig[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        loadConfigs()
    }, [])

    const loadConfigs = async () => {
        try {
            setIsLoading(true)
            const response = await adminApi.listCarrierConfigs()
            const data = response.results || response
            setConfigs(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Error loading carrier configs", error)
            toast({
                title: "Error",
                description: "No se pudieron cargar las configuraciones de transportistas",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    const getConfig = (carrierName: string) => {
        return configs.find(c => c.carrier_name === carrierName)
    }

    const handleSave = async (carrierName: string, data: Partial<CarrierConfig>) => {
        try {
            setIsSaving(true)
            const existing = getConfig(carrierName)

            if (existing) {
                // Update
                const updated = await adminApi.updateCarrierConfig(existing.id, data)
                setConfigs(prev => prev.map(c => c.id === existing.id ? updated : c))
            } else {
                // Create
                const created = await adminApi.createCarrierConfig({
                    carrier_name: carrierName,
                    ...data
                })
                setConfigs(prev => [...prev, created])
            }

            toast({
                title: "Guardado",
                description: `Configuración de ${carrierName} guardada.`,
            })
        } catch (error) {
            console.error("Error saving config", error)
            toast({
                title: "Error",
                description: "No se pudo guardar la configuración",
                variant: "destructive"
            })
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return <div className="text-center py-8">Cargando configuraciones...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <Truck className="h-6 w-6 text-primary" />
                <div>
                    <h2 className="text-xl font-bold">Transportistas Externos</h2>
                    <p className="text-sm text-muted-foreground">
                        Configura la integración con empresas de transporte para calcular envíos automáticamente cuando no aplique ninguna zona manual.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {AVAILABLE_CARRIERS.map((carrier) => {
                    const config = getConfig(carrier.name)
                    const isActive = config?.is_active || false

                    return (
                        <CarrierConfigCard
                            key={carrier.name}
                            carrierName={carrier.name}
                            carrierLabel={carrier.label}
                            initialConfig={config}
                            onSave={handleSave}
                        />
                    )
                })}
            </div>
        </div>
    )
}

function CarrierConfigCard({
    carrierName,
    carrierLabel,
    initialConfig,
    onSave
}: {
    carrierName: string
    carrierLabel: string
    initialConfig?: CarrierConfig
    onSave: (name: string, data: any) => Promise<void>
}) {
    // Local state for inputs
    const [isActive, setIsActive] = useState(initialConfig?.is_active || false)
    const [apiKey, setApiKey] = useState("")
    const [apiSecret, setApiSecret] = useState("")
    const [accountNumber, setAccountNumber] = useState(initialConfig?.account_number || "")
    // Cast to any to access extra_settings if not typed yet
    const initialExtra = (initialConfig as any)?.extra_settings || {}
    const [isTestMode, setIsTestMode] = useState<boolean>(initialExtra.is_test_mode !== false) // Default to true if undefined
    const [isExpanded, setIsExpanded] = useState(initialConfig?.is_active || false)

    const handleToggle = (checked: boolean) => {
        setIsActive(checked)
        if (checked) setIsExpanded(true)
    }

    const onSaveClick = () => {
        const data: any = {
            is_active: isActive,
            extra_settings: {
                ...initialExtra,
                is_test_mode: isTestMode
            }
        }
        if (availableFields.includes('account_number')) data.account_number = accountNumber
        if (apiKey) data.api_key = apiKey
        if (apiSecret) data.api_secret = apiSecret

        onSave(carrierName, data)
    }

    // Define fields needed per carrier (simplified for generic use now)
    const availableFields = ['api_key', 'api_secret', 'account_number'] // Customize per carrier if needed

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        <Truck className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-base">{carrierLabel}</CardTitle>
                        <CardDescription>
                            {isActive ? 'Integración activa' : 'Desactivado'}
                        </CardDescription>
                    </div>
                </div>
                <Switch checked={isActive} onCheckedChange={handleToggle} />
            </CardHeader>

            {isExpanded && (
                <CardContent className="border-t pt-4 space-y-4">
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label>API Key</Label>
                            <Input
                                type="password"
                                placeholder={initialConfig?.has_api_key ? "•••••••• (Guardado)" : "Ingresa la API Key"}
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                            />
                        </div>

                        {/* Example: Starken often needs user/password or specialized keys. Using generic fields for POC. */}
                        <div className="grid gap-2">
                            <Label>API Secret / Contraseña</Label>
                            <Input
                                type="password"
                                placeholder={initialConfig?.has_api_secret ? "•••••••• (Guardado)" : "Ingresa el Secret"}
                                value={apiSecret}

                                onChange={e => setApiSecret(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Número de Cuenta / Rut Empresa</Label>
                            <Input
                                placeholder="Ej. 76.123.456-7"
                                value={accountNumber}
                                onChange={e => setAccountNumber(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center space-x-2 border p-3 rounded-md bg-slate-50">
                            <Switch
                                id="test-mode"
                                checked={isTestMode}
                                onCheckedChange={setIsTestMode}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="test-mode" className="font-semibold text-sm">Modo de Pruebas (Sandbox)</Label>
                                <p className="text-xs text-muted-foreground">
                                    Si está activo, usará servidores de prueba. Desactívalo para Producción.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button onClick={onSaveClick} size="sm" className="gap-2">
                            <Save className="h-4 w-4" />
                            Guardar Configuración
                        </Button>
                    </div>
                </CardContent>
            )}
        </Card>
    )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CreditCard, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/storefront/header"
import { Footer } from "@/components/storefront/footer"
import { useTenant } from "@/contexts/TenantContext"
import { storefrontApi, type Order } from "@/services/storefront-api"
import { formatPrice } from "@/lib/format-price"
import { Suspense } from "react"

function PaymentContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { tenant, loading: tenantLoading } = useTenant()

    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadOrder() {
            if (tenantLoading) return // Wait for tenant to load

            const orderId = searchParams.get("order")

            if (!orderId || !tenant) {
                setError("Orden no encontrada")
                setLoading(false)
                return
            }

            try {
                const orderData = await storefrontApi.getOrder(tenant.slug, orderId)
                setOrder(orderData)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error al cargar la orden")
            } finally {
                setLoading(false)
            }
        }

        loadOrder()
    }, [searchParams, tenant, tenantLoading])

    const format = (price: string | number) => {
        return formatPrice(price, tenant)
    }

    const [selectedGateway, setSelectedGateway] = useState<string>("") // Will be set to first active gateway
    const [availableGateways, setAvailableGateways] = useState<Array<{
        id: string
        name: string
        description: string
        icon: React.ReactNode
        color: string
        borderColor: string
        bgColor: string
    }>>([])

    // Load active payment gateways
    useEffect(() => {
        async function loadGateways() {
            if (!tenant) return

            try {
                const activeGateways = await storefrontApi.getActivePaymentGateways(tenant.slug)

                // Map backend gateways to UI configuration
                const gatewayConfig: Record<string, any> = {
                    'Transbank': {
                        name: 'Webpay Plus',
                        description: 'Tarjetas de crédito y débito',
                        icon: <CreditCard className="h-6 w-6 text-white" />,
                        color: 'from-red-500 to-rose-600',
                        borderColor: 'border-red-500',
                        bgColor: 'bg-red-50'
                    },
                    'Khipu': {
                        name: 'Khipu',
                        description: 'Transferencia bancaria simplificada',
                        icon: <div className="font-bold text-white text-xl">K</div>,
                        color: 'from-violet-500 to-indigo-600',
                        borderColor: 'border-violet-500',
                        bgColor: 'bg-violet-50'
                    },
                    'Flow': {
                        name: 'Flow',
                        description: 'Webpay, Servipag, Multicaja y más',
                        icon: <CreditCard className="h-6 w-6 text-white" />,
                        color: 'from-blue-500 to-purple-600',
                        borderColor: 'border-blue-500',
                        bgColor: 'bg-blue-50'
                    }
                }

                const gateways = activeGateways.map((gw: any) => ({
                    id: gw.id,
                    ...gatewayConfig[gw.id]
                })).filter((gw: any) => gw.name) // Filter out any unknown gateways

                setAvailableGateways(gateways)

                // Set first gateway as default
                if (gateways.length > 0 && !selectedGateway) {
                    setSelectedGateway(gateways[0].id)
                }
            } catch (err) {
                console.error("Error loading payment gateways:", err)
            }
        }

        loadGateways()
    }, [tenant])

    const handlePayment = async () => {
        if (!order || !tenant) return

        setProcessing(true)
        setError(null)

        try {
            // Initiate payment with selected gateway
            const paymentResponse = await storefrontApi.initiatePayment(
                tenant.slug,
                order.id,
                selectedGateway,
                `${window.location.origin}/payment/callback`,
                `${window.location.origin}/payment/cancelled`
            )

            // Redirect to gateway payment page
            if (paymentResponse.payment_url) {
                window.location.href = paymentResponse.payment_url
            } else {
                throw new Error("No se recibió URL de pago del comercio")
            }
        } catch (err) {
            console.error("Payment initiation error:", err)
            setError(err instanceof Error ? err.message : "Error al iniciar el pago")
            setProcessing(false)
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-lg text-muted-foreground">Cargando...</p>
            </div>
        )
    }

    if (error || !order) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-destructive">Error</h1>
                    <p className="mt-2 text-muted-foreground">{error || "Orden no encontrada"}</p>
                    <Button className="mt-4" onClick={() => router.push("/")}>
                        Volver a la Tienda
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Header categories={[]} />

            <main className="flex-1 bg-secondary/30">
                <div className="container mx-auto px-4 py-12 lg:py-16">
                    {/* Page Header */}
                    <div className="mb-12 text-center relative">
                        <Button
                            variant="ghost"
                            className="absolute left-0 top-1/2 -translate-y-1/2 gap-2"
                            onClick={() => router.back()}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Volver
                        </Button>
                        <h1 className="font-serif text-4xl font-normal tracking-tight text-foreground lg:text-5xl">
                            Pago Seguro
                        </h1>
                        <p className="mt-4 text-muted-foreground">
                            Orden #{order.order_number} <span className="text-xs opacity-50">({order.status})</span>
                        </p>
                    </div>

                    {error && (
                        <div className="mx-auto mb-6 max-w-3xl rounded-lg bg-red-50 p-4 text-red-800">
                            {error}
                        </div>
                    )}

                    {/* Payment Grid */}
                    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr,380px]">
                        {/* Left: Payment Method */}
                        <div className="space-y-6">
                            <Card className="border-border bg-white p-6 lg:p-8">
                                <h2 className="mb-6 font-serif text-2xl font-normal tracking-tight">
                                    Selecciona tu Método de Pago
                                </h2>

                                <div className="space-y-4">
                                    {availableGateways.map((gw) => (
                                        <div
                                            key={gw.id}
                                            onClick={() => setSelectedGateway(gw.id)}
                                            className={`flex items-center gap-4 rounded-lg border-2 p-6 cursor-pointer transition-all ${selectedGateway === gw.id
                                                ? `${gw.borderColor} ${gw.bgColor} shadow-md`
                                                : "border-border hover:border-muted-foreground/30 hover:bg-secondary/10"
                                                }`}
                                        >
                                            <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${gw.color}`}>
                                                {gw.icon}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold">{gw.name}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {gw.description}
                                                </p>
                                            </div>
                                            {selectedGateway === gw.id && (
                                                <div className={`h-6 w-6 rounded-full ${gw.borderColor.replace('border-', 'bg-')} flex items-center justify-center`}>
                                                    <div className="h-2 w-2 rounded-full bg-white" />
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <div className="rounded-lg bg-secondary/50 p-4 mt-8">
                                        <p className="text-sm text-muted-foreground italic">
                                            Serás redirigido a la plataforma de pago seleccionada para completar tu transacción de forma segura.
                                        </p>
                                    </div>

                                    <Button
                                        onClick={handlePayment}
                                        disabled={processing}
                                        className="w-full gap-2 py-6 text-lg font-semibold shadow-lg hover:translate-y-[-2px] transition-all"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                Redirigiendo a {selectedGateway}...
                                            </>
                                        ) : (
                                            <>
                                                <CreditCard className="h-5 w-5" />
                                                Pagar con {selectedGateway}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Card>
                            调节                        </div>

                        {/* Right: Order Summary */}
                        <Card className="h-fit border-border bg-white p-6 lg:sticky lg:top-8">
                            <h2 className="mb-6 font-serif text-xl font-normal tracking-tight">
                                Resumen de Orden
                            </h2>

                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-medium">{format(order.subtotal)}</span>
                                </div>

                                {parseFloat(order.discount_amount) > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Descuento</span>
                                        <span>-{format(order.discount_amount)}</span>
                                    </div>
                                )}

                                {parseFloat(order.shipping_cost) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Envío</span>
                                        <span className="font-medium">{format(order.shipping_cost)}</span>
                                    </div>
                                )}

                                {parseFloat(order.tax_amount) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            {tenant?.prices_include_tax ? "IVA (Incluido)" : `IVA (${tenant?.tax_rate || 19}%)`}
                                        </span>
                                        <span className="font-medium">{format(order.tax_amount)}</span>
                                    </div>
                                )}

                                <div className="border-t pt-4">
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Total</span>
                                        <span className="font-serif text-2xl font-semibold">
                                            {format(order.total)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 rounded-lg bg-secondary/50 p-4">
                                <p className="text-xs text-muted-foreground">
                                    Al continuar, aceptas nuestros términos y condiciones de venta.
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default function PaymentPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-lg text-muted-foreground">Cargando...</p></div>}>
            <PaymentContent />
        </Suspense>
    )
}

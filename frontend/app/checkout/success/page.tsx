"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, FileText, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { storefrontApi } from "@/services/storefront-api"

export default function CheckoutSuccessPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [orderNumber, setOrderNumber] = useState<string | null>(null)
    const [orderId, setOrderId] = useState<string | null>(null)
    const [orderType, setOrderType] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [redirecting, setRedirecting] = useState(false)

    useEffect(() => {
        const fetchOrderDetails = async () => {
            const order = searchParams.get("order")
            const id = searchParams.get("id")
            const tenant = searchParams.get("tenant")

            setOrderNumber(order)
            setOrderId(id)

            // Fetch order details to determine type
            if (id && tenant) {
                try {
                    const orderDetails = await storefrontApi.getOrder(tenant, id)
                    setOrderType(orderDetails.order_type)
                } catch (error) {
                    console.error("Error fetching order:", error)
                } finally {
                    setLoading(false)
                }
            } else {
                setLoading(false)
            }
        }

        fetchOrderDetails()
    }, [searchParams])

    const handleProceedToPayment = () => {
        if (orderId) {
            setRedirecting(true)
            router.push(`/payment?order=${orderId}&tenant=${searchParams.get("tenant") || "demo-store"}`)
        }
    }

    const isQuote = orderType === "Quote"

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
                <p className="text-muted-foreground">Cargando...</p>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md text-center">
                <div className="mb-6 flex justify-center">
                    {isQuote ? (
                        <FileText className="size-16 text-blue-500" />
                    ) : (
                        <CheckCircle className="size-16 text-green-500" />
                    )}
                </div>

                <h1 className="mb-4 text-3xl font-bold">
                    {isQuote ? "¡Solicitud Enviada!" : "¡Orden Creada!"}
                </h1>

                {orderNumber && (
                    <p className="mb-2 text-lg text-muted-foreground">
                        Número de {isQuote ? "solicitud" : "orden"}: <span className="font-semibold text-foreground">{orderNumber}</span>
                    </p>
                )}

                {isQuote ? (
                    <>
                        <div className="mb-8 space-y-3 rounded-lg bg-blue-50 p-6 text-left">
                            <div className="flex items-start gap-3">
                                <Mail className="mt-1 size-5 text-blue-600 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-blue-900 mb-1">¿Qué sigue?</h3>
                                    <p className="text-sm text-blue-800">
                                        Nuestro equipo revisará su solicitud y le enviará una cotización personalizada
                                        a su correo electrónico en un plazo de 24-48 horas.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Button asChild variant="default" className="w-full" size="lg">
                                <a href="/">Volver a la Tienda</a>
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="mb-8 text-muted-foreground">
                            Tu orden ha sido creada exitosamente. Procede al pago para completar tu compra.
                        </p>

                        <div className="space-y-3">
                            <Button
                                onClick={handleProceedToPayment}
                                className="w-full"
                                size="lg"
                                disabled={!orderId || redirecting}
                            >
                                {redirecting ? "Redirigiendo..." : "Proceder al Pago"}
                            </Button>

                            <Button asChild variant="outline" className="w-full">
                                <a href="/">Volver a la Tienda</a>
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

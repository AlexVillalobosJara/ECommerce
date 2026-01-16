"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/storefront/header"
import { Footer } from "@/components/storefront/footer"
import { useTenant } from "@/contexts/TenantContext"
import { storefrontApi } from "@/services/storefront-api"
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { Suspense } from "react"

function PaymentCallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { tenant } = useTenant()
    const [status, setStatus] = useState<"loading" | "success" | "error" | "pending">("loading")
    const [paymentInfo, setPaymentInfo] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                // Get order ID from URL (Flow redirects with this parameter)
                const orderId = searchParams.get("order") || searchParams.get("order_id")
                const tenantSlug = tenant?.slug || searchParams.get("tenant") || "demo-store"

                console.log("Callback parameters:", { orderId, tenantSlug })

                if (!orderId) {
                    console.error("No order ID found in URL")
                    setError("No se encontró el ID de la orden")
                    setStatus("error")
                    return
                }

                // Poll for payment status (webhook should update it)
                let attempts = 0
                const maxAttempts = 15 // 30 seconds total (15 * 2s)

                const pollPaymentStatus = async () => {
                    attempts++
                    console.log(`Polling attempt ${attempts}/${maxAttempts}`)

                    try {
                        const paymentStatus = await storefrontApi.getPaymentStatus(tenantSlug, orderId)
                        console.log("Payment status:", paymentStatus)

                        setPaymentInfo(paymentStatus)

                        // Check if payment is completed or failed
                        if (paymentStatus.payment_status === "Completed" || paymentStatus.payment_status === "completed") {
                            setStatus("success")
                            return true // Stop polling
                        } else if (paymentStatus.payment_status === "Failed" || paymentStatus.payment_status === "failed") {
                            setStatus("error")
                            setError("El pago fue rechazado")
                            return true // Stop polling
                        } else if (paymentStatus.payment_status === "Cancelled" || paymentStatus.payment_status === "cancelled") {
                            setStatus("error")
                            setError("El pago fue cancelado")
                            return true // Stop polling
                        } else if (attempts >= maxAttempts) {
                            // Timeout - show pending state
                            setStatus("pending")
                            return true // Stop polling
                        }

                        // Still pending, continue polling
                        return false
                    } catch (err) {
                        console.error("Error checking payment status:", err)

                        if (attempts >= maxAttempts) {
                            setError("No se pudo verificar el estado del pago")
                            setStatus("error")
                            return true // Stop polling
                        }

                        return false // Continue polling
                    }
                }

                // Initial check
                const shouldStop = await pollPaymentStatus()

                if (!shouldStop) {
                    // Set up polling interval
                    const pollInterval = setInterval(async () => {
                        const stop = await pollPaymentStatus()
                        if (stop) {
                            clearInterval(pollInterval)
                        }
                    }, 2000) // Poll every 2 seconds

                    // Cleanup on unmount
                    return () => clearInterval(pollInterval)
                }
            } catch (err) {
                console.error("Error verifying payment:", err)
                setError(err instanceof Error ? err.message : "Error al verificar el pago")
                setStatus("error")
            }
        }

        verifyPayment()
    }, [searchParams, tenant])

    const handleContinue = () => {
        if (status === "success" && paymentInfo) {
            router.push(`/payment/success?order=${paymentInfo.order_number}&id=${paymentInfo.order_id}&tenant=${tenant?.slug}`)
        } else {
            router.push("/")
        }
    }

    const handleRetry = () => {
        if (paymentInfo) {
            router.push(`/payment?order_id=${paymentInfo.order_id}`)
        }
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Header categories={[]} />

            <main className="flex-1 bg-secondary/30">
                <div className="container mx-auto px-4 py-12 lg:py-16">
                    <div className="mx-auto max-w-2xl">
                        <Card className="border-border bg-white p-8 lg:p-12">
                            <div className="text-center">
                                {status === "loading" && (
                                    <>
                                        <Loader2 className="mx-auto h-16 w-16 animate-spin text-primary" />
                                        <h1 className="mt-6 font-serif text-3xl font-normal">
                                            Verificando Pago
                                        </h1>
                                        <p className="mt-4 text-muted-foreground">
                                            Por favor espera mientras verificamos tu pago...
                                        </p>
                                    </>
                                )}

                                {status === "success" && (
                                    <>
                                        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
                                        <h1 className="mt-6 font-serif text-3xl font-normal text-green-700">
                                            ¡Pago Exitoso!
                                        </h1>
                                        <p className="mt-4 text-muted-foreground">
                                            Tu pago ha sido procesado correctamente.
                                        </p>
                                        {paymentInfo && (
                                            <div className="mt-6 space-y-2 text-sm">
                                                <p>
                                                    <strong>Orden:</strong> {paymentInfo.order_number}
                                                </p>
                                                <p>
                                                    <strong>Monto:</strong> ${parseFloat(paymentInfo.amount).toLocaleString("es-CL")}
                                                </p>
                                                <p>
                                                    <strong>Método:</strong> {paymentInfo.payment_gateway}
                                                </p>
                                            </div>
                                        )}
                                        <Button
                                            onClick={handleContinue}
                                            size="lg"
                                            className="mt-8"
                                        >
                                            Ver Detalles de la Orden
                                        </Button>
                                    </>
                                )}

                                {status === "error" && (
                                    <>
                                        <XCircle className="mx-auto h-16 w-16 text-red-500" />
                                        <h1 className="mt-6 font-serif text-3xl font-normal text-red-700">
                                            Pago Fallido
                                        </h1>
                                        <p className="mt-4 text-muted-foreground">
                                            {error || "Hubo un problema al procesar tu pago."}
                                        </p>
                                        <div className="mt-8 flex gap-4 justify-center">
                                            <Button
                                                onClick={handleRetry}
                                                variant="outline"
                                                size="lg"
                                            >
                                                Intentar Nuevamente
                                            </Button>
                                            <Button
                                                onClick={() => router.push("/")}
                                                size="lg"
                                                className=""
                                            >
                                                Volver al Inicio
                                            </Button>
                                        </div>
                                    </>
                                )}

                                {status === "pending" && (
                                    <>
                                        <AlertCircle className="mx-auto h-16 w-16 text-yellow-500" />
                                        <h1 className="mt-6 font-serif text-3xl font-normal text-yellow-700">
                                            Pago Pendiente
                                        </h1>
                                        <p className="mt-4 text-muted-foreground">
                                            Tu pago está siendo procesado. Esto puede tomar unos minutos.
                                        </p>
                                        {paymentInfo && (
                                            <div className="mt-6 space-y-2 text-sm">
                                                <p>
                                                    <strong>Orden:</strong> {paymentInfo.order_number}
                                                </p>
                                                <p>
                                                    <strong>Estado:</strong> {paymentInfo.payment_status}
                                                </p>
                                            </div>
                                        )}
                                        <Button
                                            onClick={handleContinue}
                                            size="lg"
                                            className="mt-8"
                                        >
                                            Volver al Inicio
                                        </Button>
                                    </>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default function PaymentCallbackPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <PaymentCallbackContent />
        </Suspense>
    )
}

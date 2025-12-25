"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle, Package, Truck, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useCart } from "@/hooks/useCart"
import Link from "next/link"

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams()
    const { clearCart } = useCart()
    const [orderNumber, setOrderNumber] = useState<string | null>(null)
    const hasCleared = useRef(false)

    useEffect(() => {
        setOrderNumber(searchParams.get("order"))
        // Clear cart only once after successful payment
        if (!hasCleared.current) {
            clearCart()
            hasCleared.current = true
        }
    }, [searchParams, clearCart])

    return (
        <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
            <Card className="w-full max-w-2xl border-border bg-white p-8 lg:p-12">
                <div className="text-center">
                    {/* Success Icon */}
                    <div className="mb-6 flex justify-center">
                        <div className="rounded-full bg-green-100 p-6">
                            <CheckCircle className="size-16 text-green-600" />
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="mb-4 font-serif text-3xl font-normal tracking-tight lg:text-4xl">
                        ¡Pago Exitoso!
                    </h1>

                    {/* Order Number */}
                    {orderNumber && (
                        <p className="mb-2 text-lg text-muted-foreground">
                            Orden: <span className="font-semibold text-foreground">#{orderNumber}</span>
                        </p>
                    )}

                    <p className="mb-8 text-muted-foreground">
                        Tu pago ha sido procesado exitosamente. Recibirás un email de confirmación con los
                        detalles de tu orden.
                    </p>

                    {/* Next Steps */}
                    <div className="mb-8 rounded-lg bg-secondary p-6 text-left">
                        <h2 className="mb-4 font-serif text-xl font-normal">Próximos Pasos</h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Package className="mt-1 size-5 flex-shrink-0 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Preparación del Pedido</p>
                                    <p className="text-sm text-muted-foreground">
                                        Estamos preparando tu pedido para el envío
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Truck className="mt-1 size-5 flex-shrink-0 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Envío</p>
                                    <p className="text-sm text-muted-foreground">
                                        Te notificaremos cuando tu pedido sea enviado
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Home className="mt-1 size-5 flex-shrink-0 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Entrega</p>
                                    <p className="text-sm text-muted-foreground">
                                        Recibirás tu pedido en la dirección indicada
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Button asChild size="lg" className="bg-foreground text-background hover:bg-foreground/90">
                            <Link href="/">Volver a la Tienda</Link>
                        </Button>
                    </div>

                    {/* Support */}
                    <p className="mt-8 text-xs text-muted-foreground">
                        ¿Necesitas ayuda? Contáctanos a{" "}
                        <a href="mailto:soporte@example.com" className="underline">
                            soporte@example.com
                        </a>
                    </p>
                </div>
            </Card>
        </div>
    )
}

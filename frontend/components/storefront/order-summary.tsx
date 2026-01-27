"use client"

import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getAbsoluteMediaUrl } from "@/lib/media-utils"
import { useTenant } from "@/contexts/TenantContext"
import { formatPrice } from "@/lib/format-price"
import type { CartItem } from "@/types/product"

interface OrderSummaryProps {
    purchaseItems: CartItem[]
    quoteItems: CartItem[]
    subtotal: number
    shipping: number
    tax: number
    discount?: number
    total: number
}

export function OrderSummary({ purchaseItems, quoteItems, subtotal, shipping, tax, discount = 0, total }: OrderSummaryProps) {
    const { tenant } = useTenant()
    const hasQuoteItems = quoteItems.length > 0
    const allItems = [...purchaseItems, ...quoteItems]

    const format = (price: number) => {
        return formatPrice(price, tenant)
    }

    return (
        <Card className="sticky top-24 border-border bg-white p-6 lg:p-8">
            <h2 className="mb-6 font-serif text-2xl font-normal tracking-tight">Resumen del Pedido</h2>

            {/* Order Items */}
            <div className="space-y-4">
                {allItems.map((item) => {
                    const isQuote = quoteItems.some(q => q.variant.id === item.variant.id)
                    const itemPrice = parseFloat(item.variant.selling_price || "0")

                    return (
                        <div key={item.variant.id} className="flex gap-4">
                            <div className="relative size-20 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-secondary">
                                <img
                                    src={getAbsoluteMediaUrl(item.product.primary_image) || "/placeholder.svg"}
                                    alt={item.product.name}
                                    className="size-full object-cover"
                                />
                                {item.quantity > 1 && (
                                    <div className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-foreground text-xs text-background">
                                        {item.quantity}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-1 flex-col justify-between">
                                <div>
                                    <h3 className="text-sm font-medium leading-tight text-foreground">{item.product.name}</h3>
                                    {item.variant.name && (
                                        <p className="mt-1 text-xs text-muted-foreground">{item.variant.name}</p>
                                    )}
                                    {isQuote && (
                                        <span className="mt-1 inline-block text-xs text-muted-foreground">Precio bajo cotización</span>
                                    )}
                                </div>
                                <p className="text-sm font-medium text-foreground">
                                    {isQuote ? (
                                        <span className="text-muted-foreground">Cotizar</span>
                                    ) : (
                                        format(itemPrice * item.quantity)
                                    )}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>

            <Separator className="my-6" />

            {/* Pricing Breakdown */}
            {purchaseItems.length > 0 && (
                <>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-medium text-foreground">{format(subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Envío</span>
                            <span className="font-medium text-foreground">
                                {shipping === 0 ? "Gratis" : format(shipping)}
                            </span>
                        </div>
                        {discount > 0 && (
                            <div className="flex items-center justify-between text-sm text-green-600">
                                <span>Descuento</span>
                                <span className="font-medium">-{format(discount)}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                {tenant?.prices_include_tax ? "IVA (Incluido)" : `IVA (${tenant?.tax_rate || 19}%)`}
                            </span>
                            <span className="font-medium text-foreground">{format(tax)}</span>
                        </div>
                    </div>

                    <Separator className="my-6" />

                    {/* Total */}
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-serif text-lg font-normal">Total</span>
                            {tenant?.prices_include_tax && (
                                <p className="text-[10px] text-muted-foreground mt-0.5">(IVA incluido)</p>
                            )}
                        </div>
                        <span className="font-serif text-2xl font-normal text-foreground">{format(total)}</span>
                    </div>
                </>
            )}

            {/* Quote Notice */}
            {hasQuoteItems && (
                <div className="mt-6 rounded-lg bg-secondary p-4">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                        * Su pedido incluye productos bajo cotización. Nos pondremos en contacto para proporcionarle el precio final
                        antes de procesar el pago.
                    </p>
                </div>
            )}

            {/* Security Notice */}
            <div className="mt-6 text-center">
                <p className="text-xs text-muted-foreground">Pago seguro y protegido</p>
            </div>
        </Card>
    )
}

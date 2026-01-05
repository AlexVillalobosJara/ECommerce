"use client"

import { X, Minus, Plus, ShoppingBag } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useTenant } from "@/contexts/TenantContext"
import { formatPrice } from "@/lib/format-price"
import type { CartItem } from "@/types/product"

interface CartDrawerProps {
    open: boolean
    onClose: () => void
    purchaseItems: CartItem[]
    quoteItems: CartItem[]
    onUpdateQuantity: (variantId: string, quantity: number) => void
    onRemove: (variantId: string) => void
    onCheckout: () => void
}

export function CartDrawer({
    open,
    onClose,
    purchaseItems,
    quoteItems,
    onUpdateQuantity,
    onRemove,
    onCheckout,
}: CartDrawerProps) {
    const { tenant } = useTenant()

    const format = (price: string | null) => {
        return formatPrice(price, tenant)
    }

    const calculateSubtotal = () => {
        return purchaseItems.reduce((total, item) => {
            const price = parseFloat(item.variant.selling_price || "0")
            return total + price * item.quantity
        }, 0)
    }

    const totalItems = purchaseItems.length + quoteItems.length

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="flex w-full flex-col sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <ShoppingBag className="size-5" />
                        Carrito ({totalItems})
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-6">
                    {totalItems === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-center">
                            <ShoppingBag className="mb-4 size-12 text-muted-foreground" />
                            <p className="text-lg font-medium">Tu carrito está vacío</p>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Agrega productos para comenzar
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Purchase Items */}
                            {purchaseItems.length > 0 && (
                                <div>
                                    <h3 className="mb-4 text-sm font-semibold uppercase text-muted-foreground">
                                        Para Compra
                                    </h3>
                                    <div className="space-y-4">
                                        {purchaseItems.map((item) => (
                                            <CartItemCard
                                                key={item.variant.id}
                                                item={item}
                                                onUpdateQuantity={onUpdateQuantity}
                                                onRemove={onRemove}
                                                formatPrice={format}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quote Items */}
                            {quoteItems.length > 0 && (
                                <div>
                                    <h3 className="mb-4 text-sm font-semibold uppercase text-muted-foreground">
                                        Para Cotización
                                    </h3>
                                    <div className="space-y-4">
                                        {quoteItems.map((item) => (
                                            <CartItemCard
                                                key={item.variant.id}
                                                item={item}
                                                onUpdateQuantity={onUpdateQuantity}
                                                onRemove={onRemove}
                                                formatPrice={format}
                                                isQuote
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {totalItems > 0 && (
                    <div className="border-t pt-4">
                        {purchaseItems.length > 0 && (
                            <div className="mb-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-medium">{format(calculateSubtotal().toString())}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Envío e impuestos calculados al finalizar {(!tenant?.prices_include_tax && tenant?.tax_rate) ? "(Valores Netos)" : ""}
                                </p>
                            </div>
                        )}

                        <Button onClick={onCheckout} className="w-full" size="lg">
                            Ir al Checkout
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}

interface CartItemCardProps {
    item: CartItem
    onUpdateQuantity: (variantId: string, quantity: number) => void
    onRemove: (variantId: string) => void
    formatPrice: (price: string | null) => string
    isQuote?: boolean
}

function CartItemCard({ item, onUpdateQuantity, onRemove, formatPrice, isQuote }: CartItemCardProps) {
    return (
        <div className="flex gap-4">
            {/* Image */}
            <div className="size-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                <img
                    src={item.product.primary_image
                        ? (item.product.primary_image.startsWith('http')
                            ? item.product.primary_image
                            : `http://localhost:8000${item.product.primary_image}`)
                        : "/placeholder.svg"}
                    alt={item.product.name}
                    className="size-full object-cover"
                />
            </div>

            {/* Details */}
            <div className="flex flex-1 flex-col">
                <div className="flex justify-between">
                    <div className="flex-1">
                        <h4 className="text-sm font-medium">{item.product.name}</h4>
                        {item.variant.name && (
                            <p className="mt-1 text-xs text-muted-foreground">{item.variant.name}</p>
                        )}
                        {Object.keys(item.variant.attributes).length > 0 && (
                            <p className="mt-1 text-xs text-muted-foreground">
                                {Object.entries(item.variant.attributes)
                                    .map(([key, value]) => `${key}: ${value}`)
                                    .join(", ")}
                            </p>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => {
                            onRemove(item.variant.id)
                            toast.success("Producto eliminado del carrito")
                        }}
                    >
                        <X className="size-4" />
                    </Button>
                </div>

                <div className="mt-2 flex items-center justify-between">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() => onUpdateQuantity(item.variant.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                        >
                            <Minus className="size-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() => onUpdateQuantity(item.variant.id, item.quantity + 1)}
                        >
                            <Plus className="size-3" />
                        </Button>
                    </div>

                    {/* Price */}
                    <div className="text-sm font-medium">
                        {isQuote ? (
                            <span className="text-muted-foreground">Cotizar</span>
                        ) : (
                            <div className="flex flex-col items-end">
                                {item.variant.has_discount && item.variant.original_price && (
                                    <span className="text-xs text-muted-foreground line-through">
                                        {formatPrice(item.variant.original_price)}
                                    </span>
                                )}
                                <span>{formatPrice(item.variant.selling_price)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

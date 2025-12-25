"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DollarSign, Send, AlertCircle, Package } from "lucide-react"
import { toast } from "sonner"
import { respondToQuote } from "@/services/adminOrderService"
import { getAbsoluteMediaUrl } from "@/lib/media-utils"
import type { AdminOrder } from "@/types/admin"

interface QuoteResponseSheetProps {
    isOpen: boolean
    onClose: () => void
    order: AdminOrder
    onSuccess: () => void
}

export function QuoteResponseSheet({ isOpen, onClose, order, onSuccess }: QuoteResponseSheetProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [itemPrices, setItemPrices] = useState<Record<string, string>>({})
    const [validUntil, setValidUntil] = useState("")
    const [notes, setNotes] = useState("")

    const handleItemPriceChange = (itemId: string, price: string) => {
        setItemPrices({ ...itemPrices, [itemId]: price })
    }

    const calculateTotals = () => {
        let subtotal = 0
        order.items.forEach((item) => {
            const price = Number.parseFloat(itemPrices[item.id] || "0")
            subtotal += price * item.quantity
        })

        const tax = subtotal * 0.19 // 19% IVA
        const total = subtotal + tax + Number(order.shipping_cost || 0)

        return { subtotal, tax, total }
    }

    const totals = calculateTotals()
    const allPricesFilled = order.items.every(
        (item) => itemPrices[item.id] && Number.parseFloat(itemPrices[item.id]) > 0
    )

    const handleSave = async () => {
        if (!allPricesFilled) {
            toast.error("Por favor ingresa precios para todos los productos")
            return
        }

        if (!validUntil) {
            toast.error("Por favor selecciona una fecha de validez")
            return
        }

        setIsSaving(true)

        try {
            await respondToQuote(order.id, {
                quote_items: itemPrices,
                quote_valid_until: validUntil,
                internal_notes: notes,
            })

            toast.success("Cotización enviada exitosamente")
            onSuccess()
            onClose()
        } catch (error) {
            console.error("Error responding to quote:", error)
            toast.error("Error al enviar cotización")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Responder Cotización
                    </SheetTitle>
                    <SheetDescription>Establece precios y envía la cotización al cliente</SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Alert */}
                    <Alert className="bg-amber-50 border-amber-200">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                            Una vez enviada la cotización, el cliente recibirá un email con los precios.
                        </AlertDescription>
                    </Alert>

                    {/* Items Pricing */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Precios de Productos</h3>
                        {order.items.map((item) => (
                            <Card key={item.id} className="shadow-sm">
                                <CardContent className="p-4">
                                    <div className="flex gap-4">
                                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                            {item.product_image_url ? (
                                                <img
                                                    src={getAbsoluteMediaUrl(item.product_image_url) || ''}
                                                    alt={item.product_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="w-6 h-6 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div>
                                                <h4 className="font-medium text-sm">{item.product_name}</h4>
                                                {item.variant_name && (
                                                    <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                                                )}
                                                <Badge variant="secondary" className="text-xs mt-1">
                                                    Cantidad: {item.quantity}
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label htmlFor={`price-${item.id}`} className="text-xs">
                                                        Precio Unitario
                                                    </Label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                            $
                                                        </span>
                                                        <Input
                                                            id={`price-${item.id}`}
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            placeholder="0.00"
                                                            value={itemPrices[item.id] || ""}
                                                            onChange={(e) => handleItemPriceChange(item.id, e.target.value)}
                                                            className="pl-6"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Total</Label>
                                                    <div className="h-10 flex items-center font-semibold">
                                                        $
                                                        {itemPrices[item.id]
                                                            ? (Number.parseFloat(itemPrices[item.id]) * item.quantity).toFixed(2)
                                                            : "0.00"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Valid Until */}
                    <div className="space-y-2">
                        <Label htmlFor="valid-until">Válido Hasta *</Label>
                        <Input
                            id="valid-until"
                            type="date"
                            value={validUntil}
                            onChange={(e) => setValidUntil(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    {/* Totals Summary */}
                    <Card className="shadow-sm bg-muted/30">
                        <CardContent className="p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Envío</span>
                                <span className="font-medium">${Number(order.shipping_cost || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">IVA (19%)</span>
                                <span className="font-medium">${totals.tax.toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-semibold text-lg">
                                <span>Total</span>
                                <span className="text-primary">${totals.total.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas Adicionales (opcional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Ej: Tiempo de fabricación estimado, condiciones especiales..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={!allPricesFilled || !validUntil || isSaving} className="flex-1 gap-2">
                            <Send className="w-4 h-4" />
                            {isSaving ? "Enviando..." : "Enviar Cotización"}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

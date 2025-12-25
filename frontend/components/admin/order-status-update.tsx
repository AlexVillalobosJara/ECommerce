"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Package, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { updateOrderStatus } from "@/services/adminOrderService"
import type { AdminOrder, OrderStatus } from "@/types/admin"

interface OrderStatusUpdateProps {
    isOpen: boolean
    onClose: () => void
    order: AdminOrder
    onSuccess: () => void
}

const statusOptions: { value: OrderStatus; label: string }[] = [
    { value: "Draft", label: "Borrador" },
    { value: "PendingPayment", label: "Pendiente Pago" },
    { value: "Paid", label: "Pagado" },
    { value: "QuoteRequested", label: "Cotización Solicitada" },
    { value: "QuoteSent", label: "Cotización Enviada" },
    { value: "QuoteApproved", label: "Cotización Aprobada" },
    { value: "Processing", label: "En Preparación" },
    { value: "Shipped", label: "Despachado" },
    { value: "Delivered", label: "Entregado" },
    { value: "Cancelled", label: "Cancelado" },
    { value: "Refunded", label: "Reembolsado" },
]

export function OrderStatusUpdate({ isOpen, onClose, order, onSuccess }: OrderStatusUpdateProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [newStatus, setNewStatus] = useState<OrderStatus>(order.status)
    const [notes, setNotes] = useState("")

    const handleSave = async () => {
        try {
            setIsSaving(true)
            await updateOrderStatus(order.id, newStatus, notes)
            toast.success("Estado actualizado correctamente")
            onSuccess()
            onClose()
        } catch (error) {
            console.error('Error updating status:', error)
            toast.error("Error al actualizar estado")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-full sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Actualizar Estado del Pedido
                    </SheetTitle>
                    <SheetDescription>Cambia el estado y agrega notas internas</SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Current Status */}
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Estado Actual</Label>
                        <Badge variant="secondary" className="text-sm">
                            {statusOptions.find((s) => s.value === order.status)?.label}
                        </Badge>
                    </div>

                    {/* New Status */}
                    <div className="space-y-2">
                        <Label htmlFor="status">Nuevo Estado</Label>
                        <Select value={newStatus} onValueChange={(v) => setNewStatus(v as OrderStatus)}>
                            <SelectTrigger id="status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {statusOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Alert for status change */}
                    {newStatus === "Shipped" && (
                        <Alert className="bg-blue-50 border-blue-200">
                            <AlertCircle className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800">
                                El cliente recibirá un email notificando que su pedido ha sido despachado.
                            </AlertDescription>
                        </Alert>
                    )}

                    {newStatus === "Delivered" && (
                        <Alert className="bg-green-50 border-green-200">
                            <AlertCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                El pedido será marcado como completado y el cliente recibirá confirmación de entrega.
                            </AlertDescription>
                        </Alert>
                    )}

                    {newStatus === "Cancelled" && (
                        <Alert className="bg-red-50 border-red-200">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">
                                Esta acción cancelará el pedido. El cliente será notificado.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas Internas (opcional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Agrega notas sobre este cambio de estado..."
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
                        <Button onClick={handleSave} disabled={isSaving || newStatus === order.status} className="flex-1">
                            {isSaving ? "Actualizando..." : "Actualizar Estado"}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

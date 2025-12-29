"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, GripVertical, X } from "lucide-react"

interface ProductVariantsEditorProps {
    variants: any[]
    onChange: (variants: any[]) => void
    isQuoteOnly: boolean
    basePrice: string
}

export function ProductVariantsEditor({ variants, onChange, isQuoteOnly, basePrice }: ProductVariantsEditorProps) {
    const [showVariants, setShowVariants] = useState(variants.length > 0)

    const addVariant = () => {
        const newVariant = {
            id: `temp-${Date.now()}`,
            sku: `VAR-${Date.now()}`, // Auto-generate SKU
            name: "",
            price_adjustment: "0",
            stock_quantity: "0",
            attributes: {} as Record<string, string>,
            is_default: variants.length === 0,
        }
        onChange([...variants, newVariant])
        setShowVariants(true)
    }

    const removeVariant = (index: number) => {
        onChange(variants.filter((_, i) => i !== index))
    }

    const updateVariant = (index: number, updates: any) => {
        const updated = [...variants]
        updated[index] = { ...updated[index], ...updates }
        onChange(updated)
    }

    const addAttribute = (variantIndex: number, key: string, value: string) => {
        if (!key || !value) return
        const updated = [...variants]
        updated[variantIndex].attributes = {
            ...updated[variantIndex].attributes,
            [key]: value,
        }
        onChange(updated)
    }

    const removeAttribute = (variantIndex: number, key: string) => {
        const updated = [...variants]
        const newAttributes = { ...updated[variantIndex].attributes }
        delete newAttributes[key]
        updated[variantIndex].attributes = newAttributes
        onChange(updated)
    }

    const [newAttributeKey, setNewAttributeKey] = useState<Record<number, string>>({})
    const [newAttributeValue, setNewAttributeValue] = useState<Record<number, string>>({})

    const handleAddAttribute = (variantIndex: number) => {
        const key = newAttributeKey[variantIndex]
        const value = newAttributeValue[variantIndex]
        if (key && value) {
            addAttribute(variantIndex, key, value)
            setNewAttributeKey({ ...newAttributeKey, [variantIndex]: "" })
            setNewAttributeValue({ ...newAttributeValue, [variantIndex]: "" })
        }
    }

    return (
        <Card className="shadow-sm">
            <CardContent className="pt-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Variantes del Producto</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                {variants.length} {variants.length === 1 ? "variante" : "variantes"}
                            </p>
                        </div>
                        <Button onClick={addVariant} size="sm" className="gap-2">
                            <Plus className="w-4 h-4" />
                            Nueva Variante
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {variants.map((variant, index) => (
                            <div key={variant.id} className="p-4 rounded-lg border border-border bg-background space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                                        <div className="flex-1 grid grid-cols-3 gap-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Nombre de Variante</Label>
                                                <Input
                                                    value={variant.name}
                                                    onChange={(e) => updateVariant(index, { name: e.target.value })}
                                                    placeholder="Ej: Pequeño - Rojo"
                                                    className="h-9"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">SKU *</Label>
                                                <Input
                                                    value={variant.sku}
                                                    onChange={(e) => updateVariant(index, { sku: e.target.value })}
                                                    placeholder="VAR-001"
                                                    className={`h-9 font-mono ${!variant.sku || variant.sku.trim() === '' ? 'border-red-500' : ''}`}
                                                />
                                                {(!variant.sku || variant.sku.trim() === '') && (
                                                    <p className="text-xs text-red-500">El SKU es obligatorio</p>
                                                )}
                                            </div>
                                            {!isQuoteOnly && (
                                                <>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs">Precio</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={variant.price || ''}
                                                            onChange={(e) => updateVariant(index, { price: e.target.value })}
                                                            placeholder="0.00"
                                                            className="h-9"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs">Precio con Descuento</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={variant.compare_at_price || ''}
                                                            onChange={(e) => updateVariant(index, { compare_at_price: e.target.value })}
                                                            placeholder="0.00"
                                                            className="h-9"
                                                        />
                                                        <p className="text-xs text-muted-foreground">Precio original antes del descuento (se mostrará tachado)</p>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs">Stock</Label>
                                                        <Input
                                                            type="number"
                                                            value={variant.stock_quantity || ''}
                                                            onChange={(e) => updateVariant(index, { stock_quantity: e.target.value })}
                                                            placeholder="0"
                                                            className="h-9"
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeVariant(index)}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Attributes Section */}
                                <div className="space-y-2">
                                    <Label className="text-xs">Atributos</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(variant.attributes || {}).map(([key, value]) => (
                                            <Badge key={key} variant="secondary" className="gap-1">
                                                <span className="font-medium">{key}:</span> {value as string}
                                                <button
                                                    onClick={() => removeAttribute(index, key)}
                                                    className="ml-1 hover:text-destructive"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Clave (ej: Color)"
                                            value={newAttributeKey[index] || ""}
                                            onChange={(e) => setNewAttributeKey({ ...newAttributeKey, [index]: e.target.value })}
                                            className="h-8 text-sm"
                                        />
                                        <Input
                                            placeholder="Valor (ej: Rojo)"
                                            value={newAttributeValue[index] || ""}
                                            onChange={(e) => setNewAttributeValue({ ...newAttributeValue, [index]: e.target.value })}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault()
                                                    handleAddAttribute(index)
                                                }
                                            }}
                                            className="h-8 text-sm"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleAddAttribute(index)}
                                            className="h-8"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

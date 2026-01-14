"use client"

import { useState } from "react"
import { useTenant } from "@/contexts/TenantContext"
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
    const { tenant } = useTenant()
    const [showVariants, setShowVariants] = useState(variants.length > 0)

    const decimalStep = tenant?.decimal_places === 0 ? "1" : (1 / Math.pow(10, tenant?.decimal_places || 2)).toString()

    const formatLocalizedValue = (val: any) => {
        if (val === undefined || val === null || val === '') return ''
        const num = typeof val === 'string' ? parseFloat(val) : val
        if (isNaN(num)) return ''

        const decimalPlaces = tenant?.decimal_places ?? 0
        const thousandsSeparator = tenant?.thousands_separator || "."
        const decimalSeparator = tenant?.decimal_separator || ","

        const parts = num.toFixed(decimalPlaces).split('.')
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator)

        if (decimalPlaces > 0 && parts.length > 1) {
            return parts.join(decimalSeparator)
        }
        return parts[0]
    }

    const parseLocalizedValue = (val: string) => {
        if (!val) return ''
        const thousandsSeparator = tenant?.thousands_separator || "."
        const decimalSeparator = tenant?.decimal_separator || ","

        // Remove thousands separator and replace decimal separator with dot
        const cleaned = val
            .split(thousandsSeparator).join('')
            .replace(decimalSeparator, '.')

        const num = parseFloat(cleaned)
        return isNaN(num) ? '' : num.toString()
    }

    const LocalizedNumericInput = ({ value, onChange, placeholder, className }: any) => {
        const [isFocused, setIsFocused] = useState(false)
        const [localValue, setLocalValue] = useState("")

        // Sync local value when blurred
        const displayValue = isFocused ? localValue : formatLocalizedValue(value)

        const handleFocus = () => {
            setLocalValue(value?.toString() || "")
            setIsFocused(true)
        }

        const handleBlur = () => {
            setIsFocused(false)
            const parsed = parseLocalizedValue(localValue)
            onChange({ target: { value: parsed } })
        }

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value
            // Allow only numbers, decimal separator and thousands separator (if typed by user)
            // But actually while focused we prefer numeric-only or standard decimals
            setLocalValue(val)
        }

        return (
            <Input
                type="text"
                value={displayValue}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder || (tenant?.decimal_separator === ',' ? '0,00' : '0.00')}
                className={className}
            />
        )
    }

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
                                                        <LocalizedNumericInput
                                                            value={variant.price}
                                                            onChange={(e: any) => updateVariant(index, { price: e.target.value })}
                                                            placeholder="0.00"
                                                            className="h-9"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs">Precio con Descuento</Label>
                                                        <LocalizedNumericInput
                                                            value={variant.compare_at_price}
                                                            onChange={(e: any) => updateVariant(index, { compare_at_price: e.target.value })}
                                                            placeholder="0.00"
                                                            className="h-9"
                                                        />
                                                        <p className="text-xs text-muted-foreground">Opcional</p>
                                                    </div>
                                                </>
                                            )}
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Costo ($)</Label>
                                                <LocalizedNumericInput
                                                    value={variant.cost}
                                                    onChange={(e: any) => updateVariant(index, { cost: e.target.value })}
                                                    placeholder="0.00"
                                                    className="h-9"
                                                />
                                                <p className="text-xs text-muted-foreground">Solo para admin (cálculo de utilidades)</p>
                                            </div>
                                            {!isQuoteOnly && (
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs">Stock</Label>
                                                    <LocalizedNumericInput
                                                        value={variant.stock_quantity}
                                                        onChange={(e: any) => updateVariant(index, { stock_quantity: e.target.value })}
                                                        placeholder="0"
                                                        className="h-9"
                                                    />
                                                </div>
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

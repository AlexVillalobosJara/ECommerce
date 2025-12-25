"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import type { AdminProductVariant, VariantFormData } from "@/types/admin"

interface VariantManagerProps {
    productId?: string
    variants: AdminProductVariant[]
    onVariantsChange: (variants: AdminProductVariant[]) => void
}

export function VariantManager({ productId, variants, onVariantsChange }: VariantManagerProps) {
    const [editingVariants, setEditingVariants] = useState<Partial<VariantFormData>[]>(
        variants.length > 0 ? variants : [getEmptyVariant()]
    )

    function getEmptyVariant(): Partial<VariantFormData> {
        return {
            sku: "",
            name: "",
            price: undefined,
            stock_quantity: 0,
            is_active: true,
            is_default: variants.length === 0,
            attributes: {}
        }
    }

    const handleAddVariant = () => {
        setEditingVariants([...editingVariants, getEmptyVariant()])
    }

    const handleRemoveVariant = (index: number) => {
        const newVariants = editingVariants.filter((_, i) => i !== index)
        setEditingVariants(newVariants.length > 0 ? newVariants : [getEmptyVariant()])
    }

    const handleVariantChange = (index: number, field: string, value: any) => {
        const newVariants = [...editingVariants]
        newVariants[index] = { ...newVariants[index], [field]: value }
        setEditingVariants(newVariants)
    }

    return (
        <div className="space-y-4">
            {editingVariants.map((variant, index) => (
                <Card key={index} className="p-4">
                    <div className="flex items-start justify-between mb-4">
                        <h4 className="font-medium">Variant {index + 1}</h4>
                        {editingVariants.length > 1 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveVariant(index)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor={`sku-${index}`}>SKU *</Label>
                            <Input
                                id={`sku-${index}`}
                                value={variant.sku || ""}
                                onChange={(e) => handleVariantChange(index, "sku", e.target.value)}
                                placeholder="PROD-001"
                            />
                        </div>

                        <div>
                            <Label htmlFor={`name-${index}`}>Variant Name</Label>
                            <Input
                                id={`name-${index}`}
                                value={variant.name || ""}
                                onChange={(e) => handleVariantChange(index, "name", e.target.value)}
                                placeholder="e.g., Medium, Red"
                            />
                        </div>

                        <div>
                            <Label htmlFor={`price-${index}`}>Price</Label>
                            <Input
                                id={`price-${index}`}
                                type="number"
                                value={variant.price || ""}
                                onChange={(e) => handleVariantChange(index, "price", parseFloat(e.target.value) || undefined)}
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <Label htmlFor={`stock-${index}`}>Stock Quantity</Label>
                            <Input
                                id={`stock-${index}`}
                                type="number"
                                value={variant.stock_quantity || 0}
                                onChange={(e) => handleVariantChange(index, "stock_quantity", parseInt(e.target.value) || 0)}
                                placeholder="0"
                            />
                        </div>
                    </div>
                </Card>
            ))}

            <Button
                variant="outline"
                onClick={handleAddVariant}
                className="w-full"
            >
                <Plus className="w-4 h-4 mr-2" />
                Add Variant
            </Button>
        </div>
    )
}

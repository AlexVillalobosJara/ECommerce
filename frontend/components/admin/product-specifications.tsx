"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import type { ProductFormData } from "@/types/admin"

interface ProductSpecificationsProps {
    data: ProductFormData
    onChange: (updates: Partial<ProductFormData>) => void
}

export function ProductSpecifications({ data, onChange }: ProductSpecificationsProps) {
    // Local state array for easier editing {key, value}
    const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>([])

    // Initialize from data.specifications map
    useEffect(() => {
        if (data.specifications) {
            const initialSpecs = Object.entries(data.specifications).map(([key, value]) => ({
                key,
                value
            }))

            // Check if incoming data is effectively same as what we have (ignoring empty/draft rows)
            // This prevents the effect from nuking a new empty row when the parent updates
            const currentValidSpecs = specs.filter(s => s.key.trim() !== "")

            // Simple comparison of valid entries
            const isSynced =
                currentValidSpecs.length === initialSpecs.length &&
                currentValidSpecs.every((s, i) =>
                    s.key === initialSpecs[i].key && s.value === initialSpecs[i].value
                )

            if (!isSynced) {
                setSpecs(initialSpecs)
            }
        }
    }, [data.specifications, specs]) // Depend on specs for comparison

    const handleAddSpec = () => {
        const newSpecs = [...specs, { key: "", value: "" }]
        updateSpecs(newSpecs)
    }

    const handleRemoveSpec = (index: number) => {
        const newSpecs = specs.filter((_, i) => i !== index)
        updateSpecs(newSpecs)
    }

    const handleChange = (index: number, field: 'key' | 'value', text: string) => {
        const newSpecs = [...specs]
        newSpecs[index] = { ...newSpecs[index], [field]: text }
        updateSpecs(newSpecs)
    }

    const updateSpecs = (newSpecs: Array<{ key: string; value: string }>) => {
        setSpecs(newSpecs)

        // Convert back to Record<string, string> for parent
        const specRecord: Record<string, string> = {}
        newSpecs.forEach(item => {
            if (item.key.trim()) {
                specRecord[item.key.trim()] = item.value
            }
        })

        onChange({ specifications: specRecord })
    }

    return (
        <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Ficha Técnica</h3>
            <div className="space-y-4">
                <div className="space-y-2">
                    {specs.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">No hay especificaciones agregadas.</p>
                    )}
                    {specs.map((spec, index) => (
                        <div key={index} className="flex gap-2 items-center">
                            <Input
                                placeholder="Propiedad (Ej: Material)"
                                value={spec.key}
                                onChange={(e) => handleChange(index, 'key', e.target.value)}
                                className="flex-1"
                            />
                            <Input
                                placeholder="Valor (Ej: Acero Inoxidable)"
                                value={spec.value}
                                onChange={(e) => handleChange(index, 'value', e.target.value)}
                                className="flex-1"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveSpec(index)}
                                className="text-destructive hover:text-destructive/90"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>

                <Button onClick={handleAddSpec} variant="outline" size="sm" className="w-full mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Especificación
                </Button>
            </div>
        </Card>
    )
}

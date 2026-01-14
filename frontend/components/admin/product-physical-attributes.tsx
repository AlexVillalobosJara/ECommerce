"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Package } from "lucide-react"
import { useTenant } from "@/contexts/TenantContext"
import { useState } from "react"

interface ProductPhysicalAttributesProps {
    data: any
    onChange: (updates: any) => void
}

export function ProductPhysicalAttributes({ data, onChange }: ProductPhysicalAttributesProps) {
    const { tenant } = useTenant()

    const formatLocalizedValue = (val: any) => {
        if (val === undefined || val === null || val === '') return ''
        const num = typeof val === 'string' ? parseFloat(val) : val
        if (isNaN(num)) return ''

        const decimalPlaces = 3 // Standard for kg/cm
        const thousandsSeparator = tenant?.thousands_separator || "."
        const decimalSeparator = tenant?.decimal_separator || ","

        const parts = num.toFixed(decimalPlaces).split('.')
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator)

        if (decimalPlaces > 0 && parts.length > 1) {
            // Remove trailing zeros for a cleaner look in dimensions
            const cleanDecimals = parts[1].replace(/0+$/, '')
            if (cleanDecimals === '') return parts[0]
            return `${parts[0]}${decimalSeparator}${cleanDecimals}`
        }
        return parts[0]
    }

    const parseLocalizedValue = (val: string) => {
        if (!val) return ''
        const thousandsSeparator = tenant?.thousands_separator || "."
        const decimalSeparator = tenant?.decimal_separator || ","

        const cleaned = val
            .split(thousandsSeparator).join('')
            .replace(decimalSeparator, '.')

        const num = parseFloat(cleaned)
        return isNaN(num) ? '' : num.toString()
    }

    const LocalizedNumericInput = ({ value, onChange, placeholder, className, id }: any) => {
        const [isFocused, setIsFocused] = useState(false)
        const [localValue, setLocalValue] = useState("")

        const displayValue = isFocused ? localValue : formatLocalizedValue(value)

        const handleFocus = () => {
            setLocalValue(value?.toString() || "")
            setIsFocused(true)
        }

        const handleBlur = () => {
            setIsFocused(false)
            const parsed = parseLocalizedValue(localValue)
            onChange(parsed)
        }

        return (
            <Input
                id={id}
                type="text"
                value={displayValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder || (tenant?.decimal_separator === ',' ? '0,00' : '0.00')}
                className={className}
            />
        )
    }

    // Calculate volume in cm³
    const calculateVolume = () => {
        const length = parseFloat(data.length_cm) || 0
        const width = parseFloat(data.width_cm) || 0
        const height = parseFloat(data.height_cm) || 0
        return length * width * height
    }

    const volume = calculateVolume()

    return (
        <Card className="shadow-sm">
            <CardContent className="pt-6">
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-lg font-semibold">Atributos Físicos</h2>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="weight_kg">Peso (kg)</Label>
                        <LocalizedNumericInput
                            id="weight_kg"
                            value={data.weight_kg}
                            onChange={(val: string) => onChange({ weight_kg: val })}
                            placeholder="0.000"
                        />
                        <p className="text-xs text-muted-foreground">
                            Peso del producto en kilogramos
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Label>Dimensiones (cm)</Label>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="length_cm" className="text-xs text-muted-foreground">
                                    Largo
                                </Label>
                                <LocalizedNumericInput
                                    id="length_cm"
                                    value={data.length_cm}
                                    onChange={(val: string) => onChange({ length_cm: val })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="width_cm" className="text-xs text-muted-foreground">
                                    Ancho
                                </Label>
                                <LocalizedNumericInput
                                    id="width_cm"
                                    value={data.width_cm}
                                    onChange={(val: string) => onChange({ width_cm: val })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="height_cm" className="text-xs text-muted-foreground">
                                    Alto
                                </Label>
                                <LocalizedNumericInput
                                    id="height_cm"
                                    value={data.height_cm}
                                    onChange={(val: string) => onChange({ height_cm: val })}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        {volume > 0 && (
                            <div className="p-3 rounded-lg bg-muted/50 border border-border">
                                <p className="text-sm">
                                    <span className="font-medium">Volumen calculado:</span>{" "}
                                    <span className="text-muted-foreground">
                                        {formatLocalizedValue(volume)} cm³
                                    </span>
                                </p>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Dimensiones del producto empaquetado para cálculo de envío
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

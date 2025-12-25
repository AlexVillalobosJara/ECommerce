"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { AdminCategory } from "@/types/admin"

interface CategoryTreeSelectProps {
    categories: AdminCategory[]
    value?: string | null
    onChange: (value: string | null) => void
    excludeId?: string // Exclude this category and its children (to prevent loops)
    placeholder?: string
}

export function CategoryTreeSelect({
    categories,
    value,
    onChange,
    excludeId,
    placeholder = "Seleccionar categoría..."
}: CategoryTreeSelectProps) {
    const [flatCategories, setFlatCategories] = useState<Array<AdminCategory & { level: number }>>([])

    // Flatten categories tree for display
    useEffect(() => {
        const flatten = (
            cats: AdminCategory[],
            level = 0,
            excluded = false
        ): Array<AdminCategory & { level: number }> => {
            const result: Array<AdminCategory & { level: number }> = []

            for (const cat of cats) {
                const isExcluded = excluded || cat.id === excludeId

                if (!isExcluded) {
                    result.push({
                        ...cat,
                        level
                    })
                }

                if (cat.children && cat.children.length > 0) {
                    result.push(...flatten(cat.children, level + 1, isExcluded))
                }
            }

            return result
        }

        setFlatCategories(flatten(categories))
    }, [categories, excludeId])

    return (
        <Select
            value={value || "__none__"}
            onValueChange={(val) => onChange(val === "__none__" ? null : val)}
        >
            <SelectTrigger className="w-full">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="__none__">
                    <span className="font-medium">Sin categoría padre (Raíz)</span>
                </SelectItem>
                {flatCategories.map((category) => (
                    <SelectItem
                        key={category.id}
                        value={category.id}
                        disabled={!category.is_active}
                    >
                        <span
                            style={{
                                paddingLeft: `${category.level * 16}px`
                            }}
                            className={cn(
                                "block truncate",
                                !category.is_active && "text-muted-foreground"
                            )}
                        >
                            {category.name}
                            {!category.is_active && " (inactivo)"}
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

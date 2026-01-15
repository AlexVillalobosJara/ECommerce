"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SlidersHorizontal } from "lucide-react"
import type { Category } from "@/types/product"

export interface ProductFilters {
    category?: string
    minPrice?: number
    maxPrice?: number
    inStock?: boolean
    ordering?: string
    search?: string
}

interface ProductFiltersProps {
    categories: Category[]
    filters: ProductFilters
    onFiltersChange: (filters: ProductFilters) => void
    className?: string
    maxPrice?: number
}

export function ProductFiltersSidebar({
    categories,
    filters,
    onFiltersChange,
    className,
    maxPrice = 500000,
}: ProductFiltersProps) {
    const [sortBy, setSortBy] = useState(filters.ordering || "default")
    const [category, setCategory] = useState(filters.category || "all")
    const [priceRange, setPriceRange] = useState<[number, number]>([
        filters.minPrice || 0,
        filters.maxPrice || maxPrice,
    ])
    const [inStock, setInStock] = useState(filters.inStock || false)

    const handleApplyFilters = () => {
        const newFilters: ProductFilters = {}

        if (sortBy !== "default") newFilters.ordering = sortBy
        if (category !== "all") newFilters.category = category
        if (priceRange[0] > 0) newFilters.minPrice = priceRange[0]
        if (priceRange[1] < maxPrice) newFilters.maxPrice = priceRange[1]
        if (inStock) newFilters.inStock = true

        onFiltersChange(newFilters)
    }

    const handleClearFilters = () => {
        setSortBy("default")
        setCategory("all")
        setPriceRange([0, maxPrice])
        setInStock(false)
        onFiltersChange({})
    }

    const hasActiveFilters = sortBy !== "default" || category !== "all" || priceRange[0] > 0 || priceRange[1] < maxPrice || inStock

    const FiltersContent = () => (
        <div className="space-y-8">
            {/* Header with Clear Button */}
            <div className="space-y-4">
                <h3 className="font-serif text-lg font-medium">Filtros</h3>
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                    onClick={handleClearFilters}
                >
                    Limpiar filtros
                </Button>
            </div>

            {/* Sort By */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Ordenar por</Label>
                <RadioGroup value={sortBy} onValueChange={setSortBy}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="default" id="newest" />
                        <Label htmlFor="newest" className="font-normal cursor-pointer">
                            Más recientes
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="price" id="price-asc" />
                        <Label htmlFor="price-asc" className="font-normal cursor-pointer">
                            Precio: menor a mayor
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="-price" id="price-desc" />
                        <Label htmlFor="price-desc" className="font-normal cursor-pointer">
                            Precio: mayor a menor
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="name" id="name" />
                        <Label htmlFor="name" className="font-normal cursor-pointer">
                            Nombre A-Z
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
                <div className="space-y-3">
                    <Label className="text-sm font-medium">Categoría</Label>
                    <RadioGroup value={category} onValueChange={setCategory}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="all" id="cat-all" />
                            <Label htmlFor="cat-all" className="font-normal cursor-pointer">
                                Todas las categorías
                            </Label>
                        </div>
                        {categories.map((cat) => (
                            <div key={cat.id} className="flex items-center space-x-2">
                                <RadioGroupItem value={cat.slug} id={`cat-${cat.slug}`} />
                                <Label htmlFor={`cat-${cat.slug}`} className="font-normal cursor-pointer">
                                    {cat.name}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
            )}

            {/* Price Range Slider */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Rango de precio</Label>
                <div className="space-y-4 pt-2">
                    <Slider
                        min={0}
                        max={maxPrice}
                        step={10000}
                        value={priceRange}
                        onValueChange={(value) => setPriceRange(value as [number, number])}
                        className="w-full"
                    />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>${priceRange[0].toLocaleString("es-CL")}</span>
                        <span>${priceRange[1].toLocaleString("es-CL")}</span>
                    </div>
                </div>
            </div>

            {/* In Stock Filter */}
            <div className="flex items-center space-x-2">
                <Checkbox
                    id="in-stock"
                    checked={inStock}
                    onCheckedChange={(checked: boolean) => setInStock(checked)}
                />
                <Label htmlFor="in-stock" className="font-normal cursor-pointer">
                    Solo productos disponibles
                </Label>
            </div>

            {/* Apply Filters Button */}
            <Button onClick={handleApplyFilters} className="w-full">
                Aplicar filtros
            </Button>
        </div>
    )

    return (
        <>
            {/* Desktop Sidebar */}
            <div className={`hidden lg:block ${className}`}>
                <div className="sticky top-24">
                    <FiltersContent />
                </div>
            </div>

            {/* Mobile Sheet */}
            <div className="lg:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                            <SlidersHorizontal className="size-4" />
                            Filtros
                            {hasActiveFilters && (
                                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                    •
                                </span>
                            )}
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80">
                        <SheetHeader className="px-6">
                            <SheetTitle>Filtros</SheetTitle>
                        </SheetHeader>
                        <ScrollArea className="h-[calc(100vh-8rem)] px-6 mt-6">
                            <div className="pb-8">
                                <FiltersContent />
                            </div>
                        </ScrollArea>
                    </SheetContent>
                </Sheet>
            </div>
        </>
    )
}

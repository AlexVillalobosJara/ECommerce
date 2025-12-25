"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Package, DollarSign, FileText, Settings } from "lucide-react"
import type { AdminProduct, ProductFormData } from "@/types/admin"

interface ProductFormProps {
    product?: AdminProduct | null
    onSubmit: (data: ProductFormData) => void
    onCancel: () => void
    isSubmitting: boolean
}

export function ProductForm({ product, onSubmit, onCancel, isSubmitting }: ProductFormProps) {
    const [formData, setFormData] = useState<ProductFormData>({
        name: "",
        slug: "",
        sku: "",
        barcode: "",
        brand: "",
        category_id: null,
        short_description: "",
        description: "",
        is_quote_only: false,
        manage_stock: true,
        status: "Draft",
        is_featured: false,
    })

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || "",
                slug: product.slug || "",
                sku: product.sku || "",
                barcode: product.barcode || "",
                brand: product.brand || "",
                category_id: product.category_id || null,
                short_description: product.short_description || "",
                description: product.description || "",
                is_quote_only: product.is_quote_only || false,
                manage_stock: product.manage_stock !== undefined ? product.manage_stock : true,
                status: product.status || "Draft",
                is_featured: product.is_featured || false,
            })
        }
    }, [product])

    const handleChange = (field: keyof ProductFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }))

        // Auto-generate slug from name
        if (field === "name" && !product) {
            const slug = value
                .toLowerCase()
                .replace(/[áàäâ]/g, "a")
                .replace(/[éèëê]/g, "e")
                .replace(/[íìïî]/g, "i")
                .replace(/[óòöô]/g, "o")
                .replace(/[úùüû]/g, "u")
                .replace(/ñ/g, "n")
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .replace(/-+/g, "-")
            setFormData((prev) => ({ ...prev, slug }))
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(formData)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card className="shadow-sm">
                <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold mb-4">
                        <Package className="w-4 h-4 text-primary" />
                        Información Básica
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre del Producto *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            placeholder="Ej: Mesa de Roble Moderna"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug (URL)</Label>
                        <Input
                            id="slug"
                            value={formData.slug}
                            onChange={(e) => handleChange("slug", e.target.value)}
                            placeholder="mesa-de-roble-moderna"
                        />
                        <p className="text-xs text-muted-foreground">Se genera automáticamente del nombre</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="sku">SKU *</Label>
                            <Input
                                id="sku"
                                value={formData.sku}
                                onChange={(e) => handleChange("sku", e.target.value)}
                                placeholder="MES-001"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="barcode">Código de Barras</Label>
                            <Input
                                id="barcode"
                                value={formData.barcode}
                                onChange={(e) => handleChange("barcode", e.target.value)}
                                placeholder="7501234567890"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="brand">Marca</Label>
                            <Input
                                id="brand"
                                value={formData.brand}
                                onChange={(e) => handleChange("brand", e.target.value)}
                                placeholder="Nordic Furniture"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Categoría</Label>
                            <Select value={formData.category_id || undefined} onValueChange={(value) => handleChange("category_id", value || null)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar categoría..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {/* Categories will be loaded from API */}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Description */}
            <Card className="shadow-sm">
                <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold mb-4">
                        <FileText className="w-4 h-4 text-primary" />
                        Descripción
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="short_description">Descripción Corta</Label>
                        <Textarea
                            id="short_description"
                            value={formData.short_description}
                            onChange={(e) => handleChange("short_description", e.target.value)}
                            placeholder="Breve descripción del producto"
                            rows={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción Completa</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                            placeholder="Descripción detallada del producto"
                            rows={4}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Pricing & Stock */}
            <Card className="shadow-sm">
                <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold mb-4">
                        <DollarSign className="w-4 h-4 text-primary" />
                        Precio e Inventario
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                        <div className="flex-1">
                            <Label htmlFor="is_quote_only" className="font-medium">
                                Solo Cotización
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">El producto no tiene precio fijo</p>
                        </div>
                        <Switch
                            id="is_quote_only"
                            checked={formData.is_quote_only}
                            onCheckedChange={(checked) => handleChange("is_quote_only", checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                        <div className="flex-1">
                            <Label htmlFor="manage_stock" className="font-medium">
                                Gestionar Inventario
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">Controlar el stock automáticamente</p>
                        </div>
                        <Switch
                            id="manage_stock"
                            checked={formData.manage_stock}
                            onCheckedChange={(checked) => handleChange("manage_stock", checked)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Settings */}
            <Card className="shadow-sm">
                <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold mb-4">
                        <Settings className="w-4 h-4 text-primary" />
                        Configuración
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Estado de Publicación</Label>
                        <Select value={formData.status} onValueChange={(value: any) => handleChange("status", value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Draft">Borrador</SelectItem>
                                <SelectItem value="Published">Publicado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                        <div className="flex-1">
                            <Label htmlFor="is_featured" className="font-medium">
                                Producto Destacado
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">Mostrar en la página principal</p>
                        </div>
                        <Switch
                            id="is_featured"
                            checked={formData.is_featured}
                            onCheckedChange={(checked) => handleChange("is_featured", checked)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="flex-1 bg-transparent"
                >
                    Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? "Guardando..." : product ? "Guardar Cambios" : "Crear Producto"}
                </Button>
            </div>
        </form>
    )
}

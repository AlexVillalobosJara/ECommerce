"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProductBasicInfoProps {
  data: any
  onChange: (updates: any) => void
  categories: Array<{ id: string; name: string }>
}

export function ProductBasicInfo({ data, onChange, categories }: ProductBasicInfoProps) {
  const handleFieldChange = (field: string, value: any) => {
    const updates: any = { [field]: value }

    // Auto-generate slug from name
    if (field === "name") {
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
      updates.slug = slug
    }

    onChange(updates)
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="pt-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Información Básica</h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Producto *</Label>
              <Input
                id="name"
                value={data.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                placeholder="Ej: Mesa de Roble Moderna"
                className="text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={data.sku}
                  onChange={(e) => handleFieldChange("sku", e.target.value)}
                  placeholder="MES-001"
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">Código de Barras</Label>
                <Input
                  id="barcode"
                  value={data.barcode}
                  onChange={(e) => handleFieldChange("barcode", e.target.value)}
                  placeholder="7501234567890"
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  value={data.brand}
                  onChange={(e) => handleFieldChange("brand", e.target.value)}
                  placeholder="Nordic Furniture"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select value={data.category_id || undefined} onValueChange={(value) => handleFieldChange("category_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_description">Descripción Corta</Label>
              <Textarea
                id="short_description"
                value={data.short_description}
                onChange={(e) => handleFieldChange("short_description", e.target.value)}
                placeholder="Breve descripción del producto"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">Máximo 160 caracteres</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción Completa</Label>
              <Textarea
                id="description"
                value={data.description}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                placeholder="Describe tu producto en detalle..."
                rows={6}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

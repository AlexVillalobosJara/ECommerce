"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"
import { deepseekService } from "@/services/deepseekService"
import { toast } from "sonner"

interface ProductBasicInfoProps {
  data: any
  onChange: (updates: any) => void
  categories: Array<{ id: string; name: string }>
}

export function ProductBasicInfo({ data, onChange, categories }: ProductBasicInfoProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiInstructions, setAiInstructions] = useState("")

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

  const handleAIGenerate = async () => {
    // If we have instructions, we can generate even without name, but name is still good for context
    if ((!data.name || data.name.trim() === "") && (!aiInstructions || aiInstructions.trim() === "")) {
      toast.error("Ingresa el nombre del producto o instrucciones para la IA")
      return
    }

    // Check if any content already exists
    const hasContent = data.short_description || data.description || data.meta_title ||
      data.meta_description || data.meta_keywords ||
      (data.specifications && Object.keys(data.specifications).length > 0)

    if (hasContent) {
      const confirmed = confirm(
        "Ya existe contenido en algunos campos. ¿Deseas reemplazarlo con contenido generado por IA?"
      )
      if (!confirmed) return
    }

    try {
      setIsGenerating(true)
      toast.info("Generando contenido con IA...")

      // Pass instructions if present, otherwise just name (or both)
      const content = await deepseekService.generateProductContent(data.name, aiInstructions)

      // Update all fields with AI-generated content
      onChange({
        short_description: content.short_description,
        description: content.full_description,
        meta_title: content.meta_title,
        meta_description: content.meta_description,
        meta_keywords: content.keywords,
        specifications: content.technical_specs // Now it's a dict (Key-Value)
      })

      toast.success("Contenido generado exitosamente")
    } catch (error: any) {
      console.error("Error generating AI content:", error)
      toast.error(error.message || "Error al generar contenido con IA")
    } finally {
      setIsGenerating(false)
    }
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

            <div className="space-y-2">
              <Label htmlFor="ai_instructions" className="flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                Instrucciones para IA (Opcional)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="ai_instructions"
                  value={aiInstructions}
                  onChange={(e) => setAiInstructions(e.target.value)}
                  placeholder="Ej: Describe una mesa elegante, minimalista, estilo nórdico, color natural..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="default"
                  size="icon"
                  onClick={handleAIGenerate}
                  disabled={isGenerating || (!data.name && !aiInstructions)}
                  title="Generar contenido mágico"
                  className="shrink-0 bg-gradient-to-r from-purple-600 to-blue-600 border-0 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Usa este campo para dar detalles específicos a la IA. Si lo dejas vacío, usará el nombre del producto.
              </p>
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

"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useEffect, useState } from "react"

interface ProductSEOProps {
    data: any
    onChange: (updates: any) => void
}

// Function to generate slug from name
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD") // Normalize to decompose accented characters
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
        .trim()
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
}

export function ProductSEO({ data, onChange }: ProductSEOProps) {
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

    // Auto-generate slug from name if not manually edited
    useEffect(() => {
        if (!slugManuallyEdited && data.name && !data.slug) {
            const generatedSlug = generateSlug(data.name)
            onChange({ slug: generatedSlug })
        }
    }, [data.name, slugManuallyEdited])

    const handleSlugChange = (value: string) => {
        setSlugManuallyEdited(true)
        onChange({ slug: value })
    }

    const handleRegenerateSlug = () => {
        const generatedSlug = generateSlug(data.name)
        onChange({ slug: generatedSlug })
        setSlugManuallyEdited(false)
    }

    return (
        <Card className="shadow-sm">
            <CardContent className="pt-6">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">SEO</h2>
                        <span className="text-xs text-muted-foreground">Optimización para motores de búsqueda</span>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="slug">URL Slug</Label>
                            {data.name && (
                                <button
                                    type="button"
                                    onClick={handleRegenerateSlug}
                                    className="text-xs text-primary hover:underline"
                                >
                                    Regenerar desde nombre
                                </button>
                            )}
                        </div>
                        <Input
                            id="slug"
                            value={data.slug || ""}
                            onChange={(e) => handleSlugChange(e.target.value)}
                            placeholder="mi-producto-ejemplo"
                        />
                        {data.slug && (
                            <p className="text-xs text-muted-foreground">
                                URL: /product/{data.slug}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="meta_title">Meta Título</Label>
                        <Input
                            id="meta_title"
                            value={data.meta_title || ""}
                            onChange={(e) => onChange({ meta_title: e.target.value })}
                            placeholder={data.name || "Título para SEO"}
                            maxLength={60}
                        />
                        <p className="text-xs text-muted-foreground">
                            {(data.meta_title || "").length}/60 caracteres (óptimo: 50-60)
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="meta_description">Meta Descripción</Label>
                        <Textarea
                            id="meta_description"
                            value={data.meta_description || ""}
                            onChange={(e) => onChange({ meta_description: e.target.value })}
                            placeholder="Descripción breve del producto para resultados de búsqueda"
                            rows={3}
                            maxLength={160}
                        />
                        <p className="text-xs text-muted-foreground">
                            {(data.meta_description || "").length}/160 caracteres (óptimo: 150-160)
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="meta_keywords">Palabras Clave</Label>
                        <Input
                            id="meta_keywords"
                            value={data.meta_keywords || ""}
                            onChange={(e) => onChange({ meta_keywords: e.target.value })}
                            placeholder="palabra1, palabra2, palabra3"
                        />
                        <p className="text-xs text-muted-foreground">
                            Separa las palabras clave con comas
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

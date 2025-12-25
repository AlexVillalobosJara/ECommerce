"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AdminCategory } from "@/types/admin"

interface CategoryBasicInfoProps {
    data: {
        name: string
        slug: string
        description: string
        parent_id: string
        icon: string
    }
    onChange: (data: Partial<CategoryBasicInfoProps["data"]>) => void
    categories: AdminCategory[]
}

export function CategoryBasicInfo({ data, onChange, categories }: CategoryBasicInfoProps) {
    const handleNameChange = (name: string) => {
        const slug = name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
        onChange({ name, slug })
    }

    return (
        <Card className="shadow-sm">
            <CardContent className="pt-6">
                <div className="space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold mb-4">Información Básica</h2>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Nombre <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="Ej: Muebles de Oficina"
                                    value={data.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">
                                    Slug <span className="text-muted-foreground text-xs">(URL amigable)</span>
                                </Label>
                                <Input
                                    id="slug"
                                    placeholder="muebles-oficina"
                                    value={data.slug}
                                    onChange={(e) => onChange({ slug: e.target.value })}
                                    className="font-mono text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descripción</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe brevemente esta categoría..."
                                    value={data.description}
                                    onChange={(e) => onChange({ description: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="parent">Categoría Padre</Label>
                                    <Select value={data.parent_id || "none"} onValueChange={(value) => onChange({ parent_id: value === "none" ? "" : value })}>
                                        <SelectTrigger id="parent">
                                            <SelectValue placeholder="Ninguna (Principal)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Ninguna (Principal)</SelectItem>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="icon">
                                        Icono <span className="text-muted-foreground text-xs">(nombre lucide)</span>
                                    </Label>
                                    <Input
                                        id="icon"
                                        placeholder="Ej: package, home, briefcase"
                                        value={data.icon}
                                        onChange={(e) => onChange({ icon: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

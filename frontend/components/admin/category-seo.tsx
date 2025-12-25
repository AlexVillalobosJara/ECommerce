"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface CategorySEOProps {
    data: {
        meta_title: string
        meta_description: string
    }
    onChange: (data: Partial<CategorySEOProps["data"]>) => void
}

export function CategorySEO({ data, onChange }: CategorySEOProps) {
    return (
        <Card className="shadow-sm">
            <CardContent className="pt-6">
                <div className="space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold mb-4">SEO</h2>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="meta_title">Meta Título</Label>
                                <Input
                                    id="meta_title"
                                    placeholder="Título para motores de búsqueda"
                                    value={data.meta_title}
                                    onChange={(e) => onChange({ meta_title: e.target.value })}
                                    maxLength={60}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {data.meta_title.length}/60 caracteres
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="meta_description">Meta Descripción</Label>
                                <Textarea
                                    id="meta_description"
                                    placeholder="Descripción para motores de búsqueda"
                                    value={data.meta_description}
                                    onChange={(e) => onChange({ meta_description: e.target.value })}
                                    rows={3}
                                    maxLength={160}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {data.meta_description.length}/160 caracteres
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}


import { useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { getHeaders, API_BASE_URL } from "@/lib/api-client"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface CategorySEOProps {
    data: {
        meta_title: string
        meta_description: string
    }
    productName: string
    description?: string
    onChange: (data: Partial<CategorySEOProps["data"]>) => void
}

export function CategorySEO({ data, productName, description, onChange }: CategorySEOProps) {
    const [isGenerating, setIsGenerating] = useState(false)

    const handleGenerateSEO = async () => {
        if (!productName) {
            toast.error("Ingresa un nombre primero en Información Básica")
            return
        }

        setIsGenerating(true)
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/products/generate-ai-content/`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({
                    name: productName,
                    description: description || "",
                    type: 'category'
                })
            })

            const responseData = await response.json()

            if (!response.ok) throw new Error(responseData.error || "Error generating content")

            if (responseData.meta_title || responseData.meta_description) {
                onChange({
                    meta_title: responseData.meta_title || data.meta_title,
                    meta_description: responseData.meta_description || data.meta_description
                })
                toast.success("SEO generado con éxito")
            }
        } catch (error) {
            console.error("AI Error:", error)
            toast.error("Error al generar contenido SEO")
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <Card className="shadow-sm">
            <CardContent className="pt-6">
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">SEO</h2>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleGenerateSEO}
                                disabled={isGenerating || !productName}
                                className="h-7 text-xs"
                                type="button"
                            >
                                {isGenerating ? (
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                ) : (
                                    <Sparkles className="mr-2 h-3 w-3 text-purple-600" />
                                )}
                                Generar SEO con IA
                            </Button>
                        </div>

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

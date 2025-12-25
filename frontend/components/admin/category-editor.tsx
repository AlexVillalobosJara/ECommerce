"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save } from "lucide-react"
import { Card } from "@/components/ui/card"
import { CategoryBasicInfo } from "@/components/admin/category-basic-info"
import { CategoryMediaUpload } from "@/components/admin/category-media-upload"
import { CategorySEO } from "@/components/admin/category-seo"
import { CategorySettings } from "@/components/admin/category-settings"
import { getCategory, getCategories, createCategory, updateCategory } from "@/services/adminCategoryService"
import { toast } from "sonner"
import type { AdminCategory } from "@/types/admin"

interface CategoryEditorProps {
    categoryId?: string
}

export function CategoryEditor({ categoryId }: CategoryEditorProps) {
    const router = useRouter()
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [categories, setCategories] = useState<AdminCategory[]>([])
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        parent_id: "",
        icon: "",
        image_url: "",
        sort_order: 0,
        is_active: true,
        meta_title: "",
        meta_description: "",
    })

    const isEditing = !!categoryId

    useEffect(() => {
        loadCategories()
        if (categoryId) {
            loadCategory(categoryId)
        }
    }, [categoryId])

    const loadCategories = async () => {
        try {
            const data = await getCategories()
            // Filter out current category to prevent circular reference
            setCategories(categoryId ? data.filter(c => c.id !== categoryId) : data)
        } catch (error) {
            console.error("Error loading categories:", error)
            toast.error("Error al cargar categorías")
        }
    }

    const loadCategory = async (id: string) => {
        try {
            setIsLoading(true)
            const category = await getCategory(id)
            setFormData({
                name: category.name,
                slug: category.slug,
                description: category.description || "",
                parent_id: category.parent || "",
                icon: category.icon || "",
                image_url: category.image_url || "",
                sort_order: category.sort_order,
                is_active: category.is_active,
                meta_title: category.meta_title || "",
                meta_description: category.meta_description || "",
            })
        } catch (error) {
            console.error("Error loading category:", error)
            toast.error("Error al cargar categoría")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error("El nombre es requerido")
            return
        }

        try {
            setIsSaving(true)

            const payload = {
                name: formData.name,
                slug: formData.slug,
                description: formData.description,
                parent: formData.parent_id || null,
                icon: formData.icon,
                image_url: formData.image_url,
                sort_order: formData.sort_order,
                is_active: formData.is_active,
                meta_title: formData.meta_title,
                meta_description: formData.meta_description,
            }

            if (isEditing) {
                await updateCategory(categoryId, payload)
                toast.success("Categoría actualizada")
            } else {
                await createCategory(payload)
                toast.success("Categoría creada")
            }

            router.push("/admin/categories")
        } catch (error) {
            console.error("Error saving category:", error)
            toast.error("Error al guardar categoría")
        } finally {
            setIsSaving(false)
        }
    }

    const updateFormData = (updates: Partial<typeof formData>) => {
        setFormData((prev) => ({ ...prev, ...updates }))
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center">
                <p className="text-muted-foreground">Cargando...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Header */}
            <div className="bg-background border-b border-border sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => router.push("/admin/categories")} className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Volver
                            </Button>
                            <div className="h-6 w-px bg-border" />
                            <div>
                                <h1 className="text-xl font-semibold">{isEditing ? "Editar Categoría" : "Nueva Categoría"}</h1>
                                {formData.name && <p className="text-sm text-muted-foreground">{formData.name}</p>}
                            </div>
                        </div>
                        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                            <Save className="w-4 h-4" />
                            {isSaving ? "Guardando..." : "Guardar"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content - Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <CategoryBasicInfo data={formData} onChange={updateFormData} categories={categories} />

                        <CategoryMediaUpload data={formData} onChange={updateFormData} />

                        <CategorySEO data={formData} onChange={updateFormData} />
                    </div>

                    {/* Sidebar - Right Column */}
                    <div className="space-y-6">
                        <CategorySettings data={formData} onChange={updateFormData} />

                        {/* Preview Card */}
                        <Card className="p-6 space-y-4 sticky top-24">
                            <h3 className="font-semibold text-sm">Vista Previa</h3>
                            <div className="space-y-3">
                                {formData.image_url ? (
                                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                                        <img
                                            src={formData.image_url}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                                        <span className="text-xs text-muted-foreground">Sin imagen</span>
                                    </div>
                                )}
                                <div>
                                    <p className="font-semibold text-lg">{formData.name || "Nombre de categoría"}</p>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {formData.description || "Descripción de la categoría"}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

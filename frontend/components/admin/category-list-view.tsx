"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, GripVertical } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CategoryEditor } from "./category-editor"
import { getCategories, deleteCategory } from "@/services/adminCategoryService"
import type { AdminCategory } from "@/types/admin"

export function CategoryListView() {
    const [categories, setCategories] = useState<AdminCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [editorOpen, setEditorOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<AdminCategory | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [categoryToDelete, setCategoryToDelete] = useState<AdminCategory | null>(null)
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        loadCategories()
    }, [])

    const loadCategories = async () => {
        try {
            console.log('📦 Loading categories...')
            setLoading(true)
            const data = await getCategories()
            console.log('📦 Categories loaded:', data)
            setCategories(data)
        } catch (error) {
            console.error("Error loading categories:", error)
            toast.error("Error al cargar categorías")
        } finally {
            setLoading(false)
            console.log('📦 Loading finished')
        }
    }

    const handleCreate = () => {
        setSelectedCategory(null)
        setEditorOpen(true)
    }

    const handleEdit = (category: AdminCategory) => {
        setSelectedCategory(category)
        setEditorOpen(true)
    }

    const handleDeleteClick = (category: AdminCategory) => {
        setCategoryToDelete(category)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!categoryToDelete) return

        try {
            await deleteCategory(categoryToDelete.id)
            toast.success("Categoría eliminada correctamente")
            loadCategories()
        } catch (error) {
            console.error("Error deleting category:", error)
            toast.error(error instanceof Error ? error.message : "Error al eliminar categoría")
        } finally {
            setDeleteDialogOpen(false)
            setCategoryToDelete(null)
        }
    }

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    // Render category row with children
    const renderCategory = (category: AdminCategory, level = 0) => {
        const hasChildren = category.children && category.children.length > 0
        const isExpanded = expandedIds.has(category.id)
        const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase())

        if (searchQuery && !matchesSearch) {
            return null
        }

        return (
            <div key={category.id}>
                <div
                    className="flex items-center gap-2 px-4 py-3 border-b hover:bg-muted/20 transition-colors"
                    style={{ paddingLeft: `${16 + level * 24}px` }}
                >
                    {/* Expand/Collapse */}
                    <div className="w-6">
                        {hasChildren && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => toggleExpand(category.id)}
                            >
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </Button>
                        )}
                    </div>

                    {/* Drag Handle */}
                    <div className="cursor-grab active:cursor-grabbing">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>

                    {/* Category Name */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            {category.icon && (
                                <span className="text-muted-foreground">{category.icon}</span>
                            )}
                            <span className="font-medium truncate">{category.name}</span>
                        </div>
                        {category.description && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {category.description}
                            </p>
                        )}
                    </div>

                    {/* Products Count */}
                    <div className="w-24 text-center">
                        <Badge variant="secondary">
                            {category.products_count} productos
                        </Badge>
                    </div>

                    {/* Status */}
                    <div className="w-24">
                        <Badge variant={category.is_active ? "default" : "secondary"}>
                            {category.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(category)}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(category)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Render children if expanded */}
                {hasChildren && isExpanded && (
                    <div>
                        {category.children!.map(child => renderCategory(child, level + 1))}
                    </div>
                )}
            </div>
        )
    }

    // Get root categories (no parent)
    const rootCategories = categories.filter(cat => !cat.parent)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Categorías</h1>
                    <p className="text-muted-foreground">
                        Organiza tus productos en categorías y subcategorías
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Categoría
                </Button>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Buscar categorías..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Categories Table */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        {rootCategories.length} {rootCategories.length === 1 ? 'categoría' : 'categorías'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-12 text-center text-muted-foreground">
                            Cargando categorías...
                        </div>
                    ) : rootCategories.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-muted-foreground mb-4">
                                No hay categorías creadas
                            </p>
                            <Button onClick={handleCreate}>
                                <Plus className="mr-2 h-4 w-4" />
                                Crear Primera Categoría
                            </Button>
                        </div>
                    ) : (
                        <div className="border-t">
                            {/* Table Header */}
                            <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b text-xs font-medium text-muted-foreground">
                                <div className="w-6"></div>
                                <div className="w-6"></div>
                                <div className="flex-1">NOMBRE</div>
                                <div className="w-24 text-center">PRODUCTOS</div>
                                <div className="w-24">ESTADO</div>
                                <div className="w-20 text-right">ACCIONES</div>
                            </div>

                            {/* Categories */}
                            {rootCategories.map(category => renderCategory(category))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Category Editor Dialog */}
            <CategoryEditor
                open={editorOpen}
                onOpenChange={setEditorOpen}
                category={selectedCategory}
                categories={categories}
                onSuccess={loadCategories}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de eliminar la categoría "{categoryToDelete?.name}"?
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm}>
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

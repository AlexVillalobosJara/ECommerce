"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Search, FolderTree } from "lucide-react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { getCategories, deleteCategory } from "@/services/adminCategoryService"
import { toast } from "sonner"
import type { AdminCategory } from "@/types/admin"
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

export function CategoriesManagement() {
    const [categories, setCategories] = useState<AdminCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [categoryToDelete, setCategoryToDelete] = useState<AdminCategory | null>(null)
    const router = useRouter()

    useEffect(() => {
        loadCategories()
    }, [])

    const loadCategories = async () => {
        try {
            setLoading(true)
            const data = await getCategories()
            // Handle paginated response
            const categoryList = Array.isArray(data) ? data : ((data as any).results || [])
            setCategories(categoryList)
        } catch (error) {
            console.error("Error loading categories:", error)
            toast.error("Error al cargar categorías")
        } finally {
            setLoading(false)
        }
    }

    const handleCreateCategory = () => {
        router.push("/admin/categories/new")
    }

    const handleEditCategory = (category: AdminCategory) => {
        router.push(`/admin/categories/${category.id}`)
    }

    const handleDeleteClick = (category: AdminCategory) => {
        setCategoryToDelete(category)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!categoryToDelete) return

        try {
            await deleteCategory(categoryToDelete.id)
            toast.success("Categoría eliminada")
            loadCategories()
        } catch (error) {
            console.error("Error deleting category:", error)
            toast.error("Error al eliminar categoría")
        } finally {
            setDeleteDialogOpen(false)
            setCategoryToDelete(null)
        }
    }

    const getCategoryParentName = (parentId: string | null | undefined) => {
        if (!parentId) return null
        const parent = categories.find((c) => c.id === parentId)
        return parent?.name
    }

    const filteredCategories = categories.filter((c) => {
        const matchesSearch =
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.slug.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? c.is_active : !c.is_active)
        return matchesSearch && matchesStatus
    })

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Gestión de Categorías</h1>
                        <p className="text-muted-foreground mt-2">Organiza tu catálogo por categorías y subcategorías</p>
                    </div>
                </div>
                <Card className="shadow-sm">
                    <CardContent className="p-12 text-center">
                        <p className="text-muted-foreground">Cargando categorías...</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Categorías</h1>
                    <p className="text-muted-foreground mt-2">Organiza tu catálogo por categorías y subcategorías</p>
                </div>
                <Button onClick={handleCreateCategory} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Nueva Categoría
                </Button>
            </div>

            {/* Filters */}
            <Card className="shadow-sm">
                <CardContent className="p-4">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre o slug..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Estados</SelectItem>
                                <SelectItem value="active">Activas</SelectItem>
                                <SelectItem value="inactive">Inactivas</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Categories Table */}
            <Card className="shadow-sm">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-border bg-muted/30">
                                <tr>
                                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Categoría</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Slug</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Jerarquía</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Productos</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Estado</th>
                                    <th className="text-right text-xs font-medium text-muted-foreground px-6 py-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredCategories.map((category) => {
                                    const parentName = getCategoryParentName(category.parent)
                                    return (
                                        <tr key={category.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    {category.image_url ? (
                                                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                                            <Image
                                                                src={category.image_url}
                                                                alt={category.name}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                            <FolderTree className="w-6 h-6 text-primary" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-medium">{category.name}</div>
                                                        {category.description && (
                                                            <div className="text-xs text-muted-foreground line-clamp-1">{category.description}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-muted-foreground font-mono">{category.slug}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {parentName ? (
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {parentName}
                                                        </Badge>
                                                        <span className="text-muted-foreground">→</span>
                                                        <span className="text-sm">{category.name}</span>
                                                    </div>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-violet-50 text-violet-700 border-violet-200">
                                                        Principal
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm">{category.products_count || 0} productos</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={category.is_active ? "default" : "secondary"}>
                                                    {category.is_active ? "Activa" : "Inactiva"}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => handleEditCategory(category)}>
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteClick(category)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Empty State */}
            {filteredCategories.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No se encontraron categorías</p>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. La categoría "{categoryToDelete?.name}" será eliminada permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

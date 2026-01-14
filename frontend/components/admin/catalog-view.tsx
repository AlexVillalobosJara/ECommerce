"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Pencil, Trash2, AlertTriangle, Search } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import type { AdminProductListItem, ProductFilters } from "@/types/admin"
import { getProducts, deleteProduct, updateProduct } from "@/services/adminProductService"
import { useTenant } from "@/contexts/TenantContext"
import { formatPrice } from "@/lib/format-price"
import { getProductImageUrl } from "@/lib/image-utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import { useRouter } from "next/navigation"

export function CatalogView() {
    const router = useRouter()
    const [products, setProducts] = useState<AdminProductListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [productToDelete, setProductToDelete] = useState<string | null>(null)
    const [searchInput, setSearchInput] = useState("")
    const [filters, setFilters] = useState<ProductFilters>({
        search: "",
        status: "",
        category: "",
    })

    const loadProducts = useCallback(async () => {
        try {
            setLoading(true)
            const data = await getProducts(filters)
            setProducts(data)
        } catch (error) {
            console.error("Error loading products:", error)
            toast.error("Error al cargar productos")
        } finally {
            setLoading(false)
        }
    }, [filters])

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters(prev => {
                if (prev.search === searchInput) return prev
                return { ...prev, search: searchInput }
            })
        }, 300) // Wait 300ms after user stops typing

        return () => clearTimeout(timer)
    }, [searchInput])

    useEffect(() => {
        loadProducts()
    }, [loadProducts])

    const handleCreateProduct = () => {
        router.push("/admin/products/new")
    }

    const handleEditProduct = (productId: string) => {
        router.push(`/admin/products/${productId}`)
    }

    const handleDeleteClick = (productId: string) => {
        setProductToDelete(productId)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!productToDelete) return

        try {
            await deleteProduct(productToDelete)
            toast.success("Producto eliminado")
            loadProducts()
        } catch (error) {
            console.error("Error deleting product:", error)
            toast.error("Error al eliminar producto")
        } finally {
            setDeleteDialogOpen(false)
            setProductToDelete(null)
        }
    }

    const handleToggleFeatured = async (productId: string, currentFeatured: boolean) => {
        try {
            await updateProduct(productId, { is_featured: !currentFeatured })
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_featured: !currentFeatured } : p))
            toast.success(currentFeatured ? "Producto quitado de destacados" : "Producto destacado")
        } catch (error) {
            console.error("Error updating featured status:", error)
            toast.error("Error al actualizar estado destacado")
        }
    }

    const handleTogglePublished = async (productId: string, currentStatus: string) => {
        const newStatus = currentStatus === "Published" ? "Draft" : "Published"
        try {
            await updateProduct(productId, { status: newStatus as any })
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, status: newStatus as any } : p))
            toast.success(newStatus === "Published" ? "Producto publicado" : "Producto movido a borrador")
        } catch (error) {
            console.error("Error updating publication status:", error)
            toast.error("Error al actualizar estado de publicación")
        }
    }

    const { tenant } = useTenant()

    const formatPriceDisplay = (price: number | null) => {
        if (!price) return "—"
        return formatPrice(price, tenant)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Productos</h1>
                    <p className="text-muted-foreground mt-2">Administra tu catálogo completo</p>
                </div>
                <Button onClick={handleCreateProduct} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Nuevo Producto
                </Button>
            </div>

            {/* Filters */}
            <Card className="shadow-sm">
                <CardContent className="p-4">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre o SKU..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={filters.status || 'all'} onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? '' : value })}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Estados</SelectItem>
                                <SelectItem value="Published">Publicados</SelectItem>
                                <SelectItem value="Draft">Borradores</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Products Table - V0 Design */}
            <Card className="shadow-sm">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-border bg-muted/30">
                                <tr>
                                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Producto</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">SKU</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Publicado</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Destacado</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Stock</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Precio</th>
                                    <th className="text-right text-xs font-medium text-muted-foreground px-6 py-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-24 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                                <p>Cargando productos...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : products.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                            No se encontraron productos
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((product) => (
                                        <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                                        {product.primary_image ? (
                                                            <img
                                                                src={getProductImageUrl(product.primary_image)}
                                                                alt={product.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                                                                —
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{product.name}</div>
                                                        {product.brand && <div className="text-xs text-muted-foreground">{product.brand}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-muted-foreground font-mono">{product.sku || "—"}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center">
                                                    <Switch
                                                        checked={product.status === "Published"}
                                                        onCheckedChange={() => handleTogglePublished(product.id, product.status)}
                                                        className="scale-75"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center">
                                                    <Switch
                                                        checked={product.is_featured}
                                                        onCheckedChange={() => handleToggleFeatured(product.id, product.is_featured)}
                                                        className="scale-75"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    {product.is_quote_only ? (
                                                        <span className="text-sm text-muted-foreground">—</span>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-2">
                                                                {(product.total_available ?? 0) < 5 && (product.total_available ?? 0) > 0 && (
                                                                    <AlertTriangle className="w-4 h-4 text-destructive" />
                                                                )}
                                                                <span className={cn(
                                                                    "text-sm font-medium",
                                                                    (product.total_available ?? 0) < 5 && (product.total_available ?? 0) > 0 ? "text-destructive" : "text-foreground"
                                                                )}>
                                                                    {product.total_available ?? "0"} Disponibles
                                                                </span>
                                                            </div>
                                                            {product.total_reserved !== undefined && product.total_reserved !== null && product.total_reserved > 0 && (
                                                                <div className="text-[11px] text-muted-foreground">
                                                                    {product.total_reserved} Reservados
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {product.is_quote_only ? (
                                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                                        Solo Cotización
                                                    </Badge>
                                                ) : (
                                                    <span className="font-semibold">
                                                        {product.min_price === product.max_price
                                                            ? formatPriceDisplay(product.min_price ?? null)
                                                            : `${formatPriceDisplay(product.min_price ?? null)} - ${formatPriceDisplay(product.max_price ?? null)}`}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product.id)}>
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteClick(product.id)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. El producto será eliminado permanentemente.
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

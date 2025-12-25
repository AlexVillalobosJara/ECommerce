"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import type { AdminProduct, AdminCategory, ProductFormData } from "@/types/admin"
import { createProduct, updateProduct, getCategories } from "@/services/adminProductService"
import { ImageManager } from "./image-manager"
import { VariantManager } from "./variant-manager"

interface ProductFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    product?: AdminProduct | null
    onSuccess: () => void
}

export function ProductFormDialog({ open, onOpenChange, product, onSuccess }: ProductFormDialogProps) {
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<AdminCategory[]>([])
    const [formData, setFormData] = useState<ProductFormData>({
        name: "",
        slug: "",
        sku: "",
        short_description: "",
        description: "",
        brand: "",
        category_id: null,
        is_quote_only: false,
        manage_stock: true,
        status: "Draft",
        is_featured: false,
    })

    useEffect(() => {
        if (open) {
            loadCategories()
            if (product) {
                setFormData({
                    name: product.name,
                    slug: product.slug,
                    sku: product.sku || "",
                    short_description: product.short_description || "",
                    description: product.description || "",
                    brand: product.brand || "",
                    category_id: product.category?.id || null,
                    is_quote_only: product.is_quote_only,
                    manage_stock: product.manage_stock,
                    status: product.status,
                    is_featured: product.is_featured,
                    meta_title: product.meta_title,
                    meta_description: product.meta_description,
                })
            } else {
                // Reset form for new product
                setFormData({
                    name: "",
                    slug: "",
                    sku: "",
                    short_description: "",
                    description: "",
                    brand: "",
                    category_id: null,
                    is_quote_only: false,
                    manage_stock: true,
                    status: "Draft",
                    is_featured: false,
                })
            }
        }
    }, [open, product])

    const loadCategories = async () => {
        try {
            const data = await getCategories()
            setCategories(data)
        } catch (error) {
            console.error("Failed to load categories:", error)
        }
    }

    const handleSubmit = async () => {
        if (!formData.name || !formData.slug) {
            toast.error("Name and slug are required")
            return
        }

        setLoading(true)
        try {
            if (product) {
                await updateProduct(product.id, formData)
                toast.success("Product updated successfully")
            } else {
                await createProduct(formData)
                toast.success("Product created successfully")
            }
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            console.error("Failed to save product:", error)
            toast.error(error.message || "Failed to save product")
        } finally {
            setLoading(false)
        }
    }

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
    }

    const handleNameChange = (name: string) => {
        setFormData({ ...formData, name })
        if (!product) {
            // Auto-generate slug for new products
            setFormData(prev => ({ ...prev, name, slug: generateSlug(name) }))
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{product ? "Edit Product" : "Create Product"}</DialogTitle>
                    <DialogDescription>
                        {product ? "Update product details" : "Add a new product to your catalog"}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                        <TabsTrigger value="variants" disabled={!product}>Variants</TabsTrigger>
                        <TabsTrigger value="images" disabled={!product}>Images</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <Label htmlFor="name">Product Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="Enter product name"
                                />
                            </div>

                            <div>
                                <Label htmlFor="slug">Slug *</Label>
                                <Input
                                    id="slug"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    placeholder="product-slug"
                                />
                            </div>

                            <div>
                                <Label htmlFor="sku">SKU</Label>
                                <Input
                                    id="sku"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                    placeholder="PROD-001"
                                />
                            </div>

                            <div>
                                <Label htmlFor="brand">Brand</Label>
                                <Input
                                    id="brand"
                                    value={formData.brand}
                                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                    placeholder="Brand name"
                                />
                            </div>

                            <div>
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={formData.category_id || ""}
                                    onValueChange={(value) => setFormData({ ...formData, category_id: value || null })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
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

                            <div className="col-span-2">
                                <Label htmlFor="short_description">Short Description</Label>
                                <Textarea
                                    id="short_description"
                                    value={formData.short_description}
                                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                                    placeholder="Brief product description"
                                    rows={2}
                                />
                            </div>

                            <div className="col-span-2">
                                <Label htmlFor="description">Full Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Detailed product description"
                                    rows={4}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="variants" className="mt-4">
                        {product && (
                            <VariantManager
                                productId={product.id}
                                variants={product.variants}
                                onVariantsChange={() => { }}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="images" className="mt-4">
                        {product && (
                            <ImageManager
                                productId={product.id}
                                images={product.images}
                                onImagesChange={() => { }}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-4 mt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="is_quote_only">Quote Only</Label>
                                <p className="text-sm text-muted-foreground">
                                    Product requires quote instead of direct purchase
                                </p>
                            </div>
                            <Switch
                                id="is_quote_only"
                                checked={formData.is_quote_only}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_quote_only: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="manage_stock">Manage Stock</Label>
                                <p className="text-sm text-muted-foreground">
                                    Track inventory for this product
                                </p>
                            </div>
                            <Switch
                                id="manage_stock"
                                checked={formData.manage_stock}
                                onCheckedChange={(checked) => setFormData({ ...formData, manage_stock: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="is_featured">Featured Product</Label>
                                <p className="text-sm text-muted-foreground">
                                    Show this product in featured sections
                                </p>
                            </div>
                            <Switch
                                id="is_featured"
                                checked={formData.is_featured}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                            />
                        </div>

                        <div>
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Draft">Draft</SelectItem>
                                    <SelectItem value="Published">Published</SelectItem>
                                    <SelectItem value="Archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "Saving..." : product ? "Update Product" : "Create Product"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save } from "lucide-react"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { ProductBasicInfo } from "./product-basic-info"
import { ProductMediaUpload } from "./product-media-upload"
import { ProductPricing } from "./product-pricing"
import { ProductVariantsEditor } from "./product-variants-editor"
import { ProductSettings } from "./product-settings"
import { ProductSpecifications } from "./product-specifications"
import type { AdminProduct } from "@/types/admin"
import { getProduct, createProduct, updateProduct, getCategories, createVariant, updateVariant, deleteVariant } from "@/services/adminProductService"
import { useTenant } from "@/contexts/TenantContext"
import { formatPrice } from "@/lib/format-price"

interface ProductEditorProps {
    productId?: string
}



export function ProductEditor({ productId }: ProductEditorProps) {
    const router = useRouter()
    const { tenant } = useTenant()
    const [isSaving, setIsSaving] = useState(false)
    const [loading, setLoading] = useState(!!productId)
    const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
    const [originalVariants, setOriginalVariants] = useState<any[]>([])
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        sku: "",
        barcode: "",
        brand: "",
        category_id: null as string | null,
        short_description: "",
        description: "",
        is_quote_only: false,
        manage_stock: true,
        status: "Draft" as "Draft" | "Published" | "Archived",
        is_featured: false,
        price: "",
        stock: "",
        images: [] as import('@/types/admin').AdminProductImage[],
        variants: [] as any[],
        specifications: {} as Record<string, string>,
    })

    const isEditing = !!productId

    // Load categories on mount
    useEffect(() => {
        loadCategories()
    }, [])

    const loadCategories = async () => {
        try {
            const data = await getCategories()
            setCategories(data)
        } catch (error) {
            console.error("Error loading categories:", error)
            toast.error("Error al cargar categorías")
        }
    }

    // Load product data if editing
    useEffect(() => {
        if (productId) {
            loadProduct()
        }
    }, [productId])

    const loadProduct = async () => {
        if (!productId) return

        try {
            setLoading(true)
            const data = await getProduct(productId)

            // Map AdminProduct to form data
            setFormData({
                name: data.name || "",
                slug: data.slug || "",
                sku: data.sku || "",
                barcode: data.barcode || "",
                brand: data.brand || "",
                // Handle both category_id directly or nested category object
                category_id: data.category_id || data.category?.id || null,
                short_description: data.short_description || "",
                description: data.description || "",
                is_quote_only: data.is_quote_only || false,
                manage_stock: data.manage_stock !== undefined ? data.manage_stock : true,
                status: data.status || "Draft",
                is_featured: data.is_featured || false,
                price: data.variants[0]?.price?.toString() || "",
                stock: data.variants[0]?.stock_quantity?.toString() || "",
                images: data.images || [],
                // Deep copy variants to prevent reference mutation
                variants: JSON.parse(JSON.stringify(data.variants || [])),
                specifications: data.specifications || {},
            })

            // Store original variants for comparison when saving (also deep copy)
            setOriginalVariants(JSON.parse(JSON.stringify(data.variants || [])))
        } catch (error) {
            console.error("Error loading product:", error)
            toast.error("Error al cargar producto")
            router.push("/admin/catalog")
        } finally {
            setLoading(false)
        }
    }

    const syncVariants = async (productId: string) => {
        // Compare current variants with original variants
        const currentVariants = formData.variants

        // Identify variants to create, update, and delete
        const variantsToCreate = currentVariants.filter(v => v.id?.startsWith('temp-'))
        const variantsToUpdate = currentVariants.filter(v => !v.id?.startsWith('temp-') && v.id)
        const variantsToDelete = originalVariants.filter(
            orig => !orig.id?.startsWith('temp-') && !currentVariants.find(curr => curr.id === orig.id)
        )

        console.log('Variant sync:', {
            create: variantsToCreate.length,
            update: variantsToUpdate.length,
            delete: variantsToDelete.length,
            toDelete: variantsToDelete.map(v => ({ id: v.id, sku: v.sku }))
        })

        try {
            // Delete removed variants
            for (const variant of variantsToDelete) {
                try {
                    console.log('Deleting variant:', variant.id, variant.sku)
                    await deleteVariant(productId, variant.id)
                    console.log('Successfully deleted variant:', variant.id)
                } catch (deleteError: any) {
                    // If variant not found (404), it's already deleted, continue
                    const errorMsg = deleteError.message?.toLowerCase() || ''
                    if (errorMsg.includes('variant not found') || errorMsg.includes('404')) {
                        console.warn('Variant already deleted or not found:', variant.id)
                        continue
                    }
                    // For other errors, re-throw
                    throw deleteError
                }
            }

            // Create new variants
            for (const variant of variantsToCreate) {
                // Skip variants with empty SKU
                if (!variant.sku || variant.sku.trim() === '') {
                    console.warn('Skipping variant with empty SKU:', variant)
                    continue
                }

                const variantData = {
                    sku: variant.sku,
                    name: variant.name,
                    attributes: variant.attributes || {},
                    price: variant.price_adjustment ? parseFloat(variant.price_adjustment) : undefined,
                    compare_at_price: variant.compare_at_price ? parseFloat(variant.compare_at_price.toString()) : undefined,
                    stock_quantity: variant.stock ? parseInt(variant.stock) : 0,
                    is_default: variant.is_default || false,
                    is_active: true,
                    low_stock_threshold: 10,
                }
                console.log('Creating variant with data:', variantData)
                await createVariant(productId, variantData)
            }

            // Update existing variants
            for (const variant of variantsToUpdate) {
                console.log('Updating variant:', variant.id, 'Current data:', variant)

                const variantData = {
                    sku: variant.sku,
                    name: variant.name,
                    attributes: variant.attributes || {},
                    price: variant.price && variant.price !== "0.00" ? parseFloat(variant.price.toString()) : undefined,
                    compare_at_price: variant.compare_at_price && variant.compare_at_price !== "0.00" ? parseFloat(variant.compare_at_price.toString()) : undefined,
                    stock_quantity: variant.stock_quantity !== undefined ? variant.stock_quantity : 0,
                    is_default: variant.is_default || false,
                    is_active: variant.is_active !== undefined ? variant.is_active : true,
                }
                console.log('Sending variant update data:', variantData)
                await updateVariant(productId, variant.id, variantData)
            }

            // Update originalVariants to current state after successful sync
            setOriginalVariants(formData.variants.filter(v => !v.id?.startsWith('temp-')))
        } catch (error: any) {
            console.error('Error syncing variants:', error)
            console.error('Error message:', error.message)
            // Re-throw with more context
            throw new Error(`Error al sincronizar variantes: ${error.message}`)
        }
    }

    const handleSave = async () => {
        try {
            setIsSaving(true)

            // Prepare data for API
            const productData: any = {
                name: formData.name,
                slug: formData.slug,
                sku: formData.sku,
                barcode: formData.barcode,
                brand: formData.brand,
                category_id: formData.category_id?.trim() ? formData.category_id : null,
                short_description: formData.short_description,
                description: formData.description,
                is_quote_only: formData.is_quote_only,
                manage_stock: formData.manage_stock,
                status: formData.status,
                is_featured: formData.is_featured,
                specifications: formData.specifications,
                // Note: variants are synced separately via API
            }

            let savedProductId = productId

            if (isEditing && productId) {
                await updateProduct(productId, productData)
                // Sync variants after updating product
                await syncVariants(productId)
                toast.success("Producto actualizado correctamente")
            } else {
                const newProduct = await createProduct(productData)
                savedProductId = newProduct.id
                // Sync variants after creating product
                if (formData.variants.length > 0) {
                    await syncVariants(newProduct.id)
                }
                toast.success("Producto creado correctamente")
            }

            router.push("/admin/catalog")
        } catch (error: any) {
            console.error("Error saving product:", error)
            toast.error(error.message || "Error al guardar producto")
        } finally {
            setIsSaving(false)
        }
    }

    const updateFormData = (updates: Partial<typeof formData>) => {
        setFormData((prev) => ({ ...prev, ...updates }))
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center">
                <p className="text-muted-foreground">Cargando producto...</p>
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
                            <Button variant="ghost" size="sm" onClick={() => router.push("/admin/catalog")} className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Volver
                            </Button>
                            <div className="h-6 w-px bg-border" />
                            <div>
                                <h1 className="text-xl font-semibold">{isEditing ? "Editar Producto" : "Nuevo Producto"}</h1>
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
                        <ProductBasicInfo data={formData} onChange={updateFormData} categories={categories} />

                        <ProductMediaUpload
                            productId={productId}
                            images={formData.images}
                            onChange={(images) => updateFormData({ images })}
                        />

                        <ProductPricing data={formData} onChange={updateFormData} />

                        <ProductVariantsEditor
                            variants={formData.variants}
                            onChange={(variants) => updateFormData({ variants })}
                            isQuoteOnly={formData.is_quote_only}
                            basePrice={formData.price}
                        />

                        <ProductSpecifications
                            data={formData}
                            onChange={updateFormData}
                        />
                    </div>

                    {/* Sidebar - Right Column */}
                    <div className="space-y-6">
                        <ProductSettings data={formData} onChange={updateFormData} />

                        {/* Preview Card */}
                        <Card className="p-6 space-y-4 sticky top-24">
                            <h3 className="font-semibold text-sm">Vista Previa</h3>
                            <div className="space-y-3">
                                {formData.images[0] && (
                                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                                        <img
                                            src={`http://localhost:8000${formData.images[0].url}` || "/placeholder.svg"}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                {!formData.images[0] && (
                                    <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                                        <span className="text-xs text-muted-foreground">Sin imagen</span>
                                    </div>
                                )}
                                <div>
                                    <p className="font-semibold">{formData.name || "Nombre del producto"}</p>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {formData.short_description || "Descripción corta"}
                                    </p>
                                </div>
                                {formData.is_quote_only ? (
                                    <div className="text-sm font-medium text-blue-600">Solo Cotización</div>
                                ) : (
                                    <div className="text-lg font-bold">
                                        {formatPrice(formData.price || 0, tenant)}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

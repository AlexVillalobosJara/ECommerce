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
import { getProductImageUrl } from "@/lib/image-utils"
import type { AdminProduct } from "@/types/admin"
import { getProduct, createProduct, updateProduct, getCategories, createVariant, updateVariant, deleteVariant } from "@/services/adminProductService"
import { useTenant } from "@/contexts/TenantContext"
import { formatPrice } from "@/lib/format-price"
import { useAdminUI } from "@/contexts/AdminUIContext"

interface ProductEditorProps {
    productId?: string
}



export function ProductEditor({ productId }: ProductEditorProps) {
    const router = useRouter()
    const { tenant } = useTenant()
    const { setTitle, setDescription } = useAdminUI()
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

    // Clear UI context on unmount
    useEffect(() => {
        return () => {
            setTitle(null)
            setDescription(null)
        }
    }, [setTitle, setDescription])

    // Update dynamic title when formData.name changes
    useEffect(() => {
        if (isEditing) {
            setTitle(formData.name || "Editar Producto")
            setDescription(formData.short_description || null)
        } else {
            setTitle("Nuevo Producto")
            setDescription("Crea un nuevo producto en tu catálogo")
        }
    }, [formData.name, formData.short_description, isEditing, setTitle, setDescription])

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

        try {
            // Delete removed variants
            for (const variant of variantsToDelete) {
                try {
                    await deleteVariant(productId, variant.id)
                } catch (deleteError: any) {
                    const errorMsg = deleteError.message?.toLowerCase() || ''
                    if (errorMsg.includes('variant not found') || errorMsg.includes('404')) continue
                    throw deleteError
                }
            }

            // Create new variants
            for (const variant of variantsToCreate) {
                if (!variant.sku || variant.sku.trim() === '') continue

                const variantData = {
                    sku: variant.sku,
                    name: variant.name,
                    attributes: variant.attributes || {},
                    price: variant.price ? parseFloat(variant.price.toString()) : undefined,
                    compare_at_price: variant.compare_at_price ? parseFloat(variant.compare_at_price.toString()) : undefined,
                    stock_quantity: variant.stock_quantity !== undefined ? parseInt(variant.stock_quantity.toString()) : 0,
                    is_default: variant.is_default || false,
                    is_active: true,
                    low_stock_threshold: 10,
                }
                await createVariant(productId, variantData)
            }

            // Update existing variants
            for (const variant of variantsToUpdate) {
                const variantData: any = {
                    sku: variant.sku,
                    name: variant.name,
                    attributes: variant.attributes || {},
                    is_default: variant.is_default || false,
                    is_active: variant.is_active !== undefined ? variant.is_active : true,
                }

                if (variant.price !== undefined && variant.price !== null) {
                    variantData.price = parseFloat(variant.price.toString())
                }
                if (variant.compare_at_price !== undefined && variant.compare_at_price !== null) {
                    variantData.compare_at_price = parseFloat(variant.compare_at_price.toString())
                }
                if (variant.stock_quantity !== undefined && variant.stock_quantity !== null) {
                    variantData.stock_quantity = parseInt(variant.stock_quantity.toString())
                }

                await updateVariant(productId, variant.id, variantData)
            }

            // Update originalVariants to current state after successful sync
            setOriginalVariants(formData.variants.filter(v => !v.id?.startsWith('temp-')))
        } catch (error: any) {
            console.error('Error syncing variants:', error)
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
                // Include images with Supabase URLs
                images_data: formData.images.map(img => ({
                    url: img.url,
                    alt_text: img.alt_text || '',
                    sort_order: img.sort_order,
                    is_primary: img.is_primary
                })),
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
        <div className="min-h-screen bg-muted/30 pb-12">
            {/* Header */}
            <div className="bg-background border-b border-border sticky top-0 z-10 transition-all">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => router.push("/admin/catalog")} className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Volver al catálogo
                            </Button>
                        </div>
                        <Button onClick={handleSave} disabled={isSaving} className="gap-2 min-w-[120px]">
                            <Save className="w-4 h-4" />
                            {isSaving ? "Guardando..." : "Guardar Cambios"}
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
                                            src={getProductImageUrl(formData.images[0].url)}
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

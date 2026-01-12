"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Minus, Plus, ShoppingCart, Star, Check, ChevronLeft } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

import { Header } from "@/components/storefront/header"
import { Footer } from "@/components/storefront/footer"
import { CartDrawer } from "@/components/storefront/cart-drawer"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

import { useTenant } from "@/contexts/TenantContext"
import { useCart } from "@/hooks/useCart"
import { storefrontApi } from "@/services/storefront-api"
import type { ProductDetail, ProductVariant } from "@/types/product"

import { RelatedProducts } from "@/components/storefront/related-products"
import { ProductReviews } from "@/components/storefront/product-reviews"
import { TechnicalSpecs } from "@/components/storefront/technical-specs"
import { formatPrice } from "@/lib/format-price"
import { getProductImageUrl } from "@/lib/image-utils"
import { ProductDetailsSkeleton } from "@/components/storefront/product-details-skeleton"

// Product Detail Page with premium loading experience
export default function ProductDetailPage() {
    const params = useParams()
    const router = useRouter()
    const slug = params.slug as string

    // Hooks
    const { tenant } = useTenant()
    const {
        purchaseItems,
        quoteItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        getTotalItems,
    } = useCart()

    // State
    const [product, setProduct] = useState<ProductDetail | null>(null)
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [quantity, setQuantity] = useState(1)
    const [loading, setLoading] = useState(true)
    const [cartOpen, setCartOpen] = useState(false)

    // Load Product Data
    useEffect(() => {
        async function loadProduct() {
            if (!tenant || !slug) return

            try {
                setLoading(true)
                const data = await storefrontApi.getProduct(tenant.slug, slug)
                setProduct(data)

                // Set first variant as default active variant
                if (data.variants && data.variants.length > 0) {
                    // Try to find a default variant or one with stock
                    const defaultVar = data.variants.find(v => v.is_default) || data.variants[0]
                    setSelectedVariant(defaultVar)
                }
            } catch (err) {
                console.error("Error loading product:", err)
            } finally {
                setLoading(false)
            }
        }

        loadProduct()
    }, [tenant, slug])

    // Handlers
    const handleAddToCart = () => {
        if (!product || !selectedVariant) {
            toast.error("Por favor selecciona una variante")
            return
        }

        // Check stock
        if (product.manage_stock && selectedVariant.available_stock < quantity) {
            toast.error(`Solo hay ${selectedVariant.available_stock} unidades disponibles`)
            return
        }

        // Prepare data for cart
        const productForCart: any = {
            ...product,
            category_name: product.category?.name || null,
            primary_image: product.images && product.images.length > 0 ? product.images[0].url : null,
            min_price: selectedVariant.selling_price,
            max_price: selectedVariant.selling_price,
            variants_count: product.variants?.length || 0,
            in_stock: (selectedVariant.available_stock || 0) > 0,
            has_discount: selectedVariant.has_discount,
            min_compare_at_price: selectedVariant.original_price,
        }

        addToCart(productForCart, selectedVariant, quantity)
        toast.success(`${quantity} ${quantity === 1 ? 'unidad agregada' : 'unidades agregadas'} al carrito`)
        setCartOpen(true)
    }

    const handleRequestQuote = () => {
        if (!product || !selectedVariant) return

        const productForCart: any = {
            ...product,
            category_name: product.category?.name || null,
            primary_image: product.images && product.images.length > 0 ? product.images[0].url : null,
            min_price: null,
            max_price: null,
            variants_count: product.variants?.length || 0,
            in_stock: true,
        }

        addToCart(productForCart, selectedVariant, quantity)
        setCartOpen(true)
    }

    const handleCheckout = () => {
        setCartOpen(false)
        router.push("/checkout")
    }

    // Premium Loading State
    if (loading) {
        return <ProductDetailsSkeleton />
    }

    // Not Found State
    if (!product) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-serif">Producto no encontrado</h1>
                    <Button onClick={() => router.push("/")} variant="outline">
                        Volver a la tienda
                    </Button>
                </div>
            </div>
        )
    }

    const currentImage = getProductImageUrl(product.images?.[selectedImageIndex]?.url)

    const isOutOfStock = !product.is_quote_only && Boolean(product.manage_stock) && !!selectedVariant && selectedVariant.available_stock === 0

    return (
        <div className="min-h-screen bg-white">
            <Header
                onCartClick={() => setCartOpen(true)}
            />

            <main className="container mx-auto px-4 py-12 pt-16">

                {/* Back Button */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/")}
                        className="gap-2 pl-0 hover:bg-transparent hover:text-primary"
                    >
                        <ChevronLeft className="size-4" />
                        Volver al Inicio
                    </Button>
                </div>

                {/* Product Main Section */}
                <div className="grid gap-12 lg:grid-cols-2">

                    {/* Image Gallery */}
                    <div className="space-y-4">
                        {/* Main Image */}
                        <div className="aspect-square overflow-hidden rounded-lg bg-muted relative group">
                            <img
                                src={currentImage}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        </div>

                        {/* Thumbnails */}
                        {product.images && product.images.length > 1 && (
                            <div className="grid grid-cols-4 gap-4">
                                {product.images.map((image, index) => (
                                    <button
                                        key={image.id}
                                        onClick={() => setSelectedImageIndex(index)}
                                        className={cn(
                                            "aspect-square overflow-hidden rounded-lg bg-muted relative transition-all",
                                            selectedImageIndex === index
                                                ? "ring-2 ring-primary ring-offset-2"
                                                : "opacity-60 hover:opacity-100"
                                        )}
                                    >
                                        <img
                                            src={getProductImageUrl(image.url)}
                                            alt={`${product.name} view ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-6">
                        {/* Header Info */}
                        <div>
                            <h1 className="font-serif text-4xl font-light tracking-tight text-gray-900">
                                {product.name}
                            </h1>

                            {tenant?.show_product_ratings && (
                                <div className="mt-3 flex items-center gap-4">
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={cn(
                                                    "size-4",
                                                    i < Math.floor(parseFloat(product.average_rating || "0"))
                                                        ? "fill-yellow-400 text-yellow-400"
                                                        : "text-gray-200"
                                                )}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        {product.average_rating || "0.0"} ({product.review_count} opiniones)
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-3">
                            {product.is_quote_only ? (
                                <p className="font-serif text-3xl font-light text-primary">Cotización</p>
                            ) : selectedVariant?.selling_price ? (
                                <>
                                    {selectedVariant.has_discount && selectedVariant.original_price && (
                                        <p className="text-xl text-muted-foreground line-through">
                                            {formatPrice(selectedVariant.original_price, tenant)}
                                        </p>
                                    )}
                                    <p className={cn(
                                        "font-serif text-4xl font-light",
                                        selectedVariant.has_discount ? "text-destructive" : "text-gray-900"
                                    )}>
                                        {formatPrice(selectedVariant.selling_price, tenant)}
                                        {!tenant?.prices_include_tax && tenant?.tax_rate && (
                                            <span className="ml-2 text-lg text-muted-foreground font-normal">
                                                + IVA
                                            </span>
                                        )}
                                    </p>
                                </>
                            ) : (
                                <p className="text-xl text-muted-foreground">Seleccione variante</p>
                            )}
                        </div>

                        <Separator />

                        {/* Short Description */}
                        <p className="text-balance leading-relaxed text-muted-foreground text-lg">
                            {product.short_description || product.description?.substring(0, 150) + "..."}
                        </p>

                        {/* Variants Selector */}
                        {product.variants && product.variants.length > 0 && (
                            <div className="space-y-3">
                                <Label className="text-base font-medium">Variante</Label>
                                <div className="flex flex-wrap gap-2">
                                    {product.variants.map((variant) => (
                                        <button
                                            key={variant.id}
                                            onClick={() => setSelectedVariant(variant)}
                                            disabled={!variant.is_active}
                                            className={cn(
                                                "rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all relative",
                                                selectedVariant?.id === variant.id
                                                    ? "border-primary bg-primary/5 text-primary"
                                                    : "border-gray-200 hover:border-gray-300 text-gray-700",
                                                !variant.is_active && "cursor-not-allowed opacity-50"
                                            )}
                                        >
                                            {variant.name || variant.sku}
                                            {selectedVariant?.id === variant.id && (
                                                <Check className="ml-2 inline size-3.5" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity and Actions */}
                        <div className="space-y-4 pt-4">
                            {!product.is_quote_only && (
                                <div className="flex items-center gap-4">
                                    <Label className="text-base font-medium">Cantidad</Label>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="h-10 w-10"
                                        >
                                            <Minus className="size-4" />
                                        </Button>
                                        <span className="w-12 text-center text-lg font-medium">{quantity}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setQuantity(
                                                product.manage_stock && selectedVariant
                                                    ? Math.min(selectedVariant.available_stock, quantity + 1)
                                                    : quantity + 1
                                            )}
                                            className="h-10 w-10"
                                        >
                                            <Plus className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {product.is_quote_only ? (
                                <Button size="lg" className="w-full text-base h-12" onClick={handleRequestQuote}>
                                    Solicitar Cotización
                                </Button>
                            ) : (
                                <Button
                                    size="lg"
                                    className="w-full text-base h-12"
                                    onClick={handleAddToCart}
                                    disabled={!selectedVariant || isOutOfStock}
                                >
                                    <ShoppingCart className="mr-2 size-5" />
                                    {isOutOfStock ? "Agotado" : "Agregar al Carrito"}
                                </Button>
                            )}
                        </div>

                        {/* Stock Status Box */}
                        {!product.is_quote_only && product.manage_stock && selectedVariant && (
                            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-4 border border-gray-100">
                                <div className={cn(
                                    "size-2.5 rounded-full",
                                    selectedVariant.available_stock > 0 ? "bg-green-500" : "bg-red-500"
                                )} />
                                <span className={cn(
                                    "text-sm font-medium",
                                    selectedVariant.available_stock > 0 ? "text-green-700" : "text-red-700"
                                )}>
                                    {selectedVariant.available_stock > 0
                                        ? `En stock - ${selectedVariant.available_stock} unidades disponibles`
                                        : "Sin stock actualmente"}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs Section */}
                <div className="mt-20">
                    <Tabs defaultValue="description" className="w-full">
                        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-8">
                            <TabsTrigger
                                value="description"
                                className="rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:border-primary data-[state=active]:shadow-none text-base"
                            >
                                Descripción
                            </TabsTrigger>
                            <TabsTrigger
                                value="specifications"
                                className="rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:border-primary data-[state=active]:shadow-none text-base"
                            >
                                Especificaciones
                            </TabsTrigger>
                            {tenant?.allow_reviews && (
                                <TabsTrigger
                                    value="reviews"
                                    className="rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:border-primary data-[state=active]:shadow-none text-base"
                                >
                                    Opiniones ({product.review_count})
                                </TabsTrigger>
                            )}
                        </TabsList>

                        <TabsContent value="description" className="mt-8 animate-in fade-in-50 duration-300">
                            <div className="prose prose-gray max-w-none">
                                <h3 className="font-serif text-2xl font-light mb-4">Descripción Completa</h3>
                                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                                    {product.description}
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="specifications" className="mt-8 animate-in fade-in-50 duration-300">
                            <div className="max-w-3xl">
                                <h3 className="font-serif text-2xl font-light mb-6">Ficha Técnica</h3>
                                {product.specifications && Object.keys(product.specifications).length > 0 ? (
                                    <TechnicalSpecs specifications={product.specifications} />
                                ) : (
                                    <p className="text-muted-foreground italic">No hay especificaciones técnicas disponibles.</p>
                                )}
                            </div>
                        </TabsContent>

                        {tenant?.allow_reviews && (
                            <TabsContent value="reviews" className="mt-8 animate-in fade-in-50 duration-300">
                                <div className="space-y-8 max-w-4xl">
                                    {tenant && (
                                        <ProductReviews
                                            tenantSlug={tenant.slug}
                                            productSlug={product.slug}
                                            averageRating={product.average_rating}
                                            reviewCount={product.review_count}
                                        />
                                    )}
                                </div>
                            </TabsContent>
                        )}
                    </Tabs>
                </div>

                {/* Related Products */}
                {tenant?.show_related_products !== false && (
                    <div className="mt-24 mb-12">
                        {product.category && tenant && (
                            <div className="space-y-8">
                                <h2 className="font-serif text-3xl font-light tracking-tight">Productos Relacionados</h2>
                                <RelatedProducts
                                    tenantSlug={tenant.slug}
                                    categorySlug={product.category.slug}
                                    currentProductId={product.id}
                                />
                            </div>
                        )}
                    </div>
                )}

            </main>

            <Footer />

            <CartDrawer
                open={cartOpen}
                onClose={() => setCartOpen(false)}
                purchaseItems={purchaseItems}
                quoteItems={quoteItems}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
                onCheckout={handleCheckout}
            />
        </div>
    )
}

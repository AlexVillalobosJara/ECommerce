"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Minus, Plus, ShoppingCart, Star, Check, ChevronLeft } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { Header } from "@/components/storefront/header"
import { Footer } from "@/components/storefront/footer"
import { CartDrawer } from "@/components/storefront/cart-drawer"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useCart } from "@/hooks/useCart"
import { storefrontApi } from "@/services/storefront-api"
import type { ProductDetail, ProductVariant } from "@/types/product"
import { RelatedProducts } from "@/components/storefront/related-products"
import { ProductReviews } from "@/components/storefront/product-reviews"
import { TechnicalSpecs } from "@/components/storefront/technical-specs"
import { ProductFeaturesSection } from "@/components/storefront/product-features-section"
import { formatPrice } from "@/lib/format-price"
import { getProductImageUrl } from "@/lib/image-utils"
import { trackViewItem, trackAddToCart } from "@/lib/analytics"
import { getEstimatedShippingDate, formatEstimatedDate } from "@/lib/shipping-utils"
import { Calendar } from "lucide-react"

interface ProductClientPageProps {
    tenant: any
    product: ProductDetail
    relatedProducts: any[]
    categories: any[]
}

export function ProductClientPage({ tenant, product, relatedProducts, categories }: ProductClientPageProps) {
    const router = useRouter()
    const { purchaseItems, quoteItems, addToCart, updateQuantity, removeFromCart } = useCart()

    // Ensure we start at the top on mount
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    // Track product view for analytics
    useEffect(() => {
        trackViewItem(product)
    }, [product])

    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
        product.variants?.find(v => v.is_default) || product.variants?.[0] || null
    )
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [quantity, setQuantity] = useState(1)
    const [cartOpen, setCartOpen] = useState(false)

    const handleAddToCart = () => {
        if (!selectedVariant) {
            toast.error("Por favor selecciona una variante")
            return
        }

        if (product.manage_stock && selectedVariant.available_stock < quantity) {
            toast.error(`Solo hay ${selectedVariant.available_stock} unidades disponibles`)
            return
        }

        const productForCart: any = {
            ...product,
            category_name: product.category?.name || null,
            primary_image: product.images?.[0]?.url || null,
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
        if (!selectedVariant) return
        const productForCart: any = {
            ...product,
            category_name: product.category?.name || null,
            primary_image: product.images?.[0]?.url || null,
            min_price: null,
            max_price: null,
            variants_count: product.variants?.length || 0,
            in_stock: true,
        }
        addToCart(productForCart, selectedVariant, quantity)
        setCartOpen(true)

        // Track add to cart event
        trackAddToCart(product, selectedVariant, quantity)
    }

    const currentImage = getProductImageUrl(product.images?.[selectedImageIndex]?.url)
    const isOutOfStock = !product.is_quote_only && Boolean(product.manage_stock) && !!selectedVariant && selectedVariant.available_stock === 0

    const estimatedDate = getEstimatedShippingDate({
        shippingWorkdays: tenant.shipping_workdays,
        minShippingDays: product.min_shipping_days || 0
    })

    return (
        <div className="min-h-screen bg-white">
            <Header
                onCartClick={() => setCartOpen(true)}
                categories={categories}
                tenant={tenant}
            />

            <main className="container max-w-6xl mx-auto px-4 py-12 pt-16">
                <div className="mb-10">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/")}
                        className="gap-2 pl-0 text-muted-foreground hover:bg-transparent hover:text-black transition-colors"
                    >
                        <ChevronLeft className="size-4" />
                        <span className="text-sm uppercase tracking-widest">Volver</span>
                    </Button>
                </div>

                <div className="grid gap-16 lg:grid-cols-2 lg:items-start">
                    {/* Media Column (Col 1) */}
                    <div className="space-y-6">
                        <div className="aspect-square overflow-hidden rounded-2xl bg-[#F9F9F9] relative group">
                            <Image
                                src={currentImage}
                                alt={product.name}
                                fill
                                priority
                                className="object-contain mix-blend-multiply p-8 transition-transform duration-700 group-hover:scale-105"
                                sizes="(max-width: 1024px) 100vw, 50vw"
                            />
                        </div>

                        {product.images && product.images.length > 1 && (
                            <div className="flex flex-wrap gap-4">
                                {product.images.map((image, index) => (
                                    <button
                                        key={image.id}
                                        onClick={() => setSelectedImageIndex(index)}
                                        className={cn(
                                            "size-20 overflow-hidden rounded-xl bg-[#F9F9F9] border-2 transition-all relative",
                                            selectedImageIndex === index ? "border-black" : "border-transparent opacity-60 hover:opacity-100"
                                        )}
                                    >
                                        <Image
                                            src={getProductImageUrl(image.url)}
                                            alt={product.name}
                                            fill
                                            className="object-contain mix-blend-multiply p-2"
                                            sizes="80px"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                        {product.is_referential_image && (
                            <p className="text-xs text-muted-foreground mt-2 italic">* Las imágenes son referenciales</p>
                        )}
                    </div>

                    {/* Details Column (Col 2) */}
                    <div className="space-y-8 lg:pl-4">
                        <div className="space-y-4">
                            <h1 className="font-serif text-3xl lg:text-4xl lg:leading-tight font-light text-gray-900 tracking-tight">
                                {product.name}
                            </h1>
                            {tenant.show_product_ratings && (
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={cn("size-4", i < Math.floor(parseFloat(product.average_rating || "0")) ? "fill-yellow-400 text-yellow-400" : "text-gray-200")} />
                                        ))}
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground">{product.average_rating || "0.0"}</span>
                                    <span className="text-xs text-muted-foreground uppercase tracking-widest">{product.review_count} opiniones</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            {product.is_quote_only ? (
                                <p className="font-serif text-2xl font-light text-primary tracking-tight">Solicitar Cotización</p>
                            ) : selectedVariant?.selling_price ? (
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-4">
                                        {selectedVariant.has_discount && selectedVariant.original_price && (
                                            <span className="text-xl text-gray-400 line-through font-light">
                                                {formatPrice(selectedVariant.original_price, tenant)}
                                            </span>
                                        )}
                                        <span className={cn("font-serif text-3xl lg:text-4xl font-medium tracking-tight", selectedVariant.has_discount ? "text-[#E63946]" : "text-gray-900")}>
                                            {formatPrice(selectedVariant.selling_price, tenant)}
                                        </span>
                                    </div>
                                    {tenant.prices_include_tax && (
                                        <p className="text-xs text-muted-foreground mt-1">(IVA incluido)</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xl text-muted-foreground italic">Seleccione una opción</p>
                            )}
                        </div>

                        <Separator className="bg-gray-100" />

                        <div className="prose prose-gray max-w-none">
                            <p className="text-balance leading-relaxed text-gray-600 text-lg lg:text-xl font-light">
                                {product.short_description ? (
                                    product.short_description.split(/(\*\*.*?\*\*)/g).map((part, i) =>
                                        part.startsWith('**') && part.endsWith('**') ?
                                            <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong> :
                                            part
                                    )
                                ) : (
                                    product.description?.substring(0, 150) + "..."
                                )}
                            </p>
                        </div>

                        {product.variants && product.variants.length > 0 && (
                            <div className="space-y-4">
                                <Label className="text-sm font-semibold uppercase tracking-wider text-gray-900">Tamaño</Label>
                                <div className="flex flex-wrap gap-3">
                                    {product.variants.map((v) => (
                                        <button
                                            key={v.id}
                                            onClick={() => setSelectedVariant(v)}
                                            disabled={!v.is_active}
                                            className={cn(
                                                "min-w-[80px] rounded-full border px-6 py-2.5 text-sm font-medium transition-all",
                                                selectedVariant?.id === v.id ? "border-primary bg-primary text-[var(--secondary-text)]" : "border-gray-200 hover:border-black text-gray-600",
                                                !v.is_active && "cursor-not-allowed opacity-30"
                                            )}
                                        >
                                            {v.name || v.sku}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-6 pt-4">
                            {!product.is_quote_only && (
                                <div className="flex items-center gap-6">
                                    <Label className="text-sm font-semibold uppercase tracking-wider text-gray-900">Cantidad</Label>
                                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-11">
                                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 hover:bg-gray-50 transition-colors"><Minus className="size-3.5" /></button>
                                        <span className="w-10 text-center text-sm font-bold border-x border-gray-200 bg-white leading-10">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(product.manage_stock && selectedVariant ? Math.min(selectedVariant.available_stock, quantity + 1) : quantity + 1)}
                                            className="px-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <Plus className="size-3.5" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                {product.is_quote_only ? (
                                    <Button size="lg" className="w-full h-14 bg-black hover:bg-gray-900 text-white rounded-xl text-md font-medium uppercase tracking-widest shadow-lg shadow-black/5" onClick={handleRequestQuote}>
                                        Solicitar Cotización
                                    </Button>
                                ) : (
                                    <Button size="lg" className="w-full h-14 bg-primary text-[var(--secondary-text)] hover:bg-primary/90 rounded-xl text-md font-medium uppercase tracking-widest shadow-lg shadow-black/5 flex items-center justify-center gap-3" onClick={handleAddToCart} disabled={!selectedVariant || isOutOfStock}>
                                        <ShoppingCart className="size-5" />
                                        {isOutOfStock ? "Agotado" : "Agregar al Carrito"}
                                    </Button>
                                )}

                                {!product.is_quote_only && product.manage_stock && selectedVariant && (
                                    <div className="flex items-center gap-3 rounded-2xl bg-[#F6F6F6] px-5 py-4 border border-gray-50">
                                        <div className={cn("size-2 rounded-full", selectedVariant.available_stock > 0 ? "bg-[#10B981]" : "bg-[#EF4444]")} />
                                        <span className="text-sm font-medium text-gray-700">
                                            {selectedVariant.available_stock > 0 ? "En stock - Envío inmediato" : "Sin stock actualmente"}
                                        </span>
                                    </div>
                                )}

                                {estimatedDate && !product.is_quote_only && (
                                    <div className="flex items-start gap-3 rounded-2xl bg-primary/5 px-5 py-4 border border-primary/10">
                                        <Calendar className="size-5 text-primary shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-primary">Fecha estimada de entrega:</p>
                                            <p className="text-sm text-gray-700 mt-0.5 capitalize">
                                                {formatEstimatedDate(estimatedDate)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-20">
                    <Tabs defaultValue="description" className="w-full">
                        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-8">
                            <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:border-primary data-[state=active]:shadow-none text-base">Descripción</TabsTrigger>
                            <TabsTrigger value="specifications" className="rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:border-primary data-[state=active]:shadow-none text-base">Especificaciones</TabsTrigger>
                            {tenant.allow_reviews && <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:border-primary data-[state=active]:shadow-none text-base">Opiniones ({product.review_count})</TabsTrigger>}
                        </TabsList>
                        <TabsContent value="description" className="mt-8">
                            <div className="prose prose-gray max-w-none">
                                <h3 className="font-serif text-2xl font-light mb-4">Descripción Completa</h3>
                                <div
                                    className="text-gray-600 leading-relaxed space-y-4"
                                    dangerouslySetInnerHTML={{
                                        __html: product.description?.replace(/\n/g, '<br/>') || ""
                                    }}
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="specifications" className="mt-8">
                            <div className="max-w-3xl">
                                <h3 className="font-serif text-2xl font-light mb-6">Ficha Técnica</h3>
                                {product.specifications ? <TechnicalSpecs specifications={product.specifications} /> : <p className="text-muted-foreground italic">No hay especificaciones.</p>}
                            </div>
                        </TabsContent>
                        {tenant.allow_reviews && (
                            <TabsContent value="reviews" className="mt-8">
                                <ProductReviews tenantSlug={tenant.slug} productSlug={product.slug} averageRating={product.average_rating} reviewCount={product.review_count} />
                            </TabsContent>
                        )}
                    </Tabs>
                </div>

                {/* Product Features Section */}
                <ProductFeaturesSection features={product.features || []} />

                {tenant.show_related_products !== false && product.category && (
                    <div className="mt-24 mb-12">
                        <h2 className="font-serif text-3xl font-light tracking-tight">Productos Relacionados</h2>
                        <RelatedProducts
                            tenantSlug={tenant.slug}
                            categorySlug={product.category.slug}
                            currentProductId={product.id}
                            initialProducts={relatedProducts}
                        />
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
                onCheckout={() => router.push("/checkout")}
            />
        </div>
    )
}

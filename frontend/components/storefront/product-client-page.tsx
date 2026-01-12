"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Minus, Plus, ShoppingCart, Star, Check, ChevronLeft } from "lucide-react"
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
import { formatPrice } from "@/lib/format-price"
import { getProductImageUrl } from "@/lib/image-utils"

interface ProductClientPageProps {
    tenant: any
    product: ProductDetail
    relatedProducts: any[]
}

export function ProductClientPage({ tenant, product, relatedProducts }: ProductClientPageProps) {
    const router = useRouter()
    const { purchaseItems, quoteItems, addToCart, updateQuantity, removeFromCart } = useCart()

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
    }

    const currentImage = getProductImageUrl(product.images?.[selectedImageIndex]?.url)
    const isOutOfStock = !product.is_quote_only && Boolean(product.manage_stock) && !!selectedVariant && selectedVariant.available_stock === 0

    return (
        <div className="min-h-screen bg-white">
            <Header onCartClick={() => setCartOpen(true)} />

            <main className="container mx-auto px-4 py-12 pt-16">
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

                <div className="grid gap-12 lg:grid-cols-2">
                    <div className="space-y-4">
                        <div className="aspect-square overflow-hidden rounded-lg bg-muted relative group">
                            <img
                                src={currentImage}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        </div>

                        {product.images && product.images.length > 1 && (
                            <div className="grid grid-cols-4 gap-4">
                                {product.images.map((image, index) => (
                                    <button
                                        key={image.id}
                                        onClick={() => setSelectedImageIndex(index)}
                                        className={cn(
                                            "aspect-square overflow-hidden rounded-lg bg-muted relative transition-all",
                                            selectedImageIndex === index ? "ring-2 ring-primary ring-offset-2" : "opacity-60 hover:opacity-100"
                                        )}
                                    >
                                        <img src={getProductImageUrl(image.url)} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h1 className="font-serif text-4xl font-light tracking-tight text-gray-900">{product.name}</h1>
                            {tenant.show_product_ratings && (
                                <div className="mt-3 flex items-center gap-4">
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={cn("size-4", i < Math.floor(parseFloat(product.average_rating || "0")) ? "fill-yellow-400 text-yellow-400" : "text-gray-200")} />
                                        ))}
                                    </div>
                                    <span className="text-sm text-muted-foreground">{product.average_rating || "0.0"} ({product.review_count} opiniones)</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-baseline gap-3">
                            {product.is_quote_only ? (
                                <p className="font-serif text-3xl font-light text-primary">Cotización</p>
                            ) : selectedVariant?.selling_price ? (
                                <>
                                    {selectedVariant.has_discount && selectedVariant.original_price && (
                                        <p className="text-xl text-muted-foreground line-through">{formatPrice(selectedVariant.original_price, tenant)}</p>
                                    )}
                                    <p className={cn("font-serif text-4xl font-light", selectedVariant.has_discount ? "text-destructive" : "text-gray-900")}>
                                        {formatPrice(selectedVariant.selling_price, tenant)}
                                        {!tenant.prices_include_tax && tenant.tax_rate && <span className="ml-2 text-lg text-muted-foreground font-normal">+ IVA</span>}
                                    </p>
                                </>
                            ) : (
                                <p className="text-xl text-muted-foreground">Seleccione variante</p>
                            )}
                        </div>

                        <Separator />
                        <p className="text-balance leading-relaxed text-muted-foreground text-lg">
                            {product.short_description || product.description?.substring(0, 150) + "..."}
                        </p>

                        {product.variants && product.variants.length > 0 && (
                            <div className="space-y-3">
                                <Label className="text-base font-medium">Variante</Label>
                                <div className="flex flex-wrap gap-2">
                                    {product.variants.map((v) => (
                                        <button
                                            key={v.id}
                                            onClick={() => setSelectedVariant(v)}
                                            disabled={!v.is_active}
                                            className={cn(
                                                "rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all relative",
                                                selectedVariant?.id === v.id ? "border-primary bg-primary/5 text-primary" : "border-gray-200 hover:border-gray-300 text-gray-700",
                                                !v.is_active && "cursor-not-allowed opacity-50"
                                            )}
                                        >
                                            {v.name || v.sku}
                                            {selectedVariant?.id === v.id && <Check className="ml-2 inline size-3.5" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 pt-4">
                            {!product.is_quote_only && (
                                <div className="flex items-center gap-4">
                                    <Label className="text-base font-medium">Cantidad</Label>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-10 w-10"><Minus className="size-4" /></Button>
                                        <span className="w-12 text-center text-lg font-medium">{quantity}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setQuantity(product.manage_stock && selectedVariant ? Math.min(selectedVariant.available_stock, quantity + 1) : quantity + 1)}
                                            className="h-10 w-10"
                                        >
                                            <Plus className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {product.is_quote_only ? (
                                <Button size="lg" className="w-full text-base h-12" onClick={handleRequestQuote}>Solicitar Cotización</Button>
                            ) : (
                                <Button size="lg" className="w-full text-base h-12" onClick={handleAddToCart} disabled={!selectedVariant || isOutOfStock}>
                                    <ShoppingCart className="mr-2 size-5" />
                                    {isOutOfStock ? "Agotado" : "Agregar al Carrito"}
                                </Button>
                            )}
                        </div>

                        {!product.is_quote_only && product.manage_stock && selectedVariant && (
                            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-4 border border-gray-100">
                                <div className={cn("size-2.5 rounded-full", selectedVariant.available_stock > 0 ? "bg-green-500" : "bg-red-500")} />
                                <span className={cn("text-sm font-medium", selectedVariant.available_stock > 0 ? "text-green-700" : "text-red-700")}>
                                    {selectedVariant.available_stock > 0 ? `En stock - ${selectedVariant.available_stock} unidades disponibles` : "Sin stock actualmente"}
                                </span>
                            </div>
                        )}
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
                                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>
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

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/storefront/header"
import { Footer } from "@/components/storefront/footer"
import { ProductCard } from "@/components/storefront/product-card"
import { ProductGridSkeleton } from "@/components/storefront/product-skeleton"
import { CartDrawer } from "@/components/storefront/cart-drawer"
import { ProductFiltersSidebar, type ProductFilters } from "@/components/storefront/product-filters"
import { useCart } from "@/hooks/useCart"
import { storefrontApi } from "@/services/storefront-api"
import type { Category, ProductList } from "@/types/product"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getImageUrl } from "@/lib/image-utils"
import { trackViewItemList, trackAddToCart as trackAnalyticsAddToCart } from "@/lib/analytics"

interface CategoryClientPageProps {
    tenant: any
    category: Category
    allCategories: Category[]
    initialProducts: ProductList[]
}

export function CategoryClientPage({
    tenant,
    category,
    allCategories,
    initialProducts
}: CategoryClientPageProps) {
    const router = useRouter()
    const { purchaseItems, quoteItems, addToCart, updateQuantity, removeFromCart } = useCart()

    const [products, setProducts] = useState<ProductList[]>(initialProducts)
    const [productsLoading, setProductsLoading] = useState(false)
    const [filters, setFilters] = useState<ProductFilters>({ category: category.slug })
    const [cartOpen, setCartOpen] = useState(false)

    // Track view_item_list when products change
    useEffect(() => {
        if (products.length > 0) {
            trackViewItemList(category.name, products)
        }
    }, [products, category.name])

    // Sync products when filters change
    useEffect(() => {
        // Skip initial load since we have initialProducts
        const hasFilters = Object.keys(filters).length > 1 || (filters.category !== category.slug);
        if (!hasFilters) return;

        async function loadFilteredProducts() {
            try {
                setProductsLoading(true)
                const queryParams: any = {
                    category: filters.category !== 'all' ? filters.category : undefined,
                    min_price: filters.minPrice,
                    max_price: filters.maxPrice,
                    in_stock: filters.inStock ? 'true' : undefined,
                    ordering: filters.ordering,
                }
                const data = await storefrontApi.getProducts(tenant.slug, queryParams)
                setProducts(data)
            } catch (err) {
                console.error("Error loading products:", err)
            } finally {
                setProductsLoading(false)
            }
        }

        loadFilteredProducts()
    }, [tenant.slug, filters, category.slug])

    const handleFiltersChange = (newFilters: ProductFilters) => {
        if (newFilters.category && newFilters.category !== category.slug && newFilters.category !== 'all') {
            router.push(`/category/${newFilters.category}`)
            return
        }
        if (newFilters.category === 'all') {
            router.push('/')
            return
        }
        setFilters(newFilters)
    }

    const handleAddToCart = async (product: ProductList) => {
        try {
            const fullProduct = await storefrontApi.getProduct(tenant.slug, product.slug)
            const defaultVariant = fullProduct.variants?.[0]
            if (defaultVariant) {
                addToCart(product, defaultVariant, 1)
                setCartOpen(true)

                // Track add to cart event
                trackAnalyticsAddToCart(product, defaultVariant, 1)
            }
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="flex min-h-screen flex-col bg-white">
            <Header
                onCartClick={() => setCartOpen(true)}
                categories={allCategories}
            />

            <main className="flex-1">
                <div className="relative bg-muted/30 py-12 md:py-16 overflow-hidden">
                    {category.image_url && (
                        <div className="absolute inset-0 z-0">
                            <img
                                src={getImageUrl(category.image_url)}
                                alt={category.name}
                                className="w-full h-full object-cover opacity-20 blur-sm"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-white/80 to-white/40" />
                        </div>
                    )}
                    <div className="container relative z-10 mx-auto px-4 text-center">
                        <Link
                            href="/"
                            className="absolute top-8 left-4 md:left-8 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                            <ArrowLeft className="h-4 w-4" /> Volver
                        </Link>

                        <h1 className="font-serif text-3xl font-light tracking-tight md:text-4xl lg:text-5xl">
                            {category.name}
                        </h1>
                        {category.description && (
                            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground font-light">
                                {category.description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="container mx-auto px-4 py-12">
                    <div className="mb-8 flex items-center justify-between lg:hidden">
                        <div className="text-sm text-muted-foreground">
                            {products.length} {products.length === 1 ? "producto" : "productos"}
                        </div>
                        <ProductFiltersSidebar
                            categories={allCategories}
                            filters={filters}
                            onFiltersChange={handleFiltersChange}
                        />
                    </div>

                    <div className="flex gap-12">
                        <div className="hidden w-[260px] shrink-0 lg:block">
                            <div className="sticky top-24">
                                <ProductFiltersSidebar
                                    categories={allCategories}
                                    filters={filters}
                                    onFiltersChange={handleFiltersChange}
                                />
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="mb-6 hidden items-center justify-between lg:flex">
                                <p className="text-muted-foreground">
                                    Mostrando {products.length} resultados
                                </p>
                            </div>

                            {productsLoading ? (
                                <ProductGridSkeleton count={6} />
                            ) : products.length === 0 ? (
                                <div className="text-center py-20 bg-muted/10 rounded-lg">
                                    <p className="text-lg text-muted-foreground">No hay productos disponibles.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {products.map((product, index) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            onAddToCart={handleAddToCart}
                                            priority={index < 4}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
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

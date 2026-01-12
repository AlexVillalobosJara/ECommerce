"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/storefront/header"
import { HeroSection } from "@/components/storefront/hero-section"
import { CategoriesSection } from "@/components/storefront/categories-section"
import { ProductCard } from "@/components/storefront/product-card"
import { ProductGridSkeleton } from "@/components/storefront/product-skeleton"
import { ProductFiltersSidebar, ProductFilters } from "@/components/storefront/product-filters"
import { Footer } from "@/components/storefront/footer"
import { CartDrawer } from "@/components/storefront/cart-drawer"
import { useCart } from "@/hooks/useCart"
import { storefrontApi } from "@/services/storefront-api"
import { CatalogCTA } from "@/components/storefront/catalog-cta"
import type { Category, ProductList } from "@/types/product"

interface StorefrontClientPageProps {
    initialData: {
        tenant: any
        categories: Category[]
        featured_products: ProductList[]
    }
}

// Sub-component for Product Listing (Client Side)
function ProductListing({
    tenantSlug,
    categories,
    initialProducts,
    onAddToCart
}: {
    tenantSlug: string,
    categories: Category[],
    initialProducts: ProductList[],
    onAddToCart: (product: ProductList) => void
}) {
    const [products, setProducts] = useState<ProductList[]>(initialProducts)
    const [productsLoading, setProductsLoading] = useState(false)
    const [filters, setFilters] = useState<ProductFilters>({})
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Only fetch if filters are applied
        const hasFilters = Object.keys(filters).length > 0;
        if (!hasFilters) return;

        async function loadFilteredProducts() {
            try {
                setProductsLoading(true)
                const params: any = {
                    category: filters.category,
                    min_price: filters.minPrice,
                    max_price: filters.maxPrice,
                    in_stock: filters.inStock ? 'true' : undefined,
                    ordering: filters.ordering,
                    featured: true // Usually home page shows featured
                }
                const data = await storefrontApi.getProducts(tenantSlug, params)
                setProducts(data)
            } catch (err) {
                console.error(err)
            } finally {
                setProductsLoading(false)
            }
        }
        loadFilteredProducts()
    }, [tenantSlug, filters])

    return (
        <section id="featured-products" className="container mx-auto px-4 py-20">
            <div className="mb-12 flex items-center justify-between">
                <div>
                    <h2 className="font-serif text-4xl font-light tracking-tight">
                        {Object.keys(filters).length > 0 ? "Nuestros Productos" : "Colección Destacada"}
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        {products.length} {products.length === 1 ? "producto" : "productos"}
                    </p>
                </div>
                <div className="lg:hidden">
                    <ProductFiltersSidebar
                        categories={categories}
                        filters={filters}
                        onFiltersChange={setFilters}
                    />
                </div>
            </div>

            <div className="flex gap-12">
                <div className="hidden w-[240px] shrink-0 lg:block">
                    <div className="sticky top-24">
                        <ProductFiltersSidebar
                            categories={categories}
                            filters={filters}
                            onFiltersChange={setFilters}
                        />
                    </div>
                </div>

                <div className="flex-1">
                    {productsLoading ? (
                        <ProductGridSkeleton count={6} />
                    ) : (
                        <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                            {products.map((product, index) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onAddToCart={onAddToCart}
                                    priority={index < 4} // Adidas style LCP priority
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}

export function StorefrontClientPage({ initialData }: StorefrontClientPageProps) {
    const router = useRouter()
    const { tenant, categories, featured_products } = initialData
    const {
        purchaseItems,
        quoteItems,
        updateQuantity,
        removeFromCart,
        addToCart
    } = useCart()

    const [cartOpen, setCartOpen] = useState(false)

    const handleCheckout = () => {
        setCartOpen(false)
        router.push("/checkout")
    }

    const handleAddToCart = async (product: ProductList) => {
        try {
            const fullProduct = await storefrontApi.getProduct(tenant.slug, product.slug)
            const defaultVariant = fullProduct.variants?.[0]
            if (defaultVariant) {
                addToCart(product, defaultVariant, 1)
                setCartOpen(true)
            }
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="min-h-screen bg-white">
            <Header onCartClick={() => setCartOpen(true)} />

            <HeroSection
                title={tenant.hero_title || "El Arte del Diseño Minimalista"}
                subtitle={tenant.hero_subtitle || "Cada pieza cuenta una historia de elegancia y funcionalidad"}
                ctaText={tenant.hero_cta_text || "Explorar Colección"}
                backgroundImage={tenant.hero_image_url || "/hero-stainless-kitchen.jpg"}
                onCtaClick={() => {
                    document.getElementById('featured-products')?.scrollIntoView({ behavior: 'smooth' });
                }}
                priority // Always priority on home page
            />

            <CategoriesSection categories={categories} />

            <ProductListing
                tenantSlug={tenant.slug}
                categories={categories}
                initialProducts={featured_products}
                onAddToCart={handleAddToCart}
            />

            <CatalogCTA />
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

"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/storefront/header"
import { Footer } from "@/components/storefront/footer"
import { ProductCard } from "@/components/storefront/product-card"
import { ProductGridSkeleton } from "@/components/storefront/product-skeleton"
import { CartDrawer } from "@/components/storefront/cart-drawer"
import { ProductFiltersSidebar, type ProductFilters } from "@/components/storefront/product-filters"
import { useTenant } from "@/contexts/TenantContext"
import { useCart } from "@/hooks/useCart"
import { storefrontApi } from "@/services/storefront-api"
import type { Category, ProductList } from "@/types/product"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getImageUrl } from "@/lib/image-utils"
import { CategoryPageSkeleton } from "@/components/storefront/category-skeleton"

export default function CategoryPage() {
    const params = useParams()
    const router = useRouter()
    const { tenant, loading: tenantLoading } = useTenant()
    const {
        purchaseItems,
        quoteItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        getTotalItems,
    } = useCart()

    const [category, setCategory] = useState<Category | null>(null)
    const [allCategories, setAllCategories] = useState<Category[]>([])
    const [products, setProducts] = useState<ProductList[]>([])
    const [loading, setLoading] = useState(true)
    const [productsLoading, setProductsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [cartOpen, setCartOpen] = useState(false)

    // Slug from URL
    const slug = typeof params.slug === 'string' ? params.slug : ''

    // Filters state
    const [filters, setFilters] = useState<ProductFilters>({ category: slug })

    // Load Category Info and All Categories (once)
    useEffect(() => {
        async function loadInitialData() {
            if (!tenant || !slug) return

            try {
                setLoading(true)
                // Fetch current category details and list of all categories
                const [categoryData, categoriesList] = await Promise.all([
                    storefrontApi.getCategoryBySlug(tenant.slug, slug),
                    storefrontApi.getCategories(tenant.slug)
                ])
                setCategory(categoryData)
                setAllCategories(categoriesList)
                // Initialize filters with current category
                setFilters(prev => ({ ...prev, category: slug }))
            } catch (err) {
                console.error("Error loading category info:", err)
                setError("No pudimos cargar la categoría solicitada.")
            } finally {
                setLoading(false)
            }
        }
        loadInitialData()
    }, [tenant, slug])

    // Load Products when filters change
    useEffect(() => {
        async function loadProducts() {
            if (!tenant || !slug) return

            try {
                setProductsLoading(true)

                // Build params from filters
                const queryParams: any = {}
                if (filters.category && filters.category !== 'all') queryParams.category = filters.category
                if (filters.minPrice) queryParams.min_price = filters.minPrice
                if (filters.maxPrice) queryParams.max_price = filters.maxPrice
                if (filters.inStock) queryParams.in_stock = 'true'
                if (filters.ordering) queryParams.ordering = filters.ordering

                const productsData = await storefrontApi.getProducts(tenant.slug, queryParams)
                setProducts(productsData)
            } catch (err) {
                console.error("Error loading products:", err)
            } finally {
                setProductsLoading(false)
            }
        }

        loadProducts()
    }, [tenant, filters, slug])

    const handleFiltersChange = (newFilters: ProductFilters) => {
        // Check if category changed
        if (newFilters.category && newFilters.category !== slug && newFilters.category !== 'all') {
            // Navigate to new category page
            router.push(`/category/${newFilters.category}`)
            return
        }
        if (newFilters.category === 'all') {
            router.push('/') // Go to home or all products page? Home for now.
            return
        }

        setFilters(newFilters)
    }

    const handleAddToCart = async (product: ProductList) => {
        if (!tenant) return

        try {
            const fullProduct = await storefrontApi.getProduct(tenant.slug, product.slug)
            const defaultVariant = fullProduct.variants && fullProduct.variants.length > 0
                ? fullProduct.variants[0]
                : null

            if (!defaultVariant) {
                alert("Este producto no tiene variantes disponibles")
                return
            }

            addToCart(product, defaultVariant, 1)
            setCartOpen(true)
        } catch (err) {
            console.error("Error adding to cart:", err)
            alert("Error al agregar el producto")
        }
    }

    const handleRequestQuote = async (product: ProductList) => {
        if (!tenant) return

        try {
            const fullProduct = await storefrontApi.getProduct(tenant.slug, product.slug)
            const defaultVariant = fullProduct.variants && fullProduct.variants.length > 0
                ? fullProduct.variants[0]
                : null

            if (!defaultVariant) {
                alert("Este producto no tiene variantes disponibles")
                return
            }

            addToCart(product, defaultVariant, 1)
            setCartOpen(true)
        } catch (err) {
            console.error("Error adding to quote:", err)
            alert("Error al solicitar cotización")
        }
    }

    if (tenantLoading || loading) {
        return <CategoryPageSkeleton />
    }

    if (error || !category) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center">
                        <p className="text-xl text-muted-foreground mb-4">{error || "Categoría no encontrada"}</p>
                        <Link href="/" className="text-primary hover:underline flex items-center justify-center gap-2">
                            <ArrowLeft className="h-4 w-4" /> Volver al inicio
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col bg-white">
            <Header
                onCartClick={() => setCartOpen(true)}
            />

            <main className="flex-1">
                {/* Hero / Header Section */}
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

                {/* Content Section with Sidebar */}
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
                        {/* Desktop Filters Sidebar */}
                        <div className="hidden w-[260px] shrink-0 lg:block">
                            <div className="sticky top-24">
                                <ProductFiltersSidebar
                                    categories={allCategories}
                                    filters={filters}
                                    onFiltersChange={handleFiltersChange}
                                />
                            </div>
                        </div>

                        {/* Products Grid */}
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
                                    <p className="text-lg text-muted-foreground">No hay productos disponibles con los filtros seleccionados.</p>
                                    <button
                                        onClick={() => setFilters({ category: slug })}
                                        className="mt-4 text-sm font-medium underline"
                                    >
                                        Limpiar filtros
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                                    {products.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            onAddToCart={handleAddToCart}
                                            onRequestQuote={handleRequestQuote}
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
                onCheckout={() => {
                    setCartOpen(false)
                    router.push("/checkout")
                }}
            />
        </div>
    )
}

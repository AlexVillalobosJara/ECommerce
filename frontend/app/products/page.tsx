"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/storefront/header"
import { Footer } from "@/components/storefront/footer"
import { CartDrawer } from "@/components/storefront/cart-drawer"
import { ProductGrid } from "@/components/storefront/product-grid"
import { ProductFiltersSidebar, type ProductFilters } from "@/components/storefront/product-filters"
import { useTenant } from "@/contexts/TenantContext"
import { useCart } from "@/hooks/useCart"
import { storefrontApi } from "@/services/storefront-api"
import type { Category, ProductList } from "@/types/product"
import { Loader2, ChevronRight } from "lucide-react"
import { ProductGridSkeleton } from "@/components/storefront/product-skeleton"

function ProductsContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { tenant } = useTenant()
    const { addToCart, updateQuantity, removeFromCart, purchaseItems, quoteItems } = useCart()

    // State
    const [categories, setCategories] = useState<Category[]>([])
    const [products, setProducts] = useState<ProductList[]>([])
    const [loading, setLoading] = useState(true)
    const [cartOpen, setCartOpen] = useState(false)

    // Derive filters from URL
    const filters: ProductFilters = {
        category: searchParams.get("category") || undefined,
        minPrice: searchParams.get("min_price") ? Number(searchParams.get("min_price")) : undefined,
        maxPrice: searchParams.get("max_price") ? Number(searchParams.get("max_price")) : undefined,
        inStock: searchParams.get("in_stock") === "true",
        ordering: searchParams.get("ordering") || undefined,
        search: searchParams.get("search") || undefined
    }

    // Load Data
    useEffect(() => {
        if (!tenant) return

        async function loadData() {
            setLoading(true)
            try {
                const params: any = {}
                if (filters.category && filters.category !== 'all') params.category = filters.category
                if (filters.minPrice) params.min_price = filters.minPrice
                if (filters.maxPrice) params.max_price = filters.maxPrice
                if (filters.inStock) params.in_stock = 'true'
                if (filters.ordering) params.ordering = filters.ordering
                if (filters.search) params.search = filters.search

                // Parallel fetch
                // tenant is checked above, force TS knowledge
                const [cats, prods] = await Promise.all([
                    storefrontApi.getCategories(tenant!.slug),
                    storefrontApi.getProducts(tenant!.slug, params)
                ])
                setCategories(cats)
                setProducts(prods)
            } catch (error) {
                console.error("Failed to load products", error)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [tenant, searchParams]) // Depend on searchParams to refetch

    const handleFiltersChange = (newFilters: ProductFilters) => {
        const params = new URLSearchParams()
        if (newFilters.category && newFilters.category !== 'all') params.set("category", newFilters.category)
        if (newFilters.minPrice) params.set("min_price", newFilters.minPrice.toString())
        if (newFilters.maxPrice) params.set("max_price", newFilters.maxPrice.toString())
        if (newFilters.inStock) params.set("in_stock", "true")
        if (newFilters.ordering) params.set("ordering", newFilters.ordering)

        router.push(`/products?${params.toString()}`)
    }

    const handleAddToCart = async (product: ProductList) => {
        if (!tenant) return

        try {
            // Fetch the full product with variants
            const fullProduct = await storefrontApi.getProduct(tenant.slug, product.slug)

            // Get the first available variant
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
            console.error("Error loading product variants:", err)
            alert("Error al agregar el producto al carrito")
        }
    }

    const handleRequestQuote = async (product: ProductList) => {
        if (!tenant) return

        try {
            // Fetch the full product with variants
            const fullProduct = await storefrontApi.getProduct(tenant.slug, product.slug)

            // Get the first variant
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
            console.error("Error loading product variants:", err)
            alert("Error al solicitar cotización")
        }
    }

    const handleCheckout = () => {
        setCartOpen(false)
        router.push("/checkout")
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Header onCartClick={() => setCartOpen(true)} />
            <main className="flex-1 container mx-auto px-4 py-8">
                {/* Breadcrumbs / Title */}
                <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/" className="hover:text-foreground transition-colors">Inicio</Link>
                    <ChevronRight className="size-4" />
                    <span className="text-foreground">Productos</span>
                </nav>
                <h1 className="text-3xl font-serif mb-8">Productos</h1>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar - Force remount on filter change to sync UI */}
                    <div className="w-full lg:w-64 shrink-0">
                        <ProductFiltersSidebar
                            key={searchParams.toString()}
                            categories={categories}
                            filters={filters}
                            onFiltersChange={handleFiltersChange}
                        />
                    </div>

                    {/* Grid */}
                    <div className="flex-1">
                        {loading ? (
                            <ProductGridSkeleton count={8} />
                        ) : products.length > 0 ? (
                            <ProductGrid
                                products={products}
                                onAddToCart={handleAddToCart}
                                onRequestQuote={handleRequestQuote}
                            />
                        ) : (
                            <div className="text-center py-20 text-muted-foreground">
                                No se encontraron productos.
                            </div>
                        )}
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
                onCheckout={handleCheckout}
            />
        </div>
    )
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
            <ProductsContent />
        </Suspense>
    )
}

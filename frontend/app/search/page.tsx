"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/storefront/header"
import { Footer } from "@/components/storefront/footer"
import { ProductCard } from "@/components/storefront/product-card"
import { CartDrawer } from "@/components/storefront/cart-drawer"
import { useTenant } from "@/contexts/TenantContext"
import { useCart } from "@/hooks/useCart"
import { storefrontApi } from "@/services/storefront-api"
import type { ProductList } from "@/types/product"
import { useRouter } from "next/navigation"
import { Suspense } from "react"

function SearchContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const query = searchParams.get("q") || ""

    const { tenant } = useTenant()
    const {
        purchaseItems,
        quoteItems,
        updateQuantity,
        removeFromCart,
        getTotalItems,
    } = useCart()

    const [products, setProducts] = useState<ProductList[]>([])
    const [loading, setLoading] = useState(true)
    const [cartOpen, setCartOpen] = useState(false)

    useEffect(() => {
        async function searchProducts() {
            if (!tenant || !query) {
                setProducts([])
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                const results = await storefrontApi.getProducts(tenant.slug, { search: query })
                setProducts(results)
            } catch (err) {
                console.error("Search error:", err)
                setProducts([])
            } finally {
                setLoading(false)
            }
        }

        searchProducts()
    }, [tenant, query])

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

            const { addToCart } = useCart()
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
            const fullProduct = await storefrontApi.getProduct(tenant.slug, product.slug)
            const defaultVariant = fullProduct.variants && fullProduct.variants.length > 0
                ? fullProduct.variants[0]
                : null

            if (!defaultVariant) {
                alert("Este producto no tiene variantes disponibles")
                return
            }

            const { addToCart } = useCart()
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
        <div className="min-h-screen bg-white">
            <Header
                onCartClick={() => setCartOpen(true)}
            />

            <main className="container mx-auto px-4 py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">
                        Resultados para "{query}"
                    </h1>
                    {!loading && (
                        <p className="mt-2 text-muted-foreground">
                            {products.length} {products.length === 1 ? "producto encontrado" : "productos encontrados"}
                        </p>
                    )}
                </div>

                {loading ? (
                    <div className="text-center">
                        <p className="text-muted-foreground">Buscando...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-lg text-muted-foreground mb-4">
                            No se encontraron productos para "{query}"
                        </p>
                        <button
                            onClick={() => router.push("/")}
                            className="text-primary underline"
                        >
                            Volver a la tienda
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white flex flex-col items-center justify-center"><p className="text-muted-foreground">Buscando...</p></div>}>
            <SearchContent />
        </Suspense>
    )
}

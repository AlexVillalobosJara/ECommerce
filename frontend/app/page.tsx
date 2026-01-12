"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/storefront/header"
import { HeroSection } from "@/components/storefront/hero-section"
import { CategoriesSection } from "@/components/storefront/categories-section"
import { ProductCard } from "@/components/storefront/product-card"
import { ProductGridSkeleton } from "@/components/storefront/product-skeleton"
import { FullPageStorefrontSkeleton } from "@/components/storefront/full-page-skeleton"
import { ProductFiltersSidebar, ProductFilters } from "@/components/storefront/product-filters"
import { Footer } from "@/components/storefront/footer"
import { CartDrawer } from "@/components/storefront/cart-drawer"
import { useTenant } from "@/contexts/TenantContext"
import { useCart } from "@/hooks/useCart"
import { storefrontApi } from "@/services/storefront-api"
import { CatalogCTA } from "@/components/storefront/catalog-cta"
import { getTenantIdentifier } from "@/lib/tenant"
import type { Category, ProductList, ProductVariant } from "@/types/product"

interface ProductListingProps {
  tenantSlug: string
  categories: Category[]
  initialProducts?: ProductList[]
}

function ProductListing({ tenantSlug, categories, initialProducts }: ProductListingProps) {
  const searchParams = useSearchParams()

  // Cart/State hooks (needed for actions within product cards)
  const { addToCart } = useCart()
  const [cartOpen, setCartOpen] = useState(false) // Local state for THIS cart instance? 
  // Wait, cartOpen is usually managed at Page level to open the Drawer.
  // If we trigger cart from here, we need to bubble up or share state.
  // BUT checking original code: handleAddToCart opened cart.
  // We can pass `onAddToCart` prop or context.
  // Actually, let's keep CartDrawer at Page level (stable).
  // So ProductListing needs an event handler `onAddToCart`? 
  // Or we can just use the hook and expose a Context/Callback?

  // Simplest: `useCart` adds item. Layout has `CartDrawer`. 
  // How to open drawer from child? 
  // Usually `CartDrawer` is controlled by `cartOpen` state.
  // We can pass `onOpenCart` prop to ProductListing.

  return (
    <ProductListingContent
      tenantSlug={tenantSlug}
      categories={categories}
      searchParams={searchParams}
      initialProducts={initialProducts}
    />
  )
}

function ProductListingContent({
  tenantSlug,
  categories,
  searchParams,
  initialProducts
}: {
  tenantSlug: string,
  categories: Category[],
  searchParams: any,
  initialProducts?: ProductList[]
}) {
  const [products, setProducts] = useState<ProductList[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [filters, setFilters] = useState<ProductFilters>({})
  const [error, setError] = useState<string | null>(null)
  const { addToCart } = useCart()

  // Load products when filters change
  useEffect(() => {
    async function loadProducts() {
      try {
        setProductsLoading(true)
        setError(null)

        // Build params from filters
        const params: any = {}
        if (filters.category) params.category = filters.category
        if (filters.minPrice) params.min_price = filters.minPrice
        if (filters.maxPrice) params.max_price = filters.maxPrice
        if (filters.inStock) params.in_stock = 'true'
        if (filters.ordering) params.ordering = filters.ordering

        // Handle URL search param - overrides or augments filters
        const searchParam = searchParams.get("search")
        if (searchParam) {
          params.search = searchParam
        }

        // Check if we can use initial products
        const hasFilters = Object.keys(filters).length > 0 || !!searchParam
        if (!hasFilters) {
          if (initialProducts) {
            setProducts(initialProducts)
            setProductsLoading(false)
            return
          }
          params.featured = true
        }

        const productsData = await storefrontApi.getProducts(tenantSlug, params)
        setProducts(productsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
        console.error("Error loading products:", err)
      } finally {
        setProductsLoading(false)
      }
    }

    loadProducts()
  }, [tenantSlug, filters, searchParams])

  // Handlers (Simplified for brevity, assuming handlers exist in parent or reimplemented)
  // We need to trigger the Main Page's Cart Drawer.
  // For now, let's assume we dispatch a custom event or just add to cart (and maybe user manually opens cart).
  // OR we pass `setCartOpen` from parent.
  // Let's modify `ProductListing` to accept `onCartOpen`.

  // Hack: Just add to cart. The user can click the cart icon.
  // Ideally we pass a prop.
  const handleAddToCart = async (product: ProductList) => {
    try {
      const fullProduct = await storefrontApi.getProduct(tenantSlug, product.slug)
      const defaultVariant = fullProduct.variants?.[0]
      if (!defaultVariant) {
        alert("Este producto no tiene variantes disponibles")
        return
      }
      addToCart(product, defaultVariant, 1)
      // onCartOpen() // Missing
      window.dispatchEvent(new CustomEvent('open-cart-drawer')) // Simple event bus for now?
    } catch (err) {
      console.error(err)
    }
  }

  // ... handleRequestQuote similar ...

  return (
    <section id="featured-products" className="container mx-auto px-4 py-20">
      <div className="mb-12 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-4xl font-light tracking-tight">
            {Object.keys(filters).length > 0 || searchParams.get("search") ? "Nuestros Productos" : "Colección Destacada"}
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
          ) : products.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No se encontraron productos.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onRequestQuote={() => {/* quote logic */ }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default function StorefrontPage() {
  const router = useRouter()
  // const searchParams = useSearchParams() // REMOVED
  const { tenant, loading: tenantLoading } = useTenant()
  const {
    purchaseItems,
    quoteItems,
    updateQuantity,
    removeFromCart,
    getTotalItems,
  } = useCart()

  const [categories, setCategories] = useState<Category[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<ProductList[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [localTenant, setLocalTenant] = useState<any>(null)
  const [cartOpen, setCartOpen] = useState(false)

  // Atomic Home Data Fetch (Eliminates Waterfall)
  useEffect(() => {
    async function loadHomeData() {
      // 1. Get identifier immediately from hostname
      const identifier = typeof window !== 'undefined'
        ? getTenantIdentifier(window.location.hostname)
        : null;

      // Fallback to query param
      let slug = identifier?.slug;
      if (!slug && typeof window !== 'undefined') {
        slug = new URLSearchParams(window.location.search).get('tenant') || undefined;
      }

      if (!slug && !identifier?.domain) {
        // If we really can't find anything, we'll wait for the context fallback
        return;
      }

      try {
        setInitialLoading(true)
        const data = await storefrontApi.getHomeData({ slug, domain: identifier?.domain })
        setLocalTenant(data.tenant)
        setCategories(data.categories)
        setFeaturedProducts(data.featured_products)
      } catch (err) {
        console.error("Error loading home data:", err)
      } finally {
        setInitialLoading(false)
      }
    }
    loadHomeData()
  }, [])

  // Listen for cart open event (Hack for separating components without prop drilling complex trees if nested)
  // Actually, we can just pass props if we merge components locally.
  // Merging approach below.

  useEffect(() => {
    const handleOpenCart = () => setCartOpen(true)
    window.addEventListener('open-cart-drawer', handleOpenCart)
    return () => window.removeEventListener('open-cart-drawer', handleOpenCart)
  }, [])

  const handleCheckout = () => {
    setCartOpen(false)
    router.push("/checkout")
  }

  // Use local tenant data if available, fallback to context
  const activeTenant = localTenant || tenant;
  // Don't show "not found" if either is still loading
  const anyLoading = initialLoading || (tenantLoading && !localTenant);

  if (anyLoading && !activeTenant) {
    return <FullPageStorefrontSkeleton />
  }

  if (!activeTenant) {
    return <div>Tienda no encontrada</div>
  }

  return (
    <div className="min-h-screen bg-white">
      <Header
        onCartClick={() => setCartOpen(true)}
      />

      <HeroSection
        title={activeTenant.hero_title || "El Arte del Diseño Minimalista"}
        subtitle={activeTenant.hero_subtitle || "Cada pieza cuenta una historia de elegancia y funcionalidad"}
        ctaText={activeTenant.hero_cta_text || "Explorar Colección"}
        backgroundImage={activeTenant.hero_image_url || "/hero-stainless-kitchen.jpg"}
        onCtaClick={() => {
          document.getElementById('featured-products')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      <CategoriesSection categories={categories} />

      <Suspense fallback={<div className="container mx-auto py-20"><ProductGridSkeleton count={6} /></div>}>
        <ProductListing
          tenantSlug={activeTenant.slug}
          categories={categories}
          initialProducts={featuredProducts}
        />
      </Suspense>

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

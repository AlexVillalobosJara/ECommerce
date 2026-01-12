import { headers } from "next/headers"
import { storefrontApi } from "@/services/storefront-api"
import { getTenantIdentifier } from "@/lib/tenant"
import { ProductClientPage } from "@/components/storefront/product-client-page"
import { Metadata } from "next"

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const headersList = await headers()
    const host = headersList.get("host") || ""
    const identifier = getTenantIdentifier(host)

    if (!identifier) return { title: "Producto no encontrado" }

    try {
        const homeData = await storefrontApi.getHomeData({ slug: identifier.slug, domain: identifier.domain })
        const product = await storefrontApi.getProduct(homeData.tenant.slug, slug)
        return {
            title: `${product.name} | ${homeData.tenant.name}`,
            description: product.short_description || product.description,
        }
    } catch (e) {
        return { title: "Producto no encontrado" }
    }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const headersList = await headers()
    const host = headersList.get("host") || ""
    const identifier = getTenantIdentifier(host)

    if (!identifier || (!identifier.slug && !identifier.domain)) {
        return <div className="p-20 text-center">Tienda no configurada</div>
    }

    try {
        // 1. Resolve tenant properly via mega-fetch
        const homeData = await storefrontApi.getHomeData({ slug: identifier.slug, domain: identifier.domain })
        const tenantSlug = homeData.tenant.slug

        // 2. Fetch product detail
        const product = await storefrontApi.getProduct(tenantSlug, slug)

        // 3. Fetch related products if possible
        const relatedProducts = product.category
            ? await storefrontApi.getRelatedProducts(tenantSlug, product.category.slug, product.id, 4)
            : []

        return (
            <ProductClientPage
                tenant={homeData.tenant}
                product={product}
                relatedProducts={relatedProducts}
            />
        )
    } catch (error) {
        console.error("Product SSR Error:", error)
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
                <h1 className="text-2xl font-bold">Error al cargar el producto</h1>
                <p className="mt-2 text-muted-foreground">No pudimos encontrar el producto solicitado.</p>
                <a href="/" className="mt-4 text-primary hover:underline">Volver al inicio</a>
            </div>
        )
    }
}

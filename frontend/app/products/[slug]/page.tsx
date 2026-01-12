import { headers } from "next/headers"
import { storefrontApi } from "@/services/storefront-api"
import { getTenantIdentifier } from "@/lib/tenant"
import { ProductClientPage } from "@/components/storefront/product-client-page"
import { Metadata } from "next"

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const headersList = await headers()
    const host = headersList.get("host") || ""
    const identifier = getTenantIdentifier(host)

    if (!identifier) return { title: "Producto no encontrado" }

    try {
        const product = await storefrontApi.getProduct(identifier.slug || '', params.slug)
        return {
            title: `${product.name} | Tienda Virtual`,
            description: product.short_description || product.description,
        }
    } catch (e) {
        return { title: "Producto no encontrado" }
    }
}

export default async function Page({ params }: { params: { slug: string } }) {
    const headersList = await headers()
    const host = headersList.get("host") || ""
    const identifier = getTenantIdentifier(host)
    const slug = params.slug

    if (!identifier || (!identifier.slug && !identifier.domain)) {
        return <div>Tienda no configurada</div>
    }

    try {
        const tenantSlug = identifier.slug || ''

        // Parallel server-side fetching
        const product = await storefrontApi.getProduct(tenantSlug, slug)

        const [homeData, relatedProducts] = await Promise.all([
            storefrontApi.getHomeData({ slug: identifier.slug, domain: identifier.domain }),
            product.category
                ? storefrontApi.getRelatedProducts(tenantSlug, product.category.slug, product.id, 4)
                : Promise.resolve([])
        ])

        return (
            <ProductClientPage
                tenant={homeData.tenant}
                product={product}
                relatedProducts={relatedProducts}
            />
        )
    } catch (error) {
        console.error("Product SSR Error:", error)
        return <div>Error al cargar el producto</div>
    }
}

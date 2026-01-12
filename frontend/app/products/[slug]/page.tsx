import { headers } from "next/headers"
import { storefrontApi } from "@/services/storefront-api"
import { getTenantIdentifier } from "@/lib/tenant"
import { ProductClientPage } from "@/components/storefront/product-client-page"
import { Metadata } from "next"

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug: productSlug } = await params
    const headersList = await headers()
    const host = headersList.get("host") || ""
    const identifier = getTenantIdentifier(host)

    if (!identifier) return { title: "Producto no encontrado" }

    try {
        const data = await storefrontApi.getProductData({
            slug: identifier.slug,
            domain: identifier.domain,
            productSlug
        })
        return {
            title: `${data.product.name} | ${data.tenant.name}`,
            description: data.product.short_description || data.product.description,
        }
    } catch (e) {
        return { title: "Producto no encontrado" }
    }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug: productSlug } = await params
    const headersList = await headers()
    const host = headersList.get("host") || ""
    const identifier = getTenantIdentifier(host)

    if (!identifier || (!identifier.slug && !identifier.domain)) {
        return <div className="p-20 text-center">Tienda no configurada</div>
    }

    try {
        // Atomic mega-fetch: 1 RTT for everything
        const data = await storefrontApi.getProductData({
            slug: identifier.slug,
            domain: identifier.domain,
            productSlug
        })

        return (
            <ProductClientPage
                tenant={data.tenant}
                product={data.product}
                relatedProducts={data.related_products}
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

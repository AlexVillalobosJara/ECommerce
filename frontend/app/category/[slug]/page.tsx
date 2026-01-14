import { headers } from "next/headers"
import { storefrontApi } from "@/services/storefront-api"
import { getTenantIdentifier } from "@/lib/tenant"
import { CategoryClientPage } from "@/components/storefront/category-client-page"
import { Metadata } from "next"

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug: categorySlug } = await params
    const headersList = await headers()
    const host = headersList.get("host") || ""
    const identifier = getTenantIdentifier(host)

    if (!identifier) return { title: "Categoría no encontrada" }

    try {
        const data = await storefrontApi.getCategoryData({
            slug: identifier.slug,
            domain: identifier.domain,
            categorySlug
        })
        return {
            title: `${data.category.name} | ${data.tenant.name}`,
            description: data.category.description,
            alternates: {
                canonical: `https://${host}/category/${categorySlug}`
            }
        }
    } catch (e) {
        return { title: "Categoría no encontrada" }
    }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug: categorySlug } = await params
    const headersList = await headers()
    const host = headersList.get("host") || ""
    const identifier = getTenantIdentifier(host)

    if (!identifier || (!identifier.slug && !identifier.domain)) {
        return <div className="p-20 text-center">Tienda no configurada</div>
    }

    try {
        // Atomic mega-fetch: 1 RTT for everything
        const data = await storefrontApi.getCategoryData({
            slug: identifier.slug,
            domain: identifier.domain,
            categorySlug
        })

        return (
            <CategoryClientPage
                tenant={data.tenant}
                category={data.category}
                allCategories={data.categories}
                initialProducts={data.products}
            />
        )
    } catch (error) {
        console.error("Category SSR Error:", error)
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
                <h1 className="text-2xl font-bold">Error al cargar la categoría</h1>
                <p className="mt-2 text-muted-foreground">No pudimos encontrar la información solicitada.</p>
                <a href="/" className="mt-4 text-primary hover:underline">Volver al inicio</a>
            </div>
        )
    }
}

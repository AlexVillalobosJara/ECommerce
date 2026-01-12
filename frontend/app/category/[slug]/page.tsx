import { headers } from "next/headers"
import { storefrontApi } from "@/services/storefront-api"
import { getTenantIdentifier } from "@/lib/tenant"
import { CategoryClientPage } from "@/components/storefront/category-client-page"
import { Metadata } from "next"

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const headersList = await headers()
    const host = headersList.get("host") || ""
    const identifier = getTenantIdentifier(host)

    if (!identifier) return { title: "Categoría no encontrada" }

    try {
        const category = await storefrontApi.getCategoryBySlug(identifier.slug || '', params.slug)
        return {
            title: `${category.name} | Tienda Virtual`,
            description: category.description,
        }
    } catch (e) {
        return { title: "Categoría no encontrada" }
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
        const [category, allCategories, products, homeData] = await Promise.all([
            storefrontApi.getCategoryBySlug(tenantSlug, slug),
            storefrontApi.getCategories(tenantSlug),
            storefrontApi.getProducts(tenantSlug, { category: slug }),
            storefrontApi.getHomeData({ slug: identifier.slug, domain: identifier.domain })
        ])

        return (
            <CategoryClientPage
                tenant={homeData.tenant}
                category={category}
                allCategories={allCategories}
                initialProducts={products}
            />
        )
    } catch (error) {
        console.error("Category SSR Error:", error)
        return <div>Error al cargar la categoría</div>
    }
}

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

        const product = data.product
        const tenant = data.tenant

        // Use meta_title if available, otherwise use product name
        const title = product.meta_title || `${product.name} | ${tenant.name}`

        // Use meta_description if available, otherwise use short_description or description
        const description = product.meta_description || product.short_description || product.description || ""

        // Get primary image
        const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0]
        const imageUrl = primaryImage?.url || tenant.logo_url || ""

        // Get price for Open Graph
        const price = product.variants?.[0]?.price || ""

        return {
            title,
            description,
            keywords: product.meta_keywords || undefined,
            openGraph: {
                title,
                description,
                type: "website",
                url: `https://${host}/products/${productSlug}`,
                images: imageUrl ? [{
                    url: imageUrl,
                    alt: product.name
                }] : [],
                siteName: tenant.name,
            },
            twitter: {
                card: "summary_large_image",
                title,
                description,
                images: imageUrl ? [imageUrl] : [],
            },
            other: {
                "product:price:amount": price,
                "product:price:currency": "CLP",
            },
            alternates: {
                canonical: `https://${host}/products/${productSlug}`
            }
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

        const product = data.product
        const tenant = data.tenant
        const defaultVariant = product.variants?.find(v => v.is_default) || product.variants?.[0]

        // Generate JSON-LD Product Schema for SEO
        const productSchema = {
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name,
            "description": product.description || product.short_description || "",
            "image": product.images?.map(img => {
                // Ensure full URL for images
                const url = img.url
                if (url.startsWith('http')) return url
                return `https://${host}${url}`
            }) || [],
            ...(product.brand && {
                "brand": {
                    "@type": "Brand",
                    "name": product.brand
                }
            }),
            ...(product.sku && { "sku": product.sku }),
            ...(defaultVariant && {
                "offers": {
                    "@type": "Offer",
                    "url": `https://${host}/products/${productSlug}`,
                    "priceCurrency": "CLP",
                    "price": defaultVariant.price,
                    "availability": defaultVariant.available_stock > 0
                        ? "https://schema.org/InStock"
                        : "https://schema.org/OutOfStock",
                    "seller": {
                        "@type": "Organization",
                        "name": tenant.name
                    }
                }
            }),
            ...(product.review_count && product.review_count > 0 && {
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": product.average_rating || "0",
                    "reviewCount": product.review_count
                }
            })
        }

        return (
            <>
                {/* JSON-LD Product Schema for SEO */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
                />
                <ProductClientPage
                    tenant={data.tenant}
                    product={data.product}
                    relatedProducts={data.related_products}
                    categories={data.categories}
                />
            </>
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

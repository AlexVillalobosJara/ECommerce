import { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { storefrontApi } from '@/services/storefront-api'
import { getTenantIdentifier } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const headersList = await headers()
    const host = headersList.get('host') || ''
    const identifier = getTenantIdentifier(host)

    if (!identifier) {
        return []
    }

    const baseUrl = `https://${host}`

    try {
        // Fetch tenant data to get products and categories
        const data = await storefrontApi.getHomeData({
            slug: identifier.slug,
            domain: identifier.domain
        })

        const sitemap: MetadataRoute.Sitemap = []

        // Add home page
        sitemap.push({
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        })

        // Add categories
        if (data.categories && data.categories.length > 0) {
            data.categories.forEach((category: any) => {
                if (category.is_active) {
                    sitemap.push({
                        url: `${baseUrl}/category/${category.slug}`,
                        lastModified: new Date(),
                        changeFrequency: 'weekly',
                        priority: 0.8,
                    })
                }
            })
        }

        // Add featured products from home page
        if (data.featured_products && data.featured_products.length > 0) {
            data.featured_products.forEach((product: any) => {
                if (product.status === 'Published') {
                    sitemap.push({
                        url: `${baseUrl}/products/${product.slug}`,
                        lastModified: new Date(),
                        changeFrequency: 'weekly',
                        priority: 0.9,
                    })
                }
            })
        }

        // Fetch all published products for complete sitemap
        try {
            const productsResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/storefront/products/?tenant=${identifier.slug}`,
                { next: { revalidate: 3600 } } // Cache for 1 hour
            )

            if (productsResponse.ok) {
                const productsData = await productsResponse.json()

                if (productsData.results && Array.isArray(productsData.results)) {
                    productsData.results.forEach((product: any) => {
                        if (product.status === 'Published') {
                            // Check if not already added from featured products
                            const exists = sitemap.some(item => item.url === `${baseUrl}/products/${product.slug}`)
                            if (!exists) {
                                sitemap.push({
                                    url: `${baseUrl}/products/${product.slug}`,
                                    lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
                                    changeFrequency: 'weekly',
                                    priority: 0.7,
                                })
                            }
                        }
                    })
                }
            }
        } catch (error) {
            console.error('Error fetching products for sitemap:', error)
            // Continue with partial sitemap if products fetch fails
        }

        return sitemap

    } catch (error) {
        console.error('Error generating sitemap:', error)
        // Return minimal sitemap on error
        return [
            {
                url: baseUrl,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 1.0,
            }
        ]
    }
}

import { MetadataRoute } from 'next'
import { headers } from 'next/headers'

export default async function robots(): Promise<MetadataRoute.Robots> {
    // Get current host for multi-tenant support
    const headersList = await headers()
    const host = headersList.get('host') || 'example.com'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const baseUrl = `${protocol}://${host}`

    return {
        rules: [
            {
                userAgent: '*',
                allow: [
                    '/',
                    '/products/',
                    '/category/',
                    '/search',
                    '/pages/',
                ],
                disallow: [
                    '/admin/',
                    '/api/',
                    '/checkout/',
                    '/payment/',
                    '/_next/',
                    '/static/',
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}

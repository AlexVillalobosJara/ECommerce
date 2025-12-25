"use client"

import { useEffect, useState } from "react"
import { storefrontApi } from "@/services/storefront-api"
import { ProductList } from "@/types/product"
import { ProductCard } from "@/components/storefront/product-card"

interface RelatedProductsProps {
    tenantSlug: string
    categorySlug: string
    currentProductId: string
}

export function RelatedProducts({ tenantSlug, categorySlug, currentProductId }: RelatedProductsProps) {
    const [products, setProducts] = useState<ProductList[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchRelated = async () => {
            try {
                // Fetch up to 4 related products
                const related = await storefrontApi.getRelatedProducts(tenantSlug, categorySlug, currentProductId, 4)
                setProducts(related)
            } catch (error) {
                console.error("Failed to fetch related products", error)
            } finally {
                setLoading(false)
            }
        }

        if (tenantSlug && categorySlug) {
            fetchRelated()
        }
    }, [tenantSlug, categorySlug, currentProductId])

    if (loading) return null // Or a skeleton if we prefer
    if (products.length === 0) return null

    return (
        <section className="mt-16 border-t border-gray-200 pt-16">
            <h2 className="mb-8 font-serif text-3xl text-gray-900">También te podría interesar</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-5 xl:gap-x-8">
                {products.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        aspectRatio="square"
                        className="text-sm" // Smaller text too
                    />
                ))}
            </div>
        </section>
    )
}

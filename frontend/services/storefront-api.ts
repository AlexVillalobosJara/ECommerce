import type { Category, ProductList, ProductDetail } from "@/types/product"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Order types
export interface ShippingZone {
    id: string
    name: string
    description: string | null
    commune_codes: string[]
    base_cost: string
    cost_per_kg: string
    free_shipping_threshold: string | null
    estimated_days: number
    allows_store_pickup: boolean
    is_active: boolean
}

export interface OrderItemCreate {
    product_variant_id: string
    quantity: number
}

export interface OrderCreate {
    order_type: "Sale" | "Quote"
    customer_email: string
    customer_phone?: string
    first_name?: string
    last_name?: string
    shipping_recipient_name: string
    shipping_phone: string
    shipping_street_address: string
    shipping_apartment?: string
    shipping_commune: string
    shipping_city: string
    shipping_region: string
    shipping_postal_code?: string
    is_store_pickup: boolean
    shipping_zone_id?: string
    shipping_method?: string
    items: OrderItemCreate[]
    customer_notes?: string
    coupon_code?: string
}

export interface Order {
    id: string
    order_number: string
    order_type: string
    status: string
    customer_email: string
    customer_phone: string
    subtotal: string
    shipping_cost: string
    tax_amount: string
    discount_amount: string
    total: string
    created_at: string
    items: any[]
}

/**
 * Storefront API service
 * All endpoints require tenant parameter
 */
export const storefrontApi = {
    /**
     * Get all categories
     */
    async getCategories(tenantSlug: string): Promise<Category[]> {
        const response = await fetch(`${API_URL}/api/storefront/categories/?tenant=${tenantSlug}`)
        if (!response.ok) throw new Error("Failed to fetch categories")
        const data = await response.json()

        // Handle paginated response
        if (Array.isArray(data)) {
            return data
        }
        return data.results || []
    },

    /**
     * Get single category by slug
     */
    async getCategoryBySlug(tenantSlug: string, slug: string): Promise<Category> {
        // Since we don't have a direct endpoint for slug lookup in public API usually, 
        // we can fetch all and find, OR assume backend supports filtering.
        // Let's try fetching the list filtering by slug if supported, or just matching client side 
        // if the list is small (categories usually are).
        // A robust way: fetch all and find.
        const categories = await this.getCategories(tenantSlug)
        const category = categories.find(c => c.slug === slug)
        if (!category) throw new Error("Category not found")
        return category
    },

    /**
     * Get products list with optional filters
     */
    async getProducts(
        tenantSlug: string,
        filters?: {
            category?: string
            featured?: boolean
            in_stock?: boolean
            min_price?: number
            max_price?: number
            search?: string
            ordering?: string
        }
    ): Promise<ProductList[]> {
        const params = new URLSearchParams({ tenant: tenantSlug })

        if (filters?.category) params.append("category", filters.category)
        if (filters?.featured) params.append("featured", "true")
        if (filters?.in_stock) params.append("in_stock", "true")
        if (filters?.min_price) params.append("min_price", filters.min_price.toString())
        if (filters?.max_price) params.append("max_price", filters.max_price.toString())
        if (filters?.search) params.append("search", filters.search)
        if (filters?.ordering) params.append("ordering", filters.ordering)

        const response = await fetch(`${API_URL}/api/storefront/products/?${params}`)
        if (!response.ok) throw new Error("Failed to fetch products")

        const data = await response.json()

        // Handle paginated response from DRF
        if (Array.isArray(data)) {
            return data
        }

        // If it's a paginated response, return the results array
        return data.results || []
    },

    /**
     * Get product detail by slug
     */
    async getProduct(tenantSlug: string, productSlug: string): Promise<ProductDetail> {
        const response = await fetch(
            `${API_URL}/api/storefront/products/${productSlug}/?tenant=${tenantSlug}`
        )
        if (!response.ok) throw new Error("Failed to fetch product")
        return response.json()
    },

    /**
     * Search products
     */
    async searchProducts(tenantSlug: string, query: string): Promise<ProductList[]> {
        return this.getProducts(tenantSlug, { search: query })
    },

    /**
     * Get related products (same category)
     */
    async getRelatedProducts(tenantSlug: string, categorySlug: string, excludeId?: string, limit: number = 4): Promise<ProductList[]> {
        const params = new URLSearchParams({ tenant: tenantSlug })
        params.append("category", categorySlug)
        if (excludeId) params.append("exclude", excludeId)

        // We handle limit by slicing the result, as DRF pagination defaults might differ
        // Ideally backend should support limit/offset, but for now we fetch standard page and slice
        const response = await fetch(`${API_URL}/api/storefront/products/?${params}`)
        if (!response.ok) return []

        const data = await response.json()
        let products = Array.isArray(data) ? data : (data.results || [])

        return products.slice(0, limit)
    },

    /**
     * Get product reviews
     */
    async getProductReviews(tenantSlug: string, productSlug: string): Promise<any[]> {
        const response = await fetch(`${API_URL}/api/storefront/products/${productSlug}/reviews/?tenant=${tenantSlug}`)
        if (!response.ok) return [] // Fail gracefully

        const data = await response.json()
        return Array.isArray(data) ? data : (data.results || [])
    },

    /**
     * Create product review
     */
    async createProductReview(tenantSlug: string, productSlug: string, data: { rating: number; comment: string; customer_name: string; customer_email: string }): Promise<any> {
        const response = await fetch(`${API_URL}/api/storefront/products/${productSlug}/reviews/?tenant=${tenantSlug}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.detail || "Error al enviar reseña")
        }
        return response.json()
    },

    /**
     * Get shipping zones
     */
    async getShippingZones(tenantSlug: string): Promise<ShippingZone[]> {
        const response = await fetch(`${API_URL}/api/storefront/shipping-zones/?tenant=${tenantSlug}`)
        if (!response.ok) throw new Error("Failed to fetch shipping zones")
        const data = await response.json()

        if (Array.isArray(data)) {
            return data
        }
        return data.results || []
    },

    /**
     * Get communes grouped by region
     */
    async getCommunesByRegion(): Promise<any[]> {
        const response = await fetch(`${API_URL}/api/storefront/communes/by_region/`)
        if (!response.ok) throw new Error("Failed to fetch communes")
        return response.json()
    },

    /**
     * Calculate shipping cost
     */
    async calculateShipping(
        tenantSlug: string,
        commune: string,
        weightKg: number,
        subtotal: number
    ): Promise<{
        zone_id: string
        zone_name: string
        cost: number
        estimated_days: number
        is_free: boolean
    }> {
        const response = await fetch(
            `${API_URL}/api/storefront/shipping-zones/calculate/?tenant=${tenantSlug}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    commune,
                    weight_kg: weightKg,
                    subtotal,
                }),
            }
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "Failed to calculate shipping")
        }

        return response.json()
    },

    /**
     * Create order
     */
    async createOrder(tenantSlug: string, orderData: OrderCreate): Promise<Order> {
        const response = await fetch(`${API_URL}/api/storefront/orders/?tenant=${tenantSlug}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(orderData),
        })

        if (!response.ok) {
            const error = await response.json()
            console.error("Order creation error:", error)
            // Show detailed error message
            const errorMessage = error.error || error.detail || JSON.stringify(error) || "Failed to create order"
            throw new Error(errorMessage)
        }

        return response.json()
    },

    /**
     * Get order by ID
     */
    async getOrder(tenantSlug: string, orderId: string): Promise<Order> {
        const response = await fetch(`${API_URL}/api/storefront/orders/${orderId}/?tenant=${tenantSlug}`)

        if (!response.ok) {
            throw new Error("Failed to fetch order")
        }

        return response.json()
    },

    /**
     * Confirm payment for an order
     */
    async confirmPayment(
        tenantSlug: string,
        orderId: string,
        paymentData: {
            payment_method: string
            transaction_id?: string
            payment_notes?: string
        }
    ): Promise<Order> {
        const response = await fetch(
            `${API_URL}/api/storefront/orders/${orderId}/confirm_payment/?tenant=${tenantSlug}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(paymentData),
            }
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "Failed to confirm payment")
        }

        return response.json()
    },

    /**
     * Initiate payment with gateway
     */
    async initiatePayment(
        tenantSlug: string,
        orderId: string,
        gateway: string = "Flow",
        returnUrl?: string,
        cancelUrl?: string
    ): Promise<{
        payment_id: string
        payment_url: string
        gateway: string
        transaction_id: string
    }> {
        const response = await fetch(
            `${API_URL}/api/storefront/payments/initiate/?tenant=${tenantSlug}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    order_id: orderId,
                    gateway,
                    return_url: returnUrl,
                    cancel_url: cancelUrl,
                }),
            }
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "Failed to initiate payment")
        }

        return response.json()
    },

    /**
     * Check payment status
     */
    async getPaymentStatus(
        tenantSlug: string,
        orderId: string
    ): Promise<{
        order_id: string
        order_number: string
        payment_id: string
        payment_status: string
        payment_gateway: string
        amount: string
        currency: string
        created_at: string
        completed_at: string | null
        paid_at: string | null
    }> {
        const response = await fetch(
            `${API_URL}/api/storefront/${tenantSlug}/payments/status/${orderId}/`
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "Failed to get payment status")
        }

        return response.json()
    },

    /**
     * Get payment status by Flow token
     */
    async getPaymentStatusByToken(
        tenantSlug: string,
        token: string
    ): Promise<{
        order_id: string
        order_number: string
        payment_id: string
        payment_status: string
        payment_gateway: string
        amount: string
        currency: string
        created_at: string
        completed_at: string | null
        paid_at: string | null
    }> {
        const response = await fetch(
            `${API_URL}/api/storefront/${tenantSlug}/payments/token/${token}/`
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "Failed to get payment status")
        }

        return response.json()
    },

    async validateCoupon(code: string, cartTotal: number) {
        return fetch(`${API_URL}/api/orders/cart/validate-coupon/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, cartTotal })
        }).then(res => res.json())
    },
}

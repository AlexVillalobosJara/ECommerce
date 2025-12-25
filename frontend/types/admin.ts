// Admin-specific types for product management

export interface AdminCategory {
    id: string
    name: string
    slug: string
    description?: string
    image_url?: string
    icon?: string
    parent?: string | null
    children?: AdminCategory[]
    path?: string
    products_count: number
    sort_order: number
    is_active: boolean
    meta_title?: string
    meta_description?: string
    created_at: string
    updated_at: string
}

export interface CategoryFormData {
    name: string
    slug: string
    description?: string
    parent?: string | null
    icon?: string
    is_active: boolean
    meta_title?: string
    meta_description?: string
}

export interface AdminProductImage {
    id: string
    url: string
    alt_text?: string
    sort_order: number
    is_primary: boolean
    created_at: string
    updated_at: string
}

export interface AdminProductVariant {
    id: string
    sku: string
    barcode?: string
    name?: string
    attributes: Record<string, string>
    price?: number
    compare_at_price?: number
    cost?: number
    stock_quantity: number
    reserved_quantity: number
    available_stock: number
    low_stock_threshold: number
    is_active: boolean
    is_default: boolean
    image_url?: string
    created_at: string
    updated_at: string
}

export interface AdminProduct {
    id: string
    name: string
    slug: string
    sku?: string
    short_description?: string
    description?: string
    barcode?: string
    brand?: string
    category?: AdminCategory | null
    category_id?: string | null
    is_quote_only: boolean
    manage_stock: boolean
    status: 'Draft' | 'Published' | 'Archived'
    is_featured: boolean
    meta_title?: string
    meta_description?: string
    meta_keywords?: string
    weight_kg?: number
    length_cm?: number
    width_cm?: number
    height_cm?: number
    views_count: number
    sales_count: number
    specifications?: Record<string, string>
    variants: AdminProductVariant[]
    images: AdminProductImage[]
    created_at: string
    updated_at: string
    published_at?: string | null
}

export interface AdminProductListItem {
    id: string
    name: string
    slug: string
    sku?: string
    brand?: string
    short_description?: string
    category_name?: string
    is_quote_only: boolean
    is_featured: boolean
    status: 'Draft' | 'Published' | 'Archived'
    primary_image?: string | null
    min_price?: number | null
    max_price?: number | null
    variants_count: number
    in_stock: boolean
    total_stock?: number | null
    created_at: string
    updated_at: string
    published_at?: string | null
}

export interface ProductFormData {
    name: string
    slug: string
    sku?: string
    short_description?: string
    description?: string
    barcode?: string
    brand?: string
    category_id?: string | null
    is_quote_only: boolean
    manage_stock: boolean
    status: 'Draft' | 'Published' | 'Archived'
    is_featured: boolean
    meta_title?: string
    meta_description?: string
    meta_keywords?: string
    weight_kg?: number
    length_cm?: number
    width_cm?: number
    height_cm?: number
    specifications?: Record<string, string>
}

export interface ProductFilters {
    search?: string
    status?: string
    category?: string
    is_featured?: boolean
}

export interface VariantFormData {
    sku: string
    barcode?: string
    name?: string
    attributes: Record<string, string>
    price?: number
    compare_at_price?: number
    cost?: number
    stock_quantity: number
    low_stock_threshold: number
    is_active: boolean
    is_default: boolean
    image_url?: string
}

export interface CategoryFormData {
    name: string
    slug: string
    description?: string
    image_url?: string
    icon?: string
    sort_order: number
    is_active: boolean
    parent?: string | null
    meta_title?: string
    meta_description?: string
}

// Orders and Quotes
export type OrderType = 'Sale' | 'Quote'
export type OrderStatus = 'Draft' | 'PendingPayment' | 'Paid' | 'QuoteRequested' | 'QuoteSent' | 'QuoteApproved' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refunded'

export interface AdminCustomer {
    id: string
    email: string
    first_name: string
    last_name: string
    full_name?: string
    phone?: string
    tax_id?: string
}

export interface AdminOrderItem {
    id: string
    product_variant: string
    product_name: string
    variant_name?: string
    sku: string
    attributes_snapshot?: Record<string, string>
    unit_price: number
    quantity: number
    discount_amount: number
    subtotal: number
    tax_amount: number
    total: number
    product_image_url?: string
}

export interface AdminOrder {
    id: string
    order_number: string
    order_type: OrderType
    status: OrderStatus
    customer?: AdminCustomer
    customer_email: string
    customer_phone?: string
    // Shipping address
    shipping_recipient_name?: string
    shipping_phone?: string
    shipping_street_address?: string
    shipping_apartment?: string
    shipping_commune?: string
    shipping_city?: string
    shipping_region?: string
    shipping_postal_code?: string
    shipping_country?: string
    // Billing address
    billing_recipient_name?: string
    billing_tax_id?: string
    billing_street_address?: string
    billing_commune?: string
    billing_city?: string
    billing_region?: string
    // Financial
    subtotal: number
    discount_amount: number
    shipping_cost: number
    tax_amount: number
    total: number
    coupon_code?: string
    coupon_discount?: number
    // Shipping
    shipping_zone?: string
    shipping_method?: string
    is_store_pickup: boolean
    estimated_delivery_date?: string
    // Notes
    customer_notes?: string
    internal_notes?: string
    // Quote fields
    quote_valid_until?: string
    quote_sent_at?: string
    quote_approved_at?: string
    // Timestamps
    created_at: string
    updated_at: string
    paid_at?: string
    shipped_at?: string
    delivered_at?: string
    cancelled_at?: string
    // Items
    items: AdminOrderItem[]
}

export interface AdminOrderListItem {
    id: string
    order_number: string
    order_type: OrderType
    status: OrderStatus
    customer_email: string
    customer_name?: string
    items_count: number
    subtotal: number
    shipping_cost: number
    tax_amount: number
    total: number
    created_at: string
    paid_at?: string
    shipped_at?: string
    delivered_at?: string
}

export interface OrderFilters {
    search?: string
    status?: string
    type?: OrderType
    date_from?: string
    date_to?: string
}

export interface OrderStats {
    total: number
    by_status: Record<OrderStatus, number>
    by_type: Record<OrderType, number>
}

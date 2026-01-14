// Product types matching backend models

export interface ProductVariant {
    id: string
    sku: string
    name: string | null
    attributes: Record<string, string>
    price: string
    compare_at_price: string | null
    selling_price: string
    original_price: string | null
    has_discount: boolean
    cost: string | null
    stock_quantity: number
    reserved_quantity: number
    available_stock: number
    is_active: boolean
    is_default: boolean
    image_url: string | null
}

export interface ProductImage {
    id: string
    url: string
    alt_text: string | null
    sort_order: number
    is_primary: boolean
}

export interface Category {
    id: string
    name: string
    slug: string
    description: string | null
    image_url: string | null
    icon: string | null
    sort_order: number
    is_active: boolean
    product_count: number
    children: Category[]
    parent: string | null
}

export interface ProductList {
    id: string
    name: string
    slug: string
    short_description: string | null
    category_name: string | null
    is_quote_only: boolean
    is_featured: boolean
    status: string
    primary_image: string | null
    min_price: string | null
    max_price: string | null
    min_compare_at_price: string | null
    has_discount: boolean
    variants_count: number
    in_stock: boolean
    total_stock: number | null
    total_reserved: number | null
    min_shipping_days: number
    average_rating?: string
    review_count?: number
}

export interface ProductDetail {
    id: string
    name: string
    slug: string
    short_description: string | null
    description: string | null
    sku: string | null
    barcode: string | null
    brand: string | null
    specifications: Record<string, string>
    category: Category | null
    is_quote_only: boolean
    manage_stock: boolean
    status: string
    is_featured: boolean
    meta_title: string | null
    meta_description: string | null
    meta_keywords: string | null
    weight_kg: string | null
    length_cm: string | null
    width_cm: string | null
    height_cm: string | null
    min_shipping_days: number
    views_count: number
    sales_count: number
    variants: ProductVariant[]
    images: ProductImage[]
    created_at: string
    updated_at: string

    // Rating
    average_rating: string // Decimal string from backend
    review_count: number
}

export interface ProductReview {
    id: string
    customer_name: string
    rating: number
    comment: string
    created_at: string
}

// Cart item type
export interface CartItem {
    product: ProductList
    variant: ProductVariant
    quantity: number
}

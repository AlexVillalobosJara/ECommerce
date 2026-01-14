export interface Tenant {
    id: string
    name: string
    slug: string
    status: "Trial" | "Active" | "Suspended" | "Cancelled"

    // Branding
    logo_url?: string
    primary_color?: string
    secondary_color?: string
    custom_domain?: string

    // Payment Configuration
    transbank_api_key?: string
    transbank_commerce_code?: string
    mercadopago_access_token?: string
    mercadopago_public_key?: string
    khipu_receiver_id?: string
    khipu_secret_key?: string

    // SMTP Configuration
    smtp_host?: string
    smtp_port?: number
    smtp_username?: string
    smtp_password?: string
    smtp_from_email?: string
    smtp_from_name?: string

    // Business Info
    legal_name?: string
    tax_id?: string
    phone?: string
    email?: string
    address?: string

    // Subscription
    subscription_plan?: string
    subscription_expires_at?: string
    max_products?: number
    max_orders_per_month?: number

    // Regional Settings
    tax_rate?: number
    decimal_separator?: "." | ","
    thousands_separator?: "." | ","
    decimal_places?: number
    country?: string

    // General Settings
    prices_include_tax?: boolean
    show_product_ratings?: boolean
    allow_reviews?: boolean
    show_related_products?: boolean

    // Policies
    privacy_policy_mode?: 'Default' | 'Custom' | 'Url'
    privacy_policy_text?: string
    terms_policy_mode?: 'Default' | 'Custom' | 'Url'
    terms_policy_text?: string

    // Terms Variables
    shipping_days_min?: number
    shipping_days_max?: number
    return_window_days?: number
    return_shipping_cost_cover?: 'Customer' | 'Company'
    warranty_period?: string

    // Company Info
    about_us_text?: string
    our_history_text?: string
    mission_text?: string
    vision_text?: string
    faq_text?: string

    // Storefront Configuration
    hero_title?: string
    hero_subtitle?: string
    hero_cta_text?: string
    hero_image_url?: string

    // CTA Section
    cta_title?: string
    cta_description?: string
    cta_button_text?: string
    cta_link?: string
    shipping_workdays?: number[]

    created_at?: string
    updated_at?: string
}

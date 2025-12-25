/**
 * TypeScript types for Shipping Zones and Communes
 */

export interface Commune {
    id: string
    code: string
    name: string
    region_code: string
    region_name: string
    latitude?: number
    longitude?: number
}

export interface CommunesByRegion {
    region_code: string
    region_name: string
    communes: Commune[]
}

export interface ShippingZone {
    id: string
    name: string
    description: string
    commune_codes: string[]
    base_cost: number
    cost_per_kg: number
    free_shipping_threshold: number | null
    estimated_days: number
    allows_store_pickup: boolean
    is_active: boolean
    commune_count: number
}

export interface ShippingZoneFormData {
    name: string
    description: string
    commune_codes: string[]
    base_cost: number
    cost_per_kg: number
    free_shipping_threshold: number | null
    estimated_days: number
    allows_store_pickup: boolean
    is_active: boolean
}

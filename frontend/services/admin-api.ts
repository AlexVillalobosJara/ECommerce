/**
 * Admin API service for authenticated admin operations
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Helper to get auth token from localStorage
function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('admin_access_token')
}

// Helper for authenticated requests
async function authFetch(url: string, options: RequestInit = {}) {
    const token = getAuthToken()

    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
    }

    const response = await fetch(url, {
        ...options,
        headers,
    })

    if (!response.ok) {
        if (response.status === 401) {
            // Session expired or invalid token
            if (typeof window !== 'undefined') {
                localStorage.removeItem('admin_access_token')
                localStorage.removeItem('admin_user')
                window.location.href = '/admin/login'
            }
        }

        let errorData
        try {
            errorData = await response.json()
        } catch {
            const errorText = await response.text().catch(() => 'Unknown error')
            throw new Error(`Server Error (${response.status}): ${errorText.slice(0, 200)}`)
        }

        // Handle specific error fields or detail
        let errorMessage = errorData.error || errorData.detail

        // If no explicit error message found, try to extract validation errors
        if (!errorMessage) {
            // DRF validation errors are usually { field: ["error1", "error2"] }
            const fieldErrors = Object.entries(errorData)
                .map(([key, msgs]) => {
                    const msg = Array.isArray(msgs) ? msgs.join(', ') : String(msgs)
                    // If the key is 'non_field_errors', don't prefix
                    return key === 'non_field_errors' ? msg : `${key}: ${msg}`
                })
                .join('\n')

            if (fieldErrors) errorMessage = fieldErrors
        }

        throw new Error(errorMessage || `Request failed (${response.status})`)
    }

    return response.json()
}

export const adminApi = {
    /**
     * List all payment gateway configurations
     */
    async listPaymentGateways() {
        return authFetch(`${API_URL}/api/admin/payment-gateways/`)
    },

    /**
     * Configure or update a payment gateway
     */
    async configurePaymentGateway(gateway: string, data: any) {
        return authFetch(`${API_URL}/api/admin/payment-gateways/${gateway}/`, {
            method: 'POST',
            body: JSON.stringify(data),
        })
    },

    /**
     * Test payment gateway connection
     */
    async testPaymentGateway(gateway: string, credentials: any) {
        return authFetch(`${API_URL}/api/admin/payment-gateways/${gateway}/test/`, {
            method: 'POST',
            body: JSON.stringify(credentials),
        })
    },

    /**
     * Delete payment gateway configuration
     */
    async deletePaymentGateway(gateway: string) {
        return authFetch(`${API_URL}/api/admin/payment-gateways/${gateway}/delete/`, {
            method: 'DELETE',
        })
    },

    // ============================================================================
    // SHIPPING ZONES
    // ============================================================================

    /**
     * List all shipping zones
     */
    async listShippingZones() {
        return authFetch(`${API_URL}/api/admin/shipping-zones/`)
    },

    /**
     * Get a specific shipping zone by ID
     */
    async getShippingZone(id: string) {
        return authFetch(`${API_URL}/api/admin/shipping-zones/${id}/`)
    },

    /**
     * Create a new shipping zone
     */
    async createShippingZone(data: any) {
        return authFetch(`${API_URL}/api/admin/shipping-zones/`, {
            method: 'POST',
            body: JSON.stringify(data),
        })
    },

    /**
     * Update an existing shipping zone
     */
    async updateShippingZone(id: string, data: any) {
        return authFetch(`${API_URL}/api/admin/shipping-zones/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        })
    },

    /**
     * Delete a shipping zone (soft delete)
     */
    async deleteShippingZone(id: string) {
        return authFetch(`${API_URL}/api/admin/shipping-zones/${id}/`, {
            method: 'DELETE',
        })
    },

    // ============================================================================
    // COMMUNES
    // ============================================================================

    /**
     * List all communes
     */
    async listCommunes() {
        return authFetch(`${API_URL}/api/admin/communes/`)
    },

    /**
     * Get communes grouped by region
     */
    async getCommunesByRegion() {
        return authFetch(`${API_URL}/api/admin/communes/by-region/`)
    },

    /**
     * Search communes by name
     */
    async searchCommunes(query: string) {
        return authFetch(`${API_URL}/api/admin/communes/search/?q=${encodeURIComponent(query)}`)
    },

    // ============================================================================
    // CUSTOMERS
    // ============================================================================

    async listCustomers(params?: any) {
        const queryParams = new URLSearchParams()
        if (params?.search) queryParams.append('search', params.search)
        if (params?.customer_type && params.customer_type !== 'all') queryParams.append('customer_type', params.customer_type)
        return authFetch(`${API_URL}/api/admin/customers/?${queryParams.toString()}`)
    },

    async getCustomer(id: string) {
        return authFetch(`${API_URL}/api/admin/customers/${id}/`)
    },

    async createCustomer(data: any) {
        return authFetch(`${API_URL}/api/admin/customers/`, {
            method: 'POST',
            body: JSON.stringify(data),
        })
    },

    async updateCustomer(id: string, data: any) {
        return authFetch(`${API_URL}/api/admin/customers/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        })
    },

    async deleteCustomer(id: string) {
        return authFetch(`${API_URL}/api/admin/customers/${id}/`, {
            method: 'DELETE',
        })
    },

    // ============================================================================
    // COUPONS
    // ============================================================================

    async listCoupons(params?: any) {
        const queryParams = new URLSearchParams()
        if (params?.search) queryParams.append('search', params.search)
        if (params?.status) queryParams.append('status', params.status)
        return authFetch(`${API_URL}/api/admin/coupons/?${queryParams.toString()}`)
    },

    async getCoupon(id: string) {
        return authFetch(`${API_URL}/api/admin/coupons/${id}/`)
    },

    async createCoupon(data: any) {
        return authFetch(`${API_URL}/api/admin/coupons/`, {
            method: 'POST',
            body: JSON.stringify(data),
        })
    },

    async updateCoupon(id: string, data: any) {
        return authFetch(`${API_URL}/api/admin/coupons/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        })
    },

    async deleteCoupon(id: string) {
        return authFetch(`${API_URL}/api/admin/coupons/${id}/`, {
            method: 'DELETE',
        })
    },

    // ============================================================================
    // TENANT SETTINGS
    // ============================================================================

    async getTenantSettings() {
        return authFetch(`${API_URL}/api/admin/settings/tenant/`)
    },

    async updateTenantSettings(data: any) {
        return authFetch(`${API_URL}/api/admin/settings/tenant/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        })
    },

    async getDashboardStats() {
        return authFetch(`${API_URL}/api/admin/dashboard/stats/`)
    },

    // ============================================================================
    // SHIPPING CARRIERS
    // ============================================================================

    async listCarrierConfigs() {
        const response = await authFetch(`${API_URL}/api/admin/shipping-carriers/`)
        return response
    },

    async updateCarrierConfig(id: string, data: any) {
        return authFetch(`${API_URL}/api/admin/shipping-carriers/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        })
    },

    async createCarrierConfig(data: any) {
        return authFetch(`${API_URL}/api/admin/shipping-carriers/`, {
            method: 'POST',
            body: JSON.stringify(data),
        })
    },
}

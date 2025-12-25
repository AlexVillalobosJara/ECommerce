/**
 * API Configuration
 * 
 * For Production SaaS:
 * - Set API_BASE_URL to your production API domain
 * - Use environment variables (NEXT_PUBLIC_API_URL)
 * - Consider using same domain with reverse proxy
 */

// Get API URL from environment variable or use default for development
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Admin API base
export const API_BASE = `${API_BASE_URL}/api/admin`

export const API_ENDPOINTS = {
    // Admin Auth
    ADMIN_LOGIN: `${API_BASE_URL}/api/admin/auth/login/`,
    ADMIN_LOGOUT: `${API_BASE_URL}/api/admin/auth/logout/`,
    ADMIN_ME: `${API_BASE_URL}/api/admin/auth/me/`,

    // Admin Products
    ADMIN_PRODUCTS: `${API_BASE_URL}/api/admin/products/`,
    ADMIN_CATEGORIES: `${API_BASE_URL}/api/admin/categories/`,
}

export const config = {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    apiBaseUrl: API_BASE_URL,
}

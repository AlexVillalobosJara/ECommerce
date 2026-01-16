/**
 * DeepSeek AI Service
 * Service to generate product content using DeepSeek AI
 */

import { API_BASE_URL } from "@/config/api"

export interface AIGeneratedContent {
    short_description: string
    full_description: string
    meta_title: string
    meta_description: string
    keywords: string
    technical_specs: string
}

export interface AIContentRequest {
    product_name: string
}

// Helper to get auth token
function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('admin_access_token')
}

// Helper to get tenant slug
function getTenantSlug(): string | null {
    if (typeof window === 'undefined') return null
    const hostname = window.location.hostname
    const parts = hostname.split('.')
    if (hostname.includes('localhost') && parts.length >= 2 && parts[0] !== 'localhost') {
        return parts[0]
    }
    if (parts.length >= 3 && (hostname.includes('onrender.com') || hostname.includes('vercel.app'))) {
        const subdomain = parts[0]
        if (subdomain !== 'www' && subdomain !== 'api') {
            return subdomain
        }
    }
    return null
}

// Helper to get CSRF token from cookies
function getCsrfToken(): string | null {
    if (typeof document === 'undefined') return null
    const name = 'csrftoken'
    const cookies = document.cookie.split(';')
    for (let cookie of cookies) {
        const [key, value] = cookie.trim().split('=')
        if (key === name) {
            return decodeURIComponent(value)
        }
    }
    return null
}

class DeepSeekService {
    /**
     * Generate product content using AI
     */
    async generateProductContent(productName: string, prompt?: string): Promise<AIGeneratedContent> {
        const token = getAuthToken()
        const tenantSlug = getTenantSlug()
        const csrfToken = getCsrfToken()

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        if (tenantSlug) {
            headers['X-Tenant'] = tenantSlug
        }

        if (csrfToken) {
            headers['X-CSRFToken'] = csrfToken
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/products/generate-ai-content/`, {
                method: 'POST',
                headers,
                credentials: 'include', // Important for CSRF cookies
                body: JSON.stringify({
                    product_name: productName,
                    ai_prompt: prompt
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || 'Failed to generate AI content')
            }

            const data = await response.json()
            return data as AIGeneratedContent
        } catch (error: any) {
            const errorMessage = error.message || 'Failed to generate AI content'
            throw new Error(errorMessage)
        }
    }
}

export const deepseekService = new DeepSeekService()

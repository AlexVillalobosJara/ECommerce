import type { AdminCategory, CategoryFormData } from '@/types/admin'
import { API_BASE } from '@/config/api'

import { fetchWithAuth, getHeaders } from '@/lib/api-client'


/**
 * Get all categories
 */
export async function getCategories(parentId?: string): Promise<AdminCategory[]> {
    const url = parentId
        ? `${API_BASE}/categories/?parent_id=${parentId}`
        : `${API_BASE}/categories/`

    console.log('🔍 [getCategories] Starting fetch to:', url)

    const headers = getHeaders()
    console.log('🔍 [getCategories] Headers:', headers)

    console.log('🔍 [getCategories] Making fetch request...')
    const response = await fetchWithAuth(url, {
        method: 'GET',
        headers: headers,
    })

    console.log('🔍 [getCategories] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [getCategories] Error:', response.status, errorText)
        throw new Error(`Failed to fetch categories: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ [getCategories] Data received:', data)
    return data
}

/**
 * Get single category by ID
 */
export async function getCategory(id: string): Promise<AdminCategory> {
    console.log('🔍 [getCategory] Fetching category:', id)

    const response = await fetchWithAuth(`${API_BASE}/categories/${id}/`, {
        method: 'GET',
        headers: getHeaders(),
    })

    console.log('🔍 [getCategory] Response:', response.status, response.ok)

    if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [getCategory] Error:', response.status, errorText)
        throw new Error('Failed to fetch category')
    }

    const data = await response.json()
    console.log('✅ [getCategory] Data received:', data)
    return data
}

/**
 * Create new category
 */
export async function createCategory(data: CategoryFormData): Promise<AdminCategory> {
    const response = await fetchWithAuth(`${API_BASE}/categories/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create category')
    }

    return response.json()
}

/**
 * Update existing category
 */
export async function updateCategory(id: string, data: Partial<CategoryFormData>): Promise<AdminCategory> {
    const response = await fetchWithAuth(`${API_BASE}/categories/${id}/`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update category')
    }

    return response.json()
}

/**
 * Delete category (soft delete)
 */
export async function deleteCategory(id: string): Promise<void> {
    const response = await fetchWithAuth(`${API_BASE}/categories/${id}/`, {
        method: 'DELETE',
        headers: getHeaders(),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete category')
    }
}

/**
 * Reorder categories
 */
export async function reorderCategories(items: { id: string; sort_order: number }[]): Promise<void> {
    const response = await fetchWithAuth(`${API_BASE}/categories/reorder/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(items),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reorder categories')
    }
}

/**
 * Upload category image
 */
export async function uploadCategoryImage(id: string, file: File): Promise<AdminCategory> {
    const formData = new FormData()
    formData.append('image', file)

    const response = await fetchWithAuth(`${API_BASE}/categories/${id}/upload-image/`, {
        method: 'POST',
        headers: {
            ...getHeaders(),
            // Remove Content-Type to let browser set it with boundary for FormData
            'Content-Type': undefined as any,
        },
        body: formData,
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload image')
    }

    return response.json()
}

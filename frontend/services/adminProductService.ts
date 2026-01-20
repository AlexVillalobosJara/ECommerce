import type {
    AdminProduct,
    AdminProductListItem,
    AdminCategory,
    AdminProductVariant,
    AdminProductImage,
    ProductFormData,
    ProductFilters,
    VariantFormData,
    CategoryFormData
} from '@/types/admin'
import { API_BASE } from '@/config/api'

import { fetchWithAuth, getHeaders } from '@/lib/api-client'


// ============================================================================
// PRODUCT ENDPOINTS
// ============================================================================

export async function getProducts(filters?: ProductFilters): Promise<AdminProductListItem[]> {
    const params = new URLSearchParams()

    if (filters?.search) params.append('search', filters.search)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.category) params.append('category', filters.category)
    if (filters?.is_featured !== undefined) params.append('is_featured', filters.is_featured.toString())

    const url = `${API_BASE}/products/${params.toString() ? `?${params.toString()}` : ''}`

    const response = await fetchWithAuth(url, {
        method: 'GET',
        headers: getHeaders(),

    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(errorData.detail || `Failed to fetch products: ${response.status}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? data : (data.results || [])
}

export async function getProduct(productId: string): Promise<AdminProduct> {
    const response = await fetchWithAuth(`${API_BASE}/products/${productId}/`, {
        method: 'GET',
        headers: getHeaders(),

    })

    if (!response.ok) {
        throw new Error('Failed to fetch product')
    }

    return response.json()
}

export async function createProduct(data: ProductFormData): Promise<AdminProduct> {
    const response = await fetchWithAuth(`${API_BASE}/products/`, {
        method: 'POST',
        headers: getHeaders(),

        body: JSON.stringify(data),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create product')
    }

    return response.json()
}

export async function updateProduct(productId: string, data: Partial<ProductFormData>): Promise<AdminProduct> {
    const response = await fetchWithAuth(`${API_BASE}/products/${productId}/`, {
        method: 'PUT',
        headers: getHeaders(),

        body: JSON.stringify(data),
    })

    if (!response.ok) {
        console.error('[updateProduct] Response not OK:', response.status, response.statusText)
        const responseText = await response.text()
        console.error('[updateProduct] Response body:', responseText)

        let error
        try {
            error = JSON.parse(responseText)
        } catch {
            error = { detail: responseText || 'Unknown error' }
        }

        console.error('[updateProduct] Parsed error:', error)

        // Show detailed validation errors if available
        if (error.detail) {
            throw new Error(error.detail)
        }
        // If there are field-specific errors, show them
        if (typeof error === 'object' && !error.detail && !error.message) {
            const errorMessages = Object.entries(error)
                .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                .join('\n')
            throw new Error(errorMessages || 'Validation error')
        }
        throw new Error(error.message || error.error || 'Failed to update product')
    }

    return response.json()
}

export async function deleteProduct(productId: string): Promise<void> {
    const response = await fetchWithAuth(`${API_BASE}/products/${productId}/`, {
        method: 'DELETE',
        headers: getHeaders(),

    })

    if (!response.ok) {
        throw new Error('Failed to delete product')
    }
}

export async function publishProduct(productId: string): Promise<AdminProduct> {
    const response = await fetchWithAuth(`${API_BASE}/products/${productId}/publish/`, {
        method: 'POST',
        headers: getHeaders(),

    })

    if (!response.ok) {
        throw new Error('Failed to publish product')
    }

    return response.json()
}

export async function archiveProduct(productId: string): Promise<AdminProduct> {
    const response = await fetchWithAuth(`${API_BASE}/products/${productId}/archive/`, {
        method: 'POST',
        headers: getHeaders(),

    })

    if (!response.ok) {
        throw new Error('Failed to archive product')
    }

    return response.json()
}

// ============================================================================
// CATEGORY ENDPOINTS
// ============================================================================

export async function getCategories(): Promise<AdminCategory[]> {
    const response = await fetchWithAuth(`${API_BASE}/categories/`, {
        method: 'GET',
        headers: getHeaders(),

    })

    if (!response.ok) {
        throw new Error('Failed to fetch categories')
    }

    return response.json()
}

export async function createCategory(data: CategoryFormData): Promise<AdminCategory> {
    const response = await fetchWithAuth(`${API_BASE}/categories/`, {
        method: 'POST',
        headers: getHeaders(),

        body: JSON.stringify(data),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create category')
    }

    return response.json()
}

export async function updateCategory(categoryId: string, data: Partial<CategoryFormData>): Promise<AdminCategory> {
    const response = await fetchWithAuth(`${API_BASE}/categories/${categoryId}/`, {
        method: 'PUT',
        headers: getHeaders(),

        body: JSON.stringify(data),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update category')
    }

    return response.json()
}

export async function deleteCategory(categoryId: string): Promise<void> {
    const response = await fetchWithAuth(`${API_BASE}/categories/${categoryId}/`, {
        method: 'DELETE',
        headers: getHeaders(),

    })

    if (!response.ok) {
        throw new Error('Failed to delete category')
    }
}

// ============================================================================
// VARIANT ENDPOINTS
// ============================================================================

export async function createVariant(productId: string, data: VariantFormData): Promise<AdminProductVariant> {
    console.log('createVariant called with:', { productId, data })

    const response = await fetchWithAuth(`${API_BASE}/products/${productId}/variants/`, {
        method: 'POST',
        headers: getHeaders(),

        body: JSON.stringify(data),
    })

    console.log('createVariant response status:', response.status)

    if (!response.ok) {
        const responseText = await response.text()
        console.log('createVariant response text:', responseText)

        let error
        try {
            error = JSON.parse(responseText)
        } catch (e) {
            error = { detail: responseText || 'Unknown error' }
        }

        console.error('Create variant error:', error)
        // Show detailed validation errors if available
        if (typeof error === 'object' && !error.message && !error.detail) {
            const errorMessages = Object.entries(error)
                .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                .join('; ')
            throw new Error(errorMessages || 'Failed to create variant')
        }
        throw new Error(error.detail || error.message || 'Failed to create variant')
    }

    return response.json()
}

export async function updateVariant(
    productId: string,
    variantId: string,
    data: Partial<VariantFormData>
): Promise<AdminProductVariant> {
    const response = await fetchWithAuth(`${API_BASE}/products/${productId}/variants/${variantId}/`, {
        method: 'PUT',
        headers: getHeaders(),

        body: JSON.stringify(data),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update variant')
    }

    return response.json()
}

export async function deleteVariant(productId: string, variantId: string): Promise<void> {
    console.log('deleteVariant called with:', { productId, variantId })

    const response = await fetchWithAuth(`${API_BASE}/products/${productId}/variants/${variantId}/`, {
        method: 'DELETE',
        headers: getHeaders(),

    })

    console.log('deleteVariant response status:', response.status)

    if (!response.ok) {
        const responseText = await response.text()
        console.error('deleteVariant error response:', responseText)

        let error
        try {
            error = JSON.parse(responseText)
        } catch (e) {
            error = { detail: responseText || 'Unknown error' }
        }

        throw new Error(error.error || error.detail || error.message || 'Failed to delete variant')
    }
}

// ============================================================================
// IMAGE UPLOAD ENDPOINTS
// ============================================================================

export async function uploadProductImage(
    productId: string,
    file: File,
    metadata?: {
        alt_text?: string
        sort_order?: number
        is_primary?: boolean
    }
): Promise<AdminProductImage> {
    console.log('[uploadProductImage] Starting upload:', { productId, fileName: file.name, fileSize: file.size, metadata })

    const formData = new FormData()
    formData.append('image', file)

    if (metadata?.alt_text) formData.append('alt_text', metadata.alt_text)
    if (metadata?.sort_order !== undefined) formData.append('sort_order', metadata.sort_order.toString())
    if (metadata?.is_primary !== undefined) formData.append('is_primary', metadata.is_primary.toString())

    console.log('[uploadProductImage] FormData prepared, sending request...')

    const response = await fetchWithAuth(`${API_BASE}/products/${productId}/images/upload/`, {
        method: 'POST',
        headers: getHeaders(false),  // Don't include Content-Type for FormData
        body: formData,
    })

    console.log('[uploadProductImage] Response status:', response.status, response.statusText)

    if (!response.ok) {
        const responseText = await response.text()
        console.error('[uploadProductImage] Error response:', responseText)

        let error
        try {
            error = JSON.parse(responseText)
        } catch {
            error = { error: responseText || 'Failed to upload image' }
        }

        throw new Error(error.error || error.detail || 'Failed to upload image')
    }

    const result = await response.json()
    console.log('[uploadProductImage] Upload successful:', result)
    return result
}

export async function updateProductImage(
    productId: string,
    imageId: string,
    data: {
        alt_text?: string
        sort_order?: number
        is_primary?: boolean
    }
): Promise<AdminProductImage> {
    const response = await fetchWithAuth(`${API_BASE}/products/${productId}/images/${imageId}/`, {
        method: 'PUT',
        headers: getHeaders(),

        body: JSON.stringify(data),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update image')
    }

    return response.json()
}

export async function deleteProductImage(productId: string, imageId: string): Promise<void> {
    const response = await fetchWithAuth(`${API_BASE}/products/${productId}/images/${imageId}/`, {
        method: 'DELETE',
        headers: getHeaders(),
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('[deleteProductImage] Error:', response.status, errorText)
        throw new Error(`Failed to delete image (${response.status})`)
    }
}

export async function setProductImagePrimary(productId: string, imageId: string): Promise<AdminProductImage> {
    const response = await fetch(`${API_BASE}/products/${productId}/images/${imageId}/set-primary/`, {
        method: 'POST',
        headers: getHeaders(),

    })

    if (!response.ok) {
        throw new Error('Failed to set image as primary')
    }

    return response.json()
}

// ============================================================================
// PRODUCT FEATURES ENDPOINTS
// ============================================================================

export interface AdminProductFeature {
    id: string
    image_url: string
    title: string
    description: string
    sort_order: number
}

export async function createProductFeature(productId: string, data: Partial<AdminProductFeature>): Promise<AdminProductFeature> {
    const response = await fetchWithAuth(`${API_BASE}/products/${productId}/features/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    })

    if (!response.ok) {
        throw new Error('Failed to create feature')
    }

    return response.json()
}

export async function updateProductFeature(
    productId: string,
    featureId: string,
    data: Partial<AdminProductFeature>
): Promise<AdminProductFeature> {
    const response = await fetchWithAuth(`${API_BASE}/products/${productId}/features/${featureId}/`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
    })

    if (!response.ok) {
        throw new Error('Failed to update feature')
    }

    return response.json()
}

export async function deleteProductFeature(productId: string, featureId: string): Promise<void> {
    const response = await fetchWithAuth(`${API_BASE}/products/${productId}/features/${featureId}/`, {
        method: 'DELETE',
        headers: getHeaders(),
    })

    if (!response.ok) {
        throw new Error('Failed to delete feature')
    }
}

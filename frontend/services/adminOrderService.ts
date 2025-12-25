import { API_BASE } from '@/config/api'
import type { AdminOrder, AdminOrderListItem, OrderFilters, OrderStats } from '@/types/admin'

function getHeaders() {
    const token = localStorage.getItem('admin_access_token')
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    }
}

export async function getOrders(filters?: OrderFilters): Promise<AdminOrderListItem[]> {
    const params = new URLSearchParams()

    if (filters?.search) params.append('search', filters.search)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.type) params.append('type', filters.type)
    if (filters?.date_from) params.append('date_from', filters.date_from)
    if (filters?.date_to) params.append('date_to', filters.date_to)

    const queryString = params.toString()
    const url = `${API_BASE}/orders/${queryString ? `?${queryString}` : ''}`

    const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(),
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`)
    }

    return response.json()
}

export async function getOrder(id: string): Promise<AdminOrder> {
    const response = await fetch(`${API_BASE}/orders/${id}/`, {
        method: 'GET',
        headers: getHeaders(),
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch order: ${response.statusText}`)
    }

    return response.json()
}

export async function updateOrderStatus(
    id: string,
    status: string,
    notes?: string
): Promise<AdminOrder> {
    const response = await fetch(`${API_BASE}/orders/${id}/status/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ status, notes }),
    })

    if (!response.ok) {
        throw new Error(`Failed to update order status: ${response.statusText}`)
    }

    return response.json()
}

export async function cancelOrder(id: string, reason?: string): Promise<AdminOrder> {
    const response = await fetch(`${API_BASE}/orders/${id}/cancel/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ reason }),
    })

    if (!response.ok) {
        throw new Error(`Failed to cancel order: ${response.statusText}`)
    }

    return response.json()
}

export async function getOrderStats(): Promise<OrderStats> {
    const response = await fetch(`${API_BASE}/orders/stats/`, {
        method: 'GET',
        headers: getHeaders(),
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch order stats: ${response.statusText}`)
    }

    return response.json()
}

export async function respondToQuote(
    id: string,
    quoteData: {
        quote_items: Record<string, string>
        quote_valid_until: string
        internal_notes?: string
    }
): Promise<AdminOrder> {
    const response = await fetch(`${API_BASE}/orders/${id}/respond_quote/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(quoteData),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to respond to quote: ${response.statusText}`)
    }

    return response.json()
}

// Analytics helper functions for tracking e-commerce events

// Declare global types
declare global {
    interface Window {
        dataLayer: any[]
        gtag: (...args: any[]) => void
    }
}

/**
 * Push event to GTM dataLayer
 */
export const pushToDataLayer = (event: any) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push(event)
    }
}

/**
 * Track GA4 event
 */
export const trackEvent = (eventName: string, params?: any) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, params)
    }
}

/**
 * Track product view
 */
export const trackViewItem = (product: any) => {
    const event = {
        event: 'view_item',
        ecommerce: {
            currency: 'CLP',
            value: parseFloat(product.variants?.[0]?.price || '0'),
            items: [{
                item_id: product.sku || product.id,
                item_name: product.name,
                item_brand: product.brand || '',
                item_category: product.category?.name || '',
                price: parseFloat(product.variants?.[0]?.price || '0'),
            }]
        }
    }

    pushToDataLayer(event)
    trackEvent('view_item', event.ecommerce)
}

/**
 * Track add to cart
 */
export const trackAddToCart = (product: any, variant: any, quantity: number) => {
    const event = {
        event: 'add_to_cart',
        ecommerce: {
            currency: 'CLP',
            value: parseFloat(variant.price) * quantity,
            items: [{
                item_id: variant.sku || product.sku || product.id,
                item_name: product.name,
                item_brand: product.brand || '',
                item_category: product.category?.name || '',
                item_variant: variant.name || '',
                price: parseFloat(variant.price),
                quantity: quantity,
            }]
        }
    }

    pushToDataLayer(event)
    trackEvent('add_to_cart', event.ecommerce)
}

/**
 * Track begin checkout
 */
export const trackBeginCheckout = (items: any[], total: number) => {
    const event = {
        event: 'begin_checkout',
        ecommerce: {
            currency: 'CLP',
            value: total,
            items: items.map((item: any) => ({
                item_id: item.variant.sku || item.product.sku || item.product.id,
                item_name: item.product.name,
                item_brand: item.product.brand || '',
                item_category: item.product.category?.name || '',
                item_variant: item.variant.name || '',
                price: parseFloat(item.variant.price),
                quantity: item.quantity,
            }))
        }
    }

    pushToDataLayer(event)
    trackEvent('begin_checkout', event.ecommerce)
}

/**
 * Track purchase
 */
export const trackPurchase = (order: any) => {
    const event = {
        event: 'purchase',
        ecommerce: {
            transaction_id: order.id,
            value: parseFloat(order.total),
            tax: parseFloat(order.tax || '0'),
            shipping: parseFloat(order.shipping_cost || '0'),
            currency: 'CLP',
            items: order.items?.map((item: any) => ({
                item_id: item.sku,
                item_name: item.product_name,
                price: parseFloat(item.price),
                quantity: item.quantity,
            })) || []
        }
    }

    pushToDataLayer(event)
    trackEvent('purchase', event.ecommerce)
}

/**
 * Track search
 */
export const trackSearch = (searchTerm: string) => {
    const event = {
        event: 'search',
        search_term: searchTerm,
    }

    pushToDataLayer(event)
    trackEvent('search', { search_term: searchTerm })
}

/**
 * Track view item list (category)
 */
export const trackViewItemList = (category: string, products: any[]) => {
    const event = {
        event: 'view_item_list',
        ecommerce: {
            item_list_name: category,
            items: products.slice(0, 10).map((product: any, index: number) => ({
                item_id: product.sku || product.id,
                item_name: product.name,
                item_brand: product.brand || '',
                item_category: category,
                price: parseFloat(product.min_price || '0'),
                index: index,
            }))
        }
    }

    pushToDataLayer(event)
    trackEvent('view_item_list', event.ecommerce)
}

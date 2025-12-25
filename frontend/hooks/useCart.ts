"use client"

import { useState, useEffect } from 'react'
import type { ProductList, ProductVariant, CartItem } from '@/types/product'

const CART_STORAGE_KEY = 'ecommerce_cart'

interface CartState {
    purchaseItems: CartItem[]
    quoteItems: CartItem[]
}

export function useCart() {
    const [cart, setCart] = useState<CartState>({
        purchaseItems: [],
        quoteItems: [],
    })
    const [mounted, setMounted] = useState(false)

    // Load cart from localStorage on mount
    useEffect(() => {
        setMounted(true)
        const stored = localStorage.getItem(CART_STORAGE_KEY)
        if (stored) {
            try {
                setCart(JSON.parse(stored))
            } catch (error) {
                console.error('Error loading cart:', error)
            }
        }
    }, [])

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (mounted) {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
        }
    }, [cart, mounted])

    const addToCart = (product: ProductList, variant: ProductVariant, quantity: number = 1) => {
        setCart((prev) => {
            const items = product.is_quote_only ? prev.quoteItems : prev.purchaseItems
            const existingIndex = items.findIndex(
                (item) => item.variant.id === variant.id
            )

            let newItems
            if (existingIndex >= 0) {
                // Update quantity
                newItems = [...items]
                newItems[existingIndex] = {
                    ...newItems[existingIndex],
                    quantity: newItems[existingIndex].quantity + quantity,
                }
            } else {
                // Add new item
                newItems = [...items, { product, variant, quantity }]
            }

            return product.is_quote_only
                ? { ...prev, quoteItems: newItems }
                : { ...prev, purchaseItems: newItems }
        })
    }

    const removeFromCart = (variantId: string) => {
        setCart((prev) => ({
            purchaseItems: prev.purchaseItems.filter((item) => item.variant.id !== variantId),
            quoteItems: prev.quoteItems.filter((item) => item.variant.id !== variantId),
        }))
    }

    const updateQuantity = (variantId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(variantId)
            return
        }

        setCart((prev) => {
            const updateItems = (items: CartItem[]) =>
                items.map((item) =>
                    item.variant.id === variantId ? { ...item, quantity } : item
                )

            return {
                purchaseItems: updateItems(prev.purchaseItems),
                quoteItems: updateItems(prev.quoteItems),
            }
        })
    }

    const clearCart = () => {
        setCart({ purchaseItems: [], quoteItems: [] })
    }

    const getTotalItems = () => {
        return cart.purchaseItems.length + cart.quoteItems.length
    }

    const getTotalPrice = () => {
        return cart.purchaseItems.reduce((total, item) => {
            const price = parseFloat(item.variant.price || '0')
            return total + price * item.quantity
        }, 0)
    }

    return {
        purchaseItems: cart.purchaseItems,
        quoteItems: cart.quoteItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        mounted,
    }
}

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, Search, ShoppingBag, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MobileMenu } from "./mobile-menu"
import { SearchBar } from "./search-bar"
import { useTenant } from "@/contexts/TenantContext"
import { useCart } from "@/hooks/useCart"
import { storefrontApi } from "@/services/storefront-api"
import type { Category } from "@/types/product"

interface HeaderProps {
    onCartClick?: () => void
}

export function Header({ onCartClick }: HeaderProps) {
    const { tenant } = useTenant()
    const { getTotalItems } = useCart()
    const cartCount = getTotalItems()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])

    // Fetch categories on mount
    useEffect(() => {
        async function loadCategories() {
            if (!tenant) return
            try {
                const data = await storefrontApi.getCategories(tenant.slug)
                // Filter only root categories (no parent) if needed, or take all
                // For the menu, usually we show top-level. 
                const rootCategories = data.filter(c => !c.parent)
                setCategories(rootCategories)
            } catch (error) {
                console.error("Failed to load categories:", error)
            }
        }

        loadCategories()
    }, [tenant])

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-border bg-white/80 backdrop-blur-md">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    {/* Left: Menu + Search */}
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Open menu"
                        >
                            <Menu className="size-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSearchOpen(!searchOpen)}
                            aria-label="Search"
                        >
                            {searchOpen ? <X className="size-5" /> : <Search className="size-5" />}
                        </Button>
                    </div>

                    {/* Center: Logo and Nav */}
                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-3">
                            {tenant?.logo_url && (
                                <img
                                    src={tenant.logo_url}
                                    alt={tenant.name || "Logo"}
                                    className="h-8 w-auto object-contain"
                                />
                            )}
                            <span className="font-serif text-xl font-normal tracking-wider">
                                {tenant?.name || "Store"}
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        {/* Removed "Productos" link as requested */}
                    </div>

                    {/* Right: Cart */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative"
                        aria-label="Shopping cart"
                        onClick={onCartClick}
                    >
                        <ShoppingBag className="size-5" />
                        {cartCount > 0 && (
                            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-bold">
                                {cartCount > 9 ? "9+" : cartCount}
                            </span>
                        )}
                    </Button>
                </div>

                {/* Search Bar Overlay */}
                {searchOpen && (
                    <div className="border-t border-border bg-background p-4 animate-in slide-in-from-top-2">
                        <div className="container mx-auto max-w-2xl">
                            <SearchBar />
                        </div>
                    </div>
                )}
            </header>

            {/* Mobile Menu Dropdown */}
            <MobileMenu
                open={mobileMenuOpen}
                onOpenChange={setMobileMenuOpen}
                categories={categories}
                tenant={tenant}
            />
        </>
    )
}

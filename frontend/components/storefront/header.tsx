"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, Search, ShoppingBag, X, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MobileMenu } from "./mobile-menu"
import { SearchBar } from "./search-bar"
import { useTenant } from "@/contexts/TenantContext"
import { useCart } from "@/hooks/useCart"
import { storefrontApi } from "@/services/storefront-api"
import { getImageUrl } from "@/lib/image-utils"
import { getFlagUrl } from "@/lib/region-utils"
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
            <header className="sticky top-0 z-50 w-full border-b border-border/10 backdrop-blur-md" style={{ backgroundColor: 'var(--header-bg, var(--tenant-primary))' }}>
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    {/* Left: Menu + Search */}
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Open menu"
                            className="hover:text-white hover:bg-[var(--accent-dark)]"
                            style={{ color: 'var(--header-text, var(--tenant-secondary-text))' }}
                        >
                            <Menu className="size-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSearchOpen(!searchOpen)}
                            aria-label="Search"
                            className="hover:text-white hover:bg-[var(--accent-dark)]"
                            style={{ color: 'var(--header-text, var(--tenant-secondary-text))' }}
                        >
                            {searchOpen ? <X className="size-5" /> : <Search className="size-5" />}
                        </Button>
                    </div>

                    {/* Center: Logo and Nav */}
                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-3">
                            {tenant?.logo_url && (
                                <img
                                    src={getImageUrl(tenant.logo_url)}
                                    alt={tenant.name || "Logo"}
                                    className="h-8 w-auto object-contain"
                                />
                            )}
                            <span className="font-serif text-xl font-normal tracking-wider" style={{ color: 'var(--header-text, var(--tenant-secondary-text))' }}>
                                {tenant?.name || "Store"}
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        {/* Removed "Productos" link as requested */}
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center gap-1 md:gap-4">
                        {/* Phone Number */}
                        {tenant?.phone && (
                            <a
                                href={`tel:${tenant.phone}`}
                                className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-sm font-medium hover:text-white transition-colors"
                                style={{ color: 'var(--header-text, var(--tenant-secondary-text))' }}
                            >
                                <Phone className="size-4" />
                                <span>{tenant.phone}</span>
                            </a>
                        )}

                        {/* Country Flag */}
                        {tenant?.country && (
                            <div className="flex items-center px-1">
                                <img
                                    src={getFlagUrl(tenant.country)}
                                    alt={tenant.country}
                                    title={tenant.country}
                                    className="h-3.5 w-auto rounded-[2px] shadow-[0_0_1px_rgba(0,0,0,0.5)] object-contain opacity-90"
                                />
                            </div>
                        )}

                        {/* Shopping Bag */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative hover:text-white"
                            style={{
                                color: 'var(--header-text, var(--tenant-secondary-text))',
                                ['--hover-bg' as any]: 'var(--header-text, var(--tenant-secondary-text))'
                            }}
                            onMouseEnter={(e) => {
                                const bg = getComputedStyle(e.currentTarget).getPropertyValue('--hover-bg')
                                e.currentTarget.style.backgroundColor = bg + '20' // 20 = ~12% opacity
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                            aria-label="Shopping cart"
                            onClick={onCartClick}
                        >
                            <ShoppingBag className="size-5" />
                            {cartCount > 0 && (
                                <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-white text-xs text-primary font-bold">
                                    {cartCount > 9 ? "9+" : cartCount}
                                </span>
                            )}
                        </Button>
                    </div>
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

"use client"

import { useState } from "react"
import { Menu, Search, ShoppingBag, Phone, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MobileMenu } from "../mobile-menu"
import { SearchBar } from "../search-bar"
import { getFlagUrl } from "@/lib/region-utils"

interface HeaderProps {
    onMenuClick?: () => void
    onSearchClick?: () => void
    onCartClick?: () => void
    cartItemsCount?: number
    logoText?: string
    categories?: any[]
    tenant?: any
}

export function BlueVoltHeader({
    onMenuClick,
    onSearchClick,
    onCartClick,
    cartItemsCount = 0,
    logoText = "BLUEVOLT",
    categories = [],
    tenant
}: HeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-[#0a1628]/95 backdrop-blur-md">
                <div className="hidden border-b border-white/10 bg-[#0a1628] py-2 text-xs text-white/70 md:block">
                    <div className="container mx-auto flex items-center justify-between px-4">
                        <div className="flex items-center gap-4">
                            <span>Envío gratis en compras mayores a $500.000</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <a href={`tel:${tenant?.phone || "+56912345678"}`} className="flex items-center gap-1 hover:text-white transition-colors">
                                <Phone className="size-3" />
                                {tenant?.phone || "+56 9 1234 5678"}
                            </a>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    {/* Left: Menu + Search */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Open menu"
                            className="text-white hover:bg-white/10"
                        >
                            <Menu className="size-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSearchOpen(!searchOpen)}
                            aria-label="Search"
                            className="text-white hover:bg-white/10"
                        >
                            {searchOpen ? <X className="size-5" /> : <Search className="size-5" />}
                        </Button>
                    </div>

                    {/* Center: Logo */}
                    <div className="absolute left-1/2 -translate-x-1/2">
                        <h1 className="font-serif text-2xl font-bold tracking-wider text-white">{tenant?.name || logoText}</h1>
                    </div>

                    {/* Right: Cart */}
                    <div className="flex items-center gap-4">
                        {tenant?.country && (
                            <div className="flex items-center justify-center" title={tenant.country}>
                                <img
                                    src={getFlagUrl(tenant.country)}
                                    alt={tenant.country}
                                    className="h-5 w-auto rounded-[2px]"
                                />
                            </div>
                        )}
                        <Button
                            variant="ghost"
                            onClick={onCartClick}
                            className="relative text-white hover:bg-white/10 px-4 gap-2"
                            aria-label="Shopping cart"
                        >
                            <ShoppingBag className="size-5" />
                            {cartItemsCount > 0 && (
                                <span className="absolute right-2 top-1 flex size-5 items-center justify-center rounded-full bg-[#e63329] text-xs font-bold text-white">
                                    {cartItemsCount > 9 ? "9+" : cartItemsCount}
                                </span>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Search Bar Overlay */}
                {searchOpen && (
                    <div className="absolute top-full left-0 right-0 border-t border-border bg-white p-4 shadow-lg animate-in slide-in-from-top-2">
                        <div className="container mx-auto max-w-2xl text-black">
                            <SearchBar />
                        </div>
                    </div>
                )}
            </header>

            <MobileMenu
                open={mobileMenuOpen}
                onOpenChange={setMobileMenuOpen}
                categories={categories}
                tenant={tenant}
            />
        </>
    )
}

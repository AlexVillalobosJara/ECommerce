"use client"

import { useEffect } from "react"
import Link from "next/link"
import { type Category } from "@/types/product"
import { type Tenant } from "@/types/tenant"
import { Phone } from "lucide-react"
import { getFlagUrl } from "@/lib/region-utils"

interface MobileMenuProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    categories?: Category[]
    tenant: Tenant | null
}

export function MobileMenu({ open, onOpenChange, categories = [], tenant }: MobileMenuProps) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onOpenChange(false)
            }
        }

        if (open) {
            document.addEventListener("keydown", handleEscape)
            return () => document.removeEventListener("keydown", handleEscape)
        }
    }, [open, onOpenChange])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            // Close if clicking outside the content area (but not on the trigger button)
            if (!target.closest(".mobile-menu-content") && !target.closest("button[aria-label='Open menu']")) {
                onOpenChange(false)
            }
        }

        if (open) {
            document.addEventListener("click", handleClickOutside)
            return () => document.removeEventListener("click", handleClickOutside)
        }
    }, [open, onOpenChange])

    const handleLinkClick = () => {
        onOpenChange(false)
    }

    if (!open) return null

    return (
        <div className="mobile-menu-content fixed top-16 left-0 right-0 z-40 border-b border-border bg-white shadow-lg animate-in slide-in-from-top-2">
            <div className="container mx-auto max-h-[calc(100vh-4rem)] overflow-y-auto px-6 py-8">
                <nav className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">

                    {/* Categorías (Dynamic) */}
                    <div>
                        <h3 className="mb-4 font-serif text-lg font-medium tracking-wide">Categorías</h3>
                        <div className="flex flex-col space-y-3">
                            {categories.length > 0 ? (
                                categories.map((category) => (
                                    <Link
                                        key={category.id}
                                        href={`/products?category=${category.slug}`}
                                        onClick={handleLinkClick}
                                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        {category.name}
                                    </Link>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground italic">Cargando categorías...</p>
                            )}
                        </div>
                    </div>

                    {/* Ayuda y Legal */}
                    {(tenant?.terms_policy_text || tenant?.terms_policy_mode === 'Default' || tenant?.privacy_policy_text || tenant?.privacy_policy_mode === 'Default' || tenant?.faq_text) && (
                        <div>
                            <h3 className="mb-4 font-serif text-lg font-medium tracking-wide">Ayuda y Legal</h3>
                            <div className="flex flex-col space-y-3">
                                {(tenant?.terms_policy_text || tenant?.terms_policy_mode === 'Default') && (
                                    <Link
                                        href="/pages/terms-and-conditions"
                                        onClick={handleLinkClick}
                                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        Términos y condiciones de uso
                                    </Link>
                                )}
                                {(tenant?.privacy_policy_text || tenant?.privacy_policy_mode === 'Default') && (
                                    <Link
                                        href="/pages/privacy-policy"
                                        onClick={handleLinkClick}
                                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        Políticas de privacidad
                                    </Link>
                                )}
                                {tenant?.faq_text && (
                                    <Link
                                        href="/pages/faq"
                                        onClick={handleLinkClick}
                                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        Preguntas frecuentes
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Acerca de Nosotros */}
                    {(tenant?.mission_text || tenant?.vision_text || tenant?.our_history_text || tenant?.about_us_text) && (
                        <div>
                            <h3 className="mb-4 font-serif text-lg font-medium tracking-wide">Acerca de nosotros</h3>
                            <div className="flex flex-col space-y-3">
                                {tenant?.mission_text && (
                                    <Link
                                        href="/pages/mission"
                                        onClick={handleLinkClick}
                                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        Misión
                                    </Link>
                                )}
                                {tenant?.vision_text && (
                                    <Link
                                        href="/pages/vision"
                                        onClick={handleLinkClick}
                                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        Visión
                                    </Link>
                                )}
                                {tenant?.our_history_text && (
                                    <Link
                                        href="/pages/our-history"
                                        onClick={handleLinkClick}
                                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        Historia
                                    </Link>
                                )}
                                {tenant?.about_us_text && (
                                    <Link
                                        href="/pages/about-us"
                                        onClick={handleLinkClick}
                                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        Quiénes somos
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </nav>

                {/* Bottom Contact Section */}
                <div className="mt-12 flex flex-col items-center gap-6 border-t border-border pt-8 text-center">
                    {tenant?.phone && (
                        <a
                            href={`tel:${tenant.phone}`}
                            className="flex items-center gap-3 text-lg font-medium text-foreground transition-all hover:scale-105"
                        >
                            <Phone className="size-5 text-primary" />
                            <span>{tenant.phone}</span>
                        </a>
                    )}

                    {tenant?.country && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-widest">
                            <img
                                src={getFlagUrl(tenant.country)}
                                alt={tenant.country}
                                className="h-4 w-auto rounded-[2px] shadow-sm grayscale-[0.2]"
                            />
                            <span>{tenant.country}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

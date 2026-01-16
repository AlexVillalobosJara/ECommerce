"use client"

import Link from "next/link"
import { useTenant } from "@/contexts/TenantContext"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CatalogCTA() {
    const { tenant } = useTenant()

    if (!tenant) return null

    return (
        <section className="container mx-auto px-4 py-20">
            <div className="mt-20 animate-fade-in">
                <div className="relative overflow-hidden rounded-lg border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-12 text-center shadow-sm">
                    <div className="relative z-10">
                        <h3 className="font-serif text-3xl font-light tracking-tight" style={{ color: 'var(--cta-text, var(--tenant-accent-dark))' }}>
                            {tenant.cta_title || "Explora Toda Nuestra Colección"}
                        </h3>
                        <p className="mx-auto mt-4 max-w-2xl text-lg" style={{ color: 'var(--cta-text, var(--tenant-accent-dark))' }}>
                            {tenant.cta_description || "Descubre más de 100 productos de acero inoxidable diseñados para profesionales. Calidad premium, diseño elegante y durabilidad garantizada."}
                        </p>
                        <div className="mt-8 flex justify-center">
                            <Link href={tenant.cta_link || "/products"}>
                                <Button
                                    size="lg"
                                    className="h-12 gap-2 px-8 font-serif text-base hover:opacity-90 transition-opacity"
                                    style={{
                                        backgroundColor: 'var(--cta-btn-bg, var(--tenant-accent-medium))',
                                        color: 'var(--cta-btn-text, var(--tenant-secondary-text))'
                                    }}
                                >
                                    {tenant.cta_button_text || "Ver Catálogo Completo"}
                                    <ArrowRight className="size-5" />
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute -right-20 -top-20 size-40 rounded-full bg-neutral-100/50 blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 size-40 rounded-full bg-neutral-100/50 blur-3xl" />
                </div>
            </div>
        </section>
    )
}

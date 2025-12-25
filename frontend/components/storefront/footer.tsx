"use client"

import { useTenant } from "@/contexts/TenantContext"
import Link from "next/link"

export function Footer() {
    const { tenant } = useTenant()
    const year = new Date().getFullYear()

    if (!tenant) return null

    return (
        <footer className="border-t border-border bg-muted/30">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                    {/* Company Info */}
                    <div className="space-y-4">
                        <h3 className="font-serif text-lg font-semibold">Acerca de {tenant.name}</h3>
                        <p className="text-sm text-muted-foreground">
                            {tenant.about_us_text ? (tenant.about_us_text.substring(0, 150) + "...") : "Bienvenido a nuestra tienda."}
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h3 className="font-serif text-lg font-semibold">Enlaces</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/" className="text-muted-foreground hover:text-foreground">Inicio</Link></li>
                            <li><Link href="/products" className="text-muted-foreground hover:text-foreground">Productos</Link></li>
                            {tenant.about_us_text && (
                                <li><Link href="/pages/about-us" className="text-muted-foreground hover:text-foreground">Nosotros</Link></li>
                            )}
                            {tenant.our_history_text && (
                                <li><Link href="/pages/our-history" className="text-muted-foreground hover:text-foreground">Nuestra Historia</Link></li>
                            )}
                        </ul>
                    </div>

                    {/* Customer Service / Policies */}
                    <div className="space-y-4">
                        <h3 className="font-serif text-lg font-semibold">Información Legal</h3>
                        <ul className="space-y-2 text-sm">
                            {(tenant.terms_policy_text || tenant.terms_policy_mode === 'Default') && (
                                <li><Link href="/pages/terms-and-conditions" className="text-muted-foreground hover:text-foreground">Términos y Condiciones</Link></li>
                            )}
                            {(tenant.privacy_policy_text || tenant.privacy_policy_mode === 'Default') && (
                                <li><Link href="/pages/privacy-policy" className="text-muted-foreground hover:text-foreground">Política de Privacidad</Link></li>
                            )}
                            {tenant.faq_text && (
                                <li><Link href="/pages/faq" className="text-muted-foreground hover:text-foreground">Preguntas Frecuentes</Link></li>
                            )}
                            {tenant.mission_text && (
                                <li><Link href="/pages/mission" className="text-muted-foreground hover:text-foreground">Misión</Link></li>
                            )}
                            {tenant.vision_text && (
                                <li><Link href="/pages/vision" className="text-muted-foreground hover:text-foreground">Visión</Link></li>
                            )}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-4">
                        <h3 className="font-serif text-lg font-semibold">Contacto</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            {tenant.email && <li>Email: {tenant.email}</li>}
                            {tenant.phone && <li>Teléfono: {tenant.phone}</li>}
                            {tenant.address && <li>{tenant.address}</li>}
                            {tenant.country && <li>{tenant.country}</li>}
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
                    <p>&copy; {year} {tenant.legal_name || tenant.name}. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>
    )
}


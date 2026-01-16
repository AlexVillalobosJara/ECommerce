"use client"

import { useTenant } from "@/contexts/TenantContext"
import Link from "next/link"

export function Footer() {
    const { tenant } = useTenant()
    const year = new Date().getFullYear()

    if (!tenant) return null

    return (
        <footer
            className="border-t border-border/10"
            style={{
                backgroundColor: 'var(--footer-bg, var(--tenant-accent-dark))',
                color: 'var(--footer-text, var(--tenant-secondary-text))'
            }}
        >
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                    {/* Company Info */}
                    <div className="space-y-4">
                        <h3 className="font-serif text-lg font-semibold" style={{ color: 'var(--footer-text, var(--tenant-secondary-text))' }}>Acerca de {tenant.name}</h3>
                        <p className="text-sm opacity-80" style={{ color: 'var(--footer-text, var(--tenant-secondary-text))' }}>
                            {tenant.about_us_text ? (tenant.about_us_text.substring(0, 150) + "...") : "Bienvenido a nuestra tienda."}
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h3 className="font-serif text-lg font-semibold" style={{ color: 'var(--footer-text, var(--tenant-secondary-text))' }}>Enlaces</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/" className="opacity-80 hover:opacity-100 transition-opacity" style={{ color: 'var(--footer-text, var(--tenant-secondary-text))' }}>Inicio</Link></li>
                            <li><Link href="/products" className="opacity-80 hover:opacity-100 transition-opacity" style={{ color: 'var(--footer-text, var(--tenant-secondary-text))' }}>Productos</Link></li>
                            {tenant.about_us_text && (
                                <li><Link href="/pages/about-us" className="opacity-80 hover:opacity-100 transition-opacity" style={{ color: 'var(--footer-text, var(--tenant-secondary-text))' }}>Nosotros</Link></li>
                            )}
                            {tenant.our_history_text && (
                                <li><Link href="/pages/our-history" className="opacity-80 hover:opacity-100 transition-opacity" style={{ color: 'var(--footer-text, var(--tenant-secondary-text))' }}>Nuestra Historia</Link></li>
                            )}
                        </ul>
                    </div>

                    {/* Customer Service / Policies */}
                    <div className="space-y-4">
                        <h3 className="font-serif text-lg font-semibold" style={{ color: 'var(--footer-text, var(--tenant-secondary-text))' }}>Información Legal</h3>
                        <ul className="space-y-2 text-sm">
                            {(tenant.terms_policy_text || tenant.terms_policy_mode === 'Default') && (
                                <li><Link href="/pages/terms-and-conditions" className="opacity-80 hover:opacity-100 transition-opacity" style={{ color: 'var(--footer-text, var(--tenant-secondary-text))' }}>Términos y Condiciones</Link></li>
                            )}
                            {(tenant.privacy_policy_text || tenant.privacy_policy_mode === 'Default') && (
                                <li><Link href="/pages/privacy-policy" className="opacity-80 hover:opacity-100 transition-opacity" style={{ color: 'var(--footer-text, var(--tenant-secondary-text))' }}>Política de Privacidad</Link></li>
                            )}
                            {tenant.faq_text && (
                                <li><Link href="/pages/faq" className="opacity-80 hover:opacity-100 transition-opacity" style={{ color: 'var(--footer-text, var(--tenant-secondary-text))' }}>Preguntas Frecuentes</Link></li>
                            )}
                            {tenant.mission_text && (
                                <li><Link href="/pages/mission" className="opacity-80 hover:opacity-100 transition-opacity" style={{ color: 'var(--footer-text, var(--tenant-secondary-text))' }}>Misión</Link></li>
                            )}
                            {tenant.vision_text && (
                                <li><Link href="/pages/vision" className="opacity-80 hover:opacity-100 transition-opacity" style={{ color: 'var(--footer-text, var(--tenant-secondary-text))' }}>Visión</Link></li>
                            )}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-4">
                        <h3 className="font-serif text-lg font-semibold" style={{ color: 'var(--footer-text, var(--tenant-secondary-text))' }}>Contacto</h3>
                        <ul className="space-y-2 text-sm opacity-80" style={{ color: 'var(--footer-text, var(--tenant-secondary-text))' }}>
                            {tenant.email && <li>Email: {tenant.email}</li>}
                            {tenant.phone && <li>Teléfono: {tenant.phone}</li>}
                            {tenant.address && <li>{tenant.address}</li>}
                            {tenant.country && <li>{tenant.country}</li>}
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-12 border-t border-white/10 pt-8 text-center text-sm opacity-80" style={{ color: 'var(--footer-text, var(--tenant-secondary-text))' }}>
                    <p>&copy; {year} {tenant.legal_name || tenant.name}. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>
    )
}


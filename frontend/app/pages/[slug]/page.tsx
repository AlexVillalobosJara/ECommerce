"use client"

import { use } from "react"
import { useTenant } from "@/contexts/TenantContext"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { DEFAULT_PRIVACY_POLICY, DEFAULT_TERMS_AND_CONDITIONS, formatPolicy } from "@/config/default-policies"

const PAGE_MAPPING: Record<string, { title: string, field: keyof any, modeField?: keyof any, defaultTemplate?: string }> = {
    "privacy-policy": {
        title: "Política de Privacidad",
        field: "privacy_policy_text",
        modeField: "privacy_policy_mode",
        defaultTemplate: DEFAULT_PRIVACY_POLICY
    },
    "terms-and-conditions": {
        title: "Términos y Condiciones",
        field: "terms_policy_text",
        modeField: "terms_policy_mode",
        defaultTemplate: DEFAULT_TERMS_AND_CONDITIONS
    },
    "about-us": { title: "Acerca de Nosotros", field: "about_us_text" },
    "our-history": { title: "Nuestra Historia", field: "our_history_text" },
    "mission": { title: "Misión", field: "mission_text" },
    "vision": { title: "Visión", field: "vision_text" },
    "faq": { title: "Preguntas Frecuentes", field: "faq_text" },
}

export default function DynamicPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = use(params)
    const { tenant, loading } = useTenant()

    if (loading) return <div className="container py-12">Cargando...</div>
    if (!tenant) {
        return (
            <div className="container py-24 text-center">
                <h1 className="text-4xl font-bold mb-4">Error de Configuración</h1>
                <p className="text-muted-foreground mb-8">No se pudo identificar la tienda (Tenant ID missing).</p>
                <div className="p-4 bg-muted/50 rounded-lg inline-block text-left text-sm mb-8">
                    <p><strong>Debug Info:</strong></p>
                    <p>URL: {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
                    <p>Slug: {typeof localStorage !== 'undefined' ? localStorage.getItem('tenant_slug') : 'N/A'}</p>
                </div>
                <br />
                <a href="/?tenant=demo" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                    Ir a Inicio (Demo Tenant)
                </a>
            </div>
        )
    }

    const pageConfig = PAGE_MAPPING[resolvedParams.slug]
    if (!pageConfig) return notFound()

    let content = tenant[pageConfig.field as keyof typeof tenant] as string

    // Handle Default Mode for policies
    if (pageConfig.modeField) {
        const mode = tenant[pageConfig.modeField as keyof typeof tenant] as string
        if (mode === 'Default' && pageConfig.defaultTemplate) {
            content = formatPolicy(pageConfig.defaultTemplate, tenant)
        }
    }

    if (!content) {
        return (
            <div className="container py-12 text-center text-muted-foreground">
                <h1 className="text-3xl font-bold mb-4">{pageConfig.title}</h1>
                <p>Contenido no disponible.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto px-4 py-16 md:py-24">
                {/* Breadcrumb */}
                <a
                    href="/"
                    className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-4"
                    >
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                    Volver al inicio
                </a>

                {/* Content */}
                <article className="mx-auto max-w-4xl">
                    {/* Header */}
                    <header className="mb-12 border-b border-border pb-8">
                        <h1 className="font-serif text-4xl font-normal tracking-tight text-foreground md:text-5xl">
                            {pageConfig.title}
                        </h1>
                        <p className="mt-4 text-muted-foreground">
                            Última actualización:{" "}
                            {new Date().toLocaleDateString("es-CL", { year: "numeric", month: "long", day: "numeric" })}
                        </p>
                    </header>

                    {/* Content Body */}
                    <div className="prose max-w-none whitespace-pre-wrap text-foreground leading-relaxed text-muted-foreground text-lg">
                        {content}
                    </div>

                    {/* Contact Section */}
                    <section className="mt-16 rounded-lg border border-border bg-muted/30 p-8">
                        <h2 className="mb-4 font-serif text-xl font-normal tracking-tight text-foreground">¿Tienes preguntas?</h2>
                        <p className="mb-4 leading-relaxed text-muted-foreground">
                            Si tienes alguna pregunta sobre {pageConfig.title}, por favor contáctanos:
                        </p>
                        <div className="space-y-2 text-muted-foreground">
                            {tenant.email && (
                                <p>
                                    <span className="font-medium text-foreground">Email:</span>{" "}
                                    <a href={`mailto:${tenant.email}`} className="underline hover:text-foreground">
                                        {tenant.email}
                                    </a>
                                </p>
                            )}
                            {tenant.phone && (
                                <p>
                                    <span className="font-medium text-foreground">Teléfono:</span> {tenant.phone}
                                </p>
                            )}
                        </div>
                    </section>
                </article>
            </main>
        </div>
    )
}

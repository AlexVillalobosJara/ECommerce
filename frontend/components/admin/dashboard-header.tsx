"use client"

import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTenant } from "@/contexts/TenantContext"
import { useAdminAuth } from "@/contexts/AdminAuthContext"
import { useAdminUI } from "@/contexts/AdminUIContext"

const routeLabels: Record<string, string> = {
    "/admin": "Inicio",
    "/admin/catalog": "Productos",
    "/admin/products": "Productos",
    "/admin/products/new": "Nuevo Producto",
    "/admin/categories": "Categorías",
    "/admin/categories/new": "Nueva Categoría",
    "/admin/orders": "Pedidos",
    "/admin/customers": "Clientes",
    "/admin/customers/new": "Nuevo Cliente",
    "/admin/shipping-zones": "Zonas de Reparto",
    "/admin/shipping-zones/new": "Nueva Zona",
    "/admin/settings/payments": "Pasarelas de Pago",
    "/admin/settings": "Configuración",
    "/admin/users": "Gestión de Usuarios",
    "/admin/coupons": "Cupones",
}

export function DashboardHeader() {
    const pathname = usePathname()
    const { tenant } = useTenant()
    const { user } = useAdminAuth()
    const { title: dynamicTitle, description: dynamicDescription } = useAdminUI()

    // Generate breadcrumbs from pathname
    const generateBreadcrumbs = () => {
        const segments = pathname.split("/").filter(Boolean)
        const breadcrumbs = segments.map((segment, index) => {
            const href = `/${segments.slice(0, index + 1).join("/")}`
            return {
                label: routeLabels[href] || segment.charAt(0).toUpperCase() + segment.slice(1),
                href,
            }
        })

        return breadcrumbs.length > 0 ? breadcrumbs : [{ label: "Inicio", href: "/admin" }]
    }

    const breadcrumbs = generateBreadcrumbs()

    // Use dynamic title if provided, otherwise fallback to breadcrumb label
    const pageTitle = dynamicTitle || breadcrumbs[breadcrumbs.length - 1].label

    return (
        <header className="h-16 border-b border-border bg-card sticky top-0 z-20">
            <div className="h-full px-6 flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                    <div className="flex flex-col min-w-0">
                        {/* Breadcrumbs */}
                        <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            {breadcrumbs.map((crumb, index) => (
                                <div key={crumb.href} className="flex items-center gap-1">
                                    {index > 0 && <ChevronRight className="w-3 h-3" />}
                                    <span
                                        className={cn(
                                            "truncate max-w-[150px]",
                                            (index === breadcrumbs.length - 1 && !dynamicTitle)
                                                ? "text-foreground font-medium"
                                                : "hover:text-foreground transition-colors",
                                        )}
                                    >
                                        {crumb.label}
                                    </span>
                                </div>
                            ))}
                        </nav>
                        {/* Page Title & Description */}
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-base font-semibold text-foreground truncate leading-tight">
                                {pageTitle}
                            </h1>
                            {dynamicDescription && (
                                <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                                    {dynamicDescription}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Tenant Identity */}
                    <div className="flex items-center gap-3 pl-4 border-l border-border transition-all hover:opacity-80 cursor-default">
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-bold leading-none">{tenant?.name || "Zumi Store"}</span>
                            <span className="text-[10px] text-muted-foreground leading-none mt-1">
                                {tenant?.custom_domain || `${tenant?.slug}.zumi.cl`}
                            </span>
                        </div>
                        <div className="w-9 h-9 rounded-lg bg-primary shadow-sm flex items-center justify-center text-primary-foreground font-bold overflow-hidden">
                            {tenant?.logo_url ? (
                                <img src={tenant.logo_url} alt={tenant.name} className="w-full h-full object-cover" />
                            ) : (
                                tenant?.name?.charAt(0) || "Z"
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}

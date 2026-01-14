"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    FileText,
    Users,
    Settings,
    ExternalLink,
    Menu,
    LogOut,
    FolderTree,
    CreditCard,
    Truck,
    ChevronLeft,
    ChevronRight,
    UserCircle,
    BarChart3,
    Link2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useAdminAuth } from "@/contexts/AdminAuthContext"
import { DashboardHeader } from "./dashboard-header"
import {
    Sheet,
    SheetContent,
} from "@/components/ui/sheet"

const navigation = [
    { name: "Inicio", href: "/admin", icon: LayoutDashboard },
    { name: "Categorías", href: "/admin/categories", icon: FolderTree },
    { name: "Productos", href: "/admin/catalog", icon: Package },
    { name: "Pedidos", href: "/admin/orders", icon: ShoppingCart },
    { name: "Clientes", href: "/admin/customers", icon: Users },
    { name: "Cupones", href: "/admin/coupons", icon: FileText },
    { name: "Zonas de Reparto", href: "/admin/shipping-zones", icon: Truck, roles: ['Owner', 'Admin'] },
    { name: "Pasarelas de Pago", href: "/admin/settings/payments", icon: CreditCard, roles: ['Owner', 'Admin'] },
    { name: "Marketing & Analytics", href: "/admin/settings/marketing", icon: BarChart3, roles: ['Owner', 'Admin'] },
    { name: "Redirecciones SEO", href: "/admin/settings/seo/redirects", icon: Link2, roles: ['Owner', 'Admin'] },
]

export function DashboardShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const { user, logout, isLoading } = useAdminAuth()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/admin/login")
        }
    }, [user, isLoading, router])

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p className="text-muted-foreground">Cargando...</p>
            </div>
        )
    }

    if (!user) {
        return null
    }

    const getUserInitials = () => {
        if (user.first_name && user.last_name) {
            return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
        }
        return user.username.substring(0, 2).toUpperCase()
    }

    const getUserDisplayName = () => {
        if (user.first_name && user.last_name) {
            return `${user.first_name} ${user.last_name}`
        }
        return user.username
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar */}
            <aside className={cn(
                "hidden lg:flex lg:flex-col border-r border-border bg-card transition-all duration-300 relative",
                sidebarCollapsed ? "lg:w-20" : "lg:w-64"
            )}>
                <div className="flex flex-col flex-1 min-h-0">
                    {/* Logo */}
                    <div className="flex items-center h-16 px-6 border-b border-border overflow-hidden">
                        <h1 className={cn(
                            "text-2xl font-bold text-primary transition-opacity duration-300",
                            sidebarCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible"
                        )}>
                            Zumi
                        </h1>
                        {sidebarCollapsed && (
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0 mx-auto">
                                Z
                            </div>
                        )}
                    </div>

                    {/* Collapse Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-border bg-card hidden lg:flex items-center justify-center z-50 hover:bg-accent"
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    >
                        {sidebarCollapsed ? (
                            <ChevronRight className="h-3 w-3" />
                        ) : (
                            <ChevronLeft className="h-3 w-3" />
                        )}
                    </Button>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                        {navigation
                            .filter(item => !item.roles || (user.role && item.roles.includes(user.role)))
                            .map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors group relative",
                                            isActive
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                                            sidebarCollapsed && "justify-center px-0 mx-2"
                                        )}
                                        title={sidebarCollapsed ? item.name : ""}
                                    >
                                        <item.icon className={cn("w-5 h-5 shrink-0", !isActive && "text-muted-foreground group-hover:text-accent-foreground")} />
                                        <span className={cn(
                                            "transition-opacity duration-300 truncate",
                                            sidebarCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible"
                                        )}>
                                            {item.name}
                                        </span>
                                    </Link>
                                )
                            })}
                    </nav>

                    <div className="p-4 border-t border-border">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className={cn(
                                    "flex items-center gap-3 w-full mb-3 hover:bg-accent rounded-lg p-2 transition-colors overflow-hidden",
                                    sidebarCollapsed && "justify-center p-0 mb-6"
                                )}>
                                    <Avatar className="w-9 h-9 shrink-0">
                                        <AvatarFallback className="bg-primary text-primary-foreground">
                                            {getUserInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className={cn(
                                        "flex-1 min-w-0 text-left transition-opacity duration-300",
                                        sidebarCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible"
                                    )}>
                                        <p className="text-sm font-medium truncate">{getUserDisplayName()}</p>
                                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                    </div>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {(user.role === 'Owner' || user.role === 'Admin') && (
                                    <>
                                        <DropdownMenuItem asChild>
                                            <Link href="/admin/settings" className="cursor-pointer">
                                                <Settings className="mr-2 h-4 w-4" />
                                                <span>Configuración</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/admin/users" className="cursor-pointer">
                                                <UserCircle className="mr-2 h-4 w-4" />
                                                <span>Gestión de Usuarios</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Cerrar sesión</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "w-full justify-start gap-2 bg-transparent overflow-hidden",
                                sidebarCollapsed && "justify-center px-0 w-10 mx-auto"
                            )}
                            asChild
                        >
                            <Link href="/" target="_blank">
                                <ExternalLink className="w-4 h-4 shrink-0" />
                                {!sidebarCollapsed && <span>Ver mi tienda</span>}
                            </Link>
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Mobile Navigation */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <div className="lg:hidden fixed top-4 left-4 z-50">
                    <Button variant="outline" size="icon" onClick={() => setSidebarOpen(true)}>
                        <Menu className="w-5 h-5" />
                    </Button>
                </div>
                <SheetContent side="left" className="p-0 w-72">
                    <div className="flex flex-col h-full bg-card">
                        <div className="flex items-center h-16 px-6 border-b border-border">
                            <h1 className="text-2xl font-bold text-primary">Zumi</h1>
                        </div>
                        <nav className="flex-1 px-3 py-6 space-y-1">
                            {navigation
                                .filter(item => !item.roles || (user.role && item.roles.includes(user.role)))
                                .map((item) => {
                                    const isActive = pathname === item.href
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                                                isActive
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                            )}
                                        >
                                            <item.icon className="w-5 h-5 shrink-0" />
                                            <span>{item.name}</span>
                                        </Link>
                                    )
                                })}
                        </nav>
                        <div className="p-4 border-t border-border">
                            <div className="flex items-center gap-3 w-full p-2 mb-4">
                                <Avatar className="w-9 h-9">
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        {getUserInitials()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{getUserDisplayName()}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                </div>
                            </div>
                            <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={logout}>
                                <LogOut className="w-5 h-5" />
                                Cerrar sesión
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Main content */}
            <main className="flex-1 overflow-hidden flex flex-col">
                <DashboardHeader />
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-7xl mx-auto p-6 lg:p-8">{children}</div>
                </div>
            </main>
        </div>
    )
}

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

const navigation = [
    { name: "Inicio", href: "/admin", icon: LayoutDashboard },
    { name: "Categorías", href: "/admin/categories", icon: FolderTree },
    { name: "Productos", href: "/admin/catalog", icon: Package },
    { name: "Pedidos", href: "/admin/orders", icon: ShoppingCart },
    { name: "Clientes", href: "/admin/customers", icon: Users },
    { name: "Cupones", href: "/admin/coupons", icon: FileText },
    { name: "Zonas de Reparto", href: "/admin/shipping-zones", icon: Truck },
    { name: "Pasarelas de Pago", href: "/admin/settings/payments", icon: CreditCard },
]

export function DashboardShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const { user, logout, isLoading } = useAdminAuth()
    const [sidebarOpen, setSidebarOpen] = useState(false)

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
            <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r border-border bg-card">
                <div className="flex flex-col flex-1 min-h-0">
                    {/* Logo */}
                    <div className="flex items-center h-16 px-6 border-b border-border">
                        <h1 className="text-2xl font-bold text-primary">Zumi</h1>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                                        isActive
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>

                    <div className="p-4 border-t border-border">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-3 w-full mb-3 hover:bg-accent rounded-lg p-2 transition-colors">
                                    <Avatar className="w-9 h-9">
                                        <AvatarFallback className="bg-primary text-primary-foreground">
                                            {getUserInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="text-sm font-medium truncate">{getUserDisplayName()}</p>
                                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                    </div>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/" target="_blank" className="cursor-pointer">
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        <span>Ver mi tienda</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/admin/settings" className="cursor-pointer">
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Configuración</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Cerrar sesión</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="outline" size="sm" className="w-full justify-start gap-2 bg-transparent" asChild>
                            <Link href="/" target="_blank">
                                <ExternalLink className="w-4 h-4" />
                                Ver mi tienda
                            </Link>
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Mobile sidebar toggle */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <Button variant="outline" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    <Menu className="w-5 h-5" />
                </Button>
            </div>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto p-6 lg:p-8">{children}</div>
            </main>
        </div>
    )
}

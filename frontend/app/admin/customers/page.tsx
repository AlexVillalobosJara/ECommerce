"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Search, User, Building2, Mail, Phone } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { adminApi } from "@/services/admin-api"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import { DashboardShell } from "@/components/admin/dashboard-shell"
import { useTenant } from "@/contexts/TenantContext"
import { formatPrice } from "@/lib/format-price"

type CustomerType = "all" | "Individual" | "Corporate"

export default function CustomersPage() {
    const [customers, setCustomers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [customerTypeFilter, setCustomerTypeFilter] = useState<CustomerType>("all")

    const debouncedSearch = useDebounce(searchQuery, 500)
    const router = useRouter()

    const fetchCustomers = useCallback(async () => {
        try {
            setLoading(true)
            const data = await adminApi.listCustomers({
                search: debouncedSearch,
                customer_type: customerTypeFilter
            })
            if (data.results) {
                setCustomers(data.results)
            } else if (Array.isArray(data)) {
                setCustomers(data)
            } else {
                setCustomers([])
            }
        } catch (error) {
            console.error(error)
            toast.error("Error al cargar clientes")
        } finally {
            setLoading(false)
        }
    }, [debouncedSearch, customerTypeFilter])

    useEffect(() => {
        fetchCustomers()
    }, [fetchCustomers])

    const handleCreateCustomer = () => {
        router.push("/admin/customers/new")
    }

    const handleEditCustomer = (customer: any) => {
        router.push(`/admin/customers/${customer.id}`)
    }

    const handleDeleteCustomer = async (customerId: string) => {
        if (confirm("¿Estás seguro de eliminar este cliente?")) {
            try {
                await adminApi.deleteCustomer(customerId)
                toast.success("Cliente eliminado")
                fetchCustomers()
            } catch (error) {
                toast.error("Error al eliminar cliente")
            }
        }
    }

    const { tenant } = useTenant()

    const formatCurrency = (amount: number) => {
        return formatPrice(amount, tenant)
    }

    const getPriceListBadge = (priceList: string) => {
        const variants: any = {
            Retail: { label: "Retail", class: "bg-blue-50 text-blue-700 border-blue-200" },
            Wholesale: { label: "Mayorista", class: "bg-purple-50 text-purple-700 border-purple-200" },
            VIP: { label: "VIP", class: "bg-amber-50 text-amber-700 border-amber-200" },
        }
        const config = variants[priceList] || variants.Retail
        return <Badge className={config.class}>{config.label}</Badge>
    }

    return (
        <DashboardShell>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Gestión de Clientes</h1>
                        <p className="text-muted-foreground mt-2">Administra tus clientes individuales y corporativos</p>
                    </div>
                    <Button onClick={handleCreateCustomer} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Nuevo Cliente
                    </Button>
                </div>

                {/* Filters */}
                <Card className="shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por nombre, email, RUT..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <Tabs value={customerTypeFilter} onValueChange={(v) => setCustomerTypeFilter(v as CustomerType)}>
                                <TabsList>
                                    <TabsTrigger value="all">Todos</TabsTrigger>
                                    <TabsTrigger value="Individual">Individuales</TabsTrigger>
                                    <TabsTrigger value="Corporate">Corporativos</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </CardContent>
                </Card>

                {/* Customers Table */}
                <Card className="shadow-sm">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-border bg-muted/30">
                                    <tr>
                                        <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Cliente</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Contacto</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Tipo</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Lista de Precio</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Total Gastado</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Estado</th>
                                        <th className="text-right text-xs font-medium text-muted-foreground px-6 py-4">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {loading ? (
                                        <tr><td colSpan={7} className="p-8 text-center">Cargando...</td></tr>
                                    ) : customers.length === 0 ? (
                                        <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No se encontraron clientes</td></tr>
                                    ) : (
                                        customers.map((customer) => (
                                            <tr key={customer.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div
                                                            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${customer.customer_type === "Individual"
                                                                ? "bg-blue-50 text-blue-600"
                                                                : "bg-purple-50 text-purple-600"
                                                                }`}
                                                        >
                                                            {customer.customer_type === "Individual" ? (
                                                                <User className="w-6 h-6" />
                                                            ) : (
                                                                <Building2 className="w-6 h-6" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">
                                                                {customer.customer_type === "Individual"
                                                                    ? `${customer.first_name} ${customer.last_name}`
                                                                    : customer.company_name}
                                                            </div>
                                                            {customer.tax_id && (
                                                                <div className="text-xs text-muted-foreground font-mono">RUT: {customer.tax_id}</div>
                                                            )}
                                                            {customer.legal_representative && (
                                                                <div className="text-xs text-muted-foreground">Rep: {customer.legal_representative}</div>
                                                            )}
                                                            <div className="text-xs text-muted-foreground">{customer.total_orders || 0} pedidos</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                                                            <span className="text-muted-foreground">{customer.email}</span>
                                                        </div>
                                                        {customer.phone && (
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                                                                <span className="text-muted-foreground">{customer.phone}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant={customer.customer_type === "Individual" ? "outline" : "default"}>
                                                        {customer.customer_type === "Individual" ? "Individual" : "Corporativo"}
                                                    </Badge>
                                                    {customer.customer_type === "Corporate" && parseFloat(customer.discount_percentage) > 0 && (
                                                        <div className="text-xs text-green-600 mt-1 font-medium">
                                                            {customer.discount_percentage}% dto
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">{getPriceListBadge(customer.price_list_type)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold">{formatCurrency(parseFloat(customer.total_spent || 0))}</div>
                                                    {parseFloat(customer.credit_limit) > 0 && (
                                                        <div className="text-xs text-muted-foreground">
                                                            Crédito: {formatCurrency(parseFloat(customer.credit_limit))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <Badge variant={customer.is_active ? "default" : "secondary"}>
                                                            {customer.is_active ? "Activo" : "Inactivo"}
                                                        </Badge>
                                                        {customer.is_verified && (
                                                            <Badge className="bg-green-50 text-green-700 border-green-200">Verificado</Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="ghost" size="sm" onClick={() => handleEditCustomer(customer)}>
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteCustomer(customer.id)}
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardShell>
    )
}

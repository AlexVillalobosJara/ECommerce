import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface TopRankingsProps {
    rankings: any
}

export function TopRankings({ rankings }: TopRankingsProps) {
    const topProducts = rankings?.top_products || []
    const topCustomers = rankings?.top_customers || []

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Top Productos</CardTitle>
                    <CardDescription>Más vendidos por volumen</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {topProducts.map((product: any, index: number) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">{product.product_name}</p>
                                    <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">{product.total_qty} un.</Badge>
                                    <span className="text-sm font-bold">${product.total_revenue?.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Mejores Clientes</CardTitle>
                    <CardDescription>Clientes con mayor LTV</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {topCustomers.map((customer: any, index: number) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">{customer.customer_email}</p>
                                    <p className="text-xs text-muted-foreground">{customer.orders_count} órdenes</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">VIP</Badge>
                                    <span className="text-sm font-bold">${customer.ltv?.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

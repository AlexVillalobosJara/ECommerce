import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface RecentSalesProps {
    orders: any[]
}

export function RecentSales({ orders }: RecentSalesProps) {
    if (!orders || orders.length === 0) {
        return (
            <div className="text-center text-sm text-muted-foreground p-4">
                No hay ventas recientes.
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {orders.map((order) => (
                <div key={order.id} className="flex items-center">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={`https://avatar.vercel.sh/${order.customer_email}`} alt="Avatar" />
                        <AvatarFallback>{order.customer_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{order.customer_name}</p>
                        <p className="text-xs text-muted-foreground">
                            {order.customer_email}
                        </p>
                    </div>
                    <div className="ml-auto font-medium">
                        +${order.amount.toLocaleString()}
                    </div>
                </div>
            ))}
        </div>
    )
}

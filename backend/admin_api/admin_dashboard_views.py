from django.db.models import Sum, Count, F, ExpressionWrapper, DecimalField, Avg
from django.db.models.functions import TruncHour, TruncDay
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from datetime import timedelta
from orders.models import Order, OrderItem, OrderStatus, OrderType
from products.models import Product, ProductVariant
from .admin_user_views import IsTenantAdmin

class AdminDashboardViewSet(viewsets.ViewSet):
    """
    Viewset for providing tenant-scoped analytics and KPIs for the admin dashboard.
    """
    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]

    def get_tenant_queryset(self, model):
        tenant = getattr(self.request, 'tenant', None)
        if not tenant:
            return model.objects.none()
        return model.objects.filter(tenant=tenant)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Main dashboard stats endpoint.
        Returns KPIs and data for charts.
        """
        tenant = getattr(request, 'tenant', None)
        if not tenant:
            return Response({"error": "Tenant not found"}, status=status.HTTP_404_NOT_FOUND)

        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        yesterday_start = today_start - timedelta(days=1)
        last_30_days_start = today_start - timedelta(days=30)

        # 1. KPIs (Global Totals)
        # ----------------------
        # Total Revenue (Paid orders)
        paid_orders = self.get_tenant_queryset(Order).filter(
            status__in=[OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
            order_type=OrderType.SALE
        )

        total_revenue = paid_orders.aggregate(total=Sum('total'))['total'] or 0
        order_count = paid_orders.count()
        avg_ticket = paid_orders.aggregate(avg=Avg('total'))['avg'] or 0

        # Profitability (Revenue - Cost)
        # We join with OrderItem to get costs
        order_items = self.get_tenant_queryset(OrderItem).filter(
            order__status__in=[OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
            order__order_type=OrderType.SALE
        )

        # Total Cost calculation
        total_cost = order_items.aggregate(
            total_cost=Sum(F('quantity') * F('product_variant__cost'))
        )['total_cost'] or 0
        
        total_profit = float(total_revenue) - float(total_cost)
        margin_percentage = (total_profit / float(total_revenue) * 100) if total_revenue > 0 else 0

        # 2. Sales Over Time (Last 30 days) - Standard format for Overview.tsx
        sales_history_raw = (
            paid_orders.filter(created_at__gte=last_30_days_start)
            .annotate(date=TruncDay('created_at'))
            .values('date')
            .annotate(revenue=Sum('total'))
            .order_by('date')
        )
        
        sales_chart = [
            {
                "name": entry['date'].strftime('%d %b'),
                "total": float(entry['revenue'] or 0)
            } for entry in sales_history_raw
        ]

        # 3. Real-time Sales (Hourly - Today)
        hourly_sales_raw = (
            paid_orders.filter(created_at__gte=today_start)
            .annotate(hour=TruncHour('created_at'))
            .values('hour')
            .annotate(revenue=Sum('total'))
            .order_by('hour')
        )
        
        hourly_chart = [
            {
                "name": entry['hour'].strftime('%H:%M'),
                "total": float(entry['revenue'] or 0)
            } for entry in hourly_sales_raw
        ]

        # Recent Orders for RecentSales.tsx
        recent_orders_qs = self.get_tenant_queryset(Order).exclude(
            status=OrderStatus.DRAFT
        ).order_by('-created_at')[:5]

        recent_orders = []
        for order in recent_orders_qs:
            customer_name = "Unknown"
            customer_email = order.customer_email
            if order.customer:
                if order.customer.first_name:
                    customer_name = f"{order.customer.first_name} {order.customer.last_name or ''}".strip()
                elif order.customer.company_name:
                    customer_name = order.customer.company_name

            recent_orders.append({
                'id': str(order.id),
                'customer_name': customer_name,
                'customer_email': customer_email,
                'amount': float(order.total),
                'status': order.status,
                'created_at': order.created_at
            })

        # 4. Top Selling Products
        top_products = (
            order_items.values('product_name', 'sku')
            .annotate(
                total_qty=Sum('quantity'),
                total_revenue=Sum('total')
            )
            .order_by('-total_qty')[:5]
        )

        # 5. Top Customers (LTV)
        top_customers = (
            paid_orders.values('customer_email')
            .annotate(
                ltv=Sum('total'),
                orders_count=Count('id')
            )
            .order_by('-ltv')[:5]
        )

        # Basic Stats for backward compatibility
        total_products = self.get_tenant_queryset(Product).filter(status='Published').count()
        total_customers = self.get_tenant_queryset(Order).values('customer_email').distinct().count()

        return Response({
            # Backward Compatibility keys
            "total_sales": float(total_revenue),
            "total_orders": order_count,
            "total_products": total_products,
            "total_customers": total_customers,
            "sales_chart": sales_chart,
            "recent_orders": recent_orders,
            
            # New Advanced keys
            "kpis": {
                "total_revenue": float(total_revenue),
                "total_profit": total_profit,
                "margin_percentage": round(margin_percentage, 2),
                "order_count": order_count,
                "avg_ticket": round(avg_ticket, 2)
            },
            "charts": {
                "sales_over_time": sales_chart,
                "hourly_sales": hourly_chart
            },
            "rankings": {
                "top_products": top_products,
                "top_customers": top_customers
            }
        })

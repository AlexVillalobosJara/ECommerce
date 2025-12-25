
import os
import django
import sys

# Setup is handled by manage.py shell usually, but let's be safe
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from tenants.models import Tenant
from orders.models import Order, OrderStatus, Customer
from products.models import Product
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from django.utils import timezone
import datetime

def test_stats():
    try:
        print("--- Starting Debug ---")
        tenant = Tenant.objects.first()
        if not tenant:
            print("No tenant found!")
            return

        print(f"Using Tenant: {tenant.name} ({tenant.id})")

        # 1. Total Sales
        print("1. Calculating Total Sales...")
        sales_statuses = [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED]
        total_sales_agg = Order.objects.filter(
            tenant=tenant, 
            status__in=sales_statuses
        ).aggregate(total=Sum('total'))
        print(f"   Result: {total_sales_agg}")

        # 2. Total Orders
        print("2. Counting Orders...")
        total_orders = Order.objects.filter(
            tenant=tenant
        ).exclude(status=OrderStatus.DRAFT).count()
        print(f"   Result: {total_orders}")

        # 3. Total Products
        print("3. Counting Products...")
        total_products = Product.objects.filter(
            tenant=tenant,
            is_active=True
        ).count()
        print(f"   Result: {total_products}")

        # 4. Sales Chart
        print("4. Generating Chart Data...")
        six_months_ago = timezone.now() - datetime.timedelta(days=180)
        sales_by_month = Order.objects.filter(
            tenant=tenant,
            status__in=sales_statuses,
            created_at__gte=six_months_ago
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            total=Sum('total')
        ).order_by('month')
        
        print(f"   Query built. Executing...")
        chart_data = list(sales_by_month)
        print(f"   Result count: {len(chart_data)}")

        # 5. Recent Orders
        print("5. Fetching Recent Orders...")
        recent_orders_qs = Order.objects.filter(
            tenant=tenant
        ).exclude(status=OrderStatus.DRAFT).order_by('-created_at')[:5]
        
        for order in recent_orders_qs:
            print(f"   Processing Order {order.order_number} ({order.id})")
            customer_name = "Unknown"
            if order.customer:
                 if order.customer.first_name:
                     customer_name = f"{order.customer.first_name} {order.customer.last_name or ''}".strip()
                 elif order.customer.company_name:
                     customer_name = order.customer.company_name
            print(f"   - Customer: {customer_name}")
            print(f"   - Total: {order.total}")

        print("--- Debug Finished Successfully ---")

    except Exception as e:
        print("\n!!! ERROR CAUGHT !!!")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_stats()

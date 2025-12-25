
import os
import django
import sys
from pathlib import Path

# Setup Django environment
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from orders.models import Order

def check_latest_order():
    print("Checking latest order...")
    try:
        # Get latest order by created_at
        order = Order.objects.latest('created_at')
        print(f"Latest Order: {order.order_number} (ID: {order.id})")
        print(f"Status: {order.status}")
        print(f"Type: {order.order_type}")
        print(f"Tenant: {order.tenant.slug}")
        print(f"Customer: {order.customer_email}")
        
    except Order.DoesNotExist:
        print("No orders found.")

if __name__ == "__main__":
    check_latest_order()

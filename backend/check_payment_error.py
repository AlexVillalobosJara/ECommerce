import os
import django
import urllib.parse
from django.db import connection

# Set up Supabase connection
password = urllib.parse.quote_plus('$$kairos01%%')
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'
os.environ['DATABASE_URL'] = db_url
os.environ['RENDER'] = 'true'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')

django.setup()

from orders.models import Order, Payment
from orders.payment_models import PaymentStatus

# Check the most recent order and payment
order_id = 'd174ea5e-4324-429a-8556-cd9a9534b63c'

try:
    order = Order.objects.get(id=order_id)
    print(f"Order found: {order.order_number}")
    print(f"Order status: {order.status}")
    print(f"Order tenant: {order.tenant.slug} (custom_domain: {order.tenant.custom_domain})")
    
    payments = Payment.objects.filter(order=order).order_by('-created_at')
    print(f"\nPayments for this order: {payments.count()}")
    for payment in payments:
        print(f"  - Payment ID: {payment.id}")
        print(f"    Status: {payment.status}")
        print(f"    Gateway: {payment.gateway}")
        print(f"    Transaction ID: {payment.transaction_id}")
        print(f"    Amount: {payment.amount}")
        print(f"    Error: {payment.error_message}")
        print()
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

import os
import django
import urllib.parse

# Set up Supabase connection
password = urllib.parse.quote_plus('$$kairos01%%')
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'
os.environ['DATABASE_URL'] = db_url
os.environ['RENDER'] = 'true'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')

django.setup()

from orders.models import Order
from orders.payment_models import Payment
from django.db import connection

# Direct SQL query to check webhooks
print("=" * 80)
print("CHECKING WEBHOOK LOGS")
print("=" * 80)

with connection.cursor() as cursor:
    cursor.execute("""
        SELECT id, gateway, created_at, signature_valid, processed, processing_error
        FROM payment_webhook_logs
        ORDER BY created_at DESC
        LIMIT 5
    """)
    webhooks = cursor.fetchall()
    
    if webhooks:
        for webhook in webhooks:
            print(f"\nWebhook: {webhook[0]}")
            print(f"  Gateway: {webhook[1]}")
            print(f"  Created: {webhook[2]}")
            print(f"  Valid: {webhook[3]}")
            print(f"  Processed: {webhook[4]}")
            print(f"  Error: {webhook[5] or 'None'}")
    else:
        print("No webhooks found")

print("\n" + "=" * 80)
print("CHECKING RECENT PAYMENTS")
print("=" * 80)

payments = Payment.objects.all().order_by('-created_at')[:5]
for payment in payments:
    print(f"\nPayment: {payment.id}")
    print(f"  Order: {payment.order.order_number}")
    print(f"  Status: {payment.status}")
    print(f"  Completed: {payment.completed_at or 'Not completed'}")

print("\n" + "=" * 80)
print("CHECKING PAID ORDERS")
print("=" * 80)

paid_orders = Order.objects.filter(status='Paid').order_by('-updated_at')[:5]
if paid_orders.exists():
    for order in paid_orders:
        print(f"\nOrder: {order.order_number}")
        print(f"  Status: {order.status}")
        print(f"  Paid at: {order.paid_at}")
        print(f"  Customer: {order.customer_email}")
else:
    print("No paid orders found")

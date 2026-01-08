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

from django.conf import settings
from orders.models import Order
from orders.payment_models import Payment
from django.utils import timezone
from datetime import timedelta

print("=" * 80)
print("CRITICAL QUESTION: Are orders being marked as PAID in production?")
print("=" * 80)

# Check orders from the last 2 hours
recent_orders = Order.objects.filter(
    created_at__gte=timezone.now() - timedelta(hours=2)
).order_by('-created_at')

print(f"\nOrders created in last 2 hours: {recent_orders.count()}")

for order in recent_orders:
    print(f"\n{'='*60}")
    print(f"Order: {order.order_number}")
    print(f"Status: {order.status}")
    print(f"Created: {order.created_at}")
    print(f"Updated: {order.updated_at}")
    print(f"Paid at: {order.paid_at or 'NOT PAID'}")
    
    # Check payments
    payments = order.payments.all()
    for payment in payments:
        print(f"\n  Payment:")
        print(f"    Status: {payment.status}")
        print(f"    Token: {payment.gateway_token}")
        print(f"    Created: {payment.created_at}")
        print(f"    Completed: {payment.completed_at or 'NOT COMPLETED'}")

# Check if ANY order is marked as Paid
paid_orders = Order.objects.filter(status='Paid')
print(f"\n{'='*80}")
print(f"Total orders marked as 'Paid' in database: {paid_orders.count()}")

if paid_orders.exists():
    latest_paid = paid_orders.order_by('-paid_at').first()
    print(f"\nMost recent paid order:")
    print(f"  Order: {latest_paid.order_number}")
    print(f"  Paid at: {latest_paid.paid_at}")
    print(f"  Customer: {latest_paid.customer_email}")
else:
    print("\n⚠️  NO ORDERS ARE MARKED AS PAID!")
    print("This means the payment verification code is NOT executing in production")
    print("Or the payment status from Flow is not 'completed'")

print("\n" + "=" * 80)
print("RESEND API KEY CHECK")
print("=" * 80)
print(f"API Key configured: {bool(settings.RESEND_API_KEY)}")
if settings.RESEND_API_KEY:
    print(f"API Key (first 15 chars): {settings.RESEND_API_KEY[:15]}...")
else:
    print("⚠️  RESEND_API_KEY is NOT SET!")

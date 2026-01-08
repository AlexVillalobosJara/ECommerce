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
from orders.payment_models import Payment, PaymentWebhookLog
from django.utils import timezone
from datetime import timedelta

# Check recent webhook logs
print("=" * 80)
print("RECENT WEBHOOK LOGS (last 24 hours)")
print("=" * 80)

recent_webhooks = PaymentWebhookLog.objects.filter(
    created_at__gte=timezone.now() - timedelta(hours=24)
).order_by('-created_at')[:10]

if recent_webhooks.exists():
    for webhook in recent_webhooks:
        print(f"\nWebhook ID: {webhook.id}")
        print(f"Gateway: {webhook.gateway}")
        print(f"Created: {webhook.created_at}")
        print(f"Signature Valid: {webhook.signature_valid}")
        print(f"Processed: {webhook.processed}")
        print(f"Payment: {webhook.payment.id if webhook.payment else 'None'}")
        print(f"Error: {webhook.processing_error or 'None'}")
        print(f"Data keys: {list(webhook.webhook_data.keys()) if webhook.webhook_data else 'None'}")
else:
    print("No webhooks received in the last 24 hours")

print("\n" + "=" * 80)
print("RECENT PAYMENTS (last 24 hours)")
print("=" * 80)

recent_payments = Payment.objects.filter(
    created_at__gte=timezone.now() - timedelta(hours=24)
).order_by('-created_at')[:10]

for payment in recent_payments:
    print(f"\nPayment ID: {payment.id}")
    print(f"Order: {payment.order.order_number}")
    print(f"Status: {payment.status}")
    print(f"Gateway: {payment.gateway}")
    print(f"Amount: {payment.amount}")
    print(f"Created: {payment.created_at}")
    print(f"Completed: {payment.completed_at or 'Not completed'}")
    print(f"Token: {payment.gateway_token}")
    print(f"Transaction ID: {payment.gateway_transaction_id or 'None'}")

print("\n" + "=" * 80)
print("RECENT PAID ORDERS (last 24 hours)")
print("=" * 80)

recent_paid_orders = Order.objects.filter(
    status='Paid',
    updated_at__gte=timezone.now() - timedelta(hours=24)
).order_by('-updated_at')[:10]

if recent_paid_orders.exists():
    for order in recent_paid_orders:
        print(f"\nOrder: {order.order_number}")
        print(f"Status: {order.status}")
        print(f"Customer: {order.customer_email}")
        print(f"Paid at: {order.paid_at}")
        print(f"Updated: {order.updated_at}")
else:
    print("No orders marked as Paid in the last 24 hours")

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
from django.utils import timezone
from datetime import timedelta

print("=" * 80)
print("CHECKING RECENT ORDERS AND PAYMENTS")
print("=" * 80)

# Get orders from the last hour
recent_orders = Order.objects.filter(
    created_at__gte=timezone.now() - timedelta(hours=1)
).order_by('-created_at')

for order in recent_orders:
    print(f"\nOrder: {order.order_number}")
    print(f"  Status: {order.status}")
    print(f"  Created: {order.created_at}")
    print(f"  Updated: {order.updated_at}")
    print(f"  Paid at: {order.paid_at or 'Not paid'}")
    
    # Get payments for this order
    payments = order.payments.all()
    print(f"  Payments: {payments.count()}")
    for payment in payments:
        print(f"    - Payment {payment.id}")
        print(f"      Status: {payment.status}")
        print(f"      Token: {payment.gateway_token}")
        print(f"      Completed: {payment.completed_at or 'Not completed'}")

print("\n" + "=" * 80)
print("CHECKING IF SIGNALS ARE REGISTERED")
print("=" * 80)

from django.db.models import signals
from orders.models import Order

# Check if our signal is connected
receivers = signals.post_save.receivers
order_receivers = [r for r in receivers if r[0][0] and 'Order' in str(r[0][0])]

print(f"Total post_save receivers: {len(receivers)}")
print(f"Order-related receivers: {len(order_receivers)}")

if order_receivers:
    print("\nOrder post_save receivers:")
    for receiver in order_receivers:
        print(f"  - {receiver}")
else:
    print("WARNING: No Order post_save receivers found!")

print("\n" + "=" * 80)
print("TESTING EMAIL FUNCTION DIRECTLY")
print("=" * 80)

# Try to get a paid order and send email
paid_order = Order.objects.filter(status='Paid').order_by('-updated_at').first()

if paid_order:
    print(f"Found paid order: {paid_order.order_number}")
    print(f"Customer email: {paid_order.customer_email}")
    
    from orders.email_service import send_order_confirmation_email, send_new_order_notification
    
    print("\nTrying to send customer confirmation email...")
    try:
        result = send_order_confirmation_email(paid_order)
        print(f"✓ Customer email sent successfully")
    except Exception as e:
        print(f"✗ Error sending customer email: {e}")
        import traceback
        traceback.print_exc()
    
    print("\nTrying to send admin notification email...")
    try:
        result = send_new_order_notification(paid_order)
        print(f"✓ Admin email sent successfully")
    except Exception as e:
        print(f"✗ Error sending admin email: {e}")
        import traceback
        traceback.print_exc()
else:
    print("No paid orders found to test with")

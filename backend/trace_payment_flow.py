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
from tenants.models import Tenant

print("=" * 80)
print("ENVIRONMENT CHECK")
print("=" * 80)
print(f"RESEND_API_KEY configured: {bool(settings.RESEND_API_KEY)}")
print(f"RESEND_API_KEY value: {settings.RESEND_API_KEY[:20]}..." if settings.RESEND_API_KEY else "NOT SET")
print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
print(f"ADMIN_EMAIL: {getattr(settings, 'ADMIN_EMAIL', 'NOT SET')}")
print()

print("=" * 80)
print("CHECKING MOST RECENT PAYMENT")
print("=" * 80)

# Get the most recent payment
payment = Payment.objects.all().order_by('-created_at').first()

if payment:
    print(f"Payment ID: {payment.id}")
    print(f"Status: {payment.status}")
    print(f"Gateway: {payment.gateway}")
    print(f"Token: {payment.gateway_token}")
    print(f"Created: {payment.created_at}")
    print(f"Completed: {payment.completed_at}")
    print()
    
    order = payment.order
    print(f"Order: {order.order_number}")
    print(f"Order Status: {order.status}")
    print(f"Paid at: {order.paid_at}")
    print(f"Customer: {order.customer_email}")
    print(f"Tenant: {order.tenant.slug}")
    print()
    
    # Check if this order is marked as Paid
    if order.status == 'Paid':
        print("✓ Order is marked as PAID")
        
        # Try to manually trigger email sending
        print("\n" + "=" * 80)
        print("MANUALLY SENDING EMAILS")
        print("=" * 80)
        
        from orders.email_service import send_order_confirmation_email, send_new_order_notification
        
        print("Sending customer confirmation...")
        try:
            result = send_order_confirmation_email(order)
            print(f"✓ Customer email sent: {result}")
        except Exception as e:
            print(f"✗ Error: {e}")
            import traceback
            traceback.print_exc()
        
        print("\nSending admin notification...")
        try:
            result = send_new_order_notification(order)
            print(f"✓ Admin email sent: {result}")
        except Exception as e:
            print(f"✗ Error: {e}")
            import traceback
            traceback.print_exc()
    else:
        print(f"✗ Order is NOT marked as Paid (status: {order.status})")
        print("This is why emails are not being sent!")
        
else:
    print("No payments found")

print("\n" + "=" * 80)
print("CHECKING TENANT EMAIL CONFIGURATION")
print("=" * 80)

tenant = Tenant.objects.first()
if tenant:
    print(f"Tenant: {tenant.name}")
    print(f"Slug: {tenant.slug}")
    
    # Check if tenant has email settings
    from admin_api.models import TenantEmailSettings
    try:
        email_settings = TenantEmailSettings.objects.filter(tenant=tenant).first()
        if email_settings:
            print(f"Email settings found:")
            print(f"  From email: {email_settings.from_email}")
            print(f"  From name: {email_settings.from_name}")
            print(f"  Admin email: {email_settings.admin_email}")
        else:
            print("No email settings found for tenant")
    except Exception as e:
        print(f"Error checking email settings: {e}")

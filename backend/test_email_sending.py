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
from orders.email_service import send_order_confirmation_email
from django.conf import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Check Resend API key
print(f"Resend API Key configured: {bool(settings.RESEND_API_KEY)}")
print(f"Resend API Key (first 10 chars): {settings.RESEND_API_KEY[:10] if settings.RESEND_API_KEY else 'NOT SET'}")
print(f"Default From Email: {settings.DEFAULT_FROM_EMAIL}")
print()

# Get the most recent paid order
order = Order.objects.filter(status='Paid').order_by('-updated_at').first()

if order:
    print(f"Found paid order: {order.order_number}")
    print(f"Customer email: {order.customer_email}")
    print(f"Order status: {order.status}")
    print()
    
    # Try to send email
    print("Attempting to send confirmation email...")
    try:
        result = send_order_confirmation_email(order)
        print(f"Email sent successfully!")
        print(f"Result: {result}")
    except Exception as e:
        print(f"Error sending email: {e}")
        import traceback
        traceback.print_exc()
else:
    print("No paid orders found to test with")

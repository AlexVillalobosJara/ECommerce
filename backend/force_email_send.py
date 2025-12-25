
import os
import django
import sys
from pathlib import Path
import logging

# Setup Django environment
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from orders.models import Order
from orders.email_service import send_quote_response_notification

def force_email():
    print("Forcing Email Send for Latest Order...")
    try:
        # Get latest quote order
        order = Order.objects.filter(order_type='Quote').latest('created_at')
        print(f"Target Order: {order.order_number} (ID: {order.id})")
        print(f"Customer Email: {order.customer_email}")
        
        print("Calling send_quote_response_notification...")
        response = send_quote_response_notification(order)
        
        print(f"Response: {response}")
        if response and 'id' in response:
            print("SUCCESS: Email sent successfully according to Resend.")
        else:
            print("FAILURE: Email function returned None or invalid response.")
            
    except Order.DoesNotExist:
        print("Error: No Quote orders found.")
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    force_email()

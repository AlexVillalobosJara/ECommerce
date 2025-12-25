
import os
import django
import sys
from pathlib import Path
from datetime import datetime, timedelta
from decimal import Decimal

# Setup Django environment
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from django.conf import settings
from orders.email_service import send_quote_response_notification

# Mocking classes for dependency injection
class MockItem:
    def __init__(self, name, variant, sku, qty, price):
        self.product_name = name
        self.variant_name = variant
        self.sku = sku
        self.quantity = qty
        self.unit_price = Decimal(price)
        self.total = self.unit_price * self.quantity

class MockOrder:
    def __init__(self):
        self.id = '00000000-0000-0000-0000-000000000000' # UUID format
        self.order_number = 'TEST-QUOTE-001'
        self.customer_email = settings.ADMIN_EMAIL or 'test@example.com'
        self.customer_phone = '+56912345678'
        self.shipping_recipient_name = 'Juan Pérez'
        
        self.shipping_street_address = 'Calle Falsa 123'
        self.shipping_commune = 'Providencia'
        self.shipping_city = 'Santiago'
        self.shipping_region = 'RM'
        
        self.subtotal = Decimal('100000')
        self.shipping_cost = Decimal('5000')
        self.tax_amount = Decimal('19000')
        self.total = Decimal('124000')
        
        self.quote_valid_until = datetime.now() + timedelta(days=15)
        self.internal_notes = "Estos son precios especiales de prueba."
        self.order_type = 'Quote' # Required for some logic checks likely
        self.status = 'QuoteSent'

        # Items
        self.items_list = [
            MockItem('Silla Gamer', 'Roja', 'SILLA-001', 2, 50000)
        ]

    # Mocking related manager for items
    @property
    def items(self):
        class Manager:
            def all(self_mgr):
                return self.items_list
        return Manager()

def test_quote_email():
    print("Testing Quote Response Email...")
    print(f"To: {settings.ADMIN_EMAIL}")
    
    order = MockOrder()
    
    try:
        response = send_quote_response_notification(order)
        print("Function returned:", response)
        if response:
            print("SUCCESS: Email sent (Id should be in response)")
        else:
            print("FAILURE: Function returned None (check logs)")
    except Exception as e:
        print("CRITICAL FAILURE:", e)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_quote_email()

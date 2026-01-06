
import os
import django
import sys
import uuid
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from tenants.models import Tenant
from orders.models import Order, Customer
from orders.payment_views import initiate_payment
from rest_framework.test import APIRequestFactory

def test_full_flow():
    factory = APIRequestFactory()
    tenant = Tenant.objects.get(slug='demo-store')
    
    # 1. Create a dummy customer if doesn't exist
    customer, _ = Customer.objects.get_or_create(
        tenant=tenant,
        email='test-initiate@example.com',
        defaults={'first_name': 'Test', 'last_name': 'User'}
    )
    
    # 2. Create a NEW order
    order_number = f"TEST-{uuid.uuid4().hex[:6].upper()}"
    order = Order.objects.create(
        tenant=tenant,
        customer=customer,
        order_number=order_number,
        order_type='Sale',
        status='PendingPayment',
        customer_email=customer.email,
        total=Decimal('5000.00'),
        subtotal=Decimal('5000.00'),
        shipping_recipient_name='Test Recipient',
        shipping_phone='123456789'
    )
    print(f"Created Test Order: {order.order_number} (ID: {order.id})")
    
    # 3. Initiate payment
    request = factory.post(
        f'/api/storefront/payments/initiate/?tenant={tenant.slug}',
        data={'order_id': str(order.id), 'gateway': 'Flow'},
        format='json'
    )
    request.tenant = tenant
    
    try:
        response = initiate_payment(request)
        print(f"Status Code: {response.status_code}")
        print(f"Response Data: {response.data}")
    except Exception as e:
        print(f"CRASH: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_full_flow()

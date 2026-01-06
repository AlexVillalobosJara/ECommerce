
import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from django.test import RequestFactory
from rest_framework.test import APIRequestFactory
import json
from orders.payment_views import initiate_payment
from tenants.models import Tenant
from orders.models import Order

def test_view():
    factory = APIRequestFactory()
    
    # Try with an existing order
    valid_statuses = ['Draft', 'PendingPayment', 'QuoteSent', 'QuoteApproved']
    tenant = Tenant.objects.filter(slug='demo-store').first()
    order = Order.objects.filter(tenant=tenant, status__in=valid_statuses).first()
    
    if not order:
        # If no pending order, use the first one and force it to PendingPayment for test
        order = Order.objects.filter(tenant=tenant).first()
        if order:
            print(f"Forcing order {order.id} to PendingPayment for test")
            order.status = 'PendingPayment'
            order.save()
        print("No order found")
        return

    print(f"Testing with Order ID: {order.id}")
    
    request = factory.post(
        f'/api/storefront/payments/initiate/?tenant={tenant.slug}',
        data={'order_id': str(order.id), 'gateway': 'Flow'},
        format='json'
    )
    
    # Mocking TenantMiddleware behavior (manually setting request.tenant)
    request.tenant = tenant
    
    try:
        response = initiate_payment(request)
        print(f"Status Code: {response.status_code}")
        print(f"Response Data: {response.data}")
    except Exception as e:
        print(f"VIEW CRASHED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_view()

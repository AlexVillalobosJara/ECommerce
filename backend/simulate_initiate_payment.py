
import os
import django
import sys
import json
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from tenants.models import Tenant
from orders.models import Order
from orders.payment_services.factory import PaymentServiceFactory
from orders.payment_models import Payment, PaymentStatus
from django.conf import settings

def simulate():
    print("--- Simulation Start ---")
    
    # 1. Setup context
    tenant = Tenant.objects.filter(slug='demo-store').first()
    if not tenant:
        print("Tenant 'demo-store' not found")
        return

    order = Order.objects.filter(tenant=tenant).order_by('-created_at').first()
    if not order:
        print("No order found for 'demo-store'")
        return

    print(f"Simulating for order {order.order_number} (ID: {order.id})")
    
    gateway = 'Flow'
    return_url = "http://localhost:3000/callback"
    cancel_url = "http://localhost:3000/cancel"
    
    # 2. Replicate initiate_payment logic
    try:
        print("Step 1: Creating Payment record...")
        payment = Payment.objects.create(
            tenant=tenant,
            order=order,
            gateway=gateway,
            status=PaymentStatus.PENDING,
            amount=order.total,
            currency='CLP'
        )
        print(f"  Payment created: {payment.id}")
        
        print("Step 2: Getting Payment Service...")
        payment_service = PaymentServiceFactory.get_service(gateway, tenant=tenant)
        print(f"  Service initialized: {payment_service.__class__.__name__}")
        
        print("Step 3: Creating payment at gateway...")
        # Note: This might actually hit the Flow API if it's sandbox!
        # If it hits sandbox, it's fine.
        payment_result = payment_service.create_payment(
            order=order,
            amount=order.total,
            return_url=return_url,
            cancel_url=cancel_url
        )
        print("  Payment result received:")
        print(f"    Transaction ID: {payment_result.get('transaction_id')}")
        print(f"    Payment URL: {payment_result.get('payment_url')}")
        
        print("Step 4: Updating Payment record...")
        payment.gateway_transaction_id = payment_result.get('transaction_id')
        payment.gateway_payment_url = payment_result.get('payment_url')
        payment.gateway_token = payment_result.get('token')
        payment.gateway_response = payment_result.get('raw_response')
        payment.save()
        print("  Payment record updated.")
        
        print("Step 5: Finalizing Order status (if applicable)...")
        # initiate_payment doesn't usually change order status until callback, 
        # but let's check if it does anything else.
        
        print("\n✅ SIMULATION SUCCESS!")
        
    except Exception as e:
        print(f"\n❌ SIMULATION FAILED: {e}")
        import traceback
        traceback.print_exc()

    print("--- Simulation End ---")

if __name__ == "__main__":
    simulate()

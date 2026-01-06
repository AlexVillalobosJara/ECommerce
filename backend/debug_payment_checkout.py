
import os
import django
import sys
import traceback

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from tenants.models import Tenant
from tenants.payment_config_models import PaymentGatewayConfig
from orders.models import Order
from orders.payment_services.factory import PaymentServiceFactory
from core.encryption import get_encryption_key
from django.conf import settings

def debug():
    print("--- Extended Diagnostic Start ---")
    
    # 1. Environment & Settings
    print(f"DEBUG: {settings.DEBUG}")
    print(f"FRONTEND_URL: {getattr(settings, 'FRONTEND_URL', 'Not set')}")
    print(f"PAYMENT_WEBHOOK_URL: {getattr(settings, 'PAYMENT_WEBHOOK_URL', 'Not set')}")
    
    # 2. encryption
    try:
        key = get_encryption_key()
        print(f"Encryption Key length: {len(key)}")
    except Exception as e:
        print(f"CRITICAL: Encryption Key error: {e}")

    # 3. Find Active Configs
    configs = PaymentGatewayConfig.objects.filter(gateway='Flow', is_active=True)
    print(f"Found {configs.count()} active Flow configs.")
    
    if configs.count() == 0:
        # Check if ANY flow config exists
        any_configs = PaymentGatewayConfig.objects.filter(gateway='Flow')
        print(f"Found {any_configs.count()} total Flow configs (active or inactive).")
        for c in any_configs:
            print(f"  - Tenant: {c.tenant.slug}, Active: {c.is_active}, Sandbox: {c.is_sandbox}")

    for config in configs:
        tenant = config.tenant
        print(f"\nProcessing Tenant: {tenant.slug}")
        
        # 4. Decryption check
        try:
            api_key = config.api_key
            secret_key = config.secret_key
            print(f"  Credentials decrypted: API_KEY={'Yes' if api_key else 'No'}, SECRET_KEY={'Yes' if secret_key else 'No'}")
        except Exception as e:
            print(f"  ERROR: Decryption failed for {tenant.slug}: {e}")
            continue

        # 5. Service Init
        try:
            service = PaymentServiceFactory.get_service('Flow', tenant=tenant)
            print(f"  FlowService initialized. Base URL: {service.base_url}")
        except Exception as e:
            print(f"  ERROR: Service init failed: {e}")
            continue

        # 6. Mock Payment Attempt (Recent Order)
        order = Order.objects.filter(tenant=tenant).order_by('-created_at').first()
        if order:
            print(f"  Attempting mock payment for order: {order.order_number} (ID: {order.id})")
            print(f"  Customer: {order.customer_email}, Total: {order.total}")
            
            try:
                # We won't actually call create_payment (to avoid hitting Flow API if not sandbox)
                # But let's check if the params generation works and if signing works.
                params = {
                    'apiKey': service.api_key,
                    'commerceOrder': str(order.order_number),
                    'subject': f'Orden {order.order_number}',
                    'currency': 'CLP',
                    'amount': str(int(order.total)),
                    'email': order.customer_email,
                    'urlConfirmation': f"{settings.PAYMENT_WEBHOOK_URL}/payments/callback/Flow/?tenant={tenant.slug}",
                    'urlReturn': "http://localhost:3000/callback",
                }
                signature = service._sign_params(params)
                print(f"  Signature generated successfully: {signature[:10]}...")
                
                # If it's sandbox, we MIGHT try a real request? 
                if config.is_sandbox:
                    print("  This is SANDBOX. You can manually run test_flow.py with these credentials.")
                else:
                    print("  This is PRODUCTION. Skipping real request.")
                    
            except Exception as e:
                print(f"  ERROR: Mock payment logic failed: {e}")
                traceback.print_exc()
        else:
            print("  No orders found for this tenant.")

    print("\n--- Extended Diagnostic End ---")

if __name__ == "__main__":
    debug()

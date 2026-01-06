
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from tenants.payment_config_models import PaymentGatewayConfig
from core.encryption import decrypt_credential

def check_credentials():
    print("--- Credential Integrity Check ---")
    configs = PaymentGatewayConfig.objects.all()
    for c in configs:
        print(f"Tenant: {c.tenant.slug}, Gateway: {c.gateway}, Active: {c.is_active}")
        
        try:
            if c.api_key_encrypted:
                c.api_key
                print("  API Key: OK")
            else:
                print("  API Key: Empty")
                
            if c.secret_key_encrypted:
                c.secret_key
                print("  Secret Key: OK")
            else:
                print("  Secret Key: Empty")
                
        except Exception as e:
            print(f"  FAILED to decrypt: {e}")
            
    print("--- End of Check ---")

if __name__ == "__main__":
    check_credentials()

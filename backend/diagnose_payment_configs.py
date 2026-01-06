import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from tenants.payment_config_models import PaymentGatewayConfig
from tenants.models import Tenant

def diagnose():
    print("--- Payment Configuration Diagnosis ---")
    tenants = Tenant.objects.all()
    print(f"Total tenants: {tenants.count()}")
    
    for tenant in tenants:
        print(f"\nTenant: {tenant.name} (Slug: {tenant.slug})")
        configs = PaymentGatewayConfig.objects.filter(tenant=tenant)
        print(f"Configs found: {configs.count()}")
        
        for config in configs:
            print(f"  Gateway: {config.gateway}")
            print(f"    Active: {config.is_active}")
            print(f"    Sandbox: {config.is_sandbox}")
            
            # Check if encrypted fields have data
            api_key_status = "PRESENT" if config.api_key_encrypted else "EMPTY"
            secret_key_status = "PRESENT" if config.secret_key_encrypted else "EMPTY"
            
            print(f"    API Key Encrypted: {api_key_status} (Length: {len(config.api_key_encrypted)})")
            print(f"    Secret Key Encrypted: {secret_key_status} (Length: {len(config.secret_key_encrypted)})")
            
            # Try to decrypt and mask
            try:
                masked_api = config.get_masked_credentials().get('api_key')
                print(f"    Masked API Key (Backend sees): {masked_api}")
            except Exception as e:
                print(f"    ERROR decrypting API Key: {e}")
                
            try:
                masked_secret = config.get_masked_credentials().get('secret_key')
                print(f"    Masked Secret Key (Backend sees): {masked_secret}")
            except Exception as e:
                print(f"    ERROR decrypting Secret Key: {e}")

if __name__ == "__main__":
    diagnose()

import os
import django
import sys
import json

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from orders.models import ShippingZone
from orders.serializers import ShippingZoneSerializer
from tenants.models import Tenant

def debug_save():
    print("=== DEBUGGING SAVE VALIDATION ===")
    
    # 1. Get Tenant and Zone
    tenant = Tenant.objects.filter(status='Active').first()
    print(f"Tenant: {tenant}")
    
    zone = ShippingZone.objects.filter(tenant=tenant).first()
    if not zone:
        print("No zone found")
        return

    print(f"Testing Update on Zone: {zone.name} ({zone.id})")
    
    # 2. Prepare Data (simulating frontend payload)
    payload = {
        "id": str(zone.id),
        "name": zone.name,
        "description": zone.description,
        "commune_codes": ["Santiago", "Providencia"], # Valid codes
        "base_cost": "5000.00",
        "cost_per_kg": "0.00",
        "free_shipping_threshold": "100000.00",
        "estimated_days": 1,
        "allows_store_pickup": True,
        "is_active": True
    }
    
    # 3. Simulate Request Context (optional but good practice)
    from django.test import RequestFactory
    request = RequestFactory().put('/api/admin/shipping-zones/')
    request.tenant = tenant # Simulate middleware
    
    # 4. Run Serializer
    try:
        serializer = ShippingZoneSerializer(instance=zone, data=payload, context={'request': request})
        print("Serializer created.")
        
        if serializer.is_valid():
            print("VALIDATION SUCCESS!")
            print("Validated Data:", serializer.validated_data)
        else:
            print("VALIDATION FAILED (Expected if duplicate, but catching crashes):")
            print(serializer.errors)
            
    except Exception as e:
        print("\n!!! EXCEPTION DURING VALIDATION !!!")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    debug_save()

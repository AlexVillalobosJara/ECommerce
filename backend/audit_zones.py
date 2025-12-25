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

def audit_zones():
    print("\n=== AUDITORÍA DE ZONAS DE DESPACHO ===")
    zones = ShippingZone.objects.all()
    
    results = []
    
    for zone in zones:
        serializer = ShippingZoneSerializer(zone)
        data = serializer.data
        
        zone_info = {
            "id": str(zone.id),
            "name": zone.name,
            "raw_db_codes": zone.commune_codes,
            "raw_type": str(type(zone.commune_codes)),
            "api_output_codes": data['commune_codes'],
            "api_count": data['commune_count']
        }
        results.append(zone_info)

    with open('audit_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
        
    print("Audit saved to audit_results.json")

if __name__ == '__main__':
    audit_zones()

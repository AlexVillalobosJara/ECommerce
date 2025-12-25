import os
import django
import sys
import json
# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from rest_framework.renderers import JSONRenderer
from orders.models import ShippingZone
from orders.serializers import ShippingZoneSerializer
from core.models import Commune

def debug_zone_communes():
    zone_id = "911d3045-6723-41aa-87de-85593c30645e"
    
    print(f"\n=== Checking Zone {zone_id} ===")
    try:
        zone = ShippingZone.objects.get(id=zone_id)
        
        # Test Serializer Transformation
        serializer = ShippingZoneSerializer(zone)
        data = serializer.data
        
        debug_info = {
            "zone_name": zone.name,
            "raw_codes_type": str(type(zone.commune_codes)),
            "serialized_codes": data['commune_codes'],
            "matches": []
        }

        print("=== JSON START ===")
        codes = data['commune_codes']
        for code_or_name in codes:
            match_info = {"search": code_or_name, "found": False}
            c = Commune.objects.filter(name=code_or_name).first()
            if c:
                match_info.update({"found": True, "code": c.code, "name": c.name})
            else:
                 c_ci = Commune.objects.filter(name__iexact=code_or_name).first()
                 if c_ci:
                     match_info.update({"found": True, "match_type": "iexact", "name": c_ci.name})
            
            debug_info["matches"].append(match_info)
        
        print(json.dumps(debug_info))
        print("=== JSON END ===")
                    
    except ShippingZone.DoesNotExist:
        print("Zone not found")

if __name__ == '__main__':
    debug_zone_communes()

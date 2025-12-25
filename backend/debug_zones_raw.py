import os
import django
import sys
import json

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from orders.models import ShippingZone

def debug_zones_raw():
    print("=== DEBUG ZONES RAW DATA ===")
    zones = ShippingZone.objects.all()
    
    for zone in zones:
        print(f"\nZone: {zone.name} (ID: {zone.id})")
        codes = zone.commune_codes
        print(f"Type of codes: {type(codes)}")
        print(f"Raw Value: {repr(codes)}")
        print(f"Python Len: {len(codes) if codes else 0}")
        if isinstance(codes, list):
            for i, code in enumerate(codes):
                print(f"  [{i}] '{code}' (len: {len(code)})")

if __name__ == '__main__':
    debug_zones_raw()

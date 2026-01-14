import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from django.db import connection
from orders.models import ShippingZone
import json

def fix_shipping_zones():
    print("Checking database column type...")
    with connection.cursor() as cursor:
        cursor.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'shipping_zones' AND column_name = 'commune_codes'")
        col_info = cursor.fetchone()
        print(f"Column info: {col_info}")

    print("Checking for corrupted data...")
    zones = ShippingZone.objects.all()
    for zone in zones:
        codes = zone.commune_codes
        print(f"Zone: {zone.name}, Codes: {codes}, Type: {type(codes)}")
        
        # If it's a string that looks like a list, we might need to fix it
        if isinstance(codes, str):
            if codes.startswith('[') and codes.endswith(']'):
                try:
                    parsed = json.loads(codes)
                    print(f"  Fixed string to list: {parsed}")
                    zone.commune_codes = parsed
                    zone.save()
                except Exception as e:
                    print(f"  Error parsing JSON: {e}")
        elif isinstance(codes, list):
            # Check if it's a list of characters (corrupted storage)
            if len(codes) > 0 and len(codes[0]) == 1 and codes[0] == '[':
                try:
                    joined = "".join(codes)
                    parsed = json.loads(joined)
                    print(f"  Fixed char-list to list: {parsed}")
                    zone.commune_codes = parsed
                    zone.save()
                except Exception as e:
                    print(f"  Error joining/parsing char-list: {e}")

    print("Data fix complete.")

if __name__ == "__main__":
    fix_shipping_zones()

import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from orders.models import ShippingZone
from core.models import Commune

def fix_commune_data():
    print("=== FIXING COMMUNE DATA ===")
    
    # 1. Build lookup maps
    print("Building commune lookup maps...")
    communes = Commune.objects.all()
    name_to_code = {c.name.strip().lower(): c.code for c in communes}
    all_codes = set(c.code for c in communes)
    
    zones = ShippingZone.objects.all()
    
    for zone in zones:
        print(f"\nProcessing Zone: {zone.name}")
        old_codes = zone.commune_codes
        if not old_codes:
            continue
            
        new_codes_set = set()
        changes_made = False
        
        for item in old_codes:
            item_str = str(item).strip()
            item_lower = item_str.lower()
            
            # Case 1: It is already a valid code
            if item_str in all_codes:
                new_codes_set.add(item_str)
                continue
                
            # Case 2: It is a name
            if item_lower in name_to_code:
                code = name_to_code[item_lower]
                new_codes_set.add(code)
                print(f"  Converted name '{item_str}' to code '{code}'")
                changes_made = True
            else:
                # Case 3: Unknown
                # Try partial match or just keep it? 
                # If it's trash, maybe we should drop it?
                # User complaint implies duplication, likely exact name.
                print(f"  WARNING: Unknown item '{item_str}' - keeping it for safety but check manually.")
                new_codes_set.add(item_str)
        
        # Check size difference
        new_codes_list = list(new_codes_set)
        if len(new_codes_list) != len(old_codes) or changes_made:
            print(f"  Fixing zone. Count changed from {len(old_codes)} to {len(new_codes_list)}")
            zone.commune_codes = new_codes_list
            zone.save()
            print("  SAVED.")
        else:
            print("  No changes needed.")

if __name__ == '__main__':
    fix_commune_data()

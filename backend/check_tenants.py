import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from tenants.models import Tenant
from orders.models import ShippingZone
from django.db.models import Count

def check_data():
    print("=== Checking Tenants ===")
    tenants = Tenant.objects.all()
    for t in tenants:
        print(f"ID: {t.id} | Slug: {t.slug} | Name: {t.name} | Status: {t.status} | Deleted: {t.deleted_at}")
        
    print("\n=== Checking Shipping Zones ===")
    zones = ShippingZone.objects.all()
    if not zones.exists():
        print("No shipping zones found.")
        return

    print(f"Total Zones: {zones.count()}")
    for z in zones:
        print(f"ID: {z.id} | Name: {z.name} | Tenant ID: {z.tenant_id}")

if __name__ == '__main__':
    check_data()

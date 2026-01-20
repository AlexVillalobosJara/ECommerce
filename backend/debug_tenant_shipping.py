
import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from tenants.models import Tenant

try:
    tenant = Tenant.objects.get(slug='autotest')
    print(f"Tenant: {tenant.name} ({tenant.slug})")
    print(f"Shipping Workdays: {tenant.shipping_workdays}")
    if not tenant.shipping_workdays:
        print("WARNING: Shipping workdays is empty! This will cause getEstimatedShippingDate to return null.")
except Tenant.DoesNotExist:
    print("Tenant 'autotest' not found.")
except Exception as e:
    print(f"Error: {e}")

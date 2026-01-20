
import os
import django
import sys
from uuid import UUID

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from products.models import Category
from tenants.models import Tenant

try:
    tenant = Tenant.objects.get(slug='autotest')
    print(f"Tenant: {tenant.name} ({tenant.id})")
    
    categories = Category.objects.filter(tenant=tenant) # Show ALL, even deleted
    
    print(f"Found {categories.count()} categories for this tenant.")
    
    for cat in categories:
        status = "ACTIVE" if cat.deleted_at is None else f"DELETED ({cat.deleted_at})"
        print(f"[{status}] ID: {cat.id} | Name: {cat.name} | Slug: {cat.slug} | Parent: {cat.parent_id}")

except Tenant.DoesNotExist:
    print("Tenant 'autotest' not found.")
except Exception as e:
    print(f"Error: {e}")

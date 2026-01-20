
import os
import django
import sys
import json

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from products.models import Category
from tenants.models import Tenant

try:
    tenant = Tenant.objects.get(slug='autotest')
    print(f"Tenant: {tenant.name} ({tenant.id})")
    
    categories = Category.objects.filter(tenant=tenant)
    print(f"Found {categories.count()} categories.")
    
    for cat in categories:
        status = "ACTIVE" if cat.deleted_at is None else "DELETED"
        print(f"[{status}] ID: {cat.id}")
        print(f"    Name: {cat.name}")
        print(f"    Slug: {cat.slug}")
        print(f"    Parent: {cat.parent_id}")
        print("-" * 20)

except Exception as e:
    print(f"Error: {e}")

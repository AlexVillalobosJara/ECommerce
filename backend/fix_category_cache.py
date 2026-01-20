
import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from tenants.models import Tenant
from core.cache_utils import invalidate_category_cache

try:
    tenant = Tenant.objects.get(slug='autotest')
    print(f"Clearing cache for tenant: {tenant.name}")
    invalidate_category_cache(tenant.id)
    print("Cache cleared successfully.")

except Exception as e:
    print(f"Error: {e}")

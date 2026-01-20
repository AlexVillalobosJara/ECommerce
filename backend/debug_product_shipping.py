
import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from products.models import Product
from tenants.models import Tenant

try:
    tenant = Tenant.objects.get(slug='autotest')
    print(f"Tenant: {tenant.name}")
    
    # Try multiple variations of the name
    products = Product.objects.filter(tenant=tenant, name__icontains='taladro')
    
    if products.exists():
        for p in products:
            print(f"Product: {p.name}")
            print(f"Min Shipping Days: {p.min_shipping_days}")
    else:
        print("No product found with 'taladro' in name.")
        
except Exception as e:
    print(f"Error: {e}")

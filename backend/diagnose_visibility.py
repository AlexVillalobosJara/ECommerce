import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from products.models import Product, Category
from tenants.models import Tenant

def diagnose_tenant(slug=None):
    from tenants.models import Tenant
    
    if slug:
        tenants = Tenant.objects.filter(slug=slug)
    else:
        tenants = Tenant.objects.all()
        print(f"Total tenants found: {tenants.count()}")

    for tenant in tenants:
        print(f"\n--- Diagnosing Tenant: {tenant.name} ({tenant.slug}) ---")
        
        print("\n[Categories]")
        all_cats = Category.objects.filter(tenant=tenant, deleted_at__isnull=True).order_by('-created_at')
        print(f"Total non-deleted categories: {all_cats.count()}")
        for cat in all_cats:
            status = "ACTIVE" if cat.is_active else "INACTIVE"
            level = "Root" if cat.parent is None else f"Child of {cat.parent.name}"
            print(f"- {cat.name} ({cat.slug}): {status}, {level}, Created: {cat.created_at}")
            
        print("\n[Products]")
        all_prods = Product.objects.filter(tenant=tenant, deleted_at__isnull=True).order_by('-created_at')
        print(f"Total non-deleted products: {all_prods.count()}")
        for prod in all_prods:
            featured = "FEATURED" if prod.is_featured else "Normal"
            print(f"- {prod.name} ({prod.slug}): {prod.status}, {featured}, Category: {prod.category.name if prod.category else 'None'}, Created: {prod.created_at}")

if __name__ == "__main__":
    import sys
    slug = sys.argv[1] if len(sys.argv) > 1 else None
    diagnose_tenant(slug)

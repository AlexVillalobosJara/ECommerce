import os
import django
import urllib.parse

def debug_products():
    password = urllib.parse.quote_plus('$$kairos01%%')
    os.environ['DATABASE_URL'] = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'
    os.environ['RENDER'] = 'true'
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
    django.setup()
    
    from products.models import Product
    from tenants.models import Tenant
    
    tenant = Tenant.objects.filter(slug='doctorinox').first()
    if not tenant:
        print("Tenant doctorinox no encontrado")
        return
    
    print(f"Tenant: {tenant.name} ({tenant.id}) - Status: {tenant.status}")
    
    all_products = Product.objects.filter(tenant=tenant)
    print(f"Total productos para este tenant: {all_products.count()}")
    
    for p in all_products:
        print(f" - ID: {p.id}")
        print(f"   Name: {p.name}")
        print(f"   Status: {p.status}")
        print(f"   Is Featured: {p.is_featured}")
        print(f"   Deleted At: {p.deleted_at if hasattr(p, 'deleted_at') else 'N/A'}")
        
    print("\nPrueba de lógica de ViewSet (Filtros base):")
    from django.db.models import Q
    qs = Product.objects.filter(
        tenant=tenant,
        status='Published',
        deleted_at__isnull=True
    )
    print(f"Productos 'Published' y no borrados: {qs.count()}")

if __name__ == "__main__":
    debug_products()

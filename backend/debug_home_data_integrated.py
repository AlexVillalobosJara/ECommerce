import os
import django
import urllib.parse
import json

def debug_home_data():
    password = urllib.parse.quote_plus('$$kairos01%%')
    os.environ['DATABASE_URL'] = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'
    os.environ['RENDER'] = 'true'
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
    django.setup()
    
    from rest_framework.test import APIRequestFactory
    from tenants.views import StorefrontHomeView
    from tenants.models import Tenant
    from products.models import Product
    
    # 1. Inspect Database
    tenant = Tenant.objects.filter(slug='doctorinox').first()
    if not tenant:
        print("Tenant doctorinox no encontrado")
        return
    
    print(f"Tenant: {tenant.name} (ID: {tenant.id})")
    all_prods = Product.objects.filter(tenant=tenant)
    print(f"Total productos en DB para este tenant: {all_prods.count()}")
    
    for p in all_prods:
        print(f" - [{p.status}] {p.name} (Featured: {p.is_featured})")

    # 2. Call View
    factory = APIRequestFactory()
    view = StorefrontHomeView.as_view()
    
    request = factory.get('/api/storefront/home-data/?slug=doctorinox')
    # Mock some attributes DRF needs if any, though factory handles it
    
    print("\nLlamando a StorefrontHomeView...")
    try:
        response = view(request)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.data
            print(f"Tenant in response: {data['tenant']['slug']}")
            print(f"Categories count: {len(data['categories'])}")
            print(f"Featured products count: {len(data['featured_products'])}")
            if len(data['featured_products']) > 0:
                print("Primer producto:", data['featured_products'][0]['name'])
            else:
                print("ALERTA: featured_products está VACÍO")
        else:
            print("Error Response:", response.data)
    except Exception as e:
        print(f"Crash: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_home_data()

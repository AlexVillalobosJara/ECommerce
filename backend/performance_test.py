import os
import django
import time
import urllib.parse
from django.db import connection, reset_queries

# Credentials
password = urllib.parse.quote_plus('$$kairos01%%')
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

def test_performance():
    print("=== Test de Performance Storefront (Production DB) ===")
    os.environ['DATABASE_URL'] = db_url
    os.environ['RENDER'] = 'true'
    os.environ['DEBUG'] = 'true'
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
    django.setup()
    
    from rest_framework.test import APIRequestFactory
    from products.views import StorefrontCategoryViewSet, StorefrontProductViewSet
    from tenants.models import Tenant
    
    factory = APIRequestFactory()
    
    # Get any active tenant
    tenant = Tenant.objects.filter(status='Active', deleted_at__isnull=True).first()
    if not tenant:
        print("ERROR: No se encontró ningún inquilino activo.")
        return
    
    print(f"Probando con Inquilino: {tenant.name} (Slug: {tenant.slug})")

    def measure_viewset(name, viewset_class, url_params):
        print(f"\n--- Probando: {name} ---")
        request = factory.get(f"/?{urllib.parse.urlencode(url_params)}")
        request.tenant = tenant
        
        view = viewset_class.as_view({'get': 'list'})
        
        reset_queries()
        start_time = time.time()
        
        response = view(request)
        
        end_time = time.time()
        query_count = len(connection.queries)
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Tiempo: {end_time - start_time:.4f} segundos")
        print(f"   Cantidad de Queries: {query_count}")
        print(f"   Cantidad de Items: {len(response.data.get('results', response.data)) if response.data else 0}")
        
        if query_count > 10:
            print("   [!] ALERTA: N+1 detectado.")
            for cq in connection.queries[:10]:
                print(f"      Q: {cq['sql'][:120]}...")

    # Test Categories
    measure_viewset("Categorías List", StorefrontCategoryViewSet, {'tenant': tenant.slug})
    
    # Test Products (Featured)
    measure_viewset("Productos Destacados Home", StorefrontProductViewSet, {'tenant': tenant.slug, 'featured': 'true'})

    # Test All Products (Home usually shows many)
    measure_viewset("Todos los Productos (List)", StorefrontProductViewSet, {'tenant': tenant.slug})

if __name__ == "__main__":
    test_performance()

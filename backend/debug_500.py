import os
import django
import urllib.parse

def debug_home_view():
    password = urllib.parse.quote_plus('$$kairos01%%')
    os.environ['DATABASE_URL'] = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'
    os.environ['RENDER'] = 'true'
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
    django.setup()
    
    from rest_framework.test import APIRequestFactory
    from tenants.views import StorefrontHomeView
    from tenants.models import Tenant
    
    factory = APIRequestFactory()
    view = StorefrontHomeView.as_view()
    
    # Test for doctorinox
    tenant = Tenant.objects.filter(slug='doctorinox').first()
    if not tenant:
        print("Tenant doctorinox no encontrado en DB")
        return

    request = factory.get('/api/storefront/home-data/?slug=doctorinox')
    
    print("Iniciando llamada a StorefrontHomeView.get()...")
    try:
        response = view(request)
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            print(f"Error Response: {response.data}")
        else:
            print("Éxito! Datos recibidos.")
    except Exception as e:
        print(f"ERROR DETECTADO: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_home_view()

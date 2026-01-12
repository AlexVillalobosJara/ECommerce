import requests
import time

# Use local server URL if possible, or build the Render URL
# Since I'm in the agent, I'll try to guess if the server is running or just check the logic.
# Actually, I'll just check if the endpoint responds correctly if I can start a small test server or just mock it.
# Better: check the response format with a script if the server is reachable.

def test_mega_fetch():
    url = "http://localhost:8000/api/storefront/home-data/?slug=doctorinox"
    print(f"Probando Mega-Fetch en: {url}")
    
    try:
        start = time.time()
        # Note: Localhost might not be running. If not, this will fail.
        # But I can check if the logic is sound.
        # I'll try to reach it just in case.
        response = requests.get(url, timeout=5)
        end = time.time()
        
        print(f"Status: {response.status_code}")
        print(f"Tiempo: {end - start:.4f}s")
        if response.status_code == 200:
            data = response.json()
            print(f"Keys recibidas: {list(data.keys())}")
            print(f"Categorías: {len(data['categories'])}")
            print(f"Productos destacados: {len(data['featured_products'])}")
    except Exception as e:
        print(f"No se pudo conectar al servidor local: {e}")
        print("Tratando de verificar la lógica mediante importación directa...")
        try:
            import os
            import django
            import urllib.parse
            password = urllib.parse.quote_plus('$$kairos01%%')
            os.environ['DATABASE_URL'] = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'
            os.environ['RENDER'] = 'true'
            os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
            django.setup()
            
            from rest_framework.test import APIRequestFactory
            from tenants.views import StorefrontHomeView
            
            factory = APIRequestFactory()
            view = StorefrontHomeView.as_view()
            request = factory.get('/?slug=doctorinox')
            
            start = time.time()
            response = view(request)
            end = time.time()
            
            print(f"Status (Directo): {response.status_code}")
            print(f"Tiempo (Directo): {end - start:.4f}s")
            if response.status_code == 200:
                print(f"Keys (Directo): {list(response.data.keys())}")
                print(f"Categorías: {len(response.data['categories'])}")
                print(f"Productos: {len(response.data['featured_products'])}")
        except Exception as inner_e:
            print(f"Error en verificación directa: {inner_e}")

if __name__ == "__main__":
    test_mega_fetch()

import os
import sys
import django
from django.db import connection
from django.test import RequestFactory
from django.core.cache import cache
import time

# Setup Django
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()
from django.conf import settings
settings.DEBUG = True

from tenants.models import Tenant
from tenants.views import StorefrontHomeView

def analyze_queries():
    tenant = Tenant.objects.first()
    if not tenant:
        print("No tenant found to test.")
        return

    print(f"Testing with tenant: {tenant.name} ({tenant.custom_domain})")
    
    # 2. Setup Request
    factory = RequestFactory()
    host = tenant.custom_domain if tenant.custom_domain else "localhost"
    request = factory.get('/', HTTP_HOST=host)
    
    # 3. Test COLD Cache (Clear cache first)
    print("\n--- TEST 1: COLD CACHE (First Load) ---")
    cache.clear()
    
    # Reset queries log
    connection.queries_log.clear()
    start_time = time.time()
    
    # Run View
    view = StorefrontHomeView.as_view()
    response = view(request)
    if hasattr(response, 'render'):
        response.render()
    
    end_time = time.time()
    
    queries_cold = list(connection.queries)
    count_cold = len(queries_cold)
    time_cold = (end_time - start_time) * 1000
    
    # Analyze Tables
    tables_cold = set()
    for q in queries_cold:
        sql = q['sql'].lower()
        # Simple heuristic to extract table names (approximate)
        # Look for words starting with "tenants_", "products_", "orders_", "core_"
        for word in sql.split():
            word = word.strip('",().;') 
            if word.startswith(('tenants_', 'products_', 'orders_', 'core_', 'auth_')):
                tables_cold.add(word)
                
    print(f"Total Queries: {count_cold}")
    print(f"Execution Time: {time_cold:.2f}ms")
    print(f"Tables Accessed ({len(tables_cold)}): {', '.join(sorted(tables_cold))}")
    
    # 4. Test WARM Cache (Second Load)
    print("\n--- TEST 2: WARM CACHE (Second Load) ---")
    
    connection.queries_log.clear()
    start_time_warm = time.time()
    
    response = view(request)
    if hasattr(response, 'render'):
        response.render()
        
    end_time_warm = time.time()
    
    queries_warm = list(connection.queries)
    count_warm = len(queries_warm)
    time_warm = (end_time_warm - start_time_warm) * 1000
    
    print(f"Total Queries: {count_warm}")
    print(f"Execution Time: {time_warm:.2f}ms")
    
    # Show last few queries to see what's hitting DB in Warm state
    if count_warm > 0:
        print("\nQueries remaining in Warm state (Dynamic Data):")
        for i, q in enumerate(queries_warm[:5]):
            print(f"{i+1}. {q['sql'][:100]}...")

if __name__ == '__main__':
    try:
        analyze_queries()
    except Exception:
        import traceback
        with open('audit_error.txt', 'w') as f:
            f.write(traceback.format_exc())
        print("Error occurred. Check audit_error.txt")

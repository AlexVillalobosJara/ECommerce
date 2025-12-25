
import os
import django
import sys
from pathlib import Path

# Setup Django environment
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from django.urls import resolve, reverse
from orders.views import OrderViewSet

def check_urls():
    print("Checking URL resolution...")
    
    # UUID from previous logs
    test_uuid = "04db8f51-173e-4534-a399-de20fbb78dc6"
    path_to_check = f"/api/storefront/orders/{test_uuid}/"
    
    print(f"Resolving: {path_to_check}")
    try:
        match = resolve(path_to_check)
        print(f"Match found!")
        print(f"View Name: {match.view_name}")
        print(f"Func: {match.func}")
        print(f"Args: {match.args}")
        print(f"Kwargs: {match.kwargs}")
        
        if hasattr(match.func, 'cls'):
             print(f"View Class: {match.func.cls}")
             if match.func.cls == OrderViewSet:
                 print("SUCCESS: Maps to OrderViewSet")
             else:
                 print("WARNING: Maps to unexpected class")
        else:
            print("Func is function-based view?")
            
    except Exception as e:
        print(f"FAILURE: Could not resolve URL: {e}")

if __name__ == "__main__":
    check_urls()

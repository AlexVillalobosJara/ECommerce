import os
import django
import sys

# Set up Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from products.models import Category

def check_category_slugs(category_id):
    try:
        target_cat = Category.objects.get(id=category_id)
        tenant = target_cat.tenant
        print(f"Target Category: {target_cat.name} (ID: {target_cat.id})")
        print(f"Tenant: {tenant.name} (ID: {tenant.id})")
        
        slug_to_check = "escurridores"
        
        duplicates = Category.objects.filter(tenant=tenant, slug=slug_to_check)
        
        if duplicates.exists():
            print(f"\nFound {duplicates.count()} categories with slug '{slug_to_check}':")
            for cat in duplicates:
                status = "Deleted" if cat.deleted_at else "Active"
                print(f"- {cat.name} (ID: {cat.id}) [Status: {status}]")
        else:
            print(f"\nNo category found with slug '{slug_to_check}' in this tenant.")
            
    except Category.DoesNotExist:
        print(f"Category with ID {category_id} not found.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    category_id = "31127667-434c-4c2f-b81b-2cf33790408e"
    print(f"Checking slug collisions for category {category_id}...")
    check_category_slugs(category_id)

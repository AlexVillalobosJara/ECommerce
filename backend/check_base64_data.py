
import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from products.models import Product, ProductImage, Category, ProductFeature
from tenants.models import Tenant

def check_base64():
    print("Checking for Base64 in TextField/CharField columns...")
    
    # Check Product Images
    print("\n--- Checking ProductImage.url ---")
    bad_images = 0
    for img in ProductImage.objects.all():
        if img.url and (img.url.startswith('data:') or len(img.url) > 2000):
            print(f"[WARN] Image {img.id} URL length: {len(img.url)}")
            if img.url.startswith('data:'):
                print("  -> STARTS WITH data:")
            bad_images += 1
    if bad_images == 0:
        print("✓ No suspicious URLs in ProductImage")

    # Check Category Images
    print("\n--- Checking Category.image_url ---")
    bad_cats = 0
    for cat in Category.objects.all():
        if cat.image_url and (cat.image_url.startswith('data:') or len(cat.image_url) > 2000):
            print(f"[WARN] Category {cat.name} URL length: {len(cat.image_url)}")
            bad_cats += 1
    if bad_cats == 0:
        print("✓ No suspicious URLs in Category")

    # Check Product Descriptions
    print("\n--- Checking Product Description Sizes ---")
    for p in Product.objects.all():
        desc_len = len(p.description) if p.description else 0
        spec_len = len(str(p.specifications)) if p.specifications else 0
        
        if desc_len > 100000: # 100KB
            print(f"[WARN] Product {p.name} (ID: {p.id})")
            print(f"  -> Description size: {desc_len/1024:.2f} KB")
        
        if spec_len > 50000: # 50KB
            print(f"[WARN] Product {p.name} (ID: {p.id})")
            print(f"  -> Specs size: {spec_len/1024:.2f} KB")

    # Check Tenant Data
    print("\n--- Checking Tenant Data ---")
    bad_tenants = 0
    for t in Tenant.objects.all():
        fields_to_check = {
            'logo_url': t.logo_url,
            'hero_image_url': t.hero_image_url,
            'privacy_policy': t.privacy_policy_text,
            'terms_policy': t.terms_policy_text
        }
        
        for field_name, value in fields_to_check.items():
            if value:
                if value.startswith('data:'):
                     print(f"[WARN] Tenant {t.slug} has Base64 in {field_name}")
                     bad_tenants += 1
                elif len(value) > 50000 and 'url' in field_name: # 50KB for a URL field is suspicious
                     print(f"[WARN] Tenant {t.slug} has huge content in {field_name} ({len(value)/1024:.2f} KB)")
                     bad_tenants += 1
    
    if bad_tenants == 0:
        print("✓ No suspicious data in Tenant models")

if __name__ == '__main__':
    check_base64()

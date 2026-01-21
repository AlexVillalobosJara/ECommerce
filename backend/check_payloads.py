
import os
import django
from django.db.models import Avg, Max
from django.db.models.functions import Length

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "tenants_project.settings")
django.setup()

from products.models import ProductImage, ProductVariant

def check_payload_sizes():
    print("Checking Payload Sizes...")
    
    # Check Images
    img_stats = ProductImage.objects.aggregate(
        avg_url_len=Avg(Length('url')),
        max_url_len=Max(Length('url'))
    )
    print(f"ProductImage URL Length - Avg: {img_stats['avg_url_len']}, Max: {img_stats['max_url_len']}")
    
    # Check for potential Base64
    base64_count = ProductImage.objects.filter(url__startswith='data:image').count()
    print(f"ProductImage with Base64 prefix: {base64_count}")
    
    # Check Variant Attributes
    # length of text representation of JSON
    # This is rough but indicative
    
    # Check Variant Image URL
    var_stats = ProductVariant.objects.aggregate(
        avg_url_len=Avg(Length('image_url')),
        max_url_len=Max(Length('image_url'))
    )
    print(f"ProductVariant Image URL Length - Avg: {var_stats['avg_url_len']}, Max: {var_stats['max_url_len']}")

if __name__ == "__main__":
    check_payload_sizes()

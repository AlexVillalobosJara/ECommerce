from django.core.management.base import BaseCommand
from orders.models import OrderItem


class Command(BaseCommand):
    help = 'Update existing order items with product image URLs'

    def handle(self, *args, **options):
        """Update all order items with missing product_image_url"""
        items_updated = 0
        items_total = 0
        
        # Get all order items without product_image_url
        order_items = OrderItem.objects.filter(product_image_url__isnull=True) | OrderItem.objects.filter(product_image_url='')
        
        self.stdout.write(f"Found {order_items.count()} order items without images\n")
        
        for item in order_items:
            items_total += 1
            try:
                # Get the variant
                variant = item.product_variant
                if not variant:
                    self.stdout.write(self.style.WARNING(f"  Item {item.id}: No variant found"))
                    continue
                
                # Get product image URL
                product_image_url = None
                
                # Try variant image first
                if variant.image_url:
                    product_image_url = variant.image_url
                # Then try product's primary image
                elif variant.product.images.filter(is_primary=True).exists():
                    primary_image = variant.product.images.filter(is_primary=True).first()
                    if primary_image:
                        product_image_url = primary_image.url
                # Finally try any product image
                elif variant.product.images.exists():
                    first_image = variant.product.images.first()
                    if first_image:
                        product_image_url = first_image.url
                
                if product_image_url:
                    item.product_image_url = product_image_url
                    item.save(update_fields=['product_image_url'])
                    items_updated += 1
                    self.stdout.write(self.style.SUCCESS(f"  ✓ Updated item {item.id} ({item.product_name}): {product_image_url}"))
                else:
                    self.stdout.write(self.style.WARNING(f"  ✗ No image found for item {item.id} ({item.product_name})"))
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  ✗ Error updating item {item.id}: {e}"))
        
        self.stdout.write(self.style.SUCCESS(f"\nCompleted: {items_updated}/{items_total} items updated"))

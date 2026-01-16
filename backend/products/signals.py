from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import Product, Category

# Helper to clear Home Page Cache
def clear_home_cache(tenant_id):
    cache_key = f"storefront_home_data_{tenant_id}"
    cache.delete(cache_key)
    print(f"Removed Cache: {cache_key}")

# Helper to clear Product Detail Cache
def clear_product_cache(tenant_id, slug):
    cache_key = f"storefront_product_{tenant_id}_{slug}"
    cache.delete(cache_key)
    print(f"Removed Cache: {cache_key}")

# Helper to clear Category Page Cache
def clear_category_cache(tenant_id, slug=None):
    # Invalidate all category pages for this tenant because changing one category
    # (e.g. parent/order/name) might affect the tree or others.
    # Using delete_pattern from django-redis
    pattern = f"storefront_category_data_{tenant_id}_*"
    try:
        if hasattr(cache, "delete_pattern"):
            count = cache.delete_pattern(pattern)
            print(f"Removed Cache Pattern: {pattern} (Count: {count})")
        else:
            print(f"Warning: Cache backend does not support delete_pattern. Cannot clear {pattern}")
    except Exception as e:
        print(f"Error clearing cache pattern: {e}")

@receiver(post_save, sender=Product)
@receiver(post_delete, sender=Product)
def invalidate_product_cache(sender, instance, **kwargs):
    """
    Invalidates:
    1. Home Page (Featured products list)
    2. Product Detail Page (Price/Stock/Info update)
    3. Category Page (Product listing update)
    """
    print(f"Signal: Product {instance.slug} changed. Invalidating cache...")
    clear_home_cache(instance.tenant.id)
    clear_product_cache(instance.tenant.id, instance.slug)
    
    # Also clear category cache because product count or prices might change in filters
    if instance.category:
        clear_category_cache(instance.tenant.id)

@receiver(post_save, sender=Category)
@receiver(post_delete, sender=Category)
def invalidate_category_cache(sender, instance, **kwargs):
    """
    Invalidates:
    1. Home Page (Menu structure)
    2. Category Page (Info update)
    """
    print(f"Signal: Category {instance.name} changed. Invalidating cache...")
    clear_home_cache(instance.tenant.id)
    # Clear all category caches to be safe (tree structure)
    clear_category_cache(instance.tenant.id)

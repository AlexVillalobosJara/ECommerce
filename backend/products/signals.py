from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import Product, Category

# Helper to clear Home Page Cache
def clear_home_cache(tenant_id):
    # Bump version for 'home_data' scope
    from core.cache_utils import bump_cache_version
    bump_cache_version('home_data', tenant_id)
    print(f"Bumped Cache Version: home_data_{tenant_id}")

# Helper to clear Product Detail Cache
def clear_product_cache(tenant_id, slug):
    cache_key = f"storefront_product_{tenant_id}_{slug}"
    cache.delete(cache_key)
    print(f"Removed Cache: {cache_key}")

# Helper to clear Category Page Cache
def clear_category_cache(tenant_id, slug=None):
    # Bump version for 'categories' scope
    # This invalidates ALL filtered lists in StorefrontCategoryView because they all share the 'categories' scope version
    from core.cache_utils import bump_cache_version
    bump_cache_version('categories', tenant_id)
    print(f"Bumped Cache Version: categories_{tenant_id}")

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
    # Optimization: Only clear the specific category cache if available
    if instance.category:
        try:
            clear_category_cache(instance.tenant.id, slug=instance.category.slug)
        except Exception:
            # Fallback if category access fails
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
    # Clear this category's cache
    clear_category_cache(instance.tenant.id, slug=instance.slug)
